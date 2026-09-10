import assert from "node:assert/strict"
import test from "node:test"

import {
  canonicalSiteUrl,
  classifyPartnerHost,
  partnerAuthAllowedHosts,
} from "../lib/partner-hosts.ts"

test("auth allowlist covers canonical, partner, local, and preview hosts", () => {
  const hosts = partnerAuthAllowedHosts("extra.example.com")
  assert.deepEqual(hosts, [
    "partners.beam.ai",
    "*.partners.beam.ai",
    "localhost:*",
    "127.0.0.1:*",
    "*.vercel.app",
    "extra.example.com",
  ])
  assert.equal(canonicalSiteUrl(undefined), "https://partners.beam.ai")
  assert.equal(canonicalSiteUrl(" https://preview.example "), "https://preview.example")
})

test("partner subdomains are classified separately from apex and unknown hosts", () => {
  assert.deepEqual(classifyPartnerHost("pwc-me.partners.beam.ai"), {
    ok: true,
    kind: "partner",
    slug: "pwc-me",
  })
  assert.deepEqual(classifyPartnerHost("roboyo.partners.beam.ai:443"), {
    ok: true,
    kind: "partner",
    slug: "roboyo",
  })
  assert.deepEqual(classifyPartnerHost("partners.beam.ai"), {
    ok: true,
    kind: "apex",
  })
  assert.deepEqual(
    classifyPartnerHost("beam-partner-git-feat-beam-ai-team.vercel.app"),
    { ok: true, kind: "apex" }
  )
  assert.deepEqual(classifyPartnerHost("evil.example.com"), { ok: false })
})
