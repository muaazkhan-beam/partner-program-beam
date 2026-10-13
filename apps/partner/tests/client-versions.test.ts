import assert from "node:assert/strict"
import test from "node:test"

import { listWorkspaceItems } from "../lib/catalog/static"
import { foldClientVersions, rowsInOrder } from "../lib/client-versions"
import { isDemoContent } from "../lib/pack"

test("the demo workspace lists each answer once, with its client versions under it", () => {
  const items = listWorkspaceItems("partner-demo", "faq")
  const rows = foldClientVersions(items)
  const real = items.filter((item) => !isDemoContent(item))
  assert.equal(rows.length, real.length)
  assert.ok(rows.every((row) => !isDemoContent(row.item)), "no client version is a row of its own")
  const attached = rows.flatMap((row) => row.clientVersions)
  assert.equal(attached.length, items.length - real.length, "every client version is attached")
  assert.ok(attached.every(isDemoContent))
  const sap = rows.find((row) => row.item.slug === "why-not-sap")
  assert.equal(sap?.clientVersions.length, 2, "one answer can carry more than one client version")
})

test("use cases fold the same way", () => {
  const rows = foldClientVersions(listWorkspaceItems("partner-demo", "use-case"))
  assert.deepEqual(
    rows.map((row) => row.item.slug),
    ["invoice-exception-handling", "supplier-communication", "cv-screening"]
  )
  assert.deepEqual(
    rows.map((row) => row.clientVersions.map((version) => version.slug)),
    [["demo-invoice-exceptions"], ["demo-supplier-communication"], []]
  )
})

test("a workspace without client versions is listed as it is", () => {
  const items = listWorkspaceItems("pwc-me", "faq")
  const rows = foldClientVersions(items)
  assert.deepEqual(rows.map((row) => row.item.slug), items.map((item) => item.slug))
  assert.ok(rows.every((row) => row.clientVersions.length === 0))
})

test("a client version whose source is missing stays a row of its own", () => {
  const rows = foldClientVersions([
    { slug: "a" },
    { slug: "demo-b", sourceSlug: "b" },
    { slug: "demo-a", sourceSlug: "a" },
  ])
  assert.deepEqual(rows.map((row) => row.item.slug), ["a", "demo-b"])
  assert.deepEqual(rows[0]?.clientVersions.map((version) => version.slug), ["demo-a"])
})

test("a ranked hit on a client version surfaces its row once, in rank order", () => {
  const rows = foldClientVersions([
    { slug: "a" },
    { slug: "b" },
    { slug: "demo-a", sourceSlug: "a" },
    { slug: "demo-a-two", sourceSlug: "a" },
  ])
  assert.deepEqual(
    rowsInOrder(rows, ["b", "demo-a", "a", "demo-a-two", "missing"]).map((row) => row.item.slug),
    ["b", "a"]
  )
})
