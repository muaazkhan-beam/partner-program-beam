export type JourneyResourceKind =
  | "tool"
  | "material"
  | "faq"
  | "playbook"
  | "use-case"

export type JourneyResource = {
  kind: JourneyResourceKind
  slug: string
}

export type JourneyDeliverable = {
  id: string
  title: string
  detail: string
}

export type JourneyPhase = {
  slug: string
  number: string
  name: string
  eyebrow: string
  goal: string
  exit: string
  deliverables: JourneyDeliverable[]
  resources: JourneyResource[]
  requestLabel: string
  requestSupport: "shadow-demo" | "deployment-review" | "faq-escalation" | "other"
  /** A tool that does this phase's work, e.g. the Scope workbench. */
  surface?: { label: string; href: string }
}

// Every phase is open. A partner arrives wherever their client is and uses
// what helps; ticking deliverables is a personal checklist, never a gate.
export const journeyPhases: JourneyPhase[] = [
  {
    slug: "win",
    number: "01",
    name: "Win the client",
    eyebrow: "Phase 1 · Get to a first process",
    goal: "Explain where Beam fits, check the client is a fit, and agree to scope one process.",
    exit: "The client has agreed to scope one named process with you and Beam.",
    deliverables: [
      {
        id: "position",
        title: "Explain where Beam fits",
        detail:
          "Run the fit check on Where Beam fits, and use the published answers to place Beam beside the systems the client already runs.",
      },
      {
        id: "fit",
        title: "Check the client is a fit",
        detail:
          "Run the fit check on one candidate process. Walk away early when it fails; a weak first process costs more than no process.",
      },
      {
        id: "introduce",
        title: "Send an introduction",
        detail:
          "Send the client pack with the executive overview and anything else marked Can go to a client.",
      },
      {
        id: "agree-scope",
        title: "Agree to scope one process",
        detail:
          "Get the client to agree a scoping session on one named process, with the person who owns it in the room.",
      },
    ],
    resources: [
      { kind: "material", slug: "where-beam-fits" },
      { kind: "material", slug: "beam-partner-executive-overview" },
      { kind: "material", slug: "ideal-client-profile" },
      { kind: "material", slug: "joint-motion-one-pager" },
      { kind: "material", slug: "who-we-are" },
      { kind: "faq", slug: "why-not-sap" },
      { kind: "faq", slug: "vs-epm" },
      { kind: "faq", slug: "not-another-ai-tool" },
      { kind: "tool", slug: "competitive-battlecards" },
      { kind: "tool", slug: "call-prep" },
    ],
    requestLabel: "Ask Beam to join a client call",
    requestSupport: "other",
    surface: { label: "Run the fit check", href: "/materials/where-beam-fits" },
  },
  {
    slug: "scope",
    number: "02",
    name: "Scope",
    eyebrow: "Phase 2 · Qualify and agree success",
    goal: "Qualify one client process and agree what success means before anything is built.",
    exit: "A named process with an accountable owner, a measured baseline, and success criteria agreed in writing.",
    deliverables: [
      {
        id: "use-case",
        title: "Pick a live use case",
        detail:
          "Start from a process Beam already runs in production. Each catalog record states the trigger, the systems touched and the step that keeps a human approver.",
      },
      {
        id: "qualify",
        title: "Qualify the client and the process",
        detail:
          "Confirm the outcome, urgency, and stakeholders. Walk away when a single ERP or EPM module already solves it.",
      },
      {
        id: "diagnostic",
        title: "Run the operating diagnostic",
        detail:
          "Map the handoffs, exceptions, and systems involved. A Beam FDE joins the first two workshops.",
      },
      {
        id: "baseline",
        title: "Capture the current baseline",
        detail:
          "Record today's cycle time, throughput, exception resolution, or quality for the named process.",
      },
      {
        id: "success-criteria",
        title: "Agree success criteria in writing",
        detail:
          "Define the first production outcome, the human approval points, and how the workflow will be evaluated.",
      },
    ],
    resources: [
      { kind: "use-case", slug: "invoice-exception-handling" },
      { kind: "use-case", slug: "supplier-communication" },
      { kind: "use-case", slug: "cv-screening" },
      { kind: "faq", slug: "first-process-fit" },
      { kind: "faq", slug: "when-to-walk-away" },
      { kind: "tool", slug: "operating-diagnostic" },
      { kind: "tool", slug: "discovery" },
      { kind: "tool", slug: "success-criteria" },
      { kind: "faq", slug: "measuring-success" },
    ],
    requestLabel: "Request Beam support",
    requestSupport: "other",
    surface: { label: "Open Scope", href: "/scope" },
  },
  {
    slug: "build",
    number: "03",
    name: "Build",
    eyebrow: "Phase 3 · Shadow on test data",
    goal: "Build the first agent for the scoped process with Beam, safely, on representative test data.",
    exit: "A shadow workflow running on test data, with evals, exception paths, and the human approval points in place.",
    deliverables: [
      {
        id: "vertical-demo",
        title: "See a vertical demo",
        detail:
          "Beam runs a vertical demo such as order-to-cash, AP, or screening before you build on the client's process.",
      },
      {
        id: "test-data",
        title: "Secure test data and an access path",
        detail:
          "Confirm a usable API or export path and representative test data for the named process.",
      },
      {
        id: "shadow",
        title: "Run the shadow workflow",
        detail:
          "Build the agent with Beam on test data, with evals, exception paths, and an audit log.",
      },
      {
        id: "approvals",
        title: "Design the human approval points",
        detail:
          "Decide where an accountable person approves high-risk steps, and record it in the audit trail.",
      },
    ],
    resources: [
      { kind: "tool", slug: "platform-demo" },
      { kind: "faq", slug: "working-agent" },
      { kind: "playbook", slug: "one-workflow-shadow" },
      { kind: "tool", slug: "beam-platform" },
      { kind: "faq", slug: "data-integration" },
      { kind: "faq", slug: "human-approval" },
    ],
    requestLabel: "Request a shadow demo",
    requestSupport: "shadow-demo",
  },
  {
    slug: "deploy",
    number: "04",
    name: "Deploy",
    eyebrow: "Phase 4 · Clear production",
    goal: "Move the agent from shadow to production with the client's security, access, and brand questions answered.",
    exit: "Reviewed security evidence shared, environments and access agreed, and go-live approved against the success criteria.",
    deliverables: [
      {
        id: "security",
        title: "Share the reviewed security evidence",
        detail:
          "Use only the evidence pack for the named deployment. Do not improvise claims about hosting, residency, or certifications.",
      },
      {
        id: "access",
        title: "Agree environments and access",
        detail:
          "Confirm who gets demo, sandbox, and production access. Portal membership and certification do not grant it.",
      },
      {
        id: "brand",
        title: "Confirm the brand shape",
        detail:
          "Partner-fronted, joint, or Beam-fronted: pick one of the three approved shapes.",
      },
      {
        id: "go-live",
        title: "Approve go-live",
        detail:
          "Agree the move to production against the success criteria written in Scope.",
      },
    ],
    resources: [
      { kind: "faq", slug: "security-review-pack" },
      { kind: "material", slug: "security-compliance-pack" },
      { kind: "faq", slug: "access-and-sandbox" },
      { kind: "tool", slug: "proof-pack" },
      { kind: "faq", slug: "brand-shapes" },
    ],
    requestLabel: "Request a deployment review",
    requestSupport: "deployment-review",
    surface: { label: "Open security & compliance", href: "/compliance" },
  },
  {
    slug: "monitor",
    number: "05",
    name: "Monitor & test",
    eyebrow: "Phase 5 · Prove it holds",
    goal: "Show the agent meets the success criteria in production, and keep accuracy from decaying.",
    exit: "The agreed outcome measured against the baseline, with production feedback feeding regression-tested fixes.",
    deliverables: [
      {
        id: "evaluate",
        title: "Evaluate against the success criteria",
        detail:
          "Measure the agreed outcome, and review both the agent's recommendations and the human handoffs.",
      },
      {
        id: "feedback",
        title: "Turn production feedback into fixes",
        detail:
          "Thumbs, failed code nodes, and low evals become training data, trained one cluster at a time, then regression-tested.",
      },
      {
        id: "exceptions",
        title: "Review exceptions with the process owner",
        detail:
          "Walk through the exception paths and approvals that fired, and adjust the workflow design where needed.",
      },
    ],
    resources: [
      { kind: "faq", slug: "measuring-success" },
      { kind: "faq", slug: "accuracy" },
      { kind: "tool", slug: "self-learning" },
      { kind: "faq", slug: "human-approval" },
    ],
    requestLabel: "Escalate a question to Beam",
    requestSupport: "faq-escalation",
  },
  {
    slug: "deliver",
    number: "06",
    name: "Deliver",
    eyebrow: "Phase 6 · Hand over and expand",
    goal: "Hand over a running workflow, report the outcome, and line up the next process along the value chain.",
    exit: "Support ownership agreed, the outcome reported against the baseline, and the next workflow named.",
    deliverables: [
      {
        id: "support",
        title: "Agree support and escalation",
        detail:
          "Assign delivery ownership, support coverage, and escalation paths before promising response times.",
      },
      {
        id: "report",
        title: "Report the outcome",
        detail:
          "Share the measured result against the baseline agreed in Scope with the client's leadership.",
      },
      {
        id: "expand",
        title: "Name the next workflow",
        detail: "Expand along the value chain. License after value is visible.",
      },
    ],
    resources: [
      { kind: "faq", slug: "support-and-escalation" },
      { kind: "faq", slug: "first-engagement" },
      { kind: "faq", slug: "leadership-pack" },
    ],
    requestLabel: "Ask Beam about support coverage",
    requestSupport: "faq-escalation",
  },
]
