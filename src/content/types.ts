/**
 * The content model for the partner portal.
 *
 * Everything a partner can see — a tool, a material, an FAQ answer, a use case —
 * is a `PortalEntry`. Every entry carries the same two labels:
 *
 *   audience — who is this for, and may I forward it to my client?
 *   status   — is this published, still being written, or Beam-only?
 *
 * That pair is the portal's core primitive. It answers the question a partner
 * actually has at the moment they are about to attach a file to a client email,
 * and it is what lets one filter work across every surface.
 */

/** Who an entry is for. `client-forwardable` is the only value a partner may send onward. */
export type Audience =
  | "partner-internal"
  | "client-forwardable"
  | "technical"
  | "internal";

/** Publication state. `pending` entries are visible but marked as not yet answered. */
export type Status = "published" | "pending" | "restricted";

/**
 * The partner journey. Top-level information architecture across the portal,
 * mirroring the AWS Partner Central build/market/sell/grow model.
 */
export type Stage = "start" | "sell" | "prove" | "scope";

export const STAGES: readonly Stage[] = ["start", "sell", "prove", "scope"];

export const STAGE_LABELS: Record<Stage, string> = {
  start: "Start",
  sell: "Sell",
  prove: "Prove",
  scope: "Scope",
};

export const STAGE_BLURBS: Record<Stage, string> = {
  start: "Get set up and working inside your own agent.",
  sell: "Position Beam and run the client conversation.",
  prove: "Show it works to a technical buyer.",
  scope: "Turn a process into a specification you can deliver.",
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
  "partner-internal": "Partner-internal",
  "client-forwardable": "Client-forwardable",
  technical: "Technical",
  internal: "Internal",
};

export const STATUS_LABELS: Record<Status, string> = {
  published: "Published",
  pending: "Pending",
  restricted: "Restricted",
};

/** Fields shared by every piece of content in the portal. */
export interface PortalEntry {
  slug: string;
  title: string;
  summary: string;
  audience: Audience;
  status: Status;
  stage?: Stage;
  /** Where the entry actually lives. Absent while a stub. */
  href?: string;
}

// --- Tools -----------------------------------------------------------------

/**
 * v1 is documentation plus a request path into Beam, not live write access.
 * `access` records which of those a tool is, so the boundary stays explicit
 * rather than living only in prose on the page.
 */
export type ToolAccess = "docs" | "request" | "hosted";

export interface Tool extends PortalEntry {
  stage: Stage;
  access: ToolAccess;
}

// --- Materials -------------------------------------------------------------

export type MaterialKind =
  | "one-pager"
  | "proof"
  | "deck"
  | "playbook"
  | "template";

export const MATERIAL_KIND_LABELS: Record<MaterialKind, string> = {
  "one-pager": "One-pagers",
  proof: "Proof material",
  deck: "Executive decks",
  playbook: "Playbooks",
  template: "Templates",
};

export interface Material extends PortalEntry {
  kind: MaterialKind;
  /** Page count, slide count, or similar. Shown so partners can judge before opening. */
  extent?: string;
}

// --- FAQ -------------------------------------------------------------------

export type FaqTopic = "competitive" | "operational" | "technical" | "commercial";

export const FAQ_TOPIC_LABELS: Record<FaqTopic, string> = {
  competitive: "Competitive",
  operational: "Operational",
  technical: "Technical",
  commercial: "Commercial",
};

export interface FaqAnswer extends PortalEntry {
  topic: FaqTopic;
  question: string;
  /** Full answer body. Empty while `status` is `pending`. */
  answer: string;
  /**
   * Questions Beam answers directly rather than publishing — exclusivity,
   * independence, pricing. Renders a route-to-Beam path instead of an answer.
   */
  escalate?: boolean;
}

// --- Use cases -------------------------------------------------------------

/**
 * Kept as structured records rather than prose on purpose: the Phase 2 agent
 * builder ("McDonald's menu") is a query over exactly these fields, so the
 * catalog doubles as its source data.
 */
export interface UseCase extends PortalEntry {
  vertical: string;
  department: string;
  /** Systems the agent touches — HubSpot, Workday, SAP, and so on. */
  systems: string[];
  /** The process as it runs today. */
  before: string;
  /** The process once the agent is in place. */
  after: string;
  /** Measured result. Absent until a deployment can be cited. */
  outcome?: string;
  /** Roughly how long from scoping to production. */
  timeToProduction?: string;
}

// --- Certifications --------------------------------------------------------

export interface CertificationLevel {
  level: number;
  slug: string;
  title: string;
  /** What the person can do once certified. */
  outcome: string;
  effort: string;
  assessment: string;
  /** Slug of the level that must be completed first. */
  prerequisite?: string;
  /** Additional non-course gate, e.g. two deployed agents with measured results. */
  gate?: string;
  /**
   * What the partner firm gains when someone holds this credential.
   * Credentials belong to people; firm tier follows from certified roles.
   */
  firmBenefit: string;
}

// --- Progress checklist ----------------------------------------------------

/**
 * Modelled on AWS Partner Central Tasks rather than a static list: each item
 * names the signal that completes it, so Phase 2 can derive state from real
 * activity without reshaping the data.
 */
export type ChecklistSignal =
  | "profile-complete"
  | "certification-passed"
  | "material-viewed"
  | "request-opened"
  | "cli-connected"
  | "manual";

export interface ChecklistItem {
  slug: string;
  title: string;
  description: string;
  stage: Stage;
  signal: ChecklistSignal;
  href?: string;
}

// --- Workspace -------------------------------------------------------------

export type PartnerRole = "partner seller" | "partner builder" | "partner admin";

/**
 * Branding is stored from day one even though Phase 1 never renders it in
 * anger. Phase 2 one-click slide generation needs a logo and colors on the
 * workspace, and backfilling them later means a migration.
 */
export interface WorkspaceBranding {
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

/**
 * Pricing is modelled as a base plus a partner markup even though Phase 1
 * publishes no numbers and locks the markup. Phase 2 lets partners set their
 * own multiplier; the shape should not have to change when it does.
 */
export interface WorkspacePricing {
  status: Status;
  /** Locked to 1 in Phase 1. Partner-settable in Phase 2. */
  markup: number;
  markupEditable: boolean;
}

export interface Workspace {
  slug: string;
  name: string;
  /** Signed-in partner. Replaced by real auth; the shape is what matters now. */
  user: { email: string; role: PartnerRole };
  branding: WorkspaceBranding;
  pricing: WorkspacePricing;
  /** Checklist items the partner has completed, by slug. */
  completed: string[];
}
