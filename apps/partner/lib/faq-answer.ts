/**
 * Answering a partner's question from reviewed content.
 *
 * Partners do not browse an FAQ: a partner mid-call wants to ask, not read
 * twenty-two answers. This finds the answer and decides whether it may be
 * given.
 *
 * Retrieval is term matching, not a model, so the safety rules do not rest on
 * it. Questions on sensitive topics (where client data lives, commercial
 * terms, auditor independence, contract terms) go to Beam whatever they match;
 * restricted and unpublished answers are never given; and an approved answer
 * is given only when the question is about its title. Swapping in a Beam
 * agent means replacing the ranking and keeping `resolveAsk`'s rules.
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

export type SensitiveTopic = "data-location" | "commercial" | "independence" | "contract"

export type AskOutcome =
  | { kind: "empty" }
  | {
      kind: "none"
      question: string
      /** Answers about something close: offered, never given. */
      related: AskCandidate[]
    }
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
      /** Set when a sensitive topic decided the route. */
      topic?: SensitiveTopic
      /** True when no catalog answer exists and `answer` stands in for the topic. */
      standIn?: boolean
    }

// Words that carry no signal in a question like "how do we make money with Beam".
const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "beam", "but", "by", "can",
  "client", "clients", "do", "does", "for", "from", "has", "have", "how", "i",
  "if", "in", "is", "it", "its", "me", "my", "not", "of", "on", "or", "our",
  "partner", "partners", "should", "so", "that", "the", "their", "them",
  "there", "they", "this", "to", "us", "was", "we", "what", "when", "where",
  "which", "who", "why", "will", "with", "would", "you", "your",
  // Request filler: "what can I send a client today", "a client sent us".
  "about", "all", "any", "ask", "asked", "get", "give", "help", "just",
  "know", "need", "one", "please", "question", "questions", "send", "sent",
  "tell", "today", "use", "want", "way",
  // Connectives that carry no topic: "pick Beam over SAP".
  "after", "been", "being", "both", "each", "had", "into", "most", "much",
  "only", "other", "over", "same", "such", "than", "then", "these", "those",
  "very", "were", "says", "say", "already",
])

/**
 * Closes vocabulary gaps between how partners ask and how titles are written.
 * It improves ranking only; no safety rule depends on it.
 */
const ALIASES: Record<string, string[]> = {
  ksa: ["saudi", "arabia"],
  riyadh: ["saudi", "arabia"],
  uae: ["saudi", "kuwait", "regional", "deployment", "residency"],
  emirates: ["saudi", "kuwait", "regional", "deployment", "residency"],
  dubai: ["saudi", "kuwait", "regional", "deployment", "residency"],
  gcc: ["saudi", "arabia", "kuwait", "emirates", "region", "regional"],
  residency: ["sovereignty", "residence", "hosting", "deployment"],
  sovereignty: ["residency", "deployment"],
  onprem: ["premises", "deployment"],
  "on-prem": ["premises", "deployment"],
  pricing: ["price", "priced", "cost", "packaging"],
  price: ["pricing", "priced", "cost", "packaging"],
  cost: ["pricing", "price", "priced", "packaging"],
  exclusive: ["exclusivity", "territory"],
  gdpr: ["privacy", "compliance", "security"],
  soc2: ["security", "compliance", "certification"],
  accurate: ["accuracy"],
  accurately: ["accuracy"],
  roi: ["measure", "success", "value"],
  review: ["approval"],
  approve: ["approval"],
  signoff: ["approval"],
  walk: ["pursue", "opportunity"],
  away: ["pursue"],
  red: ["pursue"],
  flags: ["pursue"],
  start: ["engagement"],
  project: ["workflow", "engagement"],
  mistake: ["accuracy"],
  mistakes: ["accuracy"],
  errors: ["accuracy"],
  kpi: ["measure", "success"],
  kpis: ["measure", "success"],
  metrics: ["measure", "success"],
  logo: ["brand"],
  integrate: ["work"],
  integration: ["work"],
  connect: ["work"],
  api: ["work"],
  prospect: ["opportunity"],
  prospects: ["opportunity"],
  white: ["brand"],
  whitelabel: ["brand"],
  branding: ["brand"],
}

export function terms(text: string) {
  const list = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word))
  const expanded = new Set(list)
  for (const word of list) {
    for (const alias of ALIASES[word] ?? []) expanded.add(alias)
  }
  return [...expanded]
}

/** Words alone, without aliases: for matching text against other text. */
export function words(text: string) {
  return [
    ...new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 2 && !STOPWORDS.has(word))
    ),
  ]
}

/**
 * Too common to make an answer about the question on their own: every answer
 * here is about agents, data and processes, so those words decide nothing.
 */
export const WEAK_WORDS = new Set([
  "able", "agent", "agents", "also", "before", "best", "business", "case",
  "cases", "company", "data", "first", "good", "handle", "into", "keep",
  "like", "live", "long", "look", "make", "model", "models", "more", "new",
  "own", "plan", "process", "processes", "rest", "run", "see", "some",
  "system", "systems", "team", "thing", "things", "time", "used", "using",
  "work",
])

/**
 * A light stemmer for matching only: "accurate" and "accuracy", "priced" and
 * "pricing", "approve" and "approval" meet; "process" is left alone.
 */
function stem(word: string) {
  if (word.length <= 4) return word
  const cut = word.replace(/(ations?|ingly|ings?|edly|ed|ies|es|(?<!s)s|ity|ly|ments?|ness|ate|acy|cy|al|e)$/, "")
  if (cut.length >= 4) return cut
  // Cut too deep ("makes" -> "mak"): fall back to dropping a plural s.
  const singular = word.replace(/(?<!s)s$/, "")
  return singular.length >= 4 ? singular : word
}

/** Each asked word with its aliases, stemmed; a group hits when any form does. */
type TermGroup = { word: string; forms: string[] }

function termGroups(text: string): TermGroup[] {
  return words(text).map((word) => ({
    word,
    forms: [...new Set([word, ...(ALIASES[word] ?? [])].map(stem))],
  }))
}

function stems(text: string) {
  return new Set(words(text).map(stem))
}

function hits(group: TermGroup, set: Set<string>) {
  return group.forms.some((form) => set.has(form))
}

function fields(candidate: AskCandidate) {
  return {
    inTitle: stems(candidate.title),
    // In live data a restricted answer's summary and body are replaced by its
    // request label, so the label and the restriction reason count as summary.
    inSummary: stems(
      `${candidate.summary} ${candidate.requestBeamLabel ?? ""} ${candidate.restrictedReason ?? ""}`
    ),
    inBody: stems(candidate.body),
  }
}

/**
 * Title matches count for more than body matches: an FAQ title is the question
 * a partner is actually asking.
 */
export function scoreAnswer(question: string, candidate: AskCandidate) {
  const groups = termGroups(question)
  if (groups.length === 0) return 0
  const { inTitle, inSummary, inBody } = fields(candidate)
  let score = 0
  for (const group of groups) {
    if (hits(group, inTitle)) score += 5
    else if (hits(group, inSummary)) score += 2
    else if (hits(group, inBody)) score += 1
  }
  // Normalise so a long answer does not win purely by having more words.
  return score / groups.length
}

/**
 * How firmly a candidate's title is about the question, counted over the
 * words that carry meaning. An approved answer is given only when firm: two
 * title words, or the one word of a short question. A word in a summary or a
 * body is never enough ("retain" in a summary does not answer a retention
 * question).
 */
const WEAK_STEMS = new Set([...WEAK_WORDS].map(stem))

function titleMatch(question: string, candidate: AskCandidate) {
  const groups = termGroups(question)
  const meaningful = groups.filter(
    (group) => !WEAK_WORDS.has(group.word) && !WEAK_STEMS.has(stem(group.word))
  )
  const base = meaningful.length > 0 ? meaningful : groups
  const { inTitle, inSummary } = fields(candidate)
  const titleHits = base.filter((group) => hits(group, inTitle)).length
  return {
    titleHits,
    firm: titleHits >= 2 || (titleHits === 1 && base.length <= 2),
    mentions: base.some((group) => hits(group, inTitle) || hits(group, inSummary)),
  }
}

/** Restricted before approved before unpublished on a tie. */
const tieRank = (candidate: AskCandidate) =>
  candidate.claimState === "restricted" ? 0 : candidate.status === "pending" ? 2 : 1

function scoreAll(question: string, candidates: AskCandidate[]) {
  return candidates
    .map((candidate) => ({
      candidate,
      score: scoreAnswer(question, candidate),
      ...titleMatch(question, candidate),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || tieRank(a.candidate) - tieRank(b.candidate))
}

export function rankAnswers(question: string, candidates: AskCandidate[]) {
  return scoreAll(question, candidates).map((row) => row.candidate)
}

// --- Sensitive topics -------------------------------------------------------

const PLACES =
  /\b(eu|eea|europe|european|uk|britain|british|united states|usa|u\.s\.|america|american|frankfurt|germany|german|deutschland|switzerland|swiss|france|french|ireland|saudi|saudis|ksa|kingdom|uae|emirati|emiratis|emirates|dubai|abu dhabi|sharjah|kuwait|kuwaiti|qatar|qatari|doha|oman|omani|muscat|bahrain|bahraini|manama|riyadh|jeddah|dammam|neom|gcc|gulf|middle east|mena|india|indian|singapore|australia|australian|anz|new zealand|africa|canada|canadian|apac)\b/i

const DATA_THINGS =
  /\b(data|information|records?|files?|documents?|servers?|infrastructure|hosting|database|databases|backups?|logs?|workloads?|environment|instance|deployment|cloud|datacent(er|re)s?|llms?|models?|calls|traffic|processing|sub-?processors?)\b/i

const LOCATION_ACTS =
  /\b(stored?|storing|storage|host(ed|s|ing)?|process(ed|es|ing)?|kept|keep|located?|location|resides?|residing|lives?|living|leaves?|leaving|goes|go|sits?|sent|transferr?(ed|ing)?|transfers?|moved?|deployed|deploy|run|runs|running|stay|stays|happen|happens)\b/i

const LOCATION_PHRASES =
  /\b(residen\w*|sovereign\w*|onshore|on-shore|offshore|in[- ]country|cross[- ]border|air[- ]?gapped|on[- ]?prem(ise|ises)?\b|private (network\w*|cloud|link|instance)|tenan(t|ts|cy)|vpc|virtual private|government[- ]read\w*|data (centre|center|centres|centers|location|locali[sz]ation|transfers?)|cloud regions?|regions?\b|own (country|countries|region|jurisdiction|cloud|servers?|infrastructure|data ?cent(er|re)s?)|(their|our|the client'?s) country|locali[sz]\w*|deployment (options?|models?|choices|regions?|locations?|topolog\w*)|deploy (it |beam )?anywhere|\b(me|eu|us|ap|af|ca|sa|il)-[a-z]+-\d|government\w*|public[- ]sector|federal|ministr(y|ies)|defen[cs]e|datacent(er|re)s?|self[- ]?host\w*|hosting|hosted|on[- ]?prem(?!ium)\w*|(aws|azure|gcp|google cloud|oracle cloud) (account|subscription|project|tenant|region)s?|co-?mingl\w*|multi-?tenan\w*|offline|disconnected|air gap|behind (our|the|their|a) firewall|inside (our|the|their) network|public internet|internet[- ]facing|nca|ecc|sama|pdpl|citc|vision 2030|adhics|nesa)/i

const REGULATION = /\b(comply|complies|compliance|compliant|law|laws|regulat\w*|legal|permitted|allowed|available|support)\b/i

const COMMERCIAL =
  /\b(pric\w*|costs?|costing|fees?|margins?|discount\w*|commissions?|rebates?|revenue[- ]share|rev[- ]share|referral fee|rate ?card|our cut|make money|earn|earns|earning|earnings|commercial\w*|contract value|deal (size|value)|free (pilot|trial)|pilot (fee|price|cost|discount)|in it for us|resell\w*|reseller|quotes?|quotation|budget\w*|payment terms|licen[cs]e (fee|cost)s?|how much (does|do|will|would|is|are) (it|beam|this|that|a|an|the)\b)/i

const INDEPENDENCE =
  /\b(independen\w*|auditors?|statutory audit\w*|audit (client|clients|firm|firms|engagement|engagements|relationship)s?|assurance (client|clients|practice|engagement)\w*|attest\w* (client|clients|engagement)\w*|conflicts? of interest|conflict with|sec rules|pcaob|non[- ]audit services)\b/i

const CONTRACT =
  /\b(sla|slas|service levels?|liabilit\w*|indemn\w*|warrant(y|ies)|contract(ual)? terms?|msa|master services|terms and conditions|t&cs?|exclusiv\w*|territor\w*|non[- ]compete|ip ownership|intellectual property|who owns|(another|other) partners?|channel conflict|compete with us)\b/i

/**
 * The topic a question touches that only Beam may answer for a client, if
 * any. Context is the rest of a pasted email ("Our client is a Saudi
 * government entity.") and counts only for where the data lives.
 */
const PLACES_IN_CAPITALS = /\b(US|U\.S\.?|USA|UK|EU|EEA|UAE|KSA|GCC)\b/
const LOCATED_IN_PLACE =
  /\b(stored|hosted|processed|kept|located|run|runs|deployed|held|based)\s+(in|inside|within|outside|on)\s+(the\s+)?[A-Z]/

export function sensitiveTopic(question: string, context = ""): SensitiveTopic | null {
  const asked = question.toLowerCase()
  const placedHere = PLACES.test(question) || PLACES_IN_CAPITALS.test(question)
  // A place named elsewhere in the email ("our client is a Saudi entity")
  // only counts when this question is itself about where something lives:
  // it must not turn "do you encrypt data at rest" into a residency question.
  const placedInContext = PLACES.test(context) || PLACES_IN_CAPITALS.test(context)
  const locates =
    LOCATION_PHRASES.test(asked) ||
    LOCATED_IN_PLACE.test(question) ||
    (placedHere && (DATA_THINGS.test(asked) || LOCATION_ACTS.test(asked) || REGULATION.test(asked))) ||
    (placedInContext && LOCATION_ACTS.test(asked) && DATA_THINGS.test(asked)) ||
    (/\b(where|which (country|countries|cloud|clouds|region|regions))\b/.test(asked) && DATA_THINGS.test(asked)) ||
    (/\b(outside|inside|within|leave|leaves|leaving|stay|stays|local|locally)\b/.test(asked) && DATA_THINGS.test(asked)) ||
    (/\bwhere\b/.test(asked) &&
      LOCATION_ACTS.test(asked) &&
      /\b(beam|it|platform|models?|llms?|agents?|processing|data|servers?|calls)\b/.test(asked))
  if (locates) return "data-location"
  if (INDEPENDENCE.test(question)) return "independence"
  if (COMMERCIAL.test(question)) return "commercial"
  if (CONTRACT.test(question)) return "contract"
  return null
}

/** Which catalog answer speaks for a topic, judged on its own title and summary. */
const TOPIC_ANSWER: Record<SensitiveTopic, RegExp> = {
  "data-location": /deploy|residen|sovereign|region|saudi|kuwait|gcc|on-?prem|hosting/i,
  commercial: /pric|cost|margin|discount|commission|fee|money|revenue/i,
  independence: /independen|audit/i,
  contract: /exclusiv|territor|contract|liabil|\bsla\b|owner/i,
}

const STAND_IN: Record<SensitiveTopic, { title: string; reason: string }> = {
  "data-location": {
    title: "Where client data is stored and processed",
    reason: "Hosting, residency and deployment are confirmed by Beam for each client. Ask the Beam team.",
  },
  commercial: {
    title: "Pricing and commercial terms",
    reason: "Pricing, margins and commercial terms come from the Beam team for each deal.",
  },
  independence: {
    title: "Independence and conflicts",
    reason: "Independence is a risk conversation with Beam, not a published answer.",
  },
  contract: {
    title: "Contract terms",
    reason: "Contract terms, ownership and exclusivity are agreed with Beam for each deal.",
  },
}

function topicRoute(
  topic: SensitiveTopic,
  candidates: AskCandidate[],
  related: AskCandidate[]
): AskOutcome {
  const speaks = (candidate: AskCandidate) =>
    TOPIC_ANSWER[topic].test(`${candidate.title} ${candidate.summary}`)
  const restricted = candidates.find(
    (candidate) => candidate.claimState === "restricted" && speaks(candidate)
  )
  const pending = candidates.find(
    (candidate) => candidate.status === "pending" && speaks(candidate)
  )
  const found = restricted ?? pending
  if (found) {
    return {
      kind: "route-to-beam",
      reason: found === restricted ? "restricted" : "pending",
      answer: found,
      related: related.filter((candidate) => candidate !== found),
      topic,
    }
  }
  const standIn = STAND_IN[topic]
  return {
    kind: "route-to-beam",
    reason: "restricted",
    answer: {
      slug: `topic-${topic}`,
      title: standIn.title,
      summary: "",
      body: "",
      audience: "partner-internal",
      claimState: "restricted",
      restrictedReason: standIn.reason,
    },
    related,
    topic,
    standIn: true,
  }
}

/**
 * The places and names a restricted answer's title is about ("Saudi Arabia",
 * "Kuwait"): capitalised words after the first.
 */
function namedTerms(title: string) {
  const parts = title.split(/[^A-Za-z0-9]+/).filter(Boolean).slice(1)
  return terms(parts.filter((part) => /^[A-Z]/.test(part)).join(" "))
}

function namedRestricted(question: string, candidates: AskCandidate[]) {
  const asked = new Set(terms(question))
  return candidates.find(
    (candidate) =>
      candidate.claimState === "restricted" &&
      namedTerms(candidate.title).some((word) => asked.has(word))
  )
}

/**
 * The governance rule, stated once:
 * 1. A sensitive topic goes to Beam, with the catalog's answer for it if one
 *    exists, whatever else matches.
 * 2. A restricted answer the question names, or whose title it matches
 *    firmly, goes to Beam.
 * 3. Otherwise the best firm title match is given if approved, or routed to
 *    Beam if unpublished. No firm match: nothing is given.
 */
export function resolveAsk(
  question: string,
  candidates: AskCandidate[],
  context = ""
): AskOutcome {
  if (!question.trim()) return { kind: "empty" }

  const ranked = scoreAll(question, candidates)
  const related = (chosen?: AskCandidate) =>
    ranked
      .filter((row) => row.mentions && row.candidate !== chosen)
      .slice(0, 3)
      .map((row) => row.candidate)

  const topic = sensitiveTopic(question, context)
  if (topic) return topicRoute(topic, candidates, related())

  const named = namedRestricted(question, candidates)
  const firmRestricted = ranked.find(
    (row) => row.candidate.claimState === "restricted" && row.firm
  )?.candidate
  const restricted = named ?? firmRestricted
  if (restricted) {
    return { kind: "route-to-beam", reason: "restricted", answer: restricted, related: related(restricted) }
  }

  const best = ranked.find((row) => row.firm)
  if (!best) return { kind: "none", question, related: related() }
  if (best.candidate.status === "pending") {
    return { kind: "route-to-beam", reason: "pending", answer: best.candidate, related: related(best.candidate) }
  }
  return { kind: "answer", answer: best.candidate, related: related(best.candidate) }
}

/** What to tell the partner when we will not answer here. */
export function routeReasonText(outcome: {
  reason: "restricted" | "pending"
  answer: AskCandidate
}) {
  if (outcome.reason === "restricted") {
    return (
      outcome.answer.restrictedReason ??
      "Only Beam can answer this for a client. Ask the Beam team."
    )
  }
  return "Beam has not approved an answer to this yet. Ask the Beam team before you reply."
}
