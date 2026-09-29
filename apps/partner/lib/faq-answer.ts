/**
 * Answering a partner's question from reviewed content.
 *
 * Jack's note on the FAQ was that nobody clicks — a partner mid-call wants to
 * ask, not browse twenty-two answers. This finds the answer and decides whether
 * it may be given.
 *
 * Retrieval is term overlap, not a model. That is deliberate for now: it never
 * invents an answer, and it inherits the claim-review model rather than working
 * around it. Swapping in a Beam agent means replacing `rankAnswers` and keeping
 * `resolveAsk` exactly as it is — the governance is the part that must not move.
 */

export type AskCandidate = {
  slug: string
  title: string
  summary: string
  body: string
  audience: string
  claimState: string
  status?: "pending"
  requestBeamLabel?: string
  restrictedReason?: string
}

export type AskOutcome =
  | { kind: "empty" }
  | { kind: "none"; question: string }
  | {
      kind: "answer"
      answer: AskCandidate
      related: AskCandidate[]
    }
  | {
      kind: "route-to-beam"
      /** Why this one cannot be answered here. */
      reason: "restricted" | "pending"
      answer: AskCandidate
      related: AskCandidate[]
    }

// Words that carry no signal in a question like "how do we make money with Beam".
const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "beam", "but", "by", "can",
  "client", "clients", "do", "does", "for", "from", "has", "have", "how", "i",
  "if", "in", "is", "it", "its", "me", "my", "not", "of", "on", "or", "our",
  "partner", "partners", "should", "so", "that", "the", "their", "them",
  "there", "they", "this", "to", "us", "was", "we", "what", "when", "where",
  "which", "who", "why", "will", "with", "would", "you", "your",
])

/**
 * A stopgap, and worth naming as one.
 *
 * Term overlap only protects a restricted claim if the question happens to use
 * the same words the answer does. "KSA" and "Saudi Arabia" are the same
 * question to a partner and share no terms, so the restricted answer was never
 * found and an approved one was given instead. That is the failure mode that
 * matters here: not a weak answer, but the guardrail being bypassed by
 * vocabulary.
 *
 * These aliases close the cases we know about. They do not close the general
 * problem — that needs real retrieval, which is the strongest argument for
 * connecting this to a Beam agent rather than leaving it on term matching.
 */
const ALIASES: Record<string, string[]> = {
  ksa: ["saudi", "arabia"],
  uae: ["emirates", "dubai"],
  gcc: ["saudi", "arabia", "kuwait", "emirates", "region", "regional"],
  residency: ["sovereignty", "residence", "hosting", "deployment"],
  sovereignty: ["residency", "deployment"],
  onprem: ["premises", "deployment"],
  "on-prem": ["premises", "deployment"],
  pricing: ["price", "cost", "packaging"],
  cost: ["pricing", "price", "packaging"],
  margin: ["money", "revenue", "commercial"],
  exclusive: ["exclusivity", "territory"],
  gdpr: ["privacy", "compliance", "security"],
  soc2: ["security", "compliance", "certification"],
}

export function terms(text: string) {
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word))
  const expanded = new Set(words)
  for (const word of words) {
    for (const alias of ALIASES[word] ?? []) expanded.add(alias)
  }
  return [...expanded]
}

/**
 * Title matches count for more than body matches: an FAQ title is the question
 * a partner is actually asking, so matching it is a stronger signal than the
 * same word appearing somewhere in a long answer.
 */
export function scoreAnswer(question: string, candidate: AskCandidate) {
  const asked = new Set(terms(question))
  if (asked.size === 0) return 0

  const inTitle = new Set(terms(candidate.title))
  const inSummary = new Set(terms(candidate.summary))
  const inBody = new Set(terms(candidate.body))

  let score = 0
  for (const word of asked) {
    if (inTitle.has(word)) score += 5
    else if (inSummary.has(word)) score += 2
    else if (inBody.has(word)) score += 1
  }
  // Normalise so a long answer does not win purely by having more words.
  return score / asked.size
}

export function rankAnswers(question: string, candidates: AskCandidate[]) {
  return candidates
    .map((candidate) => ({ candidate, score: scoreAnswer(question, candidate) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.candidate)
}

/**
 * The governance rule, stated once: a restricted claim or an unpublished answer
 * is never given to a partner, however well it matches. They are told it exists
 * and routed to Beam instead.
 */
export function resolveAsk(
  question: string,
  candidates: AskCandidate[],
): AskOutcome {
  if (!question.trim()) return { kind: "empty" }

  const ranked = rankAnswers(question, candidates)
  const [best, ...rest] = ranked
  if (!best) return { kind: "none", question }

  const related = rest.slice(0, 3)

  if (best.claimState === "restricted") {
    return { kind: "route-to-beam", reason: "restricted", answer: best, related }
  }
  if (best.status === "pending") {
    return { kind: "route-to-beam", reason: "pending", answer: best, related }
  }
  return { kind: "answer", answer: best, related }
}

/** What to tell the partner when we will not answer here. */
export function routeReasonText(outcome: {
  reason: "restricted" | "pending"
  answer: AskCandidate
}) {
  if (outcome.reason === "restricted") {
    return (
      outcome.answer.restrictedReason ??
      "This claim is not published for partners. Ask Beam for a reviewed answer."
    )
  }
  return "Beam has not published this answer yet. Ask Beam rather than giving a client an unreviewed one."
}
