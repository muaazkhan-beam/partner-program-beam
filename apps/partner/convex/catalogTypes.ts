export type BrandMode = "beam-standard" | "co-branded" | "partner-fronted"
export type TrackFraming = "layer" | "beachhead" | "clearance"
export type ContentKind = "tool" | "material" | "faq" | "playbook"
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
}

export type PartnerCatalog = {
  workspaces: CatalogWorkspace[]
  tools: CatalogContent[]
  materials: CatalogContent[]
  faq: CatalogContent[]
  playbooks: CatalogContent[]
}
