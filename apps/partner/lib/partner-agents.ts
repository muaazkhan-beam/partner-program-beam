/**
 * Beam's agents for partner work. Each one is either run by Beam for a
 * partner's client today or planned. The portal never pretends to run one
 * itself: the partner either asks Beam to run it, or opens the portal tool
 * that does the same job by hand.
 */
export type AgentStatus = "active" | "coming-soon"

export type PartnerAgent = {
  id: string
  name: string
  role: string
  /** Slug of the journey phase (lib/partner-journey.ts) the agent is used in. */
  phase: string
  status: AgentStatus
  /** What the agent is for, one line. */
  summary: string
  /** What the partner brings before Beam can run it. */
  inputs: string[]
  /** What the partner gets back. */
  outputs: string[]
  /** The portal page where the partner does this agent's work today. Only agents Beam runs today have one. */
  tool?: { label: string; href: string }
  /** The support type a request about this agent files under. */
  support: "other" | "deployment-review"
  tone: "blue" | "cyan" | "violet" | "amber" | "rose" | "green" | "indigo"
  effect: "gel" | "folds" | "aurora" | "embers" | "rings" | "frost" | "bloom"
  position: string
}

/** Status words, portal-wide vocabulary: never "Active" or "Coming soon". */
export const AGENT_STATUS_LABEL: Record<AgentStatus, string> = {
  active: "Beam runs it today",
  "coming-soon": "Planned",
}

/** The request-form context for asking Beam to run, or about, an agent. */
export function agentRequest(agent: Pick<PartnerAgent, "id" | "support">) {
  return { about: `agent:${agent.id}`, support: agent.support }
}

export const partnerAgents: PartnerAgent[] = [
  {
    id: "strategy",
    name: "AI Strategy Advisor",
    role: "Executive meeting partner",
    phase: "win",
    status: "active",
    summary: "Turns account context into an executive-ready AI-native company story.",
    inputs: ["Company context", "Executive role", "Meeting goal"],
    outputs: ["Account brief", "Talk track", "Discovery questions"],
    tool: { label: "Open Call prep", href: "/tools/call-prep" },
    support: "other",
    tone: "blue",
    effect: "gel",
    position: "top",
  },
  {
    id: "discovery",
    name: "Process Discovery Agent",
    role: "Workshop lead",
    phase: "scope",
    status: "active",
    summary: "Maps operational friction and turns it into concrete process candidates.",
    inputs: ["Function", "Process", "Pain points"],
    outputs: ["Process map", "Evidence gaps", "Candidate workflows"],
    tool: {
      label: "Open the Operating diagnostic",
      href: "/tools/operating-diagnostic",
    },
    support: "other",
    tone: "cyan",
    effect: "folds",
    position: "left",
  },
  {
    id: "qualifier",
    name: "Opportunity Qualifier",
    role: "Engagement lead",
    phase: "scope",
    status: "active",
    summary: "Ranks workflow candidates and selects the strongest beachhead.",
    inputs: ["Discovery notes", "Urgency", "Data readiness"],
    outputs: ["Scorecard", "Go / no-go", "Evidence request"],
    tool: { label: "Open Scope", href: "/scope" },
    support: "other",
    tone: "violet",
    effect: "aurora",
    position: "center",
  },
  {
    id: "rfp",
    name: "RFP & Proposal Agent",
    role: "Bid support",
    phase: "win",
    status: "coming-soon",
    summary: "Drafts evidence-grounded responses using approved Beam materials and claims.",
    inputs: ["RFP", "Requirements", "Proposed scope"],
    outputs: ["Compliance matrix", "Response draft", "Escalations"],
    support: "other",
    tone: "amber",
    effect: "embers",
    position: "right",
  },
  {
    id: "business-case",
    name: "Business Case Agent",
    role: "Value architect",
    phase: "scope",
    status: "active",
    summary: "Builds an assumption-led value case without inventing client numbers.",
    inputs: ["Baseline", "Volumes", "Outcome"],
    outputs: ["Value hypothesis", "Assumptions", "Success criteria"],
    tool: {
      label: "Open the Success-criteria kit",
      href: "/tools/success-criteria",
    },
    support: "other",
    tone: "green",
    effect: "rings",
    position: "bottom-left",
  },
  {
    id: "solution",
    name: "Solution Design Agent",
    role: "Technical lead",
    phase: "build",
    status: "coming-soon",
    summary: "Translates the approved process into a governed Beam solution boundary.",
    inputs: ["Process spec", "Systems", "Constraints"],
    outputs: ["Architecture", "HITL points", "Evaluation plan"],
    support: "other",
    tone: "indigo",
    effect: "frost",
    position: "bottom",
  },
  {
    id: "readiness",
    name: "Delivery Readiness Agent",
    role: "Engagement manager",
    phase: "deploy",
    status: "coming-soon",
    summary: "Checks that owners, access, risks and outcomes are ready for kickoff.",
    inputs: ["Workflow", "Owners", "Success criteria"],
    outputs: ["RACI", "Risk register", "Kickoff plan"],
    support: "deployment-review",
    tone: "rose",
    effect: "bloom",
    position: "bottom-right",
  },
]
