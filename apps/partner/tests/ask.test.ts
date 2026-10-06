import assert from "node:assert/strict"
import test from "node:test"

import { CORE_SECURITY_SET, answerQuestion, matchDocuments, splitQuestions, type AskUseCase } from "../lib/ask"
import { listWorkspaceCompliance, listWorkspaceItems } from "../lib/catalog/static"
import { FAQ_OPENERS, HOME_OPENERS } from "../lib/ask-openers"
import { resolveAsk, type AskCandidate } from "../lib/faq-answer"

function sources(workspace: string) {
  return {
    faq: listWorkspaceItems(workspace, "faq") as AskCandidate[],
    documents: listWorkspaceCompliance(workspace),
    useCases: listWorkspaceItems(workspace, "use-case").map((item) => {
      const detail = (item as { useCase?: { department?: string; trigger?: string; systems?: string[] } }).useCase
      return { ...item, department: detail?.department, trigger: detail?.trigger, systems: detail?.systems } as AskUseCase
    }),
  }
}

const demo = sources("partner-demo")

test("every Home opener lands where a partner needs to go, on the real catalog", () => {
  // The review found all four original openers landed on a wrong or dead-end
  // answer. Each opener now names what it must produce, and is checked here.
  for (const opener of [...HOME_OPENERS, ...FAQ_OPENERS]) {
    const result = answerQuestion(opener.text, demo)
    if (opener.expect === "security") {
      assert.ok(result.security, opener.text)
      assert.ok(result.documents.length >= 3, `${opener.text}: documents`)
    } else if (opener.expect === "use-case") {
      assert.ok(result.useCase, opener.text)
      assert.ok(result.useCases.length > 0, `${opener.text}: use cases`)
    } else if (opener.expect.startsWith("answer:")) {
      assert.equal(result.faq.kind, "answer", opener.text)
      if (result.faq.kind === "answer") assert.equal(result.faq.answer.slug, opener.expect.slice(7))
    } else if (opener.expect.startsWith("beam:")) {
      assert.equal(result.faq.kind, "route-to-beam", opener.text)
      if (result.faq.kind === "route-to-beam") assert.equal(result.faq.answer.slug, opener.expect.slice(5))
    }
  }
})

test("a finance use case question finds the finance use case, not a security answer", () => {
  const result = answerQuestion("Which use case fits a finance client?", demo)
  assert.ok(result.useCase)
  assert.deepEqual(result.useCases.map((useCase) => useCase.slug), ["invoice-exception-handling"])
  assert.notEqual(result.faq.kind === "route-to-beam" ? result.faq.answer.slug : "", "security-review-pack")
})

test("a word that only appears inside a long answer is never the answer", () => {
  // "test" appears in first-process-fit's body; a pen test question must not
  // be answered with it.
  const result = answerQuestion("Do you have a pen test report?", demo)
  assert.ok(result.security)
  assert.notEqual(result.faq.kind, "answer")
})

test("a business continuity question leads with the continuity policy", () => {
  const match = matchDocuments("Do you have a business continuity plan?", demo.documents)
  assert.equal(match.mode, "matched")
  assert.ok(match.documents[0]?.slug.startsWith("business-continuity"), match.documents.map((d) => d.slug).join(", "))
})

test("security questions get the documents that cover them, never an unrelated answer", () => {
  const cases: Array<[string, string]> = [
    ["How do you handle a data breach?", "data-breach-management-procedure"],
    ["What is your incident response process?", "information-security-incident-management-policy-and-procedure"],
    ["How is data encrypted at rest?", "cryptography-policy"],
    ["data retention policy", "data-and-record-retention-and-deletion-policy"],
  ]
  for (const [question, slug] of cases) {
    const result = answerQuestion(question, demo)
    assert.equal(result.documentMode, "matched", question)
    assert.ok(result.documents.some((document) => document.slug === slug), `${question}: ${slug}`)
  }
  // "plan" and "data" alone must not make an unrelated answer the answer.
  for (const question of ["Do you have an incident response plan?", "How is data encrypted at rest?"]) {
    assert.notEqual(answerQuestion(question, demo).faq.kind, "answer", question)
  }
})

test("a general security ask gets the core set, labelled as a starting point", () => {
  const result = answerQuestion("A client sent us security questions", demo)
  assert.equal(result.documentMode, "starter")
  assert.deepEqual(result.documents.map((document) => document.slug), CORE_SECURITY_SET)
})

test("evidence the library does not hold goes to the Beam team, never to unrelated policies", () => {
  for (const question of [
    "Do you have SOC 2?",
    "Can you share your ISO 27001 certificate?",
    "Is there a DPA we can sign before go-live?",
    "Do you have a pen test report?",
  ]) {
    const result = answerQuestion(question, demo)
    assert.ok(result.beamOnly, question)
    assert.notEqual(result.documentMode, "matched", question)
  }
})

test("use case questions find their department, whatever the casing", () => {
  assert.deepEqual(
    answerQuestion("What could Beam do for an HR team?", demo).useCases.map((useCase) => useCase.slug),
    ["cv-screening"]
  )
  assert.deepEqual(
    answerQuestion("Can Beam automate accounts payable?", demo).useCases.map((useCase) => useCase.slug),
    ["invoice-exception-handling"]
  )
})

for (const workspace of ["pwc-me", "roboyo", "roland-berger", "grant-thornton-sa"]) {
  test(`${workspace}: regional questions reach the restricted answer, never an approved one`, () => {
    const faq = listWorkspaceItems(workspace, "faq") as AskCandidate[]
    for (const question of [
      "Where is the data stored for a Saudi client?",
      "Can we host client data in the UAE?",
      "Can you guarantee data residency in KSA?",
      "What about deployment in Riyadh?",
      // Natural phrasings with no place name the alias list knows.
      "Can the client keep data in their own country?",
      "Does the data leave the country?",
      "Can data stay in-country?",
      "Is the data kept in the EU?",
      "Is there a local data centre in the Middle East?",
      "Can we run Beam inside the client's own Azure tenant?",
      "Where would a Qatari client's data live?",
    ]) {
      const outcome = resolveAsk(question, faq)
      assert.equal(outcome.kind, "route-to-beam", `${workspace}: ${question}`)
      if (outcome.kind === "route-to-beam") assert.equal(outcome.reason, "restricted")
    }
  })
}

test("the guardrail holds in live mode, where a restricted answer's text is redacted", () => {
  // Convex replaces a restricted item's summary and body with its request
  // label; ranking must still find it from the title and the label.
  const faq = (listWorkspaceItems("pwc-me", "faq") as AskCandidate[]).map((item) =>
    item.claimState === "restricted"
      ? { ...item, summary: item.requestBeamLabel ?? "", body: item.requestBeamLabel ?? "" }
      : item
  )
  const outcome = resolveAsk("Where is the data stored for a Saudi client?", faq)
  assert.equal(outcome.kind, "route-to-beam")
})

test("a pasted client email becomes one question per line or question mark", () => {
  const email = [
    "Hi team,",
    "Ahead of the review we need a few things:",
    "1. Where is our data hosted?",
    "2) Do you hold SOC 2? Is it Type II?",
    "- Your data processing agreement",
    "Thanks, Sam",
  ].join("\n")
  assert.deepEqual(splitQuestions(email), [
    "Where is our data hosted?",
    "Do you hold SOC 2?",
    "Is it Type II?",
    "Your data processing agreement",
  ])
  assert.deepEqual(splitQuestions("Why not SAP"), ["Why not SAP"])
  // Short listed requests are kept.
  assert.deepEqual(splitQuestions("Please send:\n1. DPA\n2. SOC2"), ["DPA", "SOC2"])
  assert.deepEqual(splitQuestions("   "), [])
})

test("an email's context makes location questions cautious, and only those", () => {
  const context = "Our client is a Saudi government entity."
  const stored = answerQuestion("Where will the data be stored", demo, context)
  assert.equal(stored.faq.kind, "route-to-beam")
  const encrypted = answerQuestion("Do you encrypt data at rest", demo, context)
  assert.notEqual(encrypted.faq.kind, "route-to-beam")
  assert.ok(encrypted.documents.some((document) => document.slug === "cryptography-policy"))
})
