import assert from "node:assert/strict"
import test from "node:test"

import catalogJson from "../convex/generated/catalog.json"
import type { PartnerCatalog } from "../convex/catalogTypes"
import { listWorkspaceCompliance } from "../lib/catalog/static"
import {
  complianceDomains,
  filterDocuments,
  printedLine,
  reviewerQuestions,
} from "../lib/compliance"

const catalog = catalogJson as PartnerCatalog

test("the compliance index records printed metadata only", () => {
  assert.equal(catalog.compliance.length, 59)
  for (const document of catalog.compliance) {
    assert.ok(document.title)
    assert.ok(complianceDomains.some((domain) => domain.id === document.domain))
    assert.ok(document.pages > 0)
    assert.equal(
      document.availability === "confirm-version",
      !document.version || !document.printedDate
    )
    assert.equal(document.ndaRequired, document.availability === "under-nda")
    assert.doesNotMatch(document.summary, /certif|\bISO\b|\bSOC\b|guarantee/i)
  }
})

test("the demo workspace is granted the whole library and filters resolve", () => {
  const library = listWorkspaceCompliance("partner-demo")
  assert.equal(library.length, 59)
  assert.ok(filterDocuments(library, { query: "gdpr", domain: "all" }).length >= 1)
  assert.equal(
    filterDocuments(library, { query: "gdpr", domain: "hipaa-and-phi" }).length,
    0
  )
  assert.equal(
    filterDocuments(library, { query: "", domain: "hipaa-and-phi" }).length,
    6
  )
  const access = library.find((document) => document.slug === "access-control-policy")
  assert.equal(printedLine(access!), "Version 2.0, 01-Dec-2024")
})

test("every reviewer question points at documents that exist", () => {
  const slugs = new Set(catalog.compliance.map((document) => document.slug))
  for (const question of reviewerQuestions) {
    assert.ok(question.documentSlugs.length > 0, question.id)
    for (const slug of question.documentSlugs) {
      assert.ok(slugs.has(slug), `${question.id} → ${slug}`)
    }
  }
})
