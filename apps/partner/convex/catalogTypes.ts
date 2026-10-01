export type BrandMode = "beam-standard" | "co-branded" | "partner-fronted"
export type TrackFraming = "layer" | "beachhead" | "clearance"
export type ContentKind = "tool" | "material" | "faq" | "playbook" | "use-case"
export type UseCaseComplexity = "starter" | "standard" | "complex"
export type ContentClass =
  "shared-partner-safe" | "workspace-only" | "staff-draft"
export type ContentAudience =
  "partner-internal" | "client-forwardable" | "technical"
export type ClaimState = "approved" | "restricted" | "staff-draft"
export type ContentStatus = "pending"

export type CatalogContent = {
  slug: string
  kind: ContentKind
  title: string
  summary: string
  body: string
  group?: string
  format?: string
  shareUrl?: string
  embedUrl?: string
  href?: string
  status?: ContentStatus
  contentClass: ContentClass
  audience: ContentAudience
  forwardable: boolean
  allowedBrandModes: BrandMode[]
  claimState: ClaimState
  restrictedReason?: string
  requestBeamLabel?: string
  reviewer?: string
  /** ISO date, e.g. 2026-09-01. */
  reviewedOn?: string
  /** ISO date. When this claim must be reviewed again. */
  revalidateOn?: string
}

/**
 * A use case is a content item plus the structured fields that make it
 * sellable. Kept structured rather than written as prose so the catalog can be
 * filtered, and so a later agent builder can query it directly.
 */
export type UseCaseDetail = {
  vertical: string
  department: string
  /** Systems the agent reads from or writes to. */
  systems: string[]
  trigger: string
  before: string
  after: string
  /** Required. The step that keeps a human approver. */
  humanInLoop: string
  /** Absent until a deployment can be cited. Never invent one. */
  outcome?: { metric: string; value: string; source: string }
  timeToProduction?: string
  complexity?: UseCaseComplexity
}

export type CatalogUseCase = CatalogContent & UseCaseDetail

export type ComplianceDomain =
  | "information-security"
  | "access-and-identity"
  | "data-privacy"
  | "hipaa-and-phi"
  | "continuity-and-backup"
  | "secure-development"
  | "operations-and-suppliers"
  | "people-and-conduct"
export type ComplianceAvailability = "on-request" | "under-nda" | "confirm-version"

/**
 * One policy or procedure in Beam's security and compliance library, recorded
 * only as printed on the document. Files are never stored in the portal;
 * Beam issues the reviewed copy per client and deployment.
 */
export type CatalogComplianceDocument = {
  slug: string
  kind: "compliance"
  title: string
  domain: ComplianceDomain
  version: string
  /** ISO date derived from the printed one; "" when not printed. */
  releaseDate: string
  /** The date exactly as printed on the document; "" when not printed. */
  printedDate: string
  pages: number
  classification: string
  availability: ComplianceAvailability
  ndaRequired: boolean
  summary: string
  requestLabel: string
  reviewer: string
  sourceFile: string
}

export type CatalogWorkspace = {
  slug: string
  name: string
  displayName: string
  primaryHostname: string
  canonicalPath: string
  brandMode: BrandMode
  brandHeader: string
  homeTitle: string
  homeHeadline: string
  homeDescription: string
  supportOwner: string
  allowedEmailDomains: string[]
  enabledSurfaces: string[]
  tracks: Array<{
    id: string
    title: string
    framing: TrackFraming
    summary: string
    action: string
    href: string
  }>
  steps: Array<{ title: string; detail: string }>
  toolSlugs: string[]
  materialSlugs: string[]
  faqSlugs: string[]
  playbookSlugs: string[]
  useCaseSlugs?: string[]
  complianceSlugs?: string[]
}

export type PartnerCatalog = {
  workspaces: CatalogWorkspace[]
  tools: CatalogContent[]
  materials: CatalogContent[]
  faq: CatalogContent[]
  playbooks: CatalogContent[]
  useCases: CatalogUseCase[]
  compliance: CatalogComplianceDocument[]
}
