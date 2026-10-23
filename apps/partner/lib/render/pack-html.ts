import { escapeHtml } from "../pack"
import type { PackBlock, PackDocument } from "../pack-document"
import { BEAM_STYLE, INK, MUTED, PAGE, RULE, TYPE, type StyleTokens } from "./page-tokens"

/**
 * The same document as an HTML sheet, for the on-screen preview and for the
 * browser's print dialog when a PDF cannot be made. Same page, same type,
 * same colours as the PDF; the fonts are the Roboto files pdfmake embeds.
 */
const DEMO_TAG = "Demo content · not reviewed by Beam"

const demoLine = (demo: boolean) => (demo ? `<p class="demo">${DEMO_TAG}</p>` : "")

function blockHtml(block: PackBlock, tokens: StyleTokens): string {
  switch (block.kind) {
    case "cover": {
      const mark = tokens.logoDataUrl
        ? `<img class="logo" src="${escapeHtml(tokens.logoDataUrl)}" alt="${escapeHtml(block.partnerName)}">`
        : `<span class="mark">${block.withBeam ? `${escapeHtml(block.partnerName)} × Beam` : "Beam"}</span>`
      return `<header class="cover">${mark}<hr class="band"><h1>${escapeHtml(block.title)}</h1><p class="sub">${escapeHtml(block.preparedBy)}</p>${
        block.phaseLine ? `<p class="phase">${escapeHtml(block.phaseLine)}</p>` : ""
      }</header>`
    }
    case "heading":
      return `<h2>${escapeHtml(block.text)}</h2>`
    case "paragraph":
      return `<p class="${block.muted ? "muted" : ""}">${escapeHtml(block.text)}</p>`
    case "link":
      return `<p class="link"><strong>${escapeHtml(block.title)}</strong><br><a href="${escapeHtml(block.url)}">${escapeHtml(block.url)}</a></p>`
    case "answer":
      return `<article><h3>${escapeHtml(block.title)}</h3><p>${escapeHtml(block.body).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>${demoLine(block.demo)}</article>`
    case "reply":
      return `<article class="reply"><span class="ref">${escapeHtml(block.ref)}</span><div><h3>${escapeHtml(block.question)}</h3><p>${escapeHtml(block.answer).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>${demoLine(block.demo)}</div></article>`
    case "use-case":
      return `<article><h3>${escapeHtml(block.title)}</h3><p class="muted">${escapeHtml(block.summary)}</p><dl>${block.rows
        .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
        .join("")}</dl>${demoLine(block.demo)}</article>`
    case "documents":
      return `<table><thead><tr><th>Document</th><th>Version</th><th>Date as printed</th><th>Pages</th></tr></thead><tbody>${block.rows
        .map((row) => `<tr><td>${escapeHtml(row.title)}</td><td>${escapeHtml(row.version)}</td><td>${escapeHtml(row.printedDate)}</td><td>${row.pages}</td></tr>`)
        .join("")}</tbody></table>`
    case "nda":
      return `<h3>Shared once an NDA is in place</h3><ul>${block.titles.map((title) => `<li>${escapeHtml(title)}</li>`).join("")}</ul>`
    case "list":
      return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
  }
}

export function renderPackHtml(
  document: PackDocument,
  { tokens = BEAM_STYLE, coverOnly = false, fontBase = "/pdf-fonts/" }: { tokens?: StyleTokens; coverOnly?: boolean; fontBase?: string } = {}
) {
  const blocks = coverOnly ? document.blocks.slice(0, 1) : document.blocks
  const poweredBy = document.style === "partner-fronted" ? " · Powered by Beam" : ""
  const contentWidth = PAGE.width - PAGE.margin.left - PAGE.margin.right
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(document.title)}</title>
<style>
@font-face { font-family: "Roboto"; src: url("${fontBase}Roboto-Regular.ttf"); font-weight: 400; }
@font-face { font-family: "Roboto"; src: url("${fontBase}Roboto-Medium.ttf"); font-weight: 500 700; }
@page { size: A4; margin: ${PAGE.margin.top}pt ${PAGE.margin.right}pt ${PAGE.margin.bottom}pt ${PAGE.margin.left}pt; }
:root { --accent: ${tokens.accent}; --accent-text: ${tokens.accentText}; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #fff; }
body { font-family: "Roboto", Arial, Helvetica, sans-serif; color: ${INK}; font-size: ${TYPE.body}pt; line-height: ${TYPE.lineHeight}; width: ${contentWidth}pt; margin: ${PAGE.margin.top}pt auto ${PAGE.margin.bottom}pt; }
.cover .mark { font-weight: 700; font-size: 12pt; color: var(--accent-text); }
.cover .logo { height: 36pt; width: auto; }
.band { border: 0; border-top: 2pt solid var(--accent); margin: 18pt 0 28pt; }
h1 { font-size: ${TYPE.title}pt; font-weight: 400; margin: 0 0 6pt; letter-spacing: -0.01em; }
.sub { color: ${MUTED}; margin: 0; }
.phase { color: var(--accent-text); margin: 14pt 0 0; }
h2 { font-size: ${TYPE.heading}pt; font-weight: 700; margin: 22pt 0 8pt; }
h3 { font-size: ${TYPE.body}pt; font-weight: 700; margin: 8pt 0 3pt; }
p { margin: 0 0 6pt; } .muted { color: ${MUTED}; }
.demo { color: ${MUTED}; font-style: italic; font-size: ${TYPE.small}pt; margin: 2pt 0 0; }
.link a { color: var(--accent-text); font-size: ${TYPE.small}pt; word-break: break-all; }
.reply { display: grid; grid-template-columns: 34pt 1fr; margin: 6pt 0; } .reply .ref { font-weight: 700; color: ${MUTED}; }
article { break-inside: avoid; }
dl { display: grid; grid-template-columns: 90pt 1fr; gap: 2pt 8pt; margin: 4pt 0; } dt { color: ${MUTED}; } dd { margin: 0; }
table { border-collapse: collapse; width: 100%; margin: 4pt 0 6pt; }
th, td { text-align: left; padding: 4pt 6pt 4pt 0; border-bottom: 0.5pt solid ${RULE}; vertical-align: top; } th { color: ${MUTED}; font-weight: 400; font-size: ${TYPE.small}pt; }
ul { padding-left: 14pt; margin: 2pt 0; }
footer { margin-top: 32pt; padding-top: 10pt; border-top: 0.5pt solid ${RULE}; color: ${MUTED}; font-size: ${TYPE.small}pt; }
</style></head><body data-company="${escapeHtml(document.clientName)}">
${blocks.map((block) => blockHtml(block, tokens)).join("\n")}
${coverOnly ? "" : `<footer>${escapeHtml(document.footer)}${poweredBy}</footer>`}
</body></html>
`
}
