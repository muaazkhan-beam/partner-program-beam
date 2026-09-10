import { v } from "convex/values"

import type { Id } from "./_generated/dataModel"
import type { MutationCtx } from "./_generated/server"
import { internalMutation, mutation } from "./_generated/server"
import type { CatalogContent, PartnerCatalog } from "./catalogTypes"
import rawCatalog from "./generated/catalog.json"
import { requireStaffActor } from "./lib/access"

const catalog = rawCatalog as PartnerCatalog

const retiredCatalogContent = [
  { kind: "faq" as const, slug: "other-firms" },
  { kind: "faq" as const, slug: "what-each-side-wants" },
]

async function removeRetiredCatalogContent(ctx: MutationCtx) {
  for (const retired of retiredCatalogContent) {
    const item = await ctx.db
      .query("contentItems")
      .withIndex("by_kind_and_slug", (q) =>
        q.eq("kind", retired.kind).eq("slug", retired.slug)
      )
      .unique()
    if (!item) continue

    const grants = await ctx.db
      .query("contentGrants")
      .withIndex("by_content", (q) => q.eq("contentId", item._id))
      .collect()
    for (const grant of grants) {
      await ctx.db.delete(grant._id)
    }
    await ctx.db.delete(item._id)
  }
}

async function upsertContent(
  ctx: MutationCtx,
  item: CatalogContent,
  now: number
) {
  const existing = await ctx.db
    .query("contentItems")
    .withIndex("by_kind_and_slug", (q) =>
      q.eq("kind", item.kind).eq("slug", item.slug)
    )
    .unique()
  const fields = {
    kind: item.kind,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    body: item.body,
    group: item.group,
    contentClass: item.contentClass,
    audience: item.audience,
    forwardable: item.forwardable,
    allowedBrandModes: item.allowedBrandModes,
    claimState: item.claimState,
    restrictedReason: item.restrictedReason,
    requestBeamLabel: item.requestBeamLabel,
    href: item.href,
    format: item.format,
    shareUrl: item.shareUrl,
    embedUrl: item.embedUrl,
    status: item.status,
    reviewer: item.reviewer,
    reviewedAt: item.reviewer ? now : undefined,
    revalidateAt: item.reviewer ? now + 90 * 24 * 60 * 60 * 1000 : undefined,
    createdAt: existing?.createdAt ?? now,
  }
  if (existing) {
    await ctx.db.replace(existing._id, fields)
    return existing._id
  }
  return await ctx.db.insert("contentItems", fields)
}

async function seedCatalogData(ctx: MutationCtx, now: number) {
  await removeRetiredCatalogContent(ctx)
  const contentIds = new Map<string, Id<"contentItems">>()
  const items = [
    ...catalog.tools,
    ...catalog.materials,
    ...catalog.faq,
    ...catalog.playbooks,
  ]
  let contentCount = 0
  for (const item of items) {
    const existing = await ctx.db
      .query("contentItems")
      .withIndex("by_kind_and_slug", (q) =>
        q.eq("kind", item.kind).eq("slug", item.slug)
      )
      .unique()
    const id = await upsertContent(ctx, item, now)
    contentIds.set(`${item.kind}:${item.slug}`, id)
    if (!existing) contentCount += 1
  }

  let workspaceCount = 0
  let grantCount = 0
  for (const workspace of catalog.workspaces) {
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", workspace.slug))
      .unique()
    const fields = {
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
      customDomainStatus: "none" as const,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    const workspaceId = existing
      ? (await ctx.db.replace(existing._id, fields), existing._id)
      : await ctx.db.insert("workspaces", fields)
    if (!existing) workspaceCount += 1

    const slugs = [
      ...workspace.toolSlugs.map((slug) => `tool:${slug}`),
      ...workspace.materialSlugs.map((slug) => `material:${slug}`),
      ...workspace.faqSlugs.map((slug) => `faq:${slug}`),
      ...workspace.playbookSlugs.map((slug) => `playbook:${slug}`),
    ]
    for (const key of slugs) {
      const contentId = contentIds.get(key)
      if (!contentId) continue
      const grant = await ctx.db
        .query("contentGrants")
        .withIndex("by_workspace_and_content", (q) =>
          q.eq("workspaceId", workspaceId).eq("contentId", contentId)
        )
        .unique()
      if (grant) continue
      await ctx.db.insert("contentGrants", {
        contentId,
        workspaceId,
        createdAt: now,
      })
      grantCount += 1
    }
  }

  return { workspaceCount, contentCount, grantCount }
}

const seedResult = v.object({
  workspaceCount: v.number(),
  contentCount: v.number(),
  grantCount: v.number(),
})

export const seedFromCatalog = internalMutation({
  args: { now: v.number() },
  returns: seedResult,
  handler: async (ctx, args) => seedCatalogData(ctx, args.now),
})

export const seedPreview = internalMutation({
  args: {},
  returns: seedResult,
  handler: async (ctx) => seedCatalogData(ctx, Date.now()),
})

export const seedCatalog = mutation({
  args: { now: v.number() },
  returns: seedResult,
  handler: async (ctx, args) => {
    await requireStaffActor(ctx)
    return await seedCatalogData(ctx, args.now)
  },
})
