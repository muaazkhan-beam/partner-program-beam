import assert from "node:assert/strict"
import test from "node:test"

import {
  isStaffEmail,
  normalizeStaffEmailDomains,
} from "../convex/lib/authPolicy"

test("normalizes a comma-separated staff domain list", () => {
  assert.deepEqual(
    normalizeStaffEmailDomains(" @beam.ai, beam.so, BEAM.AI, invalid "),
    ["beam.ai", "beam.so"],
  )
})

test("accepts staff from any configured Beam domain", () => {
  assert.equal(isStaffEmail("jonas@beam.ai", "beam.ai,beam.so"), true)
  assert.equal(isStaffEmail("jonas@beam.so", "beam.ai,beam.so"), true)
  assert.equal(isStaffEmail("jonas@example.com", "beam.ai,beam.so"), false)
})
