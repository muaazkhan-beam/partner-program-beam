import assert from "node:assert/strict"
import test from "node:test"

import {
  rankAnswers,
  resolveAsk,
  scoreAnswer,
  type AskCandidate,
} from "../lib/faq-answer"

function answer(overrides: Partial<AskCandidate> = {}): AskCandidate {
  return {
    slug: "why-not-sap",
    title: "Why not SAP?",
    summary: "Beam sits across systems rather than replacing a clean ERP module.",
    body: "SAP owns the system of record. Beam handles the exceptions that fall outside it.",
    audience: "partner-internal",
    claimState: "approved",
    ...overrides,
  }
}

test("a question matching a title outranks one matching only the body", () => {
  const titleMatch = answer({ slug: "sap", title: "Why not SAP?" })
  const bodyMatch = answer({
    slug: "incumbents",
    title: "Positioning against incumbents",
    summary: "General positioning guidance.",
    body: "Mentions SAP once in passing.",
  })
  assert.ok(
    scoreAnswer("why not SAP", titleMatch) >
      scoreAnswer("why not SAP", bodyMatch),
  )
})

test("filler words alone match nothing", () => {
  // Without stopword removal "how do we with our client" would match everything.
  assert.deepEqual(rankAnswers("how do we with our client", [answer()]), [])
})

test("an empty question asks nothing", () => {
  assert.equal(resolveAsk("   ", [answer()]).kind, "empty")
})

test("a question with no published answer routes to Beam rather than guessing", () => {
  const outcome = resolveAsk("what is your carbon footprint", [answer()])
  assert.equal(outcome.kind, "none")
})

test("a restricted claim is never answered, however well it matches", () => {
  const restricted = answer({
    slug: "deployment-ksa-kuwait",
    title: "Can you guarantee data residency in KSA?",
    claimState: "restricted",
    restrictedReason:
      "Regional deployment and sovereignty claims need commercial and security approval.",
  })
  const outcome = resolveAsk("can you guarantee data residency in KSA", [
    restricted,
  ])
  assert.equal(outcome.kind, "route-to-beam")
  assert.equal(
    outcome.kind === "route-to-beam" ? outcome.reason : undefined,
    "restricted",
  )
})

test("an answer Beam has not published yet routes to Beam", () => {
  const pending = answer({
    slug: "pricing-and-packaging",
    title: "What does Beam cost?",
    status: "pending",
  })
  const outcome = resolveAsk("what does Beam cost", [pending])
  assert.equal(outcome.kind, "route-to-beam")
  assert.equal(
    outcome.kind === "route-to-beam" ? outcome.reason : undefined,
    "pending",
  )
})

test("a restricted best match is not bypassed by a weaker approved one", () => {
  // The dangerous failure: skipping the restricted answer and confidently
  // giving a partner the next-best thing instead.
  const restricted = answer({
    slug: "exclusivity",
    title: "Is our territory exclusive?",
    claimState: "restricted",
  })
  const approved = answer({
    slug: "brand-shapes",
    title: "Whose brand is on the work?",
    body: "Partner-fronted, joint, or Beam-fronted, by approved mode.",
  })
  const outcome = resolveAsk("is our territory exclusive", [
    approved,
    restricted,
  ])
  assert.equal(outcome.kind, "route-to-beam")
})

test("an approved answer is given, with the rest offered as related", () => {
  const outcome = resolveAsk("why not SAP", [
    answer(),
    answer({ slug: "vs-epm", title: "How is Beam different from SAP planning?" }),
  ])
  assert.equal(outcome.kind, "answer")
  if (outcome.kind !== "answer") return
  assert.equal(outcome.answer.slug, "why-not-sap")
  assert.equal(outcome.related.length, 1)
})
