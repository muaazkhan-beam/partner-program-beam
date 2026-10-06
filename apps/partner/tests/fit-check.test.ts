import assert from "node:assert/strict"
import test from "node:test"

import catalogJson from "../convex/generated/catalog.json"
import type { PartnerCatalog } from "../convex/catalogTypes"
import {
  decodeAnswers,
  encodeAnswers,
  evaluate,
  fitQuestions,
  fitRequestText,
  nextSteps,
  parseOnePager,
  type Answer,
  type Answers,
} from "../lib/fit-check"
import { describeRequestSubject } from "../lib/request-links"

const catalog = catalogJson as PartnerCatalog
const faqBody = (slug: string) => catalog.faq.find((item) => item.slug === slug)?.body ?? ""

test("every cited sentence is in the approved FAQ answer it names", () => {
  for (const question of fitQuestions) {
    assert.ok(faqBody(question.faq).includes(question.cite), `${question.id} → ${question.faq}`)
  }
  const allAnswers: Answer[] = ["y", "n", "u"]
  const combos = (depth: number, current: Answers): Answers[] =>
    depth === fitQuestions.length
      ? [current]
      : allAnswers.flatMap((answer) =>
          combos(depth + 1, { ...current, [fitQuestions[depth]!.id]: answer })
        )
  for (const answers of combos(0, {})) {
    for (const reason of evaluate(answers).reasons) {
      assert.ok(faqBody(reason.faq).includes(reason.text), reason.text)
    }
  }
})

test("the verdict follows the stated rules with no hidden weights", () => {
  const allAnswers: Answer[] = ["y", "n", "u"]
  let counted = 0
  const walk = (depth: number, current: Answers) => {
    if (depth === fitQuestions.length) {
      counted += 1
      const verdict = evaluate(current)
      const required = fitQuestions.filter((question) => question.role === "required")
      if (current.singleModule === "y") assert.equal(verdict.kind, "poor")
      else if (required.every((question) => current[question.id] === "y") && current.unsupervised === "n" && current.singleModule === "n") {
        assert.equal(verdict.kind, "strong")
      } else assert.equal(verdict.kind, "potential")
      assert.ok(verdict.reasons.length > 0)
      assert.ok(nextSteps("partner-demo", verdict, encodeAnswers(current)).length > 0)
      return
    }
    for (const answer of allAnswers) walk(depth + 1, { ...current, [fitQuestions[depth]!.id]: answer })
  }
  walk(0, {})
  assert.equal(counted, 3 ** 8)
  assert.equal(evaluate({}).kind, "incomplete")
  assert.equal(evaluate({ systems: "y" }).kind, "incomplete")
  assert.equal(nextSteps("partner-demo", evaluate({}), "________").length, 0)
})

test("unsure never reaches Fit, and the questions to ask are the discovery ones", () => {
  const answers = decodeAnswers("yyn_yynn")
  assert.equal(evaluate(answers).kind, "incomplete")
  const unsure = decodeAnswers("yynuyynn")
  const verdict = evaluate(unsure)
  assert.equal(verdict.kind, "potential")
  assert.deepEqual(verdict.open.map((question) => question.id), ["access"])
  assert.ok(verdict.reasons.length > 0)
})

test("answers round-trip through the URL code and bad input decodes to nothing", () => {
  const answers: Answers = { systems: "y", exceptions: "n", singleModule: "u" }
  assert.equal(encodeAnswers(answers), "ynu_____")
  assert.deepEqual(decodeAnswers(encodeAnswers(answers)), answers)
  assert.deepEqual(decodeAnswers("yyyyyyy"), {})
  assert.deepEqual(decodeAnswers("yyyyyyyyy"), {})
  assert.deepEqual(decodeAnswers("abcdefgh"), {})
  assert.deepEqual(decodeAnswers(null), {})
})

test("a verdict becomes a request subject and a request body", () => {
  const strong = "yynyyyyn"
  assert.equal(evaluate(decodeAnswers(strong)).kind, "strong")
  assert.equal(describeRequestSubject("partner-demo", `fit:${strong}`)?.label, "Fit check · Fit")
  assert.equal(describeRequestSubject("partner-demo", "fit:________"), null)
  const notYet = "yynnyynn"
  const text = fitRequestText(notYet)
  assert.ok(text.startsWith("Fit check result: Not yet."))
  assert.ok(text.includes("Is there an API or an export path"))
  assert.deepEqual(
    nextSteps("partner-demo", evaluate(decodeAnswers("yyyyyyyn")), "yyyyyyyn").map((step) => step.label),
    ["Ask the Beam team about the edge case"]
  )
})

test("the one-pager parses into its five headed sections", () => {
  const body = catalog.materials.find((item) => item.slug === "where-beam-fits")?.body ?? ""
  assert.deepEqual(
    parseOnePager(body).map((section) => section.heading),
    ["What Beam is", "When Beam gets in", "What Beam is not", "And where it doesn't", "Not yet published"]
  )
  for (const workspace of catalog.workspaces) {
    if (!workspace.materialSlugs.includes("where-beam-fits")) continue
    for (const question of fitQuestions) {
      assert.ok(workspace.faqSlugs.includes(question.faq), `${workspace.slug} grants ${question.faq}`)
    }
  }
})
