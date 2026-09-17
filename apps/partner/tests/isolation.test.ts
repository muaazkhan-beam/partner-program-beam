import assert from "node:assert/strict"
import test from "node:test"
import { convexTest } from "convex-test"

import { internal } from "../convex/_generated/api"
import schema from "../convex/schema"
import { api } from "../convex/_generated/api"

process.env.STAFF_EMAIL_DOMAIN = "beam.ai"

const convexModules = {
  "../convex/partner.ts": () => import("../convex/partner.ts"),
  "../convex/seed.ts": () => import("../convex/seed.ts"),
  "../convex/lib/access.ts": () => import("../convex/lib/access.ts"),
  "../convex/lib/authPolicy.ts": () => import("../convex/lib/authPolicy.ts"),
  "../convex/lib/validators.ts": () => import("../convex/lib/validators.ts"),
  "../convex/_generated/api.ts": () => import("../convex/_generated/api.js"),
  "../convex/_generated/server.ts": () =>
    import("../convex/_generated/server.js"),
}

const now = 1_700_000_000_000

async function seeded() {
  const t = convexTest(schema, convexModules)
  await t.mutation(internal.seed.seedFromCatalog, { now })
  return t
}

async function memberAs(
  t: ReturnType<typeof convexTest>,
  email: string,
  workspaceSlug: string,
  role: "partner_seller" | "staff" = "partner_seller",
) {
  const workspace = await t.query(api.partner.resolveWorkspace, {
    slug: workspaceSlug,
  })
  assert.ok(workspace)
  await t.run(async (ctx) => {
    let user = await ctx.db
      .query("partnerUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique()
    if (!user) {
      const userId = await ctx.db.insert("partnerUsers", {
        email,
        name: email,
        isStaff: email.endsWith("@beam.ai"),
        createdAt: now,
      })
      user = await ctx.db.get(userId)
    }
    if (!user) throw new Error("missing user")
    const existing = await ctx.db
      .query("memberships")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", workspace._id).eq("userId", user._id),
      )
      .unique()
    if (!existing) {
      await ctx.db.insert("memberships", {
        userId: user._id,
        workspaceId: workspace._id,
        role,
        createdAt: now,
      })
    }
  })
  return t.withIdentity({
    subject: email,
    issuer: "https://partner.test",
    email,
    name: email,
  })
}

test("PwC and Roland Berger resolve separately on canonical path and primary host", async () => {
  const t = await seeded()
  const pwcPath = await t.query(api.partner.resolveWorkspace, {
    slug: "pwc-me",
  })
  const pwcHost = await t.query(api.partner.resolveWorkspace, {
    host: "pwc-me.partner.beam.ai",
  })
  const rolandBerger = await t.query(api.partner.resolveWorkspace, {
    host: "roland-berger.partner.beam.ai",
  })
  assert.equal(pwcPath?.slug, "pwc-me")
  assert.equal(pwcHost?.slug, "pwc-me")
  assert.equal(pwcPath?._id, pwcHost?._id)
  assert.equal(rolandBerger?.slug, "roland-berger")
  assert.notEqual(pwcPath?._id, rolandBerger?._id)
  assert.equal(
    await t.query(api.partner.resolveWorkspace, {
      host: "unknown.example.com",
    }),
    null,
  )
})

test("neither tenant can read the other's materials, requests, or memberships", async () => {
  const t = await seeded()
  const pwc = await memberAs(t, "paul@pwc.com", "pwc-me")
  const roboyo = await memberAs(t, "alex@roboyo.com", "roboyo")
  const pwcWorkspace = await t.query(api.partner.resolveWorkspace, {
    slug: "pwc-me",
  })
  const roboyoWorkspace = await t.query(api.partner.resolveWorkspace, {
    slug: "roboyo",
  })
  assert.ok(pwcWorkspace && roboyoWorkspace)

  const pwcMaterials = await pwc.query(api.partner.listContent, {
    workspaceId: pwcWorkspace._id,
    kind: "material",
  })
  const roboyoMaterials = await roboyo.query(api.partner.listContent, {
    workspaceId: roboyoWorkspace._id,
    kind: "material",
  })
  assert.ok(
    pwcMaterials.some((item) => item.slug === "shared-services-packaging"),
  )
  assert.ok(
    !roboyoMaterials.some((item) => item.slug === "shared-services-packaging"),
  )

  await assert.rejects(
    pwc.query(api.partner.listContent, {
      workspaceId: roboyoWorkspace._id,
      kind: "material",
    }),
    /Not a member of this workspace/,
  )
  await assert.rejects(
    roboyo.query(api.partner.listRequests, {
      workspaceId: pwcWorkspace._id,
      paginationOpts: { numItems: 10, cursor: null },
    }),
    /Not a member of this workspace/,
  )

  const created = await pwc.mutation(api.partner.createRequest, {
    workspaceId: pwcWorkspace._id,
    candidateProcess: "Invoice exceptions",
    stage: "shadow",
    supportType: "shadow-demo",
    problemStatement: "Need a shadow workflow on invoice exceptions.",
  })
  const pwcRequests = await pwc.query(api.partner.listRequests, {
    workspaceId: pwcWorkspace._id,
    paginationOpts: { numItems: 10, cursor: null },
  })
  assert.equal(pwcRequests.page[0]?.requestKey, created.requestKey)
  await assert.rejects(
    roboyo.query(api.partner.listMembershipsForStaff, {
      workspaceId: pwcWorkspace._id,
    }),
    /staff only/,
  )
})

test("an invited user only sees their workspace and unknown email fails closed", async () => {
  const t = await seeded()
  const pwcWorkspace = await t.query(api.partner.resolveWorkspace, {
    slug: "pwc-me",
  })
  assert.ok(pwcWorkspace)
  const invited = await memberAs(t, "seller@pwc.com", "pwc-me")
  const session = await invited.query(api.partner.getWorkspaceSession, {
    workspaceId: pwcWorkspace._id,
  })
  assert.equal(session?.user.email, "seller@pwc.com")
  assert.equal(session?.workspace.slug, "pwc-me")

  const stranger = t.withIdentity({
    subject: "unknown@example.com",
    issuer: "https://partner.test",
    email: "unknown@example.com",
  })
  const denied = await stranger.query(api.partner.getWorkspaceSession, {
    workspaceId: pwcWorkspace._id,
  })
  assert.equal(denied, null)
  await assert.rejects(
    stranger.query(api.partner.listContent, {
      workspaceId: pwcWorkspace._id,
      kind: "faq",
    }),
    /Not authorized/,
  )
})

test("an allowed domain still needs a named invite and an invite stays workspace-scoped", async () => {
  const t = await seeded()
  const staff = await memberAs(t, "jonas@beam.ai", "pwc-me", "staff")
  const pwc = await t.query(api.partner.resolveWorkspace, { slug: "pwc-me" })
  const rolandBerger = await t.query(api.partner.resolveWorkspace, {
    slug: "roland-berger",
  })
  assert.ok(pwc && rolandBerger)
  const seller = t.withIdentity({
    subject: "new.seller@pwc.com",
    issuer: "https://partner.test",
    email: "new.seller@pwc.com",
    name: "New seller",
  })

  await assert.rejects(
    seller.mutation(api.partner.ensureSession, {
      workspaceId: pwc._id,
      email: "new.seller@pwc.com",
      name: "New seller",
      now,
    }),
    /No invitation for this workspace/,
  )
  await staff.mutation(api.partner.createInvitation, {
    workspaceId: pwc._id,
    email: "new.seller@pwc.com",
    role: "partner_seller",
    expiresAt: now + 86_400_000,
  })
  const session = await seller.mutation(api.partner.ensureSession, {
    workspaceId: pwc._id,
    email: "new.seller@pwc.com",
    name: "New seller",
    now,
  })
  assert.equal(session.workspace.slug, "pwc-me")
  await assert.rejects(
    seller.mutation(api.partner.ensureSession, {
      workspaceId: rolandBerger._id,
      email: "new.seller@pwc.com",
      name: "New seller",
      now,
    }),
    /No invitation for this workspace/,
  )
})

test("staff can attach a reviewed material without a code fork", async () => {
  const t = await seeded()
  const staffEmail = "jonas@beam.ai"
  const pwc = await memberAs(t, staffEmail, "pwc-me", "staff")
  const roboyoWorkspace = await t.query(api.partner.resolveWorkspace, {
    slug: "roboyo",
  })
  assert.ok(roboyoWorkspace)
  const content = await pwc.query(api.partner.listAllContentForStaff, {})
  const packaging = content.find(
    (item) => item.slug === "shared-services-packaging",
  )
  assert.ok(packaging)
  await pwc.mutation(api.partner.attachContent, {
    workspaceId: roboyoWorkspace._id,
    contentId: packaging._id,
  })
  const roboyo = await memberAs(t, "alex@roboyo.com", "roboyo")
  const materials = await roboyo.query(api.partner.listContent, {
    workspaceId: roboyoWorkspace._id,
    kind: "material",
  })
  assert.ok(materials.some((item) => item.slug === "shared-services-packaging"))
})

test("staff admin enforces workspace email domains and can configure a new space", async () => {
  const t = await seeded()
  const staff = await memberAs(t, "jonas@beam.ai", "pwc-me", "staff")
  const pwc = await t.query(api.partner.resolveWorkspace, { slug: "pwc-me" })
  assert.ok(pwc)

  await assert.rejects(
    staff.mutation(api.partner.createInvitation, {
      workspaceId: pwc._id,
      email: "outside@example.com",
      role: "partner_seller",
      expiresAt: now + 86_400_000,
    }),
    /allowed workspace domain/,
  )

  const workspaceId = await staff.mutation(api.partner.createWorkspace, {
    slug: "example-consulting",
    name: "Example Consulting GmbH",
    displayName: "Example Consulting",
    brandMode: "co-branded",
    brandHeader: "Example Consulting × Beam",
    homeHeadline: "Launch one governed workflow",
    homeDescription: "A reviewed partner workspace for one client workflow.",
    supportOwner: "partner-success@beam.ai",
    allowedEmailDomains: ["example-consulting.com"],
  })
  await staff.mutation(api.partner.updateWorkspaceConfiguration, {
    workspaceId,
    displayName: "Example Consulting DACH",
    brandMode: "co-branded",
    brandHeader: "Example Consulting DACH × Beam",
    homeTitle: "Future of AI-Native Companies",
    homeHeadline: "Launch one reviewed workflow",
    homeDescription: "The selected home copy is scoped to this workspace.",
    supportOwner: "partner-success@beam.ai",
    allowedEmailDomains: ["example-consulting.com", "example.de"],
  })
  const configured = await t.query(api.partner.resolveWorkspace, {
    slug: "example-consulting",
  })
  assert.equal(
    configured?.primaryHostname,
    "example-consulting.partner.beam.ai",
  )
  assert.deepEqual(configured?.allowedEmailDomains, [
    "example-consulting.com",
    "example.de",
  ])
  assert.equal(configured?.homeHeadline, "Launch one reviewed workflow")
})

test("staff workspace management returns partner counts and member details", async () => {
  const t = await seeded()
  const staff = await memberAs(t, "jonas@beam.ai", "roboyo", "staff")
  await memberAs(t, "alex@roboyo.com", "roboyo")
  const roboyo = await t.query(api.partner.resolveWorkspace, {
    slug: "roboyo",
  })
  assert.ok(roboyo)

  const summaries = await staff.query(
    api.partner.listWorkspaceSummariesForStaff,
    {},
  )
  const summary = summaries.find((item) => item.workspace.slug === "roboyo")
  assert.ok(summary)
  assert.equal(summary.memberCount, 1)

  const members = await staff.query(api.partner.listMembershipsForStaff, {
    workspaceId: roboyo._id,
  })
  const partnerMember = members.find(
    (member) => member.email === "alex@roboyo.com",
  )
  assert.deepEqual(partnerMember, {
    userId: partnerMember?.userId,
    name: "alex@roboyo.com",
    email: "alex@roboyo.com",
    role: "partner_seller",
    isStaff: false,
    joinedAt: now,
  })
})

test("restricted deployment FAQ returns request-Beam instead of an unreviewed claim", async () => {
  const t = await seeded()
  const pwc = await memberAs(t, "paul@pwc.com", "pwc-me")
  const workspace = await t.query(api.partner.resolveWorkspace, {
    slug: "pwc-me",
  })
  assert.ok(workspace)
  const faq = await pwc.query(api.partner.getContent, {
    workspaceId: workspace._id,
    kind: "faq",
    slug: "deployment-ksa-kuwait",
  })
  assert.equal(faq?.claimState, "restricted")
  assert.match(faq?.body ?? "", /Request Beam for a deployment review/)
  assert.doesNotMatch(faq?.body ?? "", /on-prem/i)
})

test("preview seed loads the demo and reviewed partner workspaces without staff auth", async () => {
  const t = convexTest(schema, convexModules)
  const result = await t.mutation(internal.seed.seedPreview, {})
  assert.equal(result.workspaceCount, 4)
  assert.ok(result.contentCount > 0)
  const demo = await t.query(api.partner.resolveWorkspace, {
    slug: "partner-demo",
  })
  const pwc = await t.query(api.partner.resolveWorkspace, { slug: "pwc-me" })
  const roboyo = await t.query(api.partner.resolveWorkspace, {
    slug: "roboyo",
  })
  const rolandBerger = await t.query(api.partner.resolveWorkspace, {
    slug: "roland-berger",
  })
  assert.equal(demo?.slug, "partner-demo")
  assert.equal(pwc?.slug, "pwc-me")
  assert.equal(roboyo?.slug, "roboyo")
  assert.equal(rolandBerger?.slug, "roland-berger")
})

test("use cases are granted per workspace and carry their guardrails", async () => {
  const t = await seeded()
  const pwc = await memberAs(t, "paul@pwc.com", "pwc-me")
  const roboyo = await memberAs(t, "alex@roboyo.com", "roboyo")
  const pwcWorkspace = await t.query(api.partner.resolveWorkspace, {
    slug: "pwc-me",
  })
  const roboyoWorkspace = await t.query(api.partner.resolveWorkspace, {
    slug: "roboyo",
  })
  assert.ok(pwcWorkspace && roboyoWorkspace)

  const pwcUseCases = await pwc.query(api.partner.listContent, {
    workspaceId: pwcWorkspace._id,
    kind: "use-case",
  })
  const roboyoUseCases = await roboyo.query(api.partner.listContent, {
    workspaceId: roboyoWorkspace._id,
    kind: "use-case",
  })

  // Both advisory and BPO partners sell finance exceptions.
  assert.ok(
    pwcUseCases.some((item) => item.slug === "invoice-exception-handling"),
  )
  // CV screening is granted to the BPO workspace only.
  assert.ok(roboyoUseCases.some((item) => item.slug === "cv-screening"))
  assert.ok(!pwcUseCases.some((item) => item.slug === "cv-screening"))

  // A workspace cannot read another's use cases even with a valid session.
  await assert.rejects(
    pwc.query(api.partner.listContent, {
      workspaceId: roboyoWorkspace._id,
      kind: "use-case",
    }),
  )

  // Every use case names the step that keeps a human approver, and no number
  // reaches a partner without a source.
  for (const item of [...pwcUseCases, ...roboyoUseCases]) {
    assert.ok(
      item.useCase?.humanInLoop,
      `${item.slug} must name its human-in-the-loop step`,
    )
    assert.ok(item.useCase.systems.length > 0)
    if (item.useCase.outcome) {
      assert.ok(
        item.useCase.outcome.source,
        `${item.slug} claims an outcome without a source`,
      )
    }
  }
})
test("brand mode gates content, and staff still see everything (bug 7)", async () => {
  const t = await seeded()
  const roboyo = await memberAs(t, "alex@roboyo.com", "roboyo")
  const workspace = await t.query(api.partner.resolveWorkspace, {
    slug: "roboyo",
  })
  assert.ok(workspace)

  // Restrict a granted material to a brand mode this workspace does not use.
  const target = await t.run(async (ctx) => {
    const item = await ctx.db
      .query("contentItems")
      .withIndex("by_kind_and_slug", (q) =>
        q.eq("kind", "material").eq("slug", "where-beam-fits"),
      )
      .unique()
    assert.ok(item)
    const other =
      workspace.brandMode === "beam-standard" ? "partner-fronted" : "beam-standard"
    await ctx.db.patch(item._id, { allowedBrandModes: [other] })
    return item._id
  })

  const partnerView = await roboyo.query(api.partner.listContent, {
    workspaceId: workspace._id,
    kind: "material",
  })
  assert.ok(
    !partnerView.some((item) => item.slug === "where-beam-fits"),
    "a material not approved for this brand mode must not reach a partner",
  )
  assert.equal(
    await roboyo.query(api.partner.getContent, {
      workspaceId: workspace._id,
      kind: "material",
      slug: "where-beam-fits",
    }),
    null,
  )

  // Staff review it from any workspace.
  const staff = await memberAs(t, "review@beam.ai", "roboyo", "staff")
  const staffView = await staff.query(api.partner.listContent, {
    workspaceId: workspace._id,
    kind: "material",
  })
  assert.ok(staffView.some((item) => item.slug === "where-beam-fits"))
  assert.ok(target)
})

test("restricted claims redact the summary as well as the body (bug 10)", async () => {
  const t = await seeded()
  const pwc = await memberAs(t, "paul@pwc.com", "pwc-me")
  const workspace = await t.query(api.partner.resolveWorkspace, {
    slug: "pwc-me",
  })
  assert.ok(workspace)

  await t.run(async (ctx) => {
    const item = await ctx.db
      .query("contentItems")
      .withIndex("by_kind_and_slug", (q) =>
        q.eq("kind", "faq").eq("slug", "deployment-ksa-kuwait"),
      )
      .unique()
    assert.ok(item)
    await ctx.db.patch(item._id, {
      summary: "Yes, Beam guarantees full data residency in KSA.",
    })
  })

  const item = await pwc.query(api.partner.getContent, {
    workspaceId: workspace._id,
    kind: "faq",
    slug: "deployment-ksa-kuwait",
  })
  assert.ok(item)
  assert.ok(
    !item.summary.includes("guarantees full data residency"),
    "an unreviewed claim in the summary must not reach a partner",
  )
})

test("staff can revoke access and detach content, and it is audited (bugs 2, 3, 6)", async () => {
  const t = await seeded()
  const staff = await memberAs(t, "ops@beam.ai", "roboyo", "staff")
  const workspace = await t.query(api.partner.resolveWorkspace, {
    slug: "roboyo",
  })
  assert.ok(workspace)

  // Invite, then revoke before it is used.
  const invitationId = await staff.mutation(api.partner.createInvitation, {
    workspaceId: workspace._id,
    email: "leaver@roboyo.com",
    role: "partner_seller",
  })
  await staff.mutation(api.partner.revokeInvitation, { invitationId })
  const remaining = await staff.query(api.partner.listInvitations, {
    workspaceId: workspace._id,
  })
  assert.ok(!remaining.some((row) => row.email === "leaver@roboyo.com"))

  // A member who leaves loses access.
  const leaver = await memberAs(t, "gone@roboyo.com", "roboyo")
  const membershipId = await t.run(async (ctx) => {
    const user = await ctx.db
      .query("partnerUsers")
      .withIndex("by_email", (q) => q.eq("email", "gone@roboyo.com"))
      .unique()
    assert.ok(user)
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_workspace_and_user", (q) =>
        q.eq("workspaceId", workspace._id).eq("userId", user._id),
      )
      .unique()
    assert.ok(membership)
    return membership._id
  })
  await staff.mutation(api.partner.removeMembership, { membershipId })
  await assert.rejects(
    leaver.query(api.partner.listContent, {
      workspaceId: workspace._id,
      kind: "material",
    }),
    "a removed member must lose access immediately",
  )

  // Content can be taken back.
  const contentId = await t.run(async (ctx) => {
    const item = await ctx.db
      .query("contentItems")
      .withIndex("by_kind_and_slug", (q) =>
        q.eq("kind", "faq").eq("slug", "why-not-sap"),
      )
      .unique()
    assert.ok(item)
    return item._id
  })
  await staff.mutation(api.partner.detachContent, {
    workspaceId: workspace._id,
    contentId,
  })
  const faq = await staff.query(api.partner.listContent, {
    workspaceId: workspace._id,
    kind: "faq",
  })
  assert.ok(!faq.some((item) => item.slug === "why-not-sap"))

  // Every one of those is on the record.
  const audit = await staff.query(api.partner.listAuditEvents, {})
  const actions = new Set(audit.map((row) => row.action))
  for (const action of [
    "invitation.create",
    "invitation.revoke",
    "membership.remove",
    "content.detach",
  ]) {
    assert.ok(actions.has(action), `${action} must be audited`)
  }
})

test("a workspace created by staff gets every default surface (bug 4)", async () => {
  const t = await seeded()
  const staff = await memberAs(t, "ops@beam.ai", "roboyo", "staff")
  const workspaceId = await staff.mutation(api.partner.createWorkspace, {
    slug: "new-partner",
    name: "New Partner",
    displayName: "New Partner",
    brandMode: "co-branded",
    brandHeader: "New Partner × Beam",
    homeHeadline: "Land one process",
    homeDescription: "Shared shell with approved content.",
    supportOwner: "partner-success@beam.ai",
    allowedEmailDomains: ["newpartner.com"],
  })

  const created = await t.run(async (ctx) => ctx.db.get(workspaceId))
  assert.ok(created)
  assert.ok(
    created.enabledSurfaces.includes("agents"),
    "admin-created workspaces must not miss a surface the seeded ones have",
  )

  // And surfaces can be changed afterwards (bug 5).
  await staff.mutation(api.partner.updateWorkspaceConfiguration, {
    workspaceId,
    displayName: "New Partner",
    brandMode: "co-branded",
    brandHeader: "New Partner × Beam",
    homeTitle: "Future of AI-Native Companies",
    homeHeadline: "Land one process",
    homeDescription: "Shared shell with approved content.",
    supportOwner: "partner-success@beam.ai",
    allowedEmailDomains: ["newpartner.com"],
    enabledSurfaces: ["home", "tools", "faq"],
  })
  const updated = await t.run(async (ctx) => ctx.db.get(workspaceId))
  assert.deepEqual(updated?.enabledSurfaces, ["home", "tools", "faq"])
})

test("re-seeding preserves staff decisions but still refreshes content (bug 1)", async () => {
  const t = await seeded()
  const staff = await memberAs(t, "ops@beam.ai", "roboyo", "staff")
  const workspace = await t.query(api.partner.resolveWorkspace, {
    slug: "roboyo",
  })
  assert.ok(workspace)

  // Staff reconfigure the workspace and review a claim.
  await staff.mutation(api.partner.updateWorkspaceConfiguration, {
    workspaceId: workspace._id,
    displayName: "Roboyo Middle East",
    brandMode: "partner-fronted",
    brandHeader: "Roboyo, powered by Beam",
    homeTitle: "Future of AI-Native Companies",
    homeHeadline: "Land one process",
    homeDescription: "Configured by staff.",
    supportOwner: "me@beam.ai",
    allowedEmailDomains: ["roboyo.com"],
    enabledSurfaces: ["home", "tools", "faq"],
  })
  const restricted = await t.run(async (ctx) => {
    const item = await ctx.db
      .query("contentItems")
      .withIndex("by_kind_and_slug", (q) =>
        q.eq("kind", "faq").eq("slug", "why-not-sap"),
      )
      .unique()
    assert.ok(item)
    return item._id
  })
  await staff.mutation(api.partner.approveClaim, {
    contentId: restricted,
    claimState: "restricted",
    reviewer: "Legal",
    reviewedAt: now,
    revalidateAt: now + 1_000,
  })

  // Someone clicks "Seed reviewed catalog" again.
  await t.mutation(internal.seed.seedFromCatalog, { now: now + 5_000 })

  const after = await t.run(async (ctx) => ctx.db.get(workspace._id))
  assert.ok(after)
  assert.equal(after.displayName, "Roboyo Middle East", "config must survive")
  assert.equal(after.brandMode, "partner-fronted")
  assert.equal(after.supportOwner, "me@beam.ai")
  assert.deepEqual(after.enabledSurfaces, ["home", "tools", "faq"])

  const claim = await t.run(async (ctx) => ctx.db.get(restricted))
  assert.equal(claim?.claimState, "restricted", "claim review must survive")
  assert.equal(claim?.reviewer, "Legal")

  // But the catalog is still the source of truth for structure and text.
  assert.equal(after.canonicalPath, "/w/roboyo")
  assert.ok(after.tracks.length > 0)
  const untouched = await t.run(async (ctx) =>
    ctx.db
      .query("contentItems")
      .withIndex("by_kind_and_slug", (q) =>
        q.eq("kind", "faq").eq("slug", "how-we-make-money"),
      )
      .unique(),
  )
  assert.equal(untouched?.claimState, "approved")
})

test("a request notifies Slack instead of landing silently (bug 9)", async () => {
  const t = await seeded()
  const roboyo = await memberAs(t, "alex@roboyo.com", "roboyo")
  const workspace = await t.query(api.partner.resolveWorkspace, {
    slug: "roboyo",
  })
  assert.ok(workspace)

  const created = await roboyo.mutation(api.partner.createRequest, {
    workspaceId: workspace._id,
    accountName: "Acme Logistics",
    candidateProcess: "Invoice exception handling",
    stage: "diagnostic",
    supportType: "shadow-demo",
    problemStatement: "Two thousand exceptions a month across three entities.",
  })

  const staff = await memberAs(t, "ops@beam.ai", "roboyo", "staff")
  const outbox = await staff.query(api.partner.listSlackOutbox, {
    workspaceId: workspace._id,
  })
  assert.equal(outbox.length, 1)
  const message = outbox[0]
  assert.equal(message.requestKey, created.requestKey)
  assert.ok(message.channel.startsWith("#"))
  assert.ok(message.text.includes(created.requestKey))
  assert.ok(message.text.includes("Invoice exception handling"))
  assert.ok(message.text.includes(created.owner), "the owner must be named")
})
