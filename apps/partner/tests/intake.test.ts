import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { NOT_ANSWERED_LINE, countsLine, isVerbatim } from "../lib/answer-sheet"
import type { AskUseCase } from "../lib/ask"
import { getWorkspaceItem, listWorkspaceCompliance, listWorkspaceItems } from "../lib/catalog/static"
import {
  IntakeError,
  answerQuestions,
  answerThread,
  filledQuestionnaire,
  newThread,
  readIntake,
  sheetCounts,
  sourceKind,
} from "../lib/desk/intake"
import type { AskCandidate } from "../lib/faq-answer"
import { parseCsv } from "../lib/intake/csv"
import type { PackContent } from "../lib/pack"

const ws = "partner-demo"
const options = {
  sources: {
    faq: listWorkspaceItems(ws, "faq") as AskCandidate[],
    documents: listWorkspaceCompliance(ws),
    useCases: listWorkspaceItems(ws, "use-case").map((item) => ({
      ...item,
      ...(item as { useCase?: object }).useCase,
    })) as AskUseCase[],
  },
  find: (slug: string) => (getWorkspaceItem(ws, "faq", slug) ?? undefined) as PackContent | undefined,
  brandMode: "beam-standard",
  hold: { demoWorkspace: true },
}
const fixture = (name: string) => readFileSync(new URL(`../public/demo/${name}`, import.meta.url), "utf8")

test("a dropped file is read by its kind, and Outlook and Excel files are explained", () => {
  assert.equal(sourceKind("review.EML"), "email")
  assert.equal(sourceKind("questionnaire.csv"), "questionnaire")
  assert.equal(sourceKind("notes.txt"), "paste")
  assert.throws(() => sourceKind("review.msg"), (error: unknown) => error instanceof IntakeError && error.code === "msg-file")
  assert.throws(() => sourceKind("sheet.xlsx"), (error: unknown) => error instanceof IntakeError && error.code === "spreadsheet")
  assert.throws(() => sourceKind("deck.pptx"), (error: unknown) => error instanceof IntakeError && error.code === "unsupported")
})

test("the forwarded review is read from the client who wrote it", () => {
  const intake = readIntake({ kind: "email", raw: fixture("orvane-vendor-review.eml"), fileName: "orvane-vendor-review.eml" })
  assert.equal(intake.senderDomain, "orvane-freight.example")
  assert.equal(intake.subject, "Fwd: Vendor security review - Beam")
  assert.equal(intake.questions.length, 9)
  const rows = answerQuestions(intake.questions, intake.context, options)
  assert.equal(countsLine(sheetCounts(rows)), "4 quoted · 3 policies · 2 for Beam")
})

test("a thread keeps questions and place names, never the email", () => {
  const raw = "Our client is a Saudi government entity.\n1. Where will the data be stored?\n2. Do you encrypt data at rest?"
  const intake = readIntake({ kind: "paste", text: raw })
  const rows = answerQuestions(intake.questions, intake.context, options)
  const thread = newThread(intake, rows, { id: "t1", workspaceSlug: ws, now: 1 })
  assert.deepEqual(thread.contextCues, ["saudi"])
  assert.doesNotMatch(JSON.stringify(thread), /government entity/)
  assert.deepEqual(thread.questions.map((question) => question.routedAtIntake), [true, false])
})

test("a stored question that went to Beam stays with Beam", () => {
  const intake = readIntake({ kind: "paste", text: "1. Is there human approval before an agent acts?\n2. Where will our data be stored?" })
  const rows = answerQuestions(intake.questions, intake.context, options)
  const thread = newThread(intake, rows, { id: "t1", workspaceSlug: ws, now: 1 })
  // Pretend the first was routed when it arrived; today's catalog must not loosen it.
  const cautious = { ...thread, questions: thread.questions.map((question) => ({ ...question, routedAtIntake: true })) }
  for (const row of answerThread(cautious, options)) assert.equal(row.cell.text, NOT_ANSWERED_LINE)
})

test("the client's questionnaire comes back in their order with three columns added", () => {
  const csv = fixture("calderhay-questionnaire.csv")
  const intake = readIntake({ kind: "questionnaire", csv, fileName: "calderhay-questionnaire.csv" })
  assert.equal(intake.questions.length, 30)
  assert.equal(intake.questions[13]!.ref, "CM-14")
  const rows = answerQuestions(intake.questions, "", { ...options, hold: { demoWorkspace: true, engagement: "advisory" } })
  for (const row of rows) assert.ok(isVerbatim(row.cell), row.question.text)
  const thread = newThread(intake, rows, { id: "t2", workspaceSlug: ws, now: 1 })
  const filled = parseCsv(filledQuestionnaire(thread, rows)!)
  assert.deepEqual(filled.headers, ["Ref", "Domain", "Question", "Notes", "From Beam", "Source", "Status"])
  const original = parseCsv(csv)
  assert.deepEqual(filled.rows.map((row) => row.slice(0, 4)), original.rows)
  const soc = filled.rows[13]!
  assert.equal(soc[4], NOT_ANSWERED_LINE)
  assert.equal(soc[6], "For Beam")
  const quoted = filled.rows[0]!
  assert.equal(quoted[6], "Quoted")
  assert.match(quoted[5]!, /demo content, not reviewed by Beam/)
})

test("an email with no questions, or a sheet with no question column, says what to do", () => {
  assert.throws(() => readIntake({ kind: "paste", text: "   " }), (error: unknown) => error instanceof IntakeError && error.code === "no-questions")
  assert.throws(
    () => readIntake({ kind: "questionnaire", csv: "A,B\n1,2\n3,4\n", fileName: "x.csv" }),
    (error: unknown) => error instanceof IntakeError && error.code === "no-question-column"
  )
})
