import assert from "node:assert/strict"
import test from "node:test"

import { listWorkspaceItems } from "../lib/catalog/static"
import { groupByLifecycle, phaseOf } from "../lib/lifecycle"
import { journeyPhases } from "../lib/partner-journey"

test("the lifecycle starts with winning the client and ends with delivery", () => {
  assert.deepEqual(
    journeyPhases.map((phase) => phase.slug),
    ["win", "scope", "build", "deploy", "monitor", "deliver"]
  )
  assert.deepEqual(
    journeyPhases.map((phase) => phase.number),
    ["01", "02", "03", "04", "05", "06"]
  )
})

test("selling material lives in Win, and Deploy opens the compliance library", () => {
  assert.equal(phaseOf({ kind: "material", slug: "where-beam-fits" }), "win")
  assert.equal(phaseOf({ kind: "material", slug: "beam-partner-executive-overview" }), "win")
  assert.equal(
    journeyPhases.find((phase) => phase.slug === "deploy")?.surface?.href,
    "/compliance"
  )
})

test("every material and tool in the demo has a phase, and groups follow the lifecycle", () => {
  for (const kind of ["material", "tool"] as const) {
    const items = listWorkspaceItems("partner-demo", kind)
    const groups = groupByLifecycle(items, { slug: "anytime", name: "Any time" })
    const order = groups.map((group) => group.slug).filter((slug) => slug !== "anytime")
    const lifecycle = journeyPhases.map((phase) => phase.slug).filter((slug) => order.includes(slug))
    assert.deepEqual(order, lifecycle, `${kind} groups are in lifecycle order`)
    const outside = groups.find((group) => group.slug === "anytime")?.items.map((item) => item.slug) ?? []
    assert.deepEqual(outside, kind === "tool" ? ["partner-cli"] : [], `${kind} outside the lifecycle`)
  }
})

test("a resource listed in two phases belongs to the first", () => {
  assert.equal(phaseOf({ kind: "faq", slug: "measuring-success" }), "scope")
  assert.equal(phaseOf({ kind: "faq", slug: "human-approval" }), "build")
})
