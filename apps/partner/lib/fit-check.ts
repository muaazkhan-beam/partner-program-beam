import { requestHref } from "./request-links"
import { workspacePath } from "./workspace-resolver"

/**
 * A two-minute fit check on the Where Beam fits page. Eight questions about a
 * client's process; the verdict is a rules table with no weights, and every
 * reason is a sentence from an approved FAQ answer, quoted verbatim (tested).
 * Verdict names follow Beam's own lead-research rubric (strong / potential /
 * poor); partners see Fit / Not yet / Walk away.
 */
export type Answer = "y" | "n" | "u"
export type QuestionId =
  | "systems"
  | "exceptions"
  | "access"
  | "owner"
  | "testData"
  | "outcome"
  | "singleModule"
  | "unsupervised"
export type Answers = Partial<Record<QuestionId, Answer>>
export type FitFaqSlug =
  | "first-process-fit"
  | "when-to-walk-away"
  | "why-not-sap"
  | "data-integration"
  | "human-approval"
  | "not-another-ai-tool"

export type FitQuestion = {
  id: QuestionId
  prompt: string
  why: string
  faq: FitFaqSlug
  /** Verbatim from the FAQ answer; a test asserts it is a substring of the body. */
  cite: string
  /** The question a partner asks the client when the answer is unsure. */
  discovery: string
  /** Which of Beam's six lead-research fit criteria this maps to. */
  criterion: string
  role: "required" | "walkAway" | "escalate"
  group: "shape" | "needs"
}

export const fitQuestions: readonly FitQuestion[] = [
  {
    id: "systems",
    prompt: "Does the process cross two or more systems?",
    why: "Beam runs the work between systems; a single system usually automates itself.",
    faq: "first-process-fit",
    cite: "crosses two or more systems",
    discovery: "Which systems does one case touch from start to finish?",
    criterion: "Repeatable use case",
    role: "required",
    group: "shape",
  },
  {
    id: "exceptions",
    prompt: "Is it exception-heavy, with manual handoffs or re-keying?",
    why: "Exceptions are where rules-based automation stops and people start.",
    faq: "first-process-fit",
    cite: "has exceptions that prevent simple rules-based automation",
    discovery: "What share of cases needs a person today, and why?",
    criterion: "Clear pain",
    role: "required",
    group: "shape",
  },
  {
    id: "singleModule",
    prompt: "Does a single ERP or EPM module already solve it well?",
    why: "If it does, that is the module's deal, not Beam's.",
    faq: "when-to-walk-away",
    cite: "Do not force a Beam deal when a clean single-module ERP or EPM workflow already solves the problem well.",
    discovery: "Which system handles this today, and does it handle the exceptions?",
    criterion: "Mismatch with product capabilities",
    role: "walkAway",
    group: "shape",
  },
  {
    id: "access",
    prompt: "Is there an API or an export path into those systems?",
    why: "Without a way in, there is nothing to integrate.",
    faq: "data-integration",
    cite: "If the client has no API and no export path, say so early.",
    discovery: "How would we read and write the records: an API, an export, or neither?",
    criterion: "Implementation effort",
    role: "required",
    group: "needs",
  },
  {
    id: "owner",
    prompt: "Is there a named, accountable process owner?",
    why: "Someone has to sign off the success criteria and the approval points.",
    faq: "first-process-fit",
    cite: "a named process owner",
    discovery: "Who is answerable when a case goes wrong?",
    criterion: "Decision-maker access",
    role: "required",
    group: "needs",
  },
  {
    id: "testData",
    prompt: "Can the client provide representative test data, including the awkward cases?",
    why: "The shadow workflow runs on real cases before anything touches production.",
    faq: "first-process-fit",
    cite: "representative test data",
    discovery: "Could we get a sample of real cases, including the failures?",
    criterion: "Implementation effort",
    role: "required",
    group: "needs",
  },
  {
    id: "outcome",
    prompt: "Is there a measurable operational outcome the client already tracks?",
    why: "Success is agreed against a baseline before production, never invented after.",
    faq: "first-process-fit",
    cite: "a baseline the client agrees to measure",
    discovery: "What number does the client report on this today?",
    criterion: "Meaningful volume or value",
    role: "required",
    group: "needs",
  },
  {
    id: "unsupervised",
    prompt: "Does the client expect unsupervised action on high-risk steps, such as payments or regulated decisions?",
    why: "An accountable person keeps those approvals; that is a design decision, not a limitation.",
    faq: "when-to-walk-away",
    cite: "Also escalate expectations of unsupervised high-risk action.",
    discovery: "Which steps must a person approve, and who?",
    criterion: "Mismatch with product capabilities",
    role: "escalate",
    group: "needs",
  },
]

export type VerdictKind = "strong" | "potential" | "poor" | "incomplete"

export const verdictLabel: Record<VerdictKind, string> = {
  strong: "Fit",
  potential: "Not yet",
  poor: "Walk away",
  incomplete: "Not answered yet",
}

export type Reason = { faq: FitFaqSlug; text: string }

export type Verdict = {
  kind: VerdictKind
  reasons: Reason[]
  /** Unanswered or unsure: the discovery question to ask. */
  open: FitQuestion[]
  /** Required questions answered no: what to obtain before Beam gets in. */
  missing: FitQuestion[]
  answered: number
}

const PAUSE_SENTENCE =
  "Pause when there is no API or export path, no accountable process owner, no representative test data, or no measurable operational outcome."

export function evaluate(answers: Answers): Verdict {
  const answered = fitQuestions.filter((question) => answers[question.id]).length
  const open = fitQuestions.filter((question) => (answers[question.id] ?? "u") === "u")
  const missing = fitQuestions.filter(
    (question) => question.role === "required" && answers[question.id] === "n"
  )
  if (answers.singleModule === "y") {
    return {
      kind: "poor",
      reasons: [
        { faq: "when-to-walk-away", text: fitQuestions[2]!.cite },
        {
          faq: "why-not-sap",
          text: "Do not pick a fight inside a clean, single-module S/4 workflow the ERP already does well.",
        },
      ],
      open: open.filter((question) => question.id !== "singleModule"),
      missing,
      answered,
    }
  }
  if (answered < fitQuestions.length) {
    return { kind: "incomplete", reasons: [], open, missing, answered }
  }
  const escalate = answers.unsupervised !== "n"
  const unsure = open.length > 0
  if (missing.length > 0 || escalate || unsure) {
    const reasons: Reason[] = []
    const pauseTriggers: QuestionId[] = ["access", "owner", "testData", "outcome"]
    if (missing.some((question) => pauseTriggers.includes(question.id))) {
      reasons.push({ faq: "when-to-walk-away", text: PAUSE_SENTENCE })
    }
    for (const question of missing) {
      if (!reasons.some((reason) => reason.text === question.cite)) {
        reasons.push({ faq: question.faq, text: question.cite })
      }
    }
    if (escalate) {
      reasons.push({ faq: "when-to-walk-away", text: fitQuestions[7]!.cite })
      reasons.push({ faq: "human-approval", text: "Start read-first and recommend-first." })
    }
    if (reasons.length === 0) {
      reasons.push({ faq: "first-process-fit", text: "Start with one narrow beachhead rather than an end-to-end transformation promise." })
    }
    return { kind: "potential", reasons, open, missing, answered }
  }
  return {
    kind: "strong",
    reasons: [
      {
        faq: "not-another-ai-tool",
        text: "We pick one high-volume back-office chain, agree success criteria, put it into production with evals and exception paths, and only then expand.",
      },
      {
        faq: "first-process-fit",
        text: "Start with one narrow beachhead rather than an end-to-end transformation promise.",
      },
    ],
    open,
    missing,
    answered,
  }
}

export function encodeAnswers(answers: Answers) {
  return fitQuestions.map((question) => answers[question.id] ?? "_").join("")
}

export function decodeAnswers(value: string | null | undefined): Answers {
  if (!value || !/^[ynu_]{8}$/.test(value)) return {}
  const answers: Answers = {}
  fitQuestions.forEach((question, index) => {
    const char = value[index]
    if (char === "y" || char === "n" || char === "u") answers[question.id] = char
  })
  return answers
}

export type NextStep = { label: string; href: string }

export function nextSteps(
  workspaceSlug: string,
  verdict: Verdict,
  code: string
): NextStep[] {
  if (verdict.kind === "strong") {
    return [
      { label: "Pick a use case", href: workspacePath(workspaceSlug, "/use-cases") },
      { label: "Start the Scope phase", href: workspacePath(workspaceSlug, "/journey?phase=scope") },
    ]
  }
  if (verdict.kind === "potential") {
    return [
      {
        label: "Request a shadow demo",
        href: requestHref(workspaceSlug, { about: `fit:${code}`, support: "shadow-demo" }),
      },
    ]
  }
  if (verdict.kind === "poor") {
    return [
      {
        label: "Ask Beam about the edge case",
        href: requestHref(workspaceSlug, { about: `fit:${code}`, support: "faq-escalation" }),
      },
    ]
  }
  return []
}

/** The request body when a partner asks Beam from a verdict. */
export function fitRequestText(code: string) {
  const verdict = evaluate(decodeAnswers(code))
  if (verdict.kind === "incomplete") return ""
  const lines = [`Fit check result: ${verdictLabel[verdict.kind]}.`]
  if (verdict.missing.length) {
    lines.push("", "Still to obtain:", ...verdict.missing.map((question) => `- ${question.prompt}`))
  }
  if (verdict.open.length) {
    lines.push("", "Still unsure:", ...verdict.open.map((question) => `- ${question.discovery}`))
  }
  return lines.join("\n") + "\n\n"
}

/** Split the Where Beam fits one-pager into its headed sections. */
export function parseOnePager(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [heading, ...rest] = block.split("\n")
      return { heading: (heading ?? "").trim(), text: rest.join(" ").trim() }
    })
}
