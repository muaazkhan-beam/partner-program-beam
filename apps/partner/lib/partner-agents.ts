export type PartnerAgent = {
  id: string
  name: string
  role: string
  stage: string
  status: "active" | "coming-soon"
  summary: string
  now: string
  inputs: string[]
  outputs: string[]
  action: string
  href: string
  tone: "blue" | "cyan" | "violet" | "amber" | "rose" | "green" | "indigo"
  effect: "gel" | "folds" | "aurora" | "embers" | "rings" | "frost" | "bloom"
  position: string
}

export const partnerAgents: PartnerAgent[] = [
  {
    id: "strategy",
    name: "AI Strategy Advisor",
    role: "Executive meeting partner",
    stage: "Prepare",
    status: "active",
    summary: "Turns account context into an executive-ready AI-native company story.",
    now: "Preparing the first executive conversation",
    inputs: ["Company context", "Executive role", "Meeting goal"],
    outputs: ["Account brief", "Talk track", "Discovery questions"],
    action: "Prepare executive meeting",
    href: "/tools/call-prep",
    tone: "blue",
    effect: "gel",
    position: "top",
  },
  {
    id: "discovery",
    name: "Process Discovery Agent",
    role: "Workshop lead",
    stage: "Discover",
    status: "active",
    summary: "Maps operational friction and turns it into concrete process candidates.",
    now: "Structuring a 60-minute diagnostic",
    inputs: ["Function", "Process", "Pain points"],
    outputs: ["Process map", "Evidence gaps", "Candidate workflows"],
    action: "Start process discovery",
    href: "/tools/operating-diagnostic",
    tone: "cyan",
    effect: "folds",
    position: "left",
  },
  {
    id: "qualifier",
    name: "Opportunity Qualifier",
    role: "Engagement lead",
    stage: "Qualify",
    status: "active",
    summary: "Ranks workflow candidates and selects the strongest beachhead.",
    now: "Scoring urgency, value and delivery readiness",
    inputs: ["Discovery notes", "Urgency", "Data readiness"],
    outputs: ["Scorecard", "Go / no-go", "Evidence request"],
    action: "Qualify the opportunity",
    href: "/tools/partner-cli",
    tone: "violet",
    effect: "aurora",
    position: "center",
  },
  {
    id: "rfp",
    name: "RFP & Proposal Agent",
    role: "Bid support",
    stage: "Propose",
    status: "coming-soon",
    summary: "Drafts evidence-grounded responses using approved Beam materials and claims.",
    now: "Planned for a future portal release",
    inputs: ["RFP", "Requirements", "Proposed scope"],
    outputs: ["Compliance matrix", "Response draft", "Escalations"],
    action: "Request RFP support",
    href: "/requests?about=agent%3Arfp&support=other",
    tone: "amber",
    effect: "embers",
    position: "right",
  },
  {
    id: "business-case",
    name: "Business Case Agent",
    role: "Value architect",
    stage: "Validate",
    status: "active",
    summary: "Builds an assumption-led value case without inventing client numbers.",
    now: "Turning a workflow into measurable success criteria",
    inputs: ["Baseline", "Volumes", "Outcome"],
    outputs: ["Value hypothesis", "Assumptions", "Success criteria"],
    action: "Build the business case",
    href: "/tools/success-criteria",
    tone: "green",
    effect: "rings",
    position: "bottom-left",
  },
  {
    id: "solution",
    name: "Solution Design Agent",
    role: "Technical lead",
    stage: "Design",
    status: "coming-soon",
    summary: "Translates the approved process into a governed Beam solution boundary.",
    now: "Planned for a future portal release",
    inputs: ["Process spec", "Systems", "Constraints"],
    outputs: ["Architecture", "HITL points", "Evaluation plan"],
    action: "Request solution workshop",
    href: "/requests?about=agent%3Asolution&support=other",
    tone: "indigo",
    effect: "frost",
    position: "bottom",
  },
  {
    id: "readiness",
    name: "Delivery Readiness Agent",
    role: "Engagement manager",
    stage: "Launch",
    status: "coming-soon",
    summary: "Checks that owners, access, risks and outcomes are ready for kickoff.",
    now: "Planned for a future portal release",
    inputs: ["Workflow", "Owners", "Success criteria"],
    outputs: ["RACI", "Risk register", "Kickoff plan"],
    action: "Request launch review",
    href: "/requests?about=agent%3Areadiness&support=deployment-review",
    tone: "rose",
    effect: "bloom",
    position: "bottom-right",
  },
]
