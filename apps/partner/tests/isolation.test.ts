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
