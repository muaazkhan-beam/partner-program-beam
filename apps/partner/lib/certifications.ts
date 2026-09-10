export type CertificationModule = {
  number: string
  title: string
  description: string
}

export type Certification = {
  slug: string
  name: string
  eyebrow: string
  duration: string
  assessment: string
  description: string
  status: string
  active?: boolean
  prerequisite: string
  outcomes: string[]
  syllabus: CertificationModule[]
}

export const certifications: Certification[] = [
  {
    slug: "beam-foundations",
    name: "Beam Foundations",
    eyebrow: "Knowledge foundation",
    duration: "3 hours",
    assessment: "40-item assessment",
    description:
      "Explain where Beam fits, qualify the first use case, and protect the client with the right guardrails.",
    status: "Ready to start",
    active: true,
    prerequisite: "No prerequisite",
    outcomes: [
      "Position Beam alongside systems of record and existing automation.",
      "Recognize a strong first workflow and know when to walk away.",
      "Use approved claims, guardrails, and escalation paths in client conversations.",
    ],
    syllabus: [
      {
        number: "01",
        title: "What Beam is",
        description: "Platform model, systems of record, agent vs RPA.",
      },
      {
        number: "02",
        title: "Candidate use cases",
        description: "Good-fit signals, exceptions, and when to walk away.",
      },
      {
        number: "03",
        title: "Feasibility and value",
        description: "Data readiness, value, and commercial qualification.",
      },
      {
        number: "04",
        title: "Guardrails",
        description: "Human approval, escalation, and claims Beam will not make.",
      },
      {
        number: "05",
        title: "Partner motion",
        description: "Roles, deal registration, and how the first three deals run.",
      },
    ],
  },
  {
    slug: "discovery-lead",
    name: "Discovery Lead",
    eyebrow: "Practical discovery",
    duration: "1 day",
    assessment: "Process-spec submission",
    description:
      "Turn a real process into an agent-ready specification that passes all seven review dimensions.",
    status: "Available after Beam Foundations",
    prerequisite: "Beam Foundations",
    outcomes: [
      "Run a structured operating diagnostic with process owners.",
      "Separate workflow symptoms from the operational outcome that matters.",
      "Produce an agent-ready process specification for Beam review.",
    ],
    syllabus: [
      {
        number: "01",
        title: "Frame the outcome",
        description: "Stakeholders, urgency, baseline, and measurable success.",
      },
      {
        number: "02",
        title: "Map the workflow",
        description: "Handoffs, systems, decisions, exceptions, and human ownership.",
      },
      {
        number: "03",
        title: "Assess readiness",
        description: "Access paths, representative data, risk, and feasibility.",
      },
      {
        number: "04",
        title: "Choose the beachhead",
        description: "Rank candidates and narrow the first production boundary.",
      },
      {
        number: "05",
        title: "Write the process spec",
        description: "Document the workflow for review, shadowing, and estimation.",
      },
    ],
  },
  {
    slug: "builder",
    name: "Builder",
    eyebrow: "Build and scope",
    duration: "2 days",
    assessment: "Working agent + credit estimate",
    description:
      "Build a controlled agent, defend its evaluation design, and translate it into a commercial scope.",
    status: "Practical assessment",
    prerequisite: "Beam Foundations + Discovery Lead",
    outcomes: [
      "Translate an approved process specification into a controlled agent.",
      "Design evaluation, exception, and human-approval paths.",
      "Estimate platform usage and define a defensible delivery scope.",
    ],
    syllabus: [
      {
        number: "01",
        title: "Agent architecture",
        description: "Break the process into tools, decisions, state, and boundaries.",
      },
      {
        number: "02",
        title: "Tools and integrations",
        description: "Connect systems safely and handle incomplete access paths.",
      },
      {
        number: "03",
        title: "Evals and guardrails",
        description: "Test the steps that matter and route high-risk actions.",
      },
      {
        number: "04",
        title: "Exceptions and observability",
        description: "Make failure states visible, recoverable, and reviewable.",
      },
      {
        number: "05",
        title: "Estimate and scope",
        description: "Turn the working agent into a delivery and usage estimate.",
      },
    ],
  },
  {
    slug: "solution-architect",
    name: "Solution Architect",
    eyebrow: "Production leadership",
    duration: "2 days + panel",
    assessment: "Live design review",
    description:
      "Defend a production architecture after delivering two agents with measurable outcomes.",
    status: "Experience gated",
    prerequisite: "Builder + two reviewed agent deliveries",
    outcomes: [
      "Design a production solution across workflow, data, security, and operations.",
      "Defend deployment choices and escalation paths with client stakeholders.",
      "Lead a partner delivery team through launch and measurable expansion.",
    ],
    syllabus: [
      {
        number: "01",
        title: "Production architecture",
        description: "System boundaries, resilience, state, and operating ownership.",
      },
      {
        number: "02",
        title: "Security and deployment",
        description: "Evidence, access, data handling, and approved deployment claims.",
      },
      {
        number: "03",
        title: "Evaluation strategy",
        description: "Production evals, drift, feedback, and regression coverage.",
      },
      {
        number: "04",
        title: "Delivery governance",
        description: "RACI, support, incident escalation, and change control.",
      },
      {
        number: "05",
        title: "Design defense",
        description: "Present the architecture and respond to a live review panel.",
      },
    ],
  },
]

export function getCertification(slug: string) {
  return certifications.find((certification) => certification.slug === slug)
}
