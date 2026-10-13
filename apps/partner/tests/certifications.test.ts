import assert from "node:assert/strict"
import test from "node:test"

import {
  certifications,
  firstOutcomeClause,
  prerequisiteLine,
} from "../lib/certifications"

test("the certification path runs from foundations to solution architect", () => {
  assert.deepEqual(
    certifications.map((certification) => certification.slug),
    ["beam-foundations", "discovery-lead", "builder", "solution-architect"]
  )
})

test("exactly one certification is open to a new partner, and it is the first", () => {
  const open = certifications.filter((certification) => certification.active)
  assert.equal(open.length, 1)
  assert.equal(open[0]?.slug, certifications[0]?.slug)
})

test("every later certification is gated by an earlier one by name", () => {
  certifications.forEach((certification, index) => {
    if (certification.active) return
    const earlierNames = certifications
      .slice(0, index)
      .map((earlier) => earlier.name)
    assert.ok(
      earlierNames.some((name) => certification.prerequisite.startsWith(name)),
      `${certification.name} names "${certification.prerequisite}", which is not an earlier certification`
    )
  })
})

test("prerequisiteLine derives the status words from the data", () => {
  const [foundations, discovery, builder, architect] = certifications
  assert.equal(prerequisiteLine(foundations!), null)
  assert.equal(prerequisiteLine(discovery!), "After Beam Foundations")
  assert.equal(
    prerequisiteLine(builder!),
    "After Beam Foundations and Discovery Lead"
  )
  assert.equal(
    prerequisiteLine(architect!),
    "After Builder and two reviewed agent deliveries"
  )
})

test("firstOutcomeClause completes the sentence without touching acronyms", () => {
  assert.equal(
    firstOutcomeClause(certifications[0]!),
    "position Beam alongside systems of record and existing automation."
  )
  assert.equal(
    firstOutcomeClause({ ...certifications[0]!, outcomes: ["RACI stays."] }),
    "RACI stays."
  )
  assert.equal(
    firstOutcomeClause({ ...certifications[0]!, outcomes: [] }),
    null
  )
})
