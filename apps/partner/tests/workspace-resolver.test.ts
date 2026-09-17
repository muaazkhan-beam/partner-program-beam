import assert from "node:assert/strict"
import test from "node:test"

import {
  resolveWorkspaceSlug,
  isPartnerLoginEntryPath,
  rewritePartnerEntryPath,
  rewriteSubdomainPath,
  slugFromPartnerEntryPath,
  slugFromHost,
  slugFromPath,
  workspacePath,
} from "../lib/workspace-resolver.ts"

test("canonical path and approved partner hosts resolve to the same slug", () => {
  assert.deepEqual(
    resolveWorkspaceSlug({
      host: "partner.beam.ai",
      pathname: "/w/pwc-me/home",
    }),
    { ok: true, slug: "pwc-me", source: "path" },
  )
  assert.deepEqual(
    resolveWorkspaceSlug({
      host: "pwc-me.partner.beam.ai",
      pathname: "/home",
    }),
    { ok: true, slug: "pwc-me", source: "host" },
  )
  assert.deepEqual(
    resolveWorkspaceSlug({
      host: "roboyo.partner.beam.ai",
      pathname: "/materials",
    }),
    { ok: true, slug: "roboyo", source: "host" },
  )
})

test("Vercel preview hosts are apex, not unknown", () => {
  assert.deepEqual(
    resolveWorkspaceSlug({
      host: "beam-partner-git-feat-beam-ai-team.vercel.app",
      pathname: "/w/pwc-me/home",
    }),
    { ok: true, slug: "pwc-me", source: "path" },
  )
  assert.equal(
    slugFromHost("beam-partner-abc123-beam-ai-team.vercel.app"),
    null,
  )
})

test("unknown hosts and host/path mismatches fail closed", () => {
  assert.deepEqual(
    resolveWorkspaceSlug({
      host: "evil.example.com",
      pathname: "/w/pwc-me/home",
    }),
    { ok: false, reason: "unknown-host" },
  )
  assert.deepEqual(
    resolveWorkspaceSlug({
      host: "pwc-me.partner.beam.ai",
      pathname: "/w/roboyo/home",
    }),
    { ok: false, reason: "host-path-mismatch" },
  )
  assert.equal(slugFromHost("not-a-partner.beam.ai"), undefined)
  assert.equal(slugFromPath("/home"), null)
})

test("subdomain paths rewrite onto the canonical workspace route", () => {
  assert.equal(rewriteSubdomainPath("/home", "pwc-me"), "/w/pwc-me/home")
  assert.equal(rewriteSubdomainPath("/login", "pwc-me"), "/login")
  assert.equal(workspacePath("roboyo", "/faq"), "/w/roboyo/faq")
})

test("only reviewed named partner entries resolve outside canonical /w routes", () => {
  assert.deepEqual(
    resolveWorkspaceSlug({ host: "partner.beam.ai", pathname: "/pwc" }),
    { ok: true, slug: "pwc-me", source: "entry" },
  )
  assert.deepEqual(
    resolveWorkspaceSlug({
      host: "partner.beam.ai",
      pathname: "/roland-berger",
    }),
    { ok: true, slug: "roland-berger", source: "entry" },
  )
  assert.deepEqual(
    resolveWorkspaceSlug({ host: "partner.beam.ai", pathname: "/unreviewed" }),
    { ok: true, slug: null, source: "apex" },
  )
  assert.equal(slugFromPartnerEntryPath("/pwc/tools"), "pwc-me")
  assert.equal(isPartnerLoginEntryPath("/pwc"), true)
  assert.equal(isPartnerLoginEntryPath("/pwc/tools"), false)
  assert.equal(slugFromPartnerEntryPath("/pwcx"), null)
  assert.equal(rewritePartnerEntryPath("/pwc", "pwc-me"), "/w/pwc-me/home")
  assert.equal(
    rewritePartnerEntryPath("/roland-berger/materials", "roland-berger"),
    "/w/roland-berger/materials",
  )
})
