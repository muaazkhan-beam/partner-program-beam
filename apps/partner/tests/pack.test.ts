import assert from "node:assert/strict"
import test from "node:test"

import type { CatalogComplianceDocument } from "../convex/catalogTypes"
import { listWorkspaceCompliance, listWorkspaceItems } from "../lib/catalog/static"
import type { IntroPackItem } from "../lib/intro-pack"
import {
  buildPack,
  coverNote,
  coverPageHtml,
  packDownloadName,
  packItemsParam,
  packRequestText,
  parsePackItems,
} from "../lib/pack"
import {
  emptyPack,
  hasItem,
  packCount,
  parsePackState,
  toggleDocument,
  toggleItem,
} from "../lib/pack-store"
import { describeRequestSubject, requestHref } from "../lib/request-links"

const materials = listWorkspaceItems("partner-demo", "material") as IntroPackItem[]
const library = listWorkspaceCompliance("partner-demo")

function pick(...slugs: string[]) {
  return slugs.map((slug) => {
    const document = library.find((entry) => entry.slug === slug)
    assert.ok(document, `fixture slug ${slug} exists in the compliance index`)
    return document
  })
}

function textOf(html: string) {
  return html
    .replace(/<style>[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
}

test("a pack holds the published decks plus the chosen documents, NDA ones apart", () => {
  const [access, privacy] = pick("access-control-policy", "data-privacy-policy")
  const nda: CatalogComplianceDocument = {
    ...privacy,
    availability: "under-nda",
    ndaRequired: true,
  }
  const pack = buildPack({
    workspaceDisplayName: "Partner Demo",
    brandMode: "beam-standard",
    clientName: "  Nordbank  ",
    materials,
    documents: [access, nda],
  })
  assert.equal(pack.account.company, "Nordbank")
  assert.deepEqual(
    pack.decks.map((deck) => deck.slug),
    ["beam-partner-executive-overview", "beam-discovery-sales-deck"]
  )
  assert.deepEqual(pack.documents.map((d) => d.slug), ["access-control-policy"])
  assert.deepEqual(pack.ndaDocuments.map((d) => d.slug), ["data-privacy-policy"])
  assert.deepEqual(pack.confirmVersion, [])
})

test("the cover page is printable, escaped, and carries only printed numbers", () => {
  const documents = pick("access-control-policy", "gdpr-manual", "backup-policy-procedure")
  const pack = buildPack({
    workspaceDisplayName: "Partner Demo",
    brandMode: "beam-standard",
    clientName: "<Nordbank & Co>",
    materials,
    documents,
  })
  const html = coverPageHtml(pack, { generatedOn: "18 September 2026" })
  assert.doesNotMatch(html, /<script/i)
  assert.ok(html.includes("&lt;Nordbank &amp; Co&gt;"))
  assert.ok(!html.includes("<Nordbank"))
  for (const document of documents) {
    assert.ok(html.includes(document.title))
    assert.ok(html.includes(document.version))
    assert.ok(html.includes(document.printedDate))
  }
  for (const deck of pack.decks) assert.ok(html.includes(deck.shareUrl ?? "missing"))
  // Strip every printed value, longest first so "02" cannot eat part of a
  // date; nothing numeric may remain (the deck-QA rule).
  const allowed = [
    "18 September 2026",
    ...documents.flatMap((document) => [
      document.version,
      document.printedDate,
      String(document.pages),
    ]),
    ...pack.decks.map((deck) => deck.shareUrl ?? ""),
  ]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
  let text = textOf(html)
  for (const value of allowed) text = text.split(value).join(" ")
  assert.doesNotMatch(text, /\d/)
})

test("the cover note and request text say what Beam will issue, without posture words", () => {
  const pack = buildPack({
    workspaceDisplayName: "Partner Demo",
    brandMode: "beam-standard",
    clientName: "Nordbank",
    materials,
    documents: pick("access-control-policy"),
  })
  const note = coverNote(pack)
  assert.ok(note.startsWith("Subject: Beam: materials for Nordbank"))
  assert.ok(note.includes("Access Control Policy, version 2.0, 01-Dec-2024"))
  assert.doesNotMatch(note, /certif|\bISO\b|\bSOC\b|compliant|guarantee/i)
  assert.ok(note.trimEnd().endsWith("Partner Demo"))
  const request = packRequestText(pack)
  assert.ok(request.startsWith("Please issue the reviewed copies for Nordbank"))
  assert.ok(request.includes("- Access Control Policy, version 2.0, 01-Dec-2024"))
})

test("pack items travel as slugs only and resolve back to the pack subject", () => {
  const href = requestHref("partner-demo", {
    about: "compliance:pack",
    support: "deployment-review",
    items: ["access-control-policy", "gdpr-manual"],
  })
  assert.equal(
    href,
    "/w/partner-demo/requests?about=compliance%3Apack&support=deployment-review&items=access-control-policy%2Cgdpr-manual"
  )
  assert.deepEqual(parsePackItems(packItemsParam(["a-b", "c"])), ["a-b", "c"])
  assert.deepEqual(parsePackItems("../x,ok-slug"), ["ok-slug"])
  assert.equal(describeRequestSubject("partner-demo", "compliance:pack")?.label, "Security and compliance pack")
  assert.equal(describeRequestSubject("partner-demo", "compliance:other"), null)
  assert.equal(packDownloadName("Nordbank & Co"), "beam-materials-for-nordbank-co.html")
  assert.equal(packDownloadName(""), "beam-materials-for-client.html")
})

test("toggling a document adds it once and removes it again", () => {
  const added = toggleDocument(emptyPack, "access-control-policy")
  assert.deepEqual(added.documentSlugs, ["access-control-policy"])
  assert.deepEqual(toggleDocument(added, "access-control-policy").documentSlugs, [])
})

test("the pack holds any kind of content, not only compliance documents", () => {
  // Jack's cart: a partner picks up a use case, an answer and a deck while
  // working one client, then assembles them. Compliance documents keep their
  // own list, which the compliance library already drives.
  let state = emptyPack
  state = toggleItem(state, "use-case", "cv-screening")
  state = toggleItem(state, "faq", "why-not-sap")
  state = toggleDocument(state, "information-security-policy")

  assert.ok(hasItem(state, "use-case", "cv-screening"))
  assert.ok(hasItem(state, "faq", "why-not-sap"))
  assert.deepEqual(state.documentSlugs, ["information-security-policy"])
  assert.equal(packCount(state), 3, "the badge counts both halves")

  // Adding the same thing twice removes it, as a toggle.
  state = toggleItem(state, "faq", "why-not-sap")
  assert.ok(!hasItem(state, "faq", "why-not-sap"))
  assert.equal(packCount(state), 2)
})

test("a pack saved before items existed still loads", () => {
  // Asad's pack shipped without `items`; a partner mid-deal must not lose it.
  const restored = parsePackState(
    JSON.stringify({ clientName: "Acme", documentSlugs: ["a", "b"] })
  )
  assert.equal(restored.clientName, "Acme")
  assert.deepEqual(restored.documentSlugs, ["a", "b"])
  assert.deepEqual(restored.items, [])
  assert.equal(packCount(restored), 2)
})
