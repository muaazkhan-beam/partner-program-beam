import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import {
  brandModeValidator,
  claimStateValidator,
  contentAudienceValidator,
  contentClassValidator,
  contentKindValidator,
  customDomainStatusValidator,
  membershipRoleValidator,
  partnerInvitationRoleValidator,
  requestStageValidator,
  requestStatusValidator,
  requestSupportTypeValidator,
  trackFramingValidator,
} from "./lib/validators"

export default defineSchema({
  workspaces: defineTable({
    slug: v.string(),
    name: v.string(),
    displayName: v.string(),
    primaryHostname: v.string(),
    canonicalPath: v.string(),
    brandMode: brandModeValidator,
    brandHeader: v.string(),
    homeTitle: v.string(),
    homeHeadline: v.string(),
    homeDescription: v.string(),
    tracks: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        framing: trackFramingValidator,
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
    customDomainStatus: customDomainStatusValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_primary_hostname", ["primaryHostname"]),

  partnerUsers: defineTable({
    email: v.string(),
    name: v.string(),
    isStaff: v.boolean(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  memberships: defineTable({
    userId: v.id("partnerUsers"),
    workspaceId: v.id("workspaces"),
    role: membershipRoleValidator,
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_workspace_and_user", ["workspaceId", "userId"]),

  invitations: defineTable({
    email: v.string(),
    workspaceId: v.id("workspaces"),
    role: partnerInvitationRoleValidator,
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
    createdAt: v.number(),
    createdBy: v.id("partnerUsers"),
  })
    .index("by_email", ["email"])
    .index("by_workspace", ["workspaceId"])
    .index("by_email_and_workspace", ["email", "workspaceId"]),

  contentItems: defineTable({
    kind: contentKindValidator,
    slug: v.string(),
    title: v.string(),
    summary: v.string(),
    body: v.string(),
    group: v.optional(v.string()),
    contentClass: contentClassValidator,
    audience: contentAudienceValidator,
    forwardable: v.boolean(),
    allowedBrandModes: v.array(brandModeValidator),
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
    createdAt: v.number(),
  })
    .index("by_kind", ["kind"])
    .index("by_kind_and_slug", ["kind", "slug"]),

  contentGrants: defineTable({
    contentId: v.id("contentItems"),
    workspaceId: v.id("workspaces"),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_content", ["contentId"])
    .index("by_workspace_and_content", ["workspaceId", "contentId"]),

  requests: defineTable({
    workspaceId: v.id("workspaces"),
    requestKey: v.string(),
    accountName: v.optional(v.string()),
    candidateProcess: v.string(),
    stage: requestStageValidator,
    supportType: requestSupportTypeValidator,
    problemStatement: v.string(),
    status: requestStatusValidator,
    owner: v.optional(v.string()),
    createdBy: v.id("partnerUsers"),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_and_created", ["workspaceId", "createdAt"])
    .index("by_request_key", ["requestKey"]),

  magicLinkOutbox: defineTable({
    email: v.string(),
    url: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
})
