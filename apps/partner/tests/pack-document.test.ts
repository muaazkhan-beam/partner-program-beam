import assert from "node:assert/strict"
import test from "node:test"

import { getWorkspaceItem, listWorkspaceCompliance } from "../lib/catalog/static"
import { buildPack, type PackContent } from "../lib/pack"
import { buildPackDocument, documentText } from "../lib/pack-document"
import { renderPackHtml } from "../lib/render/pack-html"
import { toDocDefinition } from "../lib/render/pack-pdf"

const ws = "partner-demo"
const library = listWorkspaceCompliance(ws)
const item = (kind: "material" | "faq" | "use-case", slug: string) => getWorkspaceItem(ws, kind, slug) as PackContent
const coaching = item("faq", "why-not-sap")
const overview = item("material", "beam-partner-executive-overview")
const demoAnswer = item("faq", "demo-human-approval")
const docs = library.filter((document) => ["cryptography-policy", "access-control-policy"].includes(document.slug))

function pack(items: PackContent[], hold = {}) {
  return buildPack({ workspaceDisplayName: "Partner Demo", brandMode: "beam-standard", clientName: "Orvane Freight", items, documents: docs, hold })
}

test("the document holds only what the send rule let through, and both renderers agree", () => {
  const built = pack([overview, coaching, demoAnswer], { demoWorkspace: true })
  const document = buildPackDocument({ pack: built, phase: "deploy", style: "beam-standard", generatedOn: "8 October 2026" })
  const text = documentText(document)
  assert.match(text, /Beam for Orvane Freight/)
  assert.match(text, /Where we are · Going live/)
  assert.match(text, /Is there human approval before an agent acts\?/)
  assert.doesNotMatch(text, /Do not pick a fight/)
  assert.doesNotMatch(text, /Why would a client buy Beam instead of SAP/)
  assert.equal(document.demo, true)
  assert.match(document.footer, /^Demo content · not reviewed by Beam/)

  const html = renderPackHtml(document)
  const pdf = toDocDefinition(document)
  for (const line of ["Beam for Orvane Freight", "Prepared by Partner Demo", "Cryptography Policy", "Demo content · not reviewed by Beam"]) {
    assert.ok(html.includes(line), `html: ${line}`)
    assert.ok(JSON.stringify(pdf).includes(line), `pdf: ${line}`)
  }
  assert.doesNotMatch(html, /with Beam/)
  assert.doesNotMatch(html, /<script/)
  const footer = (pdf.footer as (page: number, count: number) => { columns: Array<{ text: string }> })(2, 5)
  assert.equal(footer.columns[1]!.text, "Page 2 of 5")
  assert.match(footer.columns[0]!.text, /Demo content · not reviewed by Beam/)
})

test("the lockup follows brand mode and partner-fronted says powered by Beam on every page", () => {
  const co = buildPackDocument({ pack: { ...pack([overview]), partnerContext: { workspaceDisplayName: "Partner Demo", brandMode: "co-branded" } }, style: "co-branded", generatedOn: "8 October 2026" })
  assert.match(documentText(co), /Prepared by Partner Demo with Beam/)
  const fronted = buildPackDocument({ pack: pack([overview]), style: "partner-fronted", generatedOn: "8 October 2026" })
  const footer = (toDocDefinition(fronted).footer as (page: number, count: number) => { columns: Array<{ text: string }> })(1, 1)
  assert.match(footer.columns[0]!.text, /Powered by Beam/)
  assert.match(renderPackHtml(fronted), /Powered by Beam/)
})

test("a reply sheet prints the client's numbering and lists what is with Beam", () => {
  const document = buildPackDocument({
    pack: pack([demoAnswer], { demoWorkspace: true }),
    style: "beam-standard",
    generatedOn: "8 October 2026",
    replies: [
      { ref: "2", question: "Is there human approval?", answer: demoAnswer.body.trim(), demo: true },
      { ref: "4", question: "Where is data stored?", answer: "Not answered in this pack. We will follow up with you." },
    ],
  })
  const text = documentText(document)
  assert.match(text, /Your questions, answered/)
  assert.match(text, /Questions we are checking with Beam/)
  assert.match(text, /4\. Where is data stored\?/)
  // The quoted answer is not printed twice.
  assert.equal(text.split("Yes. Agents start by reading").length - 1, 1)
})
