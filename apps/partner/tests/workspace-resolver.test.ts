import assert from "node:assert/strict"
import test from "node:test"

import {
  resolveWorkspaceSlug,
  rewriteSubdomainPath,
  slugFromHost,
  slugFromPath,
  workspacePath,
} from "../lib/workspace-resolver.ts"

test("canonical path and approved partner hosts resolve to the same slug", () => {
  assert.deepEqual(
    resolveWorkspaceSlug({
      host: "partners.beam.ai",
      pathname: "/w/pwc-me/home",
    }),
    { ok: true, slug: "pwc-me", source: "path" }
  )
  assert.deepEqual(
    resolveWorkspaceSlug({
      host: "pwc-me.partners.beam.ai",
      pathname: "/home",
    }),
    { ok: true, slug: "pwc-me", source: "host" }
  )
  assert.deepEqual(
    resolveWorkspaceSlug({
      host: "roboyo.partners.beam.ai",
      pathname: "/materials",
    }),
    { ok: true, slug: "roboyo", source: "host" }
  )
})

test("Vercel preview hosts are apex, not unknown", () => {
  assert.deepEqual(
    resolveWorkspaceSlug({
      host: "beam-partner-git-feat-beam-ai-team.vercel.app",
      pathname: "/w/pwc-me/home",
    }),
    { ok: true, slug: "pwc-me", source: "path" }
  )
  assert.equal(
    slugFromHost("beam-partner-abc123-beam-ai-team.vercel.app"),
    null
  )
})

test("unknown hosts and host/path mismatches fail closed", () => {
  assert.deepEqual(
    resolveWorkspaceSlug({
      host: "evil.example.com",
      pathname: "/w/pwc-me/home",
    }),
    { ok: false, reason: "unknown-host" }
  )
  assert.deepEqual(
    resolveWorkspaceSlug({
      host: "pwc-me.partners.beam.ai",
      pathname: "/w/roboyo/home",
    }),
    { ok: false, reason: "host-path-mismatch" }
  )
  assert.equal(slugFromHost("not-a-partner.beam.ai"), undefined)
  assert.equal(slugFromPath("/home"), null)
})

test("subdomain paths rewrite onto the canonical workspace route", () => {
  assert.equal(rewriteSubdomainPath("/home", "pwc-me"), "/w/pwc-me/home")
  assert.equal(rewriteSubdomainPath("/login", "pwc-me"), "/login")
  assert.equal(workspacePath("roboyo", "/faq"), "/w/roboyo/faq")
})
