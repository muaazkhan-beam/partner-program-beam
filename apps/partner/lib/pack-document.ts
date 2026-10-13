import type { BrandMode, CatalogComplianceDocument } from "../convex/catalogTypes"
import { CLIENT_PHASE_LABEL } from "./desk/phase"
import type { Phase } from "./desk/types"
import { isDemoContent, type ClientPack, type PackContent } from "./pack"
import type { PackQuestion } from "./pack-store"

/**
 * One document, two renderers. What a client receives is described here as
 * blocks, and the PDF (lib/render/pack-pdf.ts) and the on-screen preview
 * (lib/render/pack-html.ts) both read it, so the preview is the PDF. Only
 * what the send rule let through reaches `buildPackDocument`: it adds no
 * content, and quotes what it is given.
 */
export type PackBlock =
  | { kind: "cover"; title: string; preparedBy: string; phaseLine?: string; partnerName: string; withBeam: boolean }
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string; muted?: boolean }
  | { kind: "link"; title: string; url: string }
  | { kind: "answer"; title: string; body: string; demo: boolean }
  | { kind: "reply"; ref: string; question: string; answer: string; demo: boolean }
  | { kind: "use-case"; title: string; summary: string; rows: Array<[string, string]>; demo: boolean }
  | { kind: "documents"; rows: Array<{ title: string; version: string; printedDate: string; pages: number }> }
  | { kind: "nda"; titles: string[] }
  | { kind: "list"; items: string[] }

export type PackDocument = {
  title: string
  fileName: string
  clientName: string
  partnerName: string
  style: BrandMode
  generatedOn: string
  /** Every page's footer: who approved what the client reads, or that it is demo. */
  footer: string
  demo: boolean
  blocks: PackBlock[]
}

/** The client's question and what they read for it, in their numbering. */
export type ReplyRow = { ref: string; question: string; answer: string; demo?: boolean }

const detailOf = (item: PackContent) => item.useCase ?? item

export function safeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim()
}

export function buildPackDocument({
  pack,
  phase,
  replies = [],
  style,
  generatedOn,
}: {
  pack: ClientPack
  phase?: Phase
  /** The client's questions answered, when the pack replies to an email. */
  replies?: readonly ReplyRow[]
  style: BrandMode
  generatedOn: string
}): PackDocument {
  const clientName = pack.account.company || "your client"
  const partnerName = pack.partnerContext.workspaceDisplayName
  const withBeam = style !== "beam-standard"
  const title = `Beam for ${clientName}`
  const demo =
    [...pack.decks, ...pack.useCases, ...pack.answers].some(isDemoContent) || replies.some((row) => row.demo)

  const blocks: PackBlock[] = [
    {
      kind: "cover",
      title,
      preparedBy: withBeam ? `Prepared by ${partnerName} with Beam` : `Prepared by ${partnerName}`,
      ...(phase ? { phaseLine: `Where we are · ${CLIENT_PHASE_LABEL[phase]}` } : {}),
      partnerName,
      withBeam,
    },
  ]

  if (replies.length) {
    blocks.push({ kind: "heading", text: "Your questions, answered" })
    blocks.push({
      kind: "paragraph",
      muted: true,
      text: "In your own numbering. Where a question is not answered here, we will follow up with you.",
    })
    for (const row of replies) {
      blocks.push({ kind: "reply", ref: row.ref, question: row.question, answer: row.answer, demo: row.demo ?? false })
    }
  }

  if (pack.decks.length) {
    blocks.push({ kind: "heading", text: "Introduction" })
    for (const deck of pack.decks) blocks.push({ kind: "link", title: deck.title, url: deck.shareUrl ?? "" })
  }

  if (pack.useCases.length) {
    blocks.push({ kind: "heading", text: "How Beam would run it" })
    for (const useCase of pack.useCases) {
      const detail = detailOf(useCase)
      const rows: Array<[string, string | undefined]> = [
        ["Starts when", detail.trigger],
        ["Today", detail.before],
        ["With Beam", detail.after],
        ["Human approval", detail.humanInLoop],
        ["Systems", detail.systems?.join(", ")],
        ["Result", detail.outcome ? `${detail.outcome.metric}: ${detail.outcome.value} (${detail.outcome.source})` : undefined],
      ]
      blocks.push({
        kind: "use-case",
        title: useCase.title,
        summary: useCase.summary,
        rows: rows.filter((row): row is [string, string] => Boolean(row[1])),
        demo: isDemoContent(useCase),
      })
    }
  }

  const answered = new Set(replies.map((row) => row.answer))
  const answers = pack.answers.filter((answer) => !answered.has(answer.body.trim()))
  if (answers.length) {
    blocks.push({ kind: "heading", text: replies.length ? "More from Beam" : "Your questions, answered" })
    for (const answer of answers) {
      blocks.push({ kind: "answer", title: answer.title, body: answer.body.trim(), demo: isDemoContent(answer) })
    }
  }

  if (pack.documents.length || pack.ndaDocuments.length) {
    blocks.push({ kind: "heading", text: "Security and compliance" })
    blocks.push({
      kind: "paragraph",
      muted: true,
      text: `Documents Beam will issue for ${clientName}, listed as printed on each.`,
    })
    if (pack.documents.length) {
      blocks.push({
        kind: "documents",
        rows: pack.documents.map((document) => ({
          title: document.title,
          version: document.version || "to confirm",
          printedDate: document.printedDate || "to confirm",
          pages: document.pages,
        })),
      })
    }
    if (pack.ndaDocuments.length) {
      blocks.push({ kind: "nda", titles: pack.ndaDocuments.map((document) => document.title) })
    }
  }

  const forBeam = replies.filter((row) => row.answer.startsWith("Not answered in this pack"))
  if (forBeam.length) {
    blocks.push({ kind: "heading", text: "Questions we are checking with Beam" })
    blocks.push({ kind: "list", items: forBeam.map((row) => `${row.ref}. ${row.question}`) })
  }

  return {
    title,
    fileName: `${safeFileName(title)}.pdf`,
    clientName,
    partnerName,
    style,
    generatedOn,
    demo,
    footer: demo ? `Demo content · not reviewed by Beam · ${generatedOn}` : `Approved content · ${generatedOn}`,
    blocks,
  }
}

/** Every string a client could read, for tests that look for held text. */
export function documentText(document: PackDocument) {
  return document.blocks
    .flatMap((block) => {
      switch (block.kind) {
        case "cover":
          return [block.title, block.preparedBy, block.phaseLine ?? ""]
        case "heading":
        case "paragraph":
          return [block.text]
        case "link":
          return [block.title, block.url]
        case "answer":
          return [block.title, block.body]
        case "reply":
          return [block.ref, block.question, block.answer]
        case "use-case":
          return [block.title, block.summary, ...block.rows.flat()]
        case "documents":
          return block.rows.flatMap((row) => [row.title, row.version, row.printedDate])
        case "nda":
          return block.titles
        case "list":
          return block.items
      }
    })
    .concat(document.footer)
    .join("\n")
}

export type { CatalogComplianceDocument, PackQuestion }
