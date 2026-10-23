import type { CatalogComplianceDocument } from "../convex/catalogTypes"
import type { AskResult } from "./ask"
import { holdReason, type HoldOptions, type PackContent } from "./pack"

/**
 * What a client sees for one of their questions: the cell in their own
 * questionnaire, the row in the reply sheet, the line in the PDF. There are
 * only three kinds, and the order decides everything:
 *
 * 1. Anything that must go to Beam (a restricted answer, a sensitive topic,
 *    evidence only Beam provides) gets the fixed line, whatever else matched.
 * 2. An approved answer is quoted word for word, and only when the send rule
 *    lets it reach a client. Answers written to coach the partner never are.
 * 3. A policy that covers the question is referenced as printed. It is not an
 *    answer, and the cell says so.
 *
 * Everything else gets the fixed line too. Nothing is ever written here: a
 * cell is a quote, a reference, or the line below.
 */
export type ClientCell =
  | { kind: "quote"; text: string; item: PackContent }
  | { kind: "policy"; text: string; documents: CatalogComplianceDocument[] }
  | { kind: "beam"; text: string }

/** In the partner's voice: Beam has promised nothing, so the line promises nothing. */
export const NOT_ANSWERED_LINE = "Not answered in this pack. We will follow up with you."

export function policyLine(documents: readonly CatalogComplianceDocument[]) {
  const named = documents
    .map((document) =>
      document.availability === "confirm-version"
        ? `${document.title} (version to be confirmed)`
        : `${document.title}, version ${document.version}, ${document.printedDate}`
    )
    .join("; ")
  const policy = documents.length === 1 ? "Related Beam policy" : "Related Beam policies"
  return `Not answered here. ${policy}: ${named}. Beam issues a copy on request.`
}

/** True when the question belongs to Beam, before any matching is trusted. */
export function routesToBeam(result: AskResult) {
  const { faq } = result
  if (result.beamOnly) return true
  return faq.kind === "route-to-beam" && (faq.reason === "restricted" || Boolean(faq.topic))
}

export function clientCell(
  result: AskResult,
  {
    brandMode,
    find,
    ...hold
  }: HoldOptions & {
    brandMode: string
    /** The catalog record behind a matched answer, so the send rule sees all of it. */
    find: (slug: string) => PackContent | undefined
  }
): ClientCell {
  if (routesToBeam(result)) return { kind: "beam", text: NOT_ANSWERED_LINE }
  if (result.faq.kind === "answer") {
    const item = find(result.faq.answer.slug)
    if (item && holdReason(item, brandMode, hold) === null) {
      return { kind: "quote", text: item.body.trim(), item }
    }
  }
  if (result.documentMode === "matched" && result.documents.length) {
    const documents = result.documents.slice(0, 3)
    return { kind: "policy", text: policyLine(documents), documents }
  }
  return { kind: "beam", text: NOT_ANSWERED_LINE }
}

export type SheetCounts = { quoted: number; policies: number; forBeam: number }

export function countCells(cells: readonly ClientCell[]): SheetCounts {
  return {
    quoted: cells.filter((cell) => cell.kind === "quote").length,
    policies: cells.filter((cell) => cell.kind === "policy").length,
    forBeam: cells.filter((cell) => cell.kind === "beam").length,
  }
}

/** "5 quoted · 2 policies · 2 for Beam". Never "ready": a policy is not an answer. */
export function countsLine({ quoted, policies, forBeam }: SheetCounts) {
  return [
    `${quoted} quoted`,
    `${policies} ${policies === 1 ? "policy" : "policies"}`,
    `${forBeam} for Beam`,
  ].join(" · ")
}

/**
 * True when the text is a quote of an approved source, a policy reference
 * built from printed fields, or the fixed line. Tests run every cell of every
 * fixture through this, so nothing composed can slip into a client file.
 */
export function isVerbatim(cell: ClientCell) {
  if (cell.kind === "beam") return cell.text === NOT_ANSWERED_LINE
  if (cell.kind === "policy") return cell.text === policyLine(cell.documents)
  return cell.item.body.includes(cell.text) && cell.text.length > 0
}
