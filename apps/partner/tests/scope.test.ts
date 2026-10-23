import assert from "node:assert/strict"
import test from "node:test"

import type { CatalogUseCase } from "../convex/catalogTypes"
import { listWorkspaceItems } from "../lib/catalog/static"
import {
  briefText,
  deltaDimensions,
  departmentsOf,
  newScopedProcess,
  noMatchText,
  readProcess,
  statusLabel,
} from "../lib/scope"
import { emptyScope, parseScopeState, removeProcess, upsertProcess } from "../lib/scope-store"
import { describeRequestSubject } from "../lib/request-links"

const useCases = listWorkspaceItems("partner-demo", "use-case") as unknown as CatalogUseCase[]
const invoice = useCases.find((entry) => entry.slug === "invoice-exception-handling")!

test("the standard shape comes from the catalog, never from the partner", () => {
  assert.ok(invoice, "the demo workspace grants the invoice use case")
  const detail = invoice
  assert.equal(deltaDimensions[0]!.standardOf(detail), detail.trigger)
  assert.equal(deltaDimensions[1]!.standardOf(detail), detail.systems.join(" · "))
  assert.equal(deltaDimensions[2]!.standardOf(detail), detail.before)
  assert.equal(deltaDimensions[3]!.standardOf(detail), detail.humanInLoop)
  assert.deepEqual(departmentsOf(useCases), ["Finance", "Procurement", "HR"])
})

test("an untouched process reads as matching the standard shape", () => {
  const process = newScopedProcess("invoice-exception-handling", { client: "Nordbank" })
  const reading = readProcess(process, invoice)
  assert.equal(reading.differenceCount, 0)
  assert.equal(reading.same.length, 4)
  assert.equal(reading.facts.length, 0)
  assert.equal(reading.missingFacts.length, 2)
  const text = briefText(process, invoice)
  assert.ok(text.startsWith("Invoice exception handling at Nordbank"))
  assert.ok(text.includes("Nothing recorded as different from the standard shape yet."))
  assert.ok(text.includes("Same as standard: what starts a case, systems"))
  assert.ok(text.includes("Still to ask:"))
})

test("a difference is reported against the standard it replaces", () => {
  const process = newScopedProcess("invoice-exception-handling", {
    client: "Nordbank",
    status: "discovery",
    differences: { systems: "Oracle and Outlook, no DATEV", trigger: "   " },
    facts: { volume: "about four hundred a week" },
  })
  const reading = readProcess(process, invoice)
  assert.deepEqual(reading.differs.map((delta) => delta.id), ["systems"])
  assert.equal(reading.differs[0]!.standard, "SAP · DATEV · Outlook")
  assert.equal(reading.same.length, 3, "whitespace does not count as a difference")
  const text = briefText(process, invoice)
  assert.ok(text.includes(`Status: ${statusLabel.discovery}`))
  assert.ok(text.includes("- Systems: Oracle and Outlook, no DATEV"))
  assert.ok(text.includes("(standard: SAP · DATEV · Outlook)"))
  assert.ok(text.includes("- Volume: about four hundred a week"))
  assert.ok(text.includes("Which number does the client report on this today?"))
})

test("the brief carries no number the partner did not hear and no commercial words", () => {
  const process = newScopedProcess("invoice-exception-handling", {
    client: "Nordbank",
    differences: { today: "Two people triage the mailbox each morning" },
  })
  const text = briefText(process, invoice)
  assert.doesNotMatch(text, /[%€$]/)
  assert.doesNotMatch(text, /\bROI\b|pricing|discount|guarantee|margin/i)
})

test("an unmatched process asks Beam whether it is covered", () => {
  const text = noMatchText("  Reconciling statements across two ledgers  ")
  assert.ok(text.includes("Reconciling statements across two ledgers"))
  assert.ok(text.includes("Is this something Beam runs today"))
  assert.ok(noMatchText("").includes("(describe the process)"))
  assert.equal(
    describeRequestSubject("partner-demo", "scope:no-match")?.label,
    "A process with no live use case"
  )
  assert.equal(describeRequestSubject("partner-demo", "scope:abc123")?.label, "Process brief")
  assert.equal(describeRequestSubject("partner-demo", "scope:"), null)
})

test("the store keeps one record per process and survives bad data", () => {
  const a = newScopedProcess("invoice-exception-handling", { id: "a" })
  const b = newScopedProcess("cv-screening", { id: "b" })
  let state = upsertProcess(emptyScope, a)
  state = upsertProcess(state, b)
  state = upsertProcess(state, { ...a, client: "Nordbank" })
  assert.deepEqual(
    state.processes.map((entry) => [entry.id, entry.client]),
    [["a", "Nordbank"], ["b", ""]]
  )
  assert.deepEqual(removeProcess(state, "a").processes.map((entry) => entry.id), ["b"])
  assert.deepEqual(parseScopeState("not json"), emptyScope)
  assert.deepEqual(
    parseScopeState('{"processes":[{"id":1},{"id":"ok","useCaseSlug":"cv-screening"}]}')
      .processes.map((entry) => entry.id),
    ["ok"]
  )
})
