import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import {
  PartnerAccessError,
  isVisibleToPartner,
  partnerFacingContent,
  requireActor,
  requireMembership,
  requireStaffActor,
} from "./lib/access"
import { isStaffEmail, normalizeEmail } from "./lib/authPolicy"
import {
  claimStateValidator,
  contentKindValidator,
  membershipRoleValidator,
  partnerInvitationRoleValidator,
  requestStageValidator,
  requestStatusValidator,
  requestSupportTypeValidator,
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
    v.literal("partner-fronted")
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
        v.literal("clearance")
      ),
      summary: v.string(),
      action: v.string(),
      href: v.string(),
    })
  ),
  steps: v.array(
    v.object({
      title: v.string(),
      detail: v.string(),
    })
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
        args.workspaceId
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
    })
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
    v.literal("staff-draft")
  ),
  audience: v.union(
    v.literal("partner-internal"),
    v.literal("client-forwardable"),
    v.literal("technical")
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
  }
}

async function listGrantedContent(
  ctx: Parameters<typeof requireMembership>[0],
  workspaceId: Id<"workspaces">,
  kind: Doc<"contentItems">["kind"]
) {
  const { actor } = await requireMembership(ctx, workspaceId)
  const grants = await ctx.db
    .query("contentGrants")
    .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
    .take(100)
  const items: ReturnType<typeof toContentCard>[] = []
  for (const grant of grants) {
    const item = await ctx.db.get(grant.contentId)
    if (!item || item.kind !== kind) continue
    if (!isVisibleToPartner(item, actor.isStaff)) continue
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
        q.eq("kind", args.kind).eq("slug", args.slug)
      )
      .unique()
    if (!item) return null
    const grant = await ctx.db
      .query("contentGrants")
      .withIndex("by_workspace_and_content", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("contentId", item._id)
      )
      .unique()
    if (!grant) return null
    if (!isVisibleToPartner(item, actor.isStaff)) return null
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
      })
    ),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.workspaceId)
    const result = await ctx.db
      .query("requests")
      .withIndex("by_workspace_and_created", (q) =>
        q.eq("workspaceId", args.workspaceId)
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
    if (args.candidateProcess.trim().length < 4) {
      throw new PartnerAccessError("Name the candidate process")
    }
    if (args.problemStatement.trim().length < 12) {
      throw new PartnerAccessError(
        "Describe the problem in one short paragraph"
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

    const staff = isStaffEmail(email, process.env.STAFF_EMAIL_DOMAIN)
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
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .unique()

    if (!membership) {
      const invite = (
        await ctx.db
          .query("invitations")
          .withIndex("by_email_and_workspace", (q) =>
            q.eq("email", email).eq("workspaceId", args.workspaceId)
          )
          .take(5)
      ).find((row) => row.consumedAt === undefined && row.expiresAt > args.now)

      if (!invite && !staff) {
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

    const workspace = await ctx.db.get(args.workspaceId)
    if (!workspace) throw new PartnerAccessError("Workspace not found")

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

export const createInvitation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: partnerInvitationRoleValidator,
    expiresAt: v.number(),
  },
  returns: v.id("invitations"),
  handler: async (ctx, args) => {
    const staff = await requireStaffActor(ctx)
    const workspace = await ctx.db.get(args.workspaceId)
    if (!workspace) throw new PartnerAccessError("Workspace not found")
    const email = normalizeEmail(args.email)
    if (!email.includes("@")) {
      throw new PartnerAccessError("Invalid invite email")
    }
    return await ctx.db.insert("invitations", {
      email,
      workspaceId: args.workspaceId,
      role: args.role,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
      createdBy: staff._id,
    })
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
        q.eq("workspaceId", args.workspaceId).eq("contentId", args.contentId)
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
    await requireStaffActor(ctx)
    const content = await ctx.db.get(args.contentId)
    if (!content) throw new PartnerAccessError("Content not found")
    await ctx.db.patch(args.contentId, {
      claimState: args.claimState,
      reviewer: args.reviewer.trim(),
      reviewedAt: args.reviewedAt,
      revalidateAt: args.revalidateAt,
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

export const listInvitations = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.array(
    v.object({
      _id: v.id("invitations"),
      email: v.string(),
      role: partnerInvitationRoleValidator,
      expiresAt: v.number(),
      consumedAt: v.optional(v.number()),
    })
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

export const listMembershipsForStaff = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.array(
    v.object({
      email: v.string(),
      role: membershipRoleValidator,
    })
  ),
  handler: async (ctx, args) => {
    await requireStaffActor(ctx)
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .take(100)
    const result: Array<{ email: string; role: Doc<"memberships">["role"] }> =
      []
    for (const membership of memberships) {
      const user = await ctx.db.get(membership.userId)
      if (!user) continue
      result.push({ email: user.email, role: membership.role })
    }
    return result
  },
})
