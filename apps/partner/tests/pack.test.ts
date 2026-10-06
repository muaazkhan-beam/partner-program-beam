import assert from "node:assert/strict"
import test from "node:test"

import type { CatalogComplianceDocument } from "../convex/catalogTypes"
import { getWorkspaceItem, listWorkspaceCompliance } from "../lib/catalog/static"
import {
  HOLD_LABEL,
  buildPack,
  coverNote,
  coverPageHtml,
  hasClientContent,
  holdReason,
  packItemsParam,
  packRequestText,
  packTitle,
  parsePackItems,
  type PackContent,
} from "../lib/pack"
import {
  addClients,
  addDocuments,
  addItems,
  clearDocuments,
  emptyPack,
  hasItem,
  mergePacks,
  packCount,
  parsePackState,
  removeClient,
  toggleDocument,
  toggleItem,
} from "../lib/pack-store"
import { describeRequestSubject, requestHref } from "../lib/request-links"

const library = listWorkspaceCompliance("partner-demo")

function docs(...slugs: string[]) {
  return slugs.map((slug) => {
    const document = library.find((entry) => entry.slug === slug)
    assert.ok(document, `fixture slug ${slug} exists in the compliance index`)
    return document
  })
}

function item(kind: "material" | "faq" | "use-case" | "tool", slug: string) {
  const found = getWorkspaceItem("partner-demo", kind, slug)
  assert.ok(found, `fixture ${kind}:${slug} is granted to partner-demo`)
  return found as PackContent
}

function textOf(html: string) {
  return html
    .replace(/<style>[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
}

const ndaCopy = (document: CatalogComplianceDocument): CatalogComplianceDocument => ({
  ...document,
  availability: "under-nda",
  ndaRequired: true,
})

/** An answer Beam wrote for clients, as opposed to one coaching the partner. */
const clientAnswer: PackContent = {
  kind: "faq",
  slug: "fixture-client-answer",
  title: "How does Beam keep a person in control?",
  summary: "Every agent has a named approval step.",
  body: "A named person approves each consequential step before it is written back.",
  claimState: "approved",
  audience: "client-forwardable",
  forwardable: true,
  allowedBrandModes: ["beam-standard", "co-branded"],
}

const approvedUseCase: PackContent = {
  kind: "use-case",
  slug: "fixture-use-case",
  title: "Fixture exception handling",
  summary: "Clears exceptions before the close.",
  body: "",
  status: undefined,
  claimState: "approved",
  audience: "client-forwardable",
  forwardable: true,
  allowedBrandModes: ["beam-standard", "co-branded"],
  trigger: "An invoice fails the match",
  before: "A clerk chases it by email",
  after: "The agent proposes the fix",
  humanInLoop: "A controller approves the posting",
  systems: ["SAP", "Outlook"],
  timeToProduction: "4 weeks",
}

test("only what was picked goes out, and only what may reach a client", () => {
  const picked = [
    item("material", "beam-partner-executive-overview"),
    item("material", "where-beam-fits"),
    item("faq", "why-not-sap"),
    item("faq", "partner-vs-beam"),
    item("tool", "call-prep"),
    item("use-case", "invoice-exception-handling"),
  ]
  const [access, privacy] = docs("access-control-policy", "data-privacy-policy")
  const pack = buildPack({
    workspaceDisplayName: "Partner Demo",
    brandMode: "beam-standard",
    clientName: "  Nordbank  ",
    items: picked,
    documents: [access, ndaCopy(privacy)],
  })
  assert.equal(pack.account.company, "Nordbank")
  assert.deepEqual(pack.decks.map((entry) => entry.slug), ["beam-partner-executive-overview"])
  // why-not-sap is approved and forwardable, but written to coach the
  // partner; it never reaches a client.
  assert.deepEqual(pack.answers, [])
  assert.deepEqual(pack.useCases, [])
  assert.deepEqual(
    pack.held.map(({ item: held, reason }) => `${held.slug}:${reason}`),
    [
      "where-beam-fits:pending",
      "why-not-sap:internal",
      "partner-vs-beam:internal",
      "call-prep:internal",
      "invoice-exception-handling:internal",
    ]
  )
  assert.deepEqual(pack.documents.map((entry) => entry.slug), ["access-control-policy"])
  assert.deepEqual(pack.ndaDocuments.map((entry) => entry.slug), ["data-privacy-policy"])
})

test("nothing is added on the partner's behalf", () => {
  const pack = buildPack({
    workspaceDisplayName: "Partner Demo",
    brandMode: "beam-standard",
    clientName: "Nordbank",
    items: [],
    documents: [],
  })
  assert.deepEqual(pack.decks, [])
  assert.equal(hasClientContent(pack), false)
})

test("the hold rule checks restriction, review, forwarding, brand and link, in that order", () => {
  const base = { ...approvedUseCase }
  assert.equal(holdReason(base, "beam-standard"), null)
  assert.equal(holdReason({ ...base, claimState: "restricted", status: "pending" }, "beam-standard"), "restricted")
  assert.equal(holdReason({ ...base, claimState: "staff-draft" }, "beam-standard"), "pending")
  assert.equal(holdReason({ ...base, forwardable: false }, "beam-standard"), "internal")
  assert.equal(holdReason({ ...base, audience: "partner-internal" }, "beam-standard"), "internal")
  assert.equal(holdReason({ ...base, audience: "technical" }, "beam-standard"), "internal")
  // On a use case, pending means no cited outcome, not an unpublished record.
  assert.equal(holdReason({ ...base, status: "pending" }, "beam-standard"), null)
  assert.equal(holdReason({ ...base, kind: "faq", status: "pending" }, "beam-standard"), "pending")
  assert.equal(holdReason({ ...base, kind: "tool" }, "beam-standard"), "internal")
  assert.equal(holdReason(base, "partner-fronted"), "brand mode")
  assert.equal(
    holdReason({ ...base, kind: "material", shareUrl: "https://example.com/deck" }, "beam-standard"),
    "no published link"
  )
  for (const reason of Object.keys(HOLD_LABEL)) assert.ok(HOLD_LABEL[reason as keyof typeof HOLD_LABEL])
})

test("the PDF is escaped, branded, and prints only approved text and printed numbers", () => {
  const documents = docs("access-control-policy", "gdpr-manual", "backup-policy-procedure")
  const answer = clientAnswer
  const held = item("faq", "why-not-sap")
  const pack = buildPack({
    workspaceDisplayName: "Partner Demo",
    brandMode: "beam-standard",
    clientName: "<Nordbank & Co>",
    items: [item("material", "beam-partner-executive-overview"), approvedUseCase, answer, held],
    documents,
  })
  const html = coverPageHtml(pack, {
    generatedOn: "6 October 2026",
    logoUrl: "https://partner.example/beam-logo.png",
  })
  assert.doesNotMatch(html, /<script/i)
  assert.ok(html.includes("&lt;Nordbank &amp; Co&gt;"))
  assert.ok(!html.includes("<Nordbank"))
  assert.ok(html.includes('src="https://partner.example/beam-logo.png"'))
  assert.ok(html.includes(`<title>${"Beam for &lt;Nordbank &amp; Co&gt;"}</title>`))
  assert.ok(html.includes("Prepared by Partner Demo"))
  assert.ok(!html.includes("with Beam"), "beam-standard keeps the partner off the brand line")
  assert.ok(html.includes(answer.title))
  assert.ok(!html.includes(held.title), "prep items never reach the client")
  assert.doesNotMatch(textOf(html), /Do not pick a fight/, "partner coaching never reaches the client")
  assert.ok(html.includes(approvedUseCase.humanInLoop ?? "missing"))
  assert.ok(!html.includes("4 weeks"), "a time to production without a cited deployment is never printed")
  assert.doesNotMatch(textOf(html), /partner portal|preview bypass|beam share/i)
  for (const document of pack.documents) {
    assert.ok(html.includes(document.title))
    assert.ok(html.includes(document.version))
    assert.ok(html.includes(document.printedDate))
  }
  // Documents printed "Internal" are listed by title only, behind an NDA.
  assert.ok(pack.ndaDocuments.some((document) => document.slug === "gdpr-manual"))
  for (const document of pack.ndaDocuments) assert.ok(html.includes(document.title))
  assert.ok(html.includes("Shared once an NDA is in place"))
  // The deck-QA rule: every number on the page comes from approved catalog
  // text, a printed document field, a link, or the date it was made.
  const sources = [
    "6 October 2026",
    ...documents.flatMap((document) => [document.version, document.printedDate, String(document.pages)]),
    ...[...pack.decks, ...pack.useCases, ...pack.answers].flatMap((entry) => [
      entry.title,
      entry.summary,
      entry.body,
      entry.shareUrl ?? "",
      entry.trigger ?? "",
      entry.before ?? "",
      entry.after ?? "",
      entry.humanInLoop ?? "",
      ...(entry.systems ?? []),
    ]),
  ].join("\n")
  const numbers = textOf(html).split(/\s+/).filter((token) => /\d/.test(token))
  for (const token of numbers) {
    const bare = token.replace(/^[^\w]+|[^\w]+$/g, "")
    assert.ok(sources.includes(bare), `"${token}" has a source`)
  }
})

test("co-branded workspaces put the partner beside Beam", () => {
  const pack = buildPack({
    workspaceDisplayName: "Roboyo",
    brandMode: "co-branded",
    clientName: "Nordbank",
    items: [],
    documents: docs("access-control-policy"),
  })
  const html = coverPageHtml(pack, { generatedOn: "6 October 2026" })
  assert.ok(html.includes("Prepared by Roboyo with Beam"))
  assert.ok(html.includes('<span class="partner">Roboyo</span>'))
  assert.equal(packTitle(pack), "Beam for Nordbank")
})

test("the email says what was sent and promises nothing that has not happened", () => {
  const pack = buildPack({
    workspaceDisplayName: "Partner Demo",
    brandMode: "beam-standard",
    clientName: "Nordbank",
    items: [clientAnswer, item("faq", "why-not-sap")],
    documents: docs("access-control-policy"),
  })
  const note = coverNote(pack)
  assert.ok(note.startsWith("Subject: Beam for Nordbank, as discussed"))
  assert.ok(note.includes("Access Control Policy, version 2.0, 01-Dec-2024"))
  assert.ok(note.includes(clientAnswer.title))
  assert.ok(!note.includes(item("faq", "why-not-sap").title))
  assert.doesNotMatch(note, /I have requested/)
  assert.doesNotMatch(note, /certif|\bISO\b|\bSOC\b|compliant|guarantee/i)
  assert.ok(note.trimEnd().endsWith("Partner Demo"))
})

test("the request to Beam names every client and lists documents as printed", () => {
  const [access, privacy] = docs("access-control-policy", "data-privacy-policy")
  const request = packRequestText({
    clients: ["Nordbank", "Acme"],
    documents: [access, ndaCopy(privacy)],
  })
  assert.ok(request.startsWith("Please issue the reviewed copies for Nordbank, Acme"))
  assert.ok(request.includes("- Access Control Policy, version 2.0, 01-Dec-2024"))
  assert.ok(request.includes("- Data Privacy Policy (under NDA; NDA to be arranged)"))
  assert.ok(packRequestText({ clients: [], documents: [access] }).includes("the named client"))
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
})

test("the pack holds any kind of content, and toggles", () => {
  let state = emptyPack
  state = toggleItem(state, "use-case", "cv-screening")
  state = toggleItem(state, "faq", "why-not-sap")
  state = toggleDocument(state, "information-security-policy")
  assert.ok(hasItem(state, "use-case", "cv-screening"))
  assert.deepEqual(state.documentSlugs, ["information-security-policy"])
  assert.equal(packCount(state), 3)
  state = toggleItem(state, "faq", "why-not-sap")
  assert.ok(!hasItem(state, "faq", "why-not-sap"))
  state = addItems(state, [{ kind: "faq", slug: "vs-epm" }, { kind: "use-case", slug: "cv-screening" }])
  assert.equal(state.items.length, 2, "adding is idempotent")
  state = addDocuments(state, ["information-security-policy", "gdpr-manual"])
  assert.deepEqual(state.documentSlugs, ["information-security-policy", "gdpr-manual"])
})

test("removing the documents keeps everything else", () => {
  let state = addClients(emptyPack, ["Acme"])
  state = toggleItem(state, "use-case", "invoice-exception-handling")
  state = toggleDocument(state, "access-control-policy")
  const cleared = clearDocuments(state)
  assert.deepEqual(cleared.documentSlugs, [])
  assert.deepEqual(cleared.items, state.items)
  assert.deepEqual(cleared.clients, ["Acme"])
})

test("several clients share one pack; names are trimmed and kept once", () => {
  let state = addClients(emptyPack, ["  Nordbank ", "Acme", "nordbank", "", "Beta   Corp"])
  assert.deepEqual(state.clients, ["Nordbank", "Acme", "Beta Corp"])
  state = removeClient(state, "Acme")
  assert.deepEqual(state.clients, ["Nordbank", "Beta Corp"])
  assert.equal(addClients(emptyPack, ["x".repeat(200)]).clients[0].length, 80)
})

test("packs saved by earlier versions still load", () => {
  // The first pack held one client name and no items; a partner mid-deal
  // must not lose it.
  const restored = parsePackState(
    JSON.stringify({ clientName: "Acme", documentSlugs: ["a", "b", "a"] })
  )
  assert.deepEqual(restored.clients, ["Acme"])
  assert.deepEqual(restored.documentSlugs, ["a", "b"])
  assert.deepEqual(restored.items, [])
  assert.deepEqual(parsePackState("not json").clients, [])
  assert.deepEqual(parsePackState(JSON.stringify({ items: [{ kind: 1 }, { kind: "faq", slug: "x" }] })).items, [
    { kind: "faq", slug: "x" },
  ])
})

test("undo after clearing keeps what was added since", () => {
  const before = addClients(toggleItem(emptyPack, "faq", "vs-epm"), ["Acme"])
  const since = toggleItem(emptyPack, "use-case", "cv-screening")
  const restored = mergePacks(before, since)
  assert.deepEqual(restored.clients, ["Acme"])
  assert.deepEqual(restored.items.map((entry) => entry.slug), ["vs-epm", "cv-screening"])
})

test("an item saved twice is kept once", () => {
  const state = parsePackState(
    JSON.stringify({ items: [{ kind: "faq", slug: "x" }, { kind: "faq", slug: "x" }] })
  )
  assert.equal(state.items.length, 1)
  assert.equal(packCount(state), 1)
})
