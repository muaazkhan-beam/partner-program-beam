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
  useCaseDetailValidator,
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
    // Bug 1: set when staff configure a workspace through the admin panel. The
    // seed preserves admin-owned fields on any workspace carrying this, so a
    // re-seed cannot silently revert a deliberate change.
    configuredAt: v.optional(v.number()),
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
    highlight: v.optional(v.boolean()),
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
    // Present only when kind is "use-case".
    useCase: v.optional(useCaseDetailValidator),
    // Bug 1: set only by approveClaim. The seed preserves the claim decision on
    // any item carrying this, so a reviewed claim survives a re-seed.
    claimReviewedAt: v.optional(v.number()),
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

  // Bug 3: the spec requires a minimal audit trail and none existed. Nothing
  // recorded who invited whom, attached what, or approved which claim — which
  // also made a re-seed reverting a reviewed decision undetectable.
  auditEvents: defineTable({
    actorId: v.id("partnerUsers"),
    actorEmail: v.string(),
    action: v.string(),
    workspaceId: v.optional(v.id("workspaces")),
    target: v.optional(v.string()),
    detail: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_created", ["createdAt"]),

  // Bug 9: a request was written with an owner and nothing else happened — no
  // email, no Slack, no Linear — so whoever owns partner-success had no idea
  // one had arrived. Mocked as an outbox for now: the message is composed and
  // recorded, and a real webhook post replaces the write without changing
  // callers. Same shape as magicLinkOutbox, which is mocked the same way.
  slackOutbox: defineTable({
    channel: v.string(),
    text: v.string(),
    workspaceId: v.id("workspaces"),
    requestKey: v.string(),
    deliveredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_request_key", ["requestKey"]),

  magicLinkOutbox: defineTable({
    email: v.string(),
    url: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
})
