import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { answerQuestion, type AskUseCase } from "../lib/ask"
import { listWorkspaceCompliance, listWorkspaceItems, listWorkspaces } from "../lib/catalog/static"
import type { AskCandidate } from "../lib/faq-answer"

/**
 * 256 realistic partner and client questions from the red-team review of the
 * ask, run against every real workspace. The safety rules are asserted
 * exhaustively; answer quality is asserted as a floor.
 */
const questions = JSON.parse(
  readFileSync(new URL("./fixtures/ask-questions.json", import.meta.url), "utf8")
) as {
  residency: string[]
  commercial: Array<[string, string]>
  security: Array<[string, string[], string]>
  everyday: Array<[string, string[]]>
}

function sources(workspace: string, redacted = false) {
  // Live data replaces a restricted answer's text with its request label.
  const faq = (listWorkspaceItems(workspace, "faq") as AskCandidate[]).map((item) =>
    redacted && item.claimState === "restricted"
      ? { ...item, summary: item.requestBeamLabel ?? "", body: item.requestBeamLabel ?? "" }
      : item
  )
  return {
    faq,
    documents: listWorkspaceCompliance(workspace),
    useCases: listWorkspaceItems(workspace, "use-case").map((item) => {
      const detail = (item as { useCase?: { department?: string } }).useCase
      return { ...item, department: detail?.department } as AskUseCase
    }),
  }
}

const workspaces = listWorkspaces().map((workspace) => workspace.slug)

for (const workspace of workspaces) {
  for (const redacted of [false, true]) {
    const mode = redacted ? "live" : "static"
    test(`${workspace} (${mode}): where client data lives always goes to Beam`, () => {
      const source = sources(workspace, redacted)
      for (const question of questions.residency) {
        const { faq } = answerQuestion(question, source)
        assert.equal(faq.kind, "route-to-beam", `${workspace}/${mode}: ${question}`)
      }
    })

    test(`${workspace} (${mode}): commercial, contract and independence questions are never answered`, () => {
      const source = sources(workspace, redacted)
      for (const [question, kind] of questions.commercial) {
        const { faq } = answerQuestion(question, source)
        if (kind === "money" && faq.kind === "answer") {
          assert.equal(faq.answer.slug, "how-we-make-money", `${workspace}: ${question}`)
        } else {
          assert.notEqual(faq.kind, "answer", `${workspace}/${mode}: ${question}`)
        }
      }
    })

    test(`${workspace} (${mode}): everyday questions are never answered with the wrong answer`, () => {
      const source = sources(workspace, redacted)
      for (const [question, accepted] of questions.everyday) {
        const { faq } = answerQuestion(question, source)
        if (faq.kind === "answer") {
          assert.ok(accepted.includes(faq.answer.slug), `${workspace}/${mode}: ${question} -> ${faq.answer.slug}`)
        }
      }
    })
  }
}

test("everyday questions keep their answers where the answer is granted", () => {
  const source = sources("pwc-me")
  const granted = new Set(source.faq.map((item) => item.slug))
  let answerable = 0
  let answered = 0
  for (const [question, accepted] of questions.everyday) {
    if (!accepted.some((slug) => granted.has(slug))) continue
    answerable++
    const { faq } = answerQuestion(question, source)
    if ((faq.kind === "answer" || faq.kind === "route-to-beam") && accepted.includes(faq.answer.slug)) answered++
  }
  assert.ok(answered >= answerable - 2, `${answered} of ${answerable} answered`)
})

test("security questionnaire lines get the documents that cover them, or the Beam team", () => {
  const source = sources("partner-demo")
  for (const [question, expected, note] of questions.security) {
    const result = answerQuestion(question, source)
    if (note === "beam-only") {
      assert.ok(result.beamOnly, `beam-only: ${question}`)
      continue
    }
    if (note.startsWith("not-held")) {
      // The library does not hold it: never claimed as covered.
      assert.notEqual(result.documentMode, "matched", `not held: ${question}`)
    }
    if (expected.length > 0 && result.documentMode === "matched") {
      const top = result.documents.slice(0, 3).map((document) => document.slug)
      assert.ok(top.some((slug) => expected.includes(slug)), `${question}: ${top.join(", ")}`)
    }
    if (expected.length > 0) assert.ok(result.security, `recognised as security: ${question}`)
    assert.ok(
      !(result.faq.kind === "answer" && result.beamOnly),
      `no FAQ answer beside a Beam-only ask: ${question}`
    )
  }
})
