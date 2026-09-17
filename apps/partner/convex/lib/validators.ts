import { v } from "convex/values"

export const brandModeValidator = v.union(
  v.literal("beam-standard"),
  v.literal("co-branded"),
  v.literal("partner-fronted")
)

export const trackFramingValidator = v.union(
  v.literal("layer"),
  v.literal("beachhead"),
  v.literal("clearance")
)

export const customDomainStatusValidator = v.literal("none")

export const membershipRoleValidator = v.union(
  v.literal("staff"),
  v.literal("partner_admin"),
  v.literal("partner_seller")
)

export const partnerInvitationRoleValidator = v.union(
  v.literal("partner_admin"),
  v.literal("partner_seller")
)

export const contentKindValidator = v.union(
  v.literal("tool"),
  v.literal("material"),
  v.literal("faq"),
  v.literal("playbook"),
  v.literal("use-case")
)

export const useCaseComplexityValidator = v.union(
  v.literal("starter"),
  v.literal("standard"),
  v.literal("complex")
)

/**
 * The structured half of a use case. `humanInLoop` is required because every
 * use case must name the step that keeps a human approver; `outcome` carries
 * its source so no number reaches a partner without provenance.
 */
export const useCaseDetailValidator = v.object({
  vertical: v.string(),
  department: v.string(),
  systems: v.array(v.string()),
  trigger: v.string(),
  before: v.string(),
  after: v.string(),
  humanInLoop: v.string(),
  outcome: v.optional(
    v.object({ metric: v.string(), value: v.string(), source: v.string() })
  ),
  timeToProduction: v.optional(v.string()),
  complexity: v.optional(useCaseComplexityValidator),
})

export const contentClassValidator = v.union(
  v.literal("shared-partner-safe"),
  v.literal("workspace-only"),
  v.literal("staff-draft")
)

export const contentAudienceValidator = v.union(
  v.literal("partner-internal"),
  v.literal("client-forwardable"),
  v.literal("technical")
)

export const claimStateValidator = v.union(
  v.literal("approved"),
  v.literal("restricted"),
  v.literal("staff-draft")
)

export const requestStageValidator = v.union(
  v.literal("qualify"),
  v.literal("diagnostic"),
  v.literal("shadow"),
  v.literal("success-criteria")
)

export const requestSupportTypeValidator = v.union(
  v.literal("shadow-demo"),
  v.literal("deployment-review"),
  v.literal("faq-escalation"),
  v.literal("other")
)

export const requestStatusValidator = v.union(
  v.literal("open"),
  v.literal("assigned"),
  v.literal("closed")
)
