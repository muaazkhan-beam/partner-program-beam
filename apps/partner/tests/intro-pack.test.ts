import assert from "node:assert/strict"
import test from "node:test"

import { listWorkspaceItems } from "../lib/catalog/static"
import {
  introEmail,
  introPack,
  packReason,
  type IntroPackItem,
} from "../lib/intro-pack"

function deck(slug: string, extra: Partial<IntroPackItem> = {}): IntroPackItem {
  return {
    kind: "material",
    slug,
    title: slug,
    summary: "",
    format: "deck",
    shareUrl: `https://shares.beam.ai/s/${slug}`,
    claimState: "approved",
    audience: "client-forwardable",
    forwardable: true,
    allowedBrandModes: ["beam-standard", "co-branded"],
    ...extra,
  }
}

test("only approved, client-forwardable, published items in the brand mode make the pack, in input order", () => {
  const items = [
    deck("z-deck"),
    deck("pending-deck", { status: "pending" }),
    deck("no-link", { shareUrl: undefined }),
    deck("drive-link", { shareUrl: "https://drive.google.com/file/d/x" }),
    deck("internal-with-link", { audience: "partner-internal" }),
    deck("not-forwardable", { forwardable: false }),
    deck("fronted-only", { allowedBrandModes: ["partner-fronted"] }),
    deck("any-mode", { allowedBrandModes: undefined }),
    deck("staff-only", { audience: "technical", forwardable: false }),
    deck("a-deck"),
  ]
  const { pack, notYet } = introPack(items, "beam-standard")
  assert.deepEqual(
    pack.map((item) => item.slug),
    ["z-deck", "any-mode", "a-deck"]
  )
  assert.deepEqual(
    notYet.map(({ item, reason }) => [item.slug, reason]),
    [
      ["pending-deck", "pending"],
      ["no-link", "no share link"],
      ["drive-link", "no share link"],
      ["internal-with-link", "pending"],
      ["not-forwardable", "pending"],
      ["fronted-only", "brand mode"],
    ]
  )
  assert.ok(
    introPack(items, "partner-fronted")
      .pack.map((item) => item.slug)
      .includes("fronted-only")
  )
})

test("brand mode is the first reason, because waiting cannot fix it", () => {
  assert.equal(
    packReason(
      deck("x", { status: "pending", allowedBrandModes: ["partner-fronted"] }),
      "beam-standard"
    ),
    "brand mode"
  )
  assert.equal(packReason(deck("x", { status: "pending" }), "beam-standard"), "pending")
  assert.equal(packReason(deck("x"), "beam-standard"), null)
})

test("the demo workspace's pack is the two published decks and nothing pending", () => {
  const items = listWorkspaceItems("partner-demo", "material") as IntroPackItem[]
  const { pack, notYet } = introPack(items, "beam-standard")
  assert.deepEqual(
    pack.map((item) => item.slug),
    ["beam-partner-executive-overview", "beam-discovery-sales-deck"]
  )
  assert.ok(notYet.every(({ item }) => !pack.includes(item)))
})

test("the intro email is written to the client: titles and links only", () => {
  const items = listWorkspaceItems("partner-demo", "material") as IntroPackItem[]
  const { pack } = introPack(items, "beam-standard")
  const email = introEmail({ workspaceDisplayName: "Partner Demo", items: pack })
  assert.ok(email.startsWith("Subject: Beam: introduction, as discussed"))
  for (const item of pack) {
    assert.ok(email.includes(`- ${item.title}: ${item.shareUrl}`))
    assert.ok(!email.includes(item.summary))
  }
  assert.ok(email.trimEnd().endsWith("Partner Demo"))
  // The fixed copy carries no numbers; only the share links may.
  assert.doesNotMatch(email.replace(/https?:\/\/\S+/g, ""), /\d/)
  assert.doesNotMatch(email, /reviewed|Beam Share|materials|forwardable|pending/i)
})
