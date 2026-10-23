import type { PackBlock, PackDocument } from "../pack-document"
import { BEAM_STYLE, INK, MUTED, PAGE, RULE, TYPE, type StyleTokens } from "./page-tokens"

/**
 * The pdfmake definition for a pack: plain data built from the document's
 * blocks, so tests can read it without a browser. Footers carry the page
 * count and the approval line on every page.
 */
type Content = Record<string, unknown>

const DEMO_TAG = "Demo content · not reviewed by Beam"

function demoLine(demo: boolean): Content[] {
  return demo ? [{ text: DEMO_TAG, fontSize: TYPE.small, color: MUTED, italics: true, margin: [0, 2, 0, 0] }] : []
}

function blockContent(block: PackBlock, tokens: StyleTokens): Content[] {
  switch (block.kind) {
    case "cover":
      return [
        tokens.logoDataUrl
          ? { image: tokens.logoDataUrl, fit: [120, 36], margin: [0, 0, 0, 18] }
          : { text: block.withBeam ? `${block.partnerName} × Beam` : "Beam", fontSize: 12, bold: true, color: tokens.accentText, margin: [0, 0, 0, 18] },
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: PAGE.width - PAGE.margin.left - PAGE.margin.right, y2: 0, lineWidth: 2, lineColor: tokens.accent }], margin: [0, 0, 0, 28] },
        { text: block.title, fontSize: TYPE.title, color: INK, margin: [0, 0, 0, 6] },
        { text: block.preparedBy, fontSize: TYPE.body, color: MUTED },
        ...(block.phaseLine ? [{ text: block.phaseLine, fontSize: TYPE.body, color: tokens.accentText, margin: [0, 14, 0, 0] }] : []),
      ]
    case "heading":
      return [{ text: block.text, fontSize: TYPE.heading, bold: true, color: INK, margin: [0, 22, 0, 8] }]
    case "paragraph":
      return [{ text: block.text, color: block.muted ? MUTED : INK, margin: [0, 0, 0, 6] }]
    case "link":
      return [
        { text: block.title, bold: true, margin: [0, 4, 0, 0] },
        { text: block.url, link: block.url, color: tokens.accentText, fontSize: TYPE.small, margin: [0, 0, 0, 6] },
      ]
    case "answer":
      return [
        { text: block.title, bold: true, margin: [0, 8, 0, 3] },
        { text: block.body, margin: [0, 0, 0, 2] },
        ...demoLine(block.demo),
      ]
    case "reply":
      return [
        {
          columns: [
            { width: 34, text: block.ref, bold: true, color: MUTED },
            { width: "*", stack: [{ text: block.question, bold: true }, { text: block.answer, margin: [0, 3, 0, 0] }, ...demoLine(block.demo)] },
          ],
          margin: [0, 6, 0, 6],
        },
      ]
    case "use-case":
      return [
        { text: block.title, bold: true, margin: [0, 8, 0, 2] },
        { text: block.summary, color: MUTED, margin: [0, 0, 0, 4] },
        {
          table: { widths: [90, "*"], body: block.rows.map(([label, value]) => [{ text: label, color: MUTED }, { text: value }]) },
          layout: "noBorders",
          margin: [0, 0, 0, 2],
        },
        ...demoLine(block.demo),
      ]
    case "documents":
      return [
        {
          table: {
            headerRows: 1,
            widths: ["*", 50, 80, 36],
            body: [
              ["Document", "Version", "Date as printed", "Pages"].map((text) => ({ text, color: MUTED, fontSize: TYPE.small })),
              ...block.rows.map((row) => [row.title, row.version, row.printedDate, String(row.pages)]),
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => RULE,
            paddingTop: () => 4,
            paddingBottom: () => 4,
          },
          margin: [0, 4, 0, 6],
        },
      ]
    case "nda":
      return [
        { text: "Shared once an NDA is in place", bold: true, margin: [0, 6, 0, 2] },
        { ul: block.titles },
      ]
    case "list":
      return [{ ul: block.items, margin: [0, 2, 0, 0] }]
  }
}

export function toDocDefinition(document: PackDocument, tokens: StyleTokens = BEAM_STYLE) {
  const poweredBy = document.style === "partner-fronted" ? " · Powered by Beam" : ""
  return {
    pageSize: "A4",
    pageMargins: [PAGE.margin.left, PAGE.margin.top, PAGE.margin.right, PAGE.margin.bottom],
    info: { title: document.title, author: document.partnerName, producer: "Beam Partner" },
    defaultStyle: { font: "Roboto", fontSize: TYPE.body, lineHeight: TYPE.lineHeight, color: INK },
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `${document.footer}${poweredBy}`, fontSize: TYPE.small, color: MUTED },
        { text: `Page ${currentPage} of ${pageCount}`, fontSize: TYPE.small, color: MUTED, alignment: "right" },
      ],
      margin: [PAGE.margin.left, 24, PAGE.margin.right, 0],
    }),
    content: document.blocks.flatMap((block) => blockContent(block, tokens)),
  }
}
