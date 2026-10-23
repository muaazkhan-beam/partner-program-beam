import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import {
  NOT_ANSWERED_LINE,
  clientCell,
  countCells,
  countsLine,
  isVerbatim,
  policyLine,
  routesToBeam,
} from "../lib/answer-sheet"
import { answerQuestion, splitEmailWithRefs, type AskUseCase } from "../lib/ask"
import { getWorkspaceItem, listWorkspaceCompliance, listWorkspaceItems } from "../lib/catalog/static"
import { parseCsv } from "../lib/intake/csv"
import type { AskCandidate } from "../lib/faq-answer"
import type { PackContent } from "../lib/pack"

function sources(workspace: string) {
  return {
    faq: listWorkspaceItems(workspace, "faq") as AskCandidate[],
    documents: listWorkspaceCompliance(workspace),
    useCases: listWorkspaceItems(workspace, "use-case").map((item) => ({
      ...item,
      ...(item as { useCase?: object }).useCase,
    })) as AskUseCase[],
  }
}

function cellsFor(workspace: string, questions: string[], context = "", engagement?: "advisory") {
  const source = sources(workspace)
  const find = (slug: string) => (getWorkspaceItem(workspace, "faq", slug) ?? undefined) as PackContent | undefined
  return questions.map((question) => {
    const result = answerQuestion(question, source, context)
    return {
      result,
      cell: clientCell(result, {
        brandMode: "beam-standard",
        find,
        engagement,
        demoWorkspace: workspace === "partner-demo",
      }),
    }
  })
}

const fixture = (name: string) => readFileSync(new URL(`../public/demo/${name}`, import.meta.url), "utf8")

test("the forwarded vendor review keeps the client's numbering and gives the designed counts", () => {
  const { questions, context } = splitEmailWithRefs(fixture("orvane-vendor-review.eml"))
  assert.deepEqual(questions.map((question) => question.ref), ["1", "2", "3", "4", "5", "6", "7", "8", "9"])
  const rows = cellsFor("partner-demo", questions.map((question) => question.text), context)
  assert.equal(countsLine(countCells(rows.map((row) => row.cell))), "4 quoted · 3 policies · 2 for Beam")
  // Where data lives and audit evidence are Beam's to answer.
  assert.equal(rows[3]!.cell.kind, "beam")
  assert.equal(rows[5]!.cell.kind, "beam")
  for (const row of rows) assert.ok(isVerbatim(row.cell), row.result.question)
})

test("every cell of the client questionnaire is a quote, a printed reference, or the fixed line", () => {
  const parsed = parseCsv(fixture("calderhay-questionnaire.csv"))
  const questions = parsed.rows.map((row) => row[2]!)
  const rows = cellsFor("partner-demo", questions, "", "advisory")
  for (const row of rows) assert.ok(isVerbatim(row.cell), row.result.question)
  const counts = countCells(rows.map((row) => row.cell))
  assert.equal(counts.quoted + counts.policies + counts.forBeam, questions.length)
  assert.equal(countsLine(counts), "7 quoted · 15 policies · 8 for Beam")
})

test("a sensitive topic goes to Beam before any policy that shares its words", () => {
  for (const question of [
    "What liability cap do you accept in the contract?",
    "What is the pricing model and are there volume discounts?",
    "Is Beam independent of our external auditor?",
    "Where will our data be processed and stored?",
  ]) {
    const [row] = cellsFor("partner-demo", [question])
    assert.ok(routesToBeam(row!.result), question)
    assert.equal(row!.cell.text, NOT_ANSWERED_LINE, question)
  }
})

test("an answer written to coach the partner is never quoted to a client", () => {
  // pwc-me holds only partner-internal answers; none may become a cell.
  const source = sources("pwc-me")
  for (const answer of source.faq) {
    const [row] = cellsFor("pwc-me", [answer.title])
    assert.notEqual(row!.cell.kind, "quote", answer.slug)
  }
})

test("demo answers are quoted only from the demo workspace", () => {
  const [row] = cellsFor("partner-demo", ["Is there human approval before an agent acts?"])
  assert.equal(row!.cell.kind, "quote")
  const source = sources("partner-demo")
  const find = (slug: string) => (getWorkspaceItem("partner-demo", "faq", slug) ?? undefined) as PackContent | undefined
  const outside = clientCell(answerQuestion("Is there human approval before an agent acts?", source), {
    brandMode: "beam-standard",
    find,
  })
  assert.notEqual(outside.kind, "quote")
})

test("a policy reference is built from printed fields and says it is not an answer", () => {
  const [document] = listWorkspaceCompliance("partner-demo").filter((entry) => entry.slug === "cryptography-policy")
  assert.ok(document)
  assert.equal(
    policyLine([document]),
    `Not answered here. Related Beam policy: Cryptography Policy, version ${document.version}, ${document.printedDate}. Beam issues a copy on request.`
  )
})

test("counts never call a policy ready", () => {
  assert.equal(countsLine({ quoted: 1, policies: 1, forBeam: 0 }), "1 quoted · 1 policy · 0 for Beam")
  assert.doesNotMatch(countsLine({ quoted: 4, policies: 3, forBeam: 2 }), /ready/i)
})
