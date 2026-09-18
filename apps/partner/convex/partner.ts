import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import type { MutationCtx } from "./_generated/server"
import { mutation, query } from "./_generated/server"
import {
  PartnerAccessError,
  PartnerInputError,
  isAllowedInBrandMode,
  isVisibleToPartner,
  partnerFacingContent,
  requireActor,
  requireMembership,
  requireStaffActor,
} from "./lib/access"
import {
  isAllowedPartnerDomain,
  isStaffEmail,
  normalizeEmail,
} from "./lib/authPolicy"
import { primaryHostnameForWorkspace } from "./lib/partnerHosts"
import {
  claimStateValidator,
  contentKindValidator,
  membershipRoleValidator,
  partnerInvitationRoleValidator,
  requestStageValidator,
  requestStatusValidator,
  requestSupportTypeValidator,
  useCaseDetailValidator,
} from "./lib/validators"

const workspacePublicValidator = v.object({
  _id: v.id("workspaces"),
  slug: v.string(),
  name: v.string(),
  displayName: v.string(),
  primaryHostname: v.string(),
  canonicalPath: v.string(),
  brandMode: v.union(
    v.literal("beam-standard"),
    v.literal("co-branded"),
    v.literal("partner-fronted"),
  ),
  brandHeader: v.string(),
  homeTitle: v.string(),
  homeHeadline: v.string(),
  homeDescription: v.string(),
  tracks: v.array(
    v.object({
      id: v.string(),
      title: v.string(),
      framing: v.union(
        v.literal("layer"),
        v.literal("beachhead"),
        v.literal("clearance"),
      ),
      summary: v.string(),
      action: v.string(),
      href: v.string(),
    }),
  ),
  steps: v.array(
    v.object({
      title: v.string(),
      detail: v.string(),
    }),
  ),
  enabledSurfaces: v.array(v.string()),
  supportOwner: v.string(),
  allowedEmailDomains: v.array(v.string()),
  customDomainStatus: v.literal("none"),
})

function toPublicWorkspace(workspace: Doc<"workspaces">) {
  return {
    _id: workspace._id,
    slug: workspace.slug,
    name: workspace.name,
    displayName: workspace.displayName,
    primaryHostname: workspace.primaryHostname,
    canonicalPath: workspace.canonicalPath,
    brandMode: workspace.brandMode,
    brandHeader: workspace.brandHeader,
    homeTitle: workspace.homeTitle,
    homeHeadline: workspace.homeHeadline,
    homeDescription: workspace.homeDescription,
    tracks: workspace.tracks,
    steps: workspace.steps,
    enabledSurfaces: workspace.enabledSurfaces,
    supportOwner: workspace.supportOwner,
    allowedEmailDomains: workspace.allowedEmailDomains,
    customDomainStatus: workspace.customDomainStatus,
  }
}

export const resolveWorkspace = query({
  args: {
    host: v.optional(v.string()),
    slug: v.optional(v.string()),
  },
  returns: v.union(workspacePublicValidator, v.null()),
  handler: async (ctx, args) => {
    const slug = args.slug?.trim().toLowerCase()
    if (slug) {
      const workspace = await ctx.db
        .query("workspaces")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique()
      return workspace ? toPublicWorkspace(workspace) : null
    }

    const host = args.host?.trim().toLowerCase().split(":")[0]
    if (!host) return null
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_primary_hostname", (q) => q.eq("primaryHostname", host))
      .unique()
    return workspace ? toPublicWorkspace(workspace) : null
  },
})

const sessionValidator = v.object({
  user: v.object({
    _id: v.id("partnerUsers"),
    email: v.string(),
    name: v.string(),
    isStaff: v.boolean(),
  }),
  membership: v.object({
    _id: v.id("memberships"),
    workspaceId: v.id("workspaces"),
    role: membershipRoleValidator,
  }),
  workspace: workspacePublicValidator,
})

export const getWorkspaceSession = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.union(sessionValidator, v.null()),
  handler: async (ctx, args) => {
    try {
      const { actor, membership } = await requireMembership(
        ctx,
        args.workspaceId,
      )
      const workspace = await ctx.db.get(args.workspaceId)
      if (!workspace) return null
      return {
        user: {
          _id: actor._id,
          email: actor.email,
          name: actor.name,
          isStaff: actor.isStaff,
        },
        membership: {
          _id: membership._id,
          workspaceId: membership.workspaceId,
          role: membership.role,
        },
        workspace: toPublicWorkspace(workspace),
      }
    } catch (error) {
      if (error instanceof PartnerAccessError) return null
      throw error
    }
  },
})

export const listMyMemberships = query({
  args: {},
  returns: v.array(
    v.object({
      workspaceId: v.id("workspaces"),
      slug: v.string(),
      name: v.string(),
      role: membershipRoleValidator,
    }),
  ),
  handler: async (ctx) => {
    const actor = await requireActor(ctx)
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", actor._id))
      .take(50)
    const result: Array<{
      workspaceId: Id<"workspaces">
      slug: string
      name: string
      role: Doc<"memberships">["role"]
    }> = []
    for (const membership of memberships) {
      const workspace = await ctx.db.get(membership.workspaceId)
      if (!workspace) continue
      result.push({
        workspaceId: workspace._id,
        slug: workspace.slug,
        name: workspace.name,
        role: membership.role,
      })
    }
    return result
  },
})

const contentCardValidator = v.object({
  _id: v.id("contentItems"),
  kind: contentKindValidator,
  slug: v.string(),
  title: v.string(),
  summary: v.string(),
  body: v.string(),
  group: v.optional(v.string()),
  contentClass: v.union(
    v.literal("shared-partner-safe"),
    v.literal("workspace-only"),
    v.literal("staff-draft"),
  ),
  audience: v.union(
    v.literal("partner-internal"),
    v.literal("client-forwardable"),
    v.literal("technical"),
  ),
  forwardable: v.boolean(),
  claimState: claimStateValidator,
  restrictedReason: v.optional(v.string()),
  requestBeamLabel: v.optional(v.string()),
  href: v.optional(v.string()),
  format: v.optional(v.string()),
  shareUrl: v.optional(v.string()),
  embedUrl: v.optional(v.string()),
  status: v.optional(v.literal("pending")),
  reviewer: v.optional(v.string()),
  reviewedAt: v.optional(v.number()),
  revalidateAt: v.optional(v.number()),
  useCase: v.optional(useCaseDetailValidator),
})

function toContentCard(item: Doc<"contentItems">) {
  const visible = partnerFacingContent(item)
  return {
    _id: visible._id,
    kind: visible.kind,
    slug: visible.slug,
    title: visible.title,
    summary: visible.summary,
    body: visible.body,
    group: visible.group,
    contentClass: visible.contentClass,
    audience: visible.audience,
    forwardable: visible.forwardable,
    claimState: visible.claimState,
    restrictedReason: visible.restrictedReason,
    requestBeamLabel: visible.requestBeamLabel,
    href: visible.href,
    format: visible.format,
    shareUrl: visible.shareUrl,
    embedUrl: visible.embedUrl,
    status: visible.status,
    reviewer: visible.reviewer,
    reviewedAt: visible.reviewedAt,
    revalidateAt: visible.revalidateAt,
    useCase: visible.useCase,
  }
}

async function listGrantedContent(
  ctx: Parameters<typeof requireMembership>[0],
  workspaceId: Id<"workspaces">,
  kind: Doc<"contentItems">["kind"],
) {
  const { actor } = await requireMembership(ctx, workspaceId)
  const workspace = await ctx.db.get(workspaceId)
  if (!workspace) throw new PartnerAccessError("Workspace not found")
  const grants = await ctx.db
    .query("contentGrants")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .take(100)
  const items: ReturnType<typeof toContentCard>[] = []
  for (const grant of grants) {
    const item = await ctx.db.get(grant.contentId)
    if (!item || item.kind !== kind) continue
    if (!isVisibleToPartner(item, actor.isStaff)) continue
    if (!isAllowedInBrandMode(item, workspace.brandMode, actor.isStaff)) continue
    items.push(toContentCard(item))
  }
  return items
}

export const listContent = query({
  args: {
    workspaceId: v.id("workspaces"),
    kind: contentKindValidator,
  },
  returns: v.array(contentCardValidator),
  handler: async (ctx, args) =>
    listGrantedContent(ctx, args.workspaceId, args.kind),
})

export const getContent = query({
  args: {
    workspaceId: v.id("workspaces"),
    kind: contentKindValidator,
    slug: v.string(),
  },
  returns: v.union(contentCardValidator, v.null()),
  handler: async (ctx, args) => {
    const { actor } = await requireMembership(ctx, args.workspaceId)
    const item = await ctx.db
      .query("contentItems")
      .withIndex("by_kind_and_slug", (q) =>
        q.eq("kind", args.kind).eq("slug", args.slug),
      )
      .unique()
    if (!item) return null
    const grant = await ctx.db
      .query("contentGrants")
      .withIndex("by_workspace_and_content", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("contentId", item._id),
      )
      .unique()
    if (!grant) return null
    if (!isVisibleToPartner(item, actor.isStaff)) return null
    const workspace = await ctx.db.get(args.workspaceId)
    if (!workspace) return null
    if (!isAllowedInBrandMode(item, workspace.brandMode, actor.isStaff)) {
      return null
    }
    return toContentCard(item)
  },
})

export const listRequests = query({
  args: {
    workspaceId: v.id("workspaces"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("requests"),
        requestKey: v.string(),
        accountName: v.optional(v.string()),
        candidateProcess: v.string(),
        stage: requestStageValidator,
        supportType: requestSupportTypeValidator,
        problemStatement: v.string(),
        status: requestStatusValidator,
        owner: v.optional(v.string()),
        createdAt: v.number(),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.workspaceId)
    const result = await ctx.db
      .query("requests")
      .withIndex("by_workspace_and_created", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .order("desc")
      .paginate(args.paginationOpts)
    return {
      page: result.page.map((request) => ({
        _id: request._id,
        requestKey: request.requestKey,
        accountName: request.accountName,
        candidateProcess: request.candidateProcess,
        stage: request.stage,
        supportType: request.supportType,
        problemStatement: request.problemStatement,
        status: request.status,
        owner: request.owner,
        createdAt: request.createdAt,
      })),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    }
  },
})

export const createRequest = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    accountName: v.optional(v.string()),
    candidateProcess: v.string(),
    stage: requestStageValidator,
    supportType: requestSupportTypeValidator,
    problemStatement: v.string(),
  },
  returns: v.object({
    requestId: v.id("requests"),
    requestKey: v.string(),
    status: requestStatusValidator,
    owner: v.string(),
  }),
  handler: async (ctx, args) => {
    const { actor } = await requireMembership(ctx, args.workspaceId)
    const workspace = await ctx.db.get(args.workspaceId)
    if (!workspace) throw new PartnerAccessError("Workspace not found")
    // Bug 12: these are validation failures, not access failures.
    if (args.candidateProcess.trim().length < 4) {
      throw new PartnerInputError("Name the candidate process")
    }
    if (args.problemStatement.trim().length < 12) {
      throw new PartnerInputError(
        "Describe the problem in one short paragraph",
      )
    }
    const existing = await ctx.db
      .query("requests")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .take(100)
    const requestKey = `${workspace.slug.toUpperCase()}-${String(existing.length + 1).padStart(3, "0")}`
    const owner = workspace.supportOwner
    const requestId = await ctx.db.insert("requests", {
      workspaceId: args.workspaceId,
      requestKey,
      accountName: args.accountName?.trim() || undefined,
      candidateProcess: args.candidateProcess.trim(),
      stage: args.stage,
      supportType: args.supportType,
      problemStatement: args.problemStatement.trim(),
      status: "open",
      owner,
      createdBy: actor._id,
      createdAt: Date.now(),
    })
    // Bug 9: tell someone. Mocked until the webhook URL is configured.
    await notifySlack(ctx, {
      workspaceId: args.workspaceId,
      requestKey,
      text: [
        `New partner request ${requestKey} from ${workspace.displayName}`,
        `Stage: ${args.stage} · Support: ${args.supportType}`,
        args.accountName ? `Account: ${args.accountName.trim()}` : undefined,
        `Process: ${args.candidateProcess.trim()}`,
        `Owner: ${owner}`,
      ]
        .filter(Boolean)
        .join("\n"),
    })

    return {
      requestId,
      requestKey,
      status: "open" as const,
      owner,
    }
  },
})

export const ensureSession = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    name: v.optional(v.string()),
    now: v.number(),
  },
  returns: sessionValidator,
  handler: async (ctx, args) => {
    const identityEmail = await ctx.auth.getUserIdentity()
    const email = normalizeEmail(identityEmail?.email ?? args.email)
    if (!email) throw new PartnerAccessError("Not authenticated")
    if (identityEmail?.email && normalizeEmail(identityEmail.email) !== email) {
      throw new PartnerAccessError("Session email mismatch")
    }
    const workspace = await ctx.db.get(args.workspaceId)
    if (!workspace) throw new PartnerAccessError("Workspace not found")

    const staff = isStaffEmail(
      email,
      process.env.STAFF_EMAIL_DOMAINS ?? process.env.STAFF_EMAIL_DOMAIN,
    )
    let user = await ctx.db
      .query("partnerUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique()

    if (!user) {
      const userId = await ctx.db.insert("partnerUsers", {
        email,
        name: args.name?.trim() || email,
        isStaff: staff,
        createdAt: args.now,
      })
      user = await ctx.db.get(userId)
      if (!user) throw new PartnerAccessError("Unable to create user")
    } else if (staff && !user.isStaff) {
      await ctx.db.patch(user._id, { isStaff: true })
      user = { ...user, isStaff: true }
    }

    let membership = await ctx.db
      .query("memberships")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id),
      )
      .unique()

    if (!membership) {
      const invite = (
        await ctx.db
          .query("invitations")
          .withIndex("by_email_and_workspace", (q) =>
            q.eq("email", email).eq("workspaceId", args.workspaceId),
          )
          .take(5)
      ).find((row) => row.consumedAt === undefined && row.expiresAt > args.now)

      if (
        !staff &&
        (!invite ||
          !isAllowedPartnerDomain(email, workspace.allowedEmailDomains))
      ) {
        throw new PartnerAccessError("No invitation for this workspace")
      }

      const role = invite?.role ?? "staff"
      const membershipId = await ctx.db.insert("memberships", {
        userId: user._id,
        workspaceId: args.workspaceId,
        role,
        createdAt: args.now,
      })
      if (invite) {
        await ctx.db.patch(invite._id, { consumedAt: args.now })
      }
      membership = await ctx.db.get(membershipId)
      if (!membership)
        throw new PartnerAccessError("Unable to grant membership")
    }

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        isStaff: user.isStaff,
      },
      membership: {
        _id: membership._id,
        workspaceId: membership.workspaceId,
        role: membership.role,
      },
      workspace: toPublicWorkspace(workspace),
    }
  },
})

export const ensureStaffSession = mutation({
  args: { name: v.optional(v.string()), now: v.number() },
  returns: v.object({ email: v.string(), name: v.string() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const email = normalizeEmail(identity?.email)
    if (
      !isStaffEmail(
        email,
        process.env.STAFF_EMAIL_DOMAINS ?? process.env.STAFF_EMAIL_DOMAIN,
      )
    ) {
      throw new PartnerAccessError("Unauthorized: staff only")
    }
    const existing = await ctx.db
      .query("partnerUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique()
    if (existing) {
      if (!existing.isStaff) await ctx.db.patch(existing._id, { isStaff: true })
      return { email: existing.email, name: existing.name }
    }
    const name = args.name?.trim() || identity?.name || email
    await ctx.db.insert("partnerUsers", {
      email,
      name,
      isStaff: true,
      createdAt: args.now,
    })
    return { email, name }
  },
})

async function recordAudit(
  ctx: MutationCtx,
  actor: Doc<"partnerUsers">,
  action: string,
  fields: {
    workspaceId?: Id<"workspaces">
    target?: string
    detail?: string
  } = {},
) {
  await ctx.db.insert("auditEvents", {
    actorId: actor._id,
    actorEmail: actor.email,
    action,
    workspaceId: fields.workspaceId,
    target: fields.target,
    detail: fields.detail,
    createdAt: Date.now(),
  })
}

const SLACK_CHANNEL = process.env.PARTNER_SLACK_CHANNEL ?? "#partner-requests"

/**
 * Bug 9: composes the message and records it. When PARTNER_SLACK_WEBHOOK_URL is
 * configured this is where the post goes; until then the outbox is the record,
 * readable by staff, so a request is never silently dropped.
 */
async function notifySlack(
  ctx: MutationCtx,
  message: {
    workspaceId: Id<"workspaces">
    requestKey: string
    text: string
  },
) {
  await ctx.db.insert("slackOutbox", {
    channel: SLACK_CHANNEL,
    text: message.text,
    workspaceId: message.workspaceId,
    requestKey: message.requestKey,
    createdAt: Date.now(),
  })
}

/** Bug 9: staff can see what would have been posted. */
export const listSlackOutbox = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  returns: v.array(
    v.object({
      _id: v.id("slackOutbox"),
      channel: v.string(),
      text: v.string(),
      requestKey: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireStaffActor(ctx)
    const workspaceId = args.workspaceId
    const rows = workspaceId
      ? await ctx.db
          .query("slackOutbox")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
          .order("desc")
          .take(50)
      : await ctx.db.query("slackOutbox").order("desc").take(50)
    return rows.map((row) => ({
      _id: row._id,
      channel: row.channel,
      text: row.text,
      requestKey: row.requestKey,
      createdAt: row.createdAt,
    }))
  },
})

const INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1000

export const createInvitation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: partnerInvitationRoleValidator,
    // Bug 13: kept for callers that still send it, but the server decides the
    // window. A client should not be able to mint a never-expiring invite.
    expiresAt: v.optional(v.number()),
  },
  returns: v.id("invitations"),
  handler: async (ctx, args) => {
    const staff = await requireStaffActor(ctx)
    const workspace = await ctx.db.get(args.workspaceId)
    if (!workspace) throw new PartnerAccessError("Workspace not found")
    const email = normalizeEmail(args.email)
    if (!isAllowedPartnerDomain(email, workspace.allowedEmailDomains)) {
      throw new PartnerAccessError(
        "Invite email must match an allowed workspace domain",
      )
    }
    const now = Date.now()
    await recordAudit(ctx, staff, "invitation.create", {
      workspaceId: args.workspaceId,
      target: email,
      detail: args.role,
    })
    // Bug 13: repeated invites for the same address left several live rows.
    const live = (
      await ctx.db
        .query("invitations")
        .withIndex("by_email_and_workspace", (q) =>
          q.eq("email", email).eq("workspaceId", args.workspaceId),
        )
        .take(20)
    ).find((row) => row.consumedAt === undefined && row.expiresAt > now)
    if (live) {
      await ctx.db.patch(live._id, { expiresAt: now + INVITATION_TTL_MS })
      return live._id
    }
    return await ctx.db.insert("invitations", {
      email,
      workspaceId: args.workspaceId,
      role: args.role,
      expiresAt: now + INVITATION_TTL_MS,
      createdAt: now,
      createdBy: staff._id,
    })
  },
})

/**
 * Bug 4: this list omitted "agents", so a workspace created through the admin
 * panel lacked a surface every seeded workspace had. Keep it in one place so
 * the next surface cannot drift the same way.
 */
export const DEFAULT_ENABLED_SURFACES = [
  "home",
  "agents",
  "use-cases",
  "tools",
  "materials",
  "faq",
  "certifications",
  "requests",
] as const

// Surfaces a workspace may enable. Superset of the defaults: the journey is
// opt-in per workspace while it is a prototype, but it must survive a save.
export const KNOWN_SURFACES = [
  ...DEFAULT_ENABLED_SURFACES,
  "journey",
] as const

const workspaceConfigurationValidator = v.object({
  workspaceId: v.id("workspaces"),
  displayName: v.string(),
  brandMode: v.union(
    v.literal("beam-standard"),
    v.literal("co-branded"),
    v.literal("partner-fronted"),
  ),
  brandHeader: v.string(),
  homeTitle: v.string(),
  homeHeadline: v.string(),
  homeDescription: v.string(),
  supportOwner: v.string(),
  allowedEmailDomains: v.array(v.string()),
  // Bug 5: surfaces could never be turned on or off after creation, so the
  // spec's "workspaces can hide a surface until its content is ready" was not
  // achievable through administration.
  enabledSurfaces: v.optional(v.array(v.string())),
})

/** Keeps `enabledSurfaces` to known surfaces, and always keeps home reachable. */
function normalizedSurfaces(surfaces: readonly string[]) {
  const known = new Set<string>(KNOWN_SURFACES)
  const kept = surfaces.map((s) => s.trim()).filter((s) => known.has(s))
  return kept.includes("home") ? kept : ["home", ...kept]
}

function normalizedPartnerDomains(domains: readonly string[]) {
  const result = [
    ...new Set(
      domains
        .map((domain) => domain.trim().toLowerCase().replace(/^@/, ""))
        .filter((domain) =>
          /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
            domain,
          ),
        ),
    ),
  ]
  if (!result.length)
    throw new PartnerAccessError("Add at least one valid partner email domain")
  return result
}

function defaultWorkspaceJourney() {
  return {
    tracks: [
      {
        id: "layer",
        title: "Future of AI-Native Companies",
        framing: "layer" as const,
        summary:
          "Position Beam alongside the client stack and shape the account hypothesis.",
        action: "Open the competitive FAQ",
        href: "/faq",
      },
      {
        id: "beachhead",
        title: "First workflow",
        framing: "beachhead" as const,
        summary:
          "Choose one process, run a diagnostic, and request a shadow demo.",
        action: "Start a client opportunity",
        href: "/requests",
      },
      {
        id: "clearance",
        title: "Risk & delivery readiness",
        framing: "clearance" as const,
        summary:
          "Use reviewed material and route restricted questions to Beam.",
        action: "Open risk FAQ",
        href: "/faq",
      },
    ],
    steps: [
      {
        title: "Qualify the client",
        detail: "Confirm the outcome, urgency, and stakeholders.",
      },
      {
        title: "Run a diagnostic",
        detail: "Map the exception-heavy workflow and systems involved.",
      },
      {
        title: "Show a shadow workflow",
        detail: "Validate the process safely with representative test data.",
      },
      {
        title: "Agree success criteria",
        detail: "Define the first production outcome and evaluation plan.",
      },
    ],
  }
}

export const createWorkspace = mutation({
  args: v.object({
    slug: v.string(),
    name: v.string(),
    displayName: v.string(),
    brandMode: v.union(
      v.literal("beam-standard"),
      v.literal("co-branded"),
      v.literal("partner-fronted"),
    ),
    brandHeader: v.string(),
    homeHeadline: v.string(),
    homeDescription: v.string(),
    supportOwner: v.string(),
    allowedEmailDomains: v.array(v.string()),
  }),
  returns: v.id("workspaces"),
  handler: async (ctx, args) => {
    const staffActor = await requireStaffActor(ctx)
    const slug = args.slug.trim().toLowerCase()
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new PartnerAccessError(
        "Workspace slug must use lowercase letters, numbers, and hyphens",
      )
    }
    if (
      await ctx.db
        .query("workspaces")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique()
    ) {
      throw new PartnerAccessError("A workspace with this slug already exists")
    }
    const journey = defaultWorkspaceJourney()
    const now = Date.now()
    await recordAudit(ctx, staffActor, "workspace.create", { target: slug })
    return await ctx.db.insert("workspaces", {
      slug,
      name: args.name.trim(),
      displayName: args.displayName.trim(),
      primaryHostname: primaryHostnameForWorkspace(slug),
      canonicalPath: `/w/${slug}`,
      brandMode: args.brandMode,
      brandHeader: args.brandHeader.trim(),
      homeTitle: "Future of AI-Native Companies",
      homeHeadline: args.homeHeadline.trim(),
      homeDescription: args.homeDescription.trim(),
      tracks: journey.tracks,
      steps: journey.steps,
      enabledSurfaces: [...DEFAULT_ENABLED_SURFACES],
      supportOwner: args.supportOwner.trim(),
      allowedEmailDomains: normalizedPartnerDomains(args.allowedEmailDomains),
      customDomainStatus: "none",
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const updateWorkspaceConfiguration = mutation({
  args: workspaceConfigurationValidator,
  returns: v.null(),
  handler: async (ctx, args) => {
    const staffActor = await requireStaffActor(ctx)
    const workspace = await ctx.db.get(args.workspaceId)
    if (!workspace) throw new PartnerAccessError("Workspace not found")
    await recordAudit(ctx, staffActor, "workspace.configure", {
      workspaceId: args.workspaceId,
      target: workspace.slug,
    })
    await ctx.db.patch(args.workspaceId, {
      displayName: args.displayName.trim(),
      brandMode: args.brandMode,
      brandHeader: args.brandHeader.trim(),
      homeTitle: args.homeTitle.trim(),
      homeHeadline: args.homeHeadline.trim(),
      homeDescription: args.homeDescription.trim(),
      supportOwner: args.supportOwner.trim(),
      allowedEmailDomains: normalizedPartnerDomains(args.allowedEmailDomains),
      ...(args.enabledSurfaces
        ? { enabledSurfaces: normalizedSurfaces(args.enabledSurfaces) }
        : {}),
      // Bug 1: marks this workspace as admin-owned so a re-seed preserves it.
      configuredAt: Date.now(),
      updatedAt: Date.now(),
    })
    return null
  },
})

export const assignRequest = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    requestId: v.id("requests"),
    owner: v.string(),
    status: requestStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireStaffActor(ctx)
    const request = await ctx.db.get(args.requestId)
    if (!request || request.workspaceId !== args.workspaceId) {
      throw new PartnerAccessError("Request not found")
    }
    await ctx.db.patch(args.requestId, {
      owner: args.owner.trim(),
      status: args.status,
    })
    return null
  },
})

export const attachContent = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    contentId: v.id("contentItems"),
  },
  returns: v.id("contentGrants"),
  handler: async (ctx, args) => {
    await requireStaffActor(ctx)
    const workspace = await ctx.db.get(args.workspaceId)
    const content = await ctx.db.get(args.contentId)
    if (!workspace || !content) {
      throw new PartnerAccessError("Workspace or content not found")
    }
    const existing = await ctx.db
      .query("contentGrants")
      .withIndex("by_workspace_and_content", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("contentId", args.contentId),
      )
      .unique()
    if (existing) return existing._id
    return await ctx.db.insert("contentGrants", {
      contentId: args.contentId,
      workspaceId: args.workspaceId,
      createdAt: Date.now(),
    })
  },
})

/**
 * Bug 2: nothing removed a membership, so someone who left a partner firm kept
 * access indefinitely. Removing the workspace domain did not help, because an
 * existing membership is never re-validated.
 */
export const removeMembership = mutation({
  args: { membershipId: v.id("memberships") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const staff = await requireStaffActor(ctx)
    const membership = await ctx.db.get(args.membershipId)
    if (!membership) throw new PartnerAccessError("Membership not found")
    const user = await ctx.db.get(membership.userId)
    await recordAudit(ctx, staff, "membership.remove", {
      workspaceId: membership.workspaceId,
      target: user?.email,
      detail: membership.role,
    })
    await ctx.db.delete(args.membershipId)
    return null
  },
})

/** Bug 2: a sent invitation could not be cancelled before it was consumed. */
export const revokeInvitation = mutation({
  args: { invitationId: v.id("invitations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const staff = await requireStaffActor(ctx)
    const invitation = await ctx.db.get(args.invitationId)
    if (!invitation) throw new PartnerAccessError("Invitation not found")
    if (invitation.consumedAt !== undefined) {
      throw new PartnerInputError(
        "This invitation was already used. Remove the membership instead.",
      )
    }
    await recordAudit(ctx, staff, "invitation.revoke", {
      workspaceId: invitation.workspaceId,
      target: invitation.email,
    })
    await ctx.db.delete(args.invitationId)
    return null
  },
})

/**
 * Bug 6: content could be attached to a workspace but never taken back, and a
 * re-seed only ever adds grants, so a mistake was permanent.
 */
export const detachContent = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    contentId: v.id("contentItems"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const staff = await requireStaffActor(ctx)
    const grant = await ctx.db
      .query("contentGrants")
      .withIndex("by_workspace_and_content", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("contentId", args.contentId),
      )
      .unique()
    if (!grant) throw new PartnerInputError("That content is not attached")
    const item = await ctx.db.get(args.contentId)
    await recordAudit(ctx, staff, "content.detach", {
      workspaceId: args.workspaceId,
      target: item ? `${item.kind}:${item.slug}` : undefined,
    })
    await ctx.db.delete(grant._id)
    return null
  },
})

/** Bug 3: staff need to be able to read the trail, not just write it. */
export const listAuditEvents = query({
  args: { workspaceId: v.optional(v.id("workspaces")) },
  returns: v.array(
    v.object({
      _id: v.id("auditEvents"),
      actorEmail: v.string(),
      action: v.string(),
      target: v.optional(v.string()),
      detail: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireStaffActor(ctx)
    const workspaceId = args.workspaceId
    const rows = workspaceId
      ? await ctx.db
          .query("auditEvents")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
          .order("desc")
          .take(100)
      : await ctx.db.query("auditEvents").order("desc").take(100)
    return rows.map((row) => ({
      _id: row._id,
      actorEmail: row.actorEmail,
      action: row.action,
      target: row.target,
      detail: row.detail,
      createdAt: row.createdAt,
    }))
  },
})

export const approveClaim = mutation({
  args: {
    contentId: v.id("contentItems"),
    claimState: claimStateValidator,
    reviewer: v.string(),
    reviewedAt: v.number(),
    revalidateAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const staff = await requireStaffActor(ctx)
    const content = await ctx.db.get(args.contentId)
    if (!content) throw new PartnerAccessError("Content not found")
    await recordAudit(ctx, staff, "claim.review", {
      target: `${content.kind}:${content.slug}`,
      detail: `${content.claimState} → ${args.claimState}`,
    })
    await ctx.db.patch(args.contentId, {
      claimState: args.claimState,
      reviewer: args.reviewer.trim(),
      reviewedAt: args.reviewedAt,
      revalidateAt: args.revalidateAt,
      // Bug 1: marks this decision as staff-made so a re-seed preserves it.
      claimReviewedAt: Date.now(),
      contentClass:
        args.claimState === "staff-draft"
          ? "staff-draft"
          : content.contentClass,
    })
    return null
  },
})

export const listWorkspacesForStaff = query({
  args: {},
  returns: v.array(workspacePublicValidator),
  handler: async (ctx) => {
    await requireStaffActor(ctx)
    const workspaces = await ctx.db.query("workspaces").take(50)
    return workspaces.map(toPublicWorkspace)
  },
})

export const listWorkspaceSummariesForStaff = query({
  args: {},
  returns: v.array(
    v.object({
      workspace: workspacePublicValidator,
      memberCount: v.number(),
      openInvitationCount: v.number(),
      contentCount: v.number(),
      requestCount: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireStaffActor(ctx)
    const workspaces = await ctx.db.query("workspaces").take(50)
    const summaries = []
    for (const workspace of workspaces) {
      const [memberships, invitations, grants, requests] = await Promise.all([
        ctx.db
          .query("memberships")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
          .take(100),
        ctx.db
          .query("invitations")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
          .take(100),
        ctx.db
          .query("contentGrants")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
          .take(300),
        ctx.db
          .query("requests")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
          .take(100),
      ])
      let memberCount = 0
      for (const membership of memberships) {
        const user = await ctx.db.get(membership.userId)
        if (user && !user.isStaff) memberCount += 1
      }
      summaries.push({
        workspace: toPublicWorkspace(workspace),
        memberCount,
        openInvitationCount: invitations.filter(
          (invite) =>
            invite.consumedAt === undefined && invite.expiresAt > Date.now(),
        ).length,
        contentCount: grants.length,
        requestCount: requests.length,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      })
    }
    return summaries.sort((a, b) =>
      a.workspace.displayName.localeCompare(b.workspace.displayName),
    )
  },
})

export const listInvitations = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.array(
    v.object({
      _id: v.id("invitations"),
      email: v.string(),
      role: partnerInvitationRoleValidator,
      expiresAt: v.number(),
      consumedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireStaffActor(ctx)
    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .take(100)
    return invitations.map((invite) => ({
      _id: invite._id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      consumedAt: invite.consumedAt,
    }))
  },
})

export const listAllContentForStaff = query({
  args: {},
  returns: v.array(contentCardValidator),
  handler: async (ctx) => {
    await requireStaffActor(ctx)
    const items = await ctx.db.query("contentItems").take(200)
    return items.map(toContentCard)
  },
})

export const listContentForStaff = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.array(
    v.object({
      content: contentCardValidator,
      attached: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireStaffActor(ctx)
    const [items, grants] = await Promise.all([
      ctx.db.query("contentItems").take(300),
      ctx.db
        .query("contentGrants")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .take(300),
    ])
    const attached = new Set(grants.map((grant) => String(grant.contentId)))
    return items.map((item) => ({
      content: toContentCard(item),
      attached: attached.has(String(item._id)),
    }))
  },
})

export const listMembershipsForStaff = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.array(
    v.object({
      userId: v.id("partnerUsers"),
      name: v.string(),
      email: v.string(),
      role: membershipRoleValidator,
      isStaff: v.boolean(),
      joinedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireStaffActor(ctx)
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .take(100)
    const result: Array<{
      userId: Id<"partnerUsers">
      name: string
      email: string
      role: Doc<"memberships">["role"]
      isStaff: boolean
      joinedAt: number
    }> = []
    for (const membership of memberships) {
      const user = await ctx.db.get(membership.userId)
      if (!user) continue
      result.push({
        userId: user._id,
        name: user.name,
        email: user.email,
        role: membership.role,
        isStaff: user.isStaff,
        joinedAt: membership.createdAt,
      })
    }
    return result
  },
})

export const listRequestsForStaff = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.array(
    v.object({
      _id: v.id("requests"),
      requestKey: v.string(),
      accountName: v.optional(v.string()),
      candidateProcess: v.string(),
      stage: requestStageValidator,
      supportType: requestSupportTypeValidator,
      problemStatement: v.string(),
      status: requestStatusValidator,
      owner: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireStaffActor(ctx)
    const requests = await ctx.db
      .query("requests")
      .withIndex("by_workspace_and_created", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .order("desc")
      .take(100)
    return requests.map((request) => ({
      _id: request._id,
      requestKey: request.requestKey,
      accountName: request.accountName,
      candidateProcess: request.candidateProcess,
      stage: request.stage,
      supportType: request.supportType,
      problemStatement: request.problemStatement,
      status: request.status,
      owner: request.owner,
      createdAt: request.createdAt,
    }))
  },
})
