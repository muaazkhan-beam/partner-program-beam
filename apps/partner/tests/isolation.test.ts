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
  "../convex/_generated/server.ts": () => import("../convex/_generated/server.js"),
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
  role: "partner_seller" | "staff" = "partner_seller"
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
        q.eq("workspaceId", workspace._id).eq("userId", user._id)
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

test("PwC and Roboyo resolve separately on canonical path and primary host", async () => {
  const t = await seeded()
  const pwcPath = await t.query(api.partner.resolveWorkspace, { slug: "pwc-me" })
  const pwcHost = await t.query(api.partner.resolveWorkspace, {
    host: "pwc-me.partners.beam.ai",
  })
  const roboyo = await t.query(api.partner.resolveWorkspace, {
    host: "roboyo.partners.beam.ai",
  })
  assert.equal(pwcPath?.slug, "pwc-me")
  assert.equal(pwcHost?.slug, "pwc-me")
  assert.equal(pwcPath?._id, pwcHost?._id)
  assert.equal(roboyo?.slug, "roboyo")
  assert.notEqual(pwcPath?._id, roboyo?._id)
  assert.equal(
    await t.query(api.partner.resolveWorkspace, { host: "unknown.example.com" }),
    null
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
  assert.ok(pwcMaterials.some((item) => item.slug === "shared-services-packaging"))
  assert.ok(
    !roboyoMaterials.some((item) => item.slug === "shared-services-packaging")
  )

  await assert.rejects(
    pwc.query(api.partner.listContent, {
      workspaceId: roboyoWorkspace._id,
      kind: "material",
    }),
    /Not a member of this workspace/
  )
  await assert.rejects(
    roboyo.query(api.partner.listRequests, {
      workspaceId: pwcWorkspace._id,
      paginationOpts: { numItems: 10, cursor: null },
    }),
    /Not a member of this workspace/
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
    /staff only/
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
    /Not authorized/
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
  const packaging = content.find((item) => item.slug === "shared-services-packaging")
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

test("restricted deployment FAQ returns request-Beam instead of an unreviewed claim", async () => {
  const t = await seeded()
  const pwc = await memberAs(t, "paul@pwc.com", "pwc-me")
  const workspace = await t.query(api.partner.resolveWorkspace, { slug: "pwc-me" })
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
  assert.equal(result.workspaceCount, 3)
  assert.ok(result.contentCount > 0)
  const demo = await t.query(api.partner.resolveWorkspace, {
    slug: "partner-demo",
  })
  const pwc = await t.query(api.partner.resolveWorkspace, { slug: "pwc-me" })
  const roboyo = await t.query(api.partner.resolveWorkspace, { slug: "roboyo" })
  assert.equal(demo?.slug, "partner-demo")
  assert.equal(pwc?.slug, "pwc-me")
  assert.equal(roboyo?.slug, "roboyo")
})
