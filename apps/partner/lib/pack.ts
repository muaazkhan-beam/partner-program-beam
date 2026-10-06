import type {
  BrandMode,
  CatalogComplianceDocument,
  CatalogContent,
  UseCaseDetail,
} from "../convex/catalogTypes"
import { PUBLISHED_SHARE_PREFIX } from "./intro-pack"

/**
 * Anything a partner can pick up: a catalog item, with a use case's structured
 * fields either nested (Convex) or at the top level (the static catalog).
 */
export type PackContent = {
  kind: CatalogContent["kind"] | (string & {})
  slug: string
  title: string
  summary: string
  body: string
  format?: string
  shareUrl?: string
  status?: string
  claimState: string
  audience: string
  forwardable: boolean
  allowedBrandModes?: readonly string[]
  useCase?: UseCaseDetail
} & Partial<UseCaseDetail>

/** Why a picked item stays with the partner instead of going to the client. */
export type HoldReason =
  | "restricted"
  | "pending"
  | "internal"
  | "brand mode"
  | "no published link"

/**
 * The one rule for what may reach a client, used by every badge, the pack
 * page and the PDF so they can never disagree. In the portal spec `audience` says
 * who an item is written for and `forwardable` says whether it may be passed
 * on. Both must hold: an answer written to coach the partner ("do not pick a
 * fight inside…") is forwardable to a colleague, never printable for a
 * client. Tools and playbooks are for the partner.
 */
export function holdReason(item: PackContent, brandMode: string): HoldReason | null {
  if (item.claimState === "restricted") return "restricted"
  // A use case's `pending` means no cited outcome yet, not an unpublished record.
  const unpublished = item.status === "pending" && item.kind !== "use-case"
  if (unpublished || item.claimState !== "approved") return "pending"
  if (item.kind === "tool" || item.kind === "playbook") return "internal"
  if (item.audience !== "client-forwardable" || !item.forwardable) return "internal"
  if (item.allowedBrandModes && !item.allowedBrandModes.includes(brandMode)) {
    return "brand mode"
  }
  if (item.kind === "material" && !item.shareUrl?.startsWith(PUBLISHED_SHARE_PREFIX)) {
    return "no published link"
  }
  return null
}

export const HOLD_LABEL: Record<HoldReason, string> = {
  restricted: "Only Beam can answer this",
  pending: "Not published yet",
  internal: "For you only",
  "brand mode": "Not cleared for your brand",
  "no published link": "No client link yet",
}

export const CLIENT_READY_LABEL = "Can go to a client"

export function sendLabel(item: PackContent, brandMode: string) {
  const reason = holdReason(item, brandMode)
  return reason ? HOLD_LABEL[reason] : CLIENT_READY_LABEL
}

function detailOf(item: PackContent): Partial<UseCaseDetail> {
  return item.useCase ?? item
}

/**
 * A client pack: what one partner sends one client, built only from what they
 * picked. Nothing is added on their behalf.
 */
export type ClientPack = {
  account: { company: string }
  partnerContext: { workspaceDisplayName: string; brandMode: string }
  decks: PackContent[]
  useCases: PackContent[]
  answers: PackContent[]
  documents: CatalogComplianceDocument[]
  ndaDocuments: CatalogComplianceDocument[]
  confirmVersion: CatalogComplianceDocument[]
  held: Array<{ item: PackContent; reason: HoldReason }>
}

export function buildPack({
  workspaceDisplayName,
  brandMode,
  clientName,
  items,
  documents,
}: {
  workspaceDisplayName: string
  brandMode: string
  clientName: string
  items: readonly PackContent[]
  documents: readonly CatalogComplianceDocument[]
}): ClientPack {
  const pack: ClientPack = {
    account: { company: clientName.trim() },
    partnerContext: { workspaceDisplayName, brandMode },
    decks: [],
    useCases: [],
    answers: [],
    documents: documents.filter((document) => !document.ndaRequired),
    ndaDocuments: documents.filter((document) => document.ndaRequired),
    confirmVersion: documents.filter(
      (document) => document.availability === "confirm-version"
    ),
    held: [],
  }
  for (const item of items) {
    const reason = holdReason(item, brandMode)
    if (reason) pack.held.push({ item, reason })
    else if (item.kind === "material") pack.decks.push(item)
    else if (item.kind === "use-case") pack.useCases.push(item)
    else if (item.kind === "faq") pack.answers.push(item)
  }
  return pack
}

/** True when there is anything to send to the client. */
export function hasClientContent(pack: ClientPack) {
  return (
    pack.decks.length +
      pack.useCases.length +
      pack.answers.length +
      pack.documents.length +
      pack.ndaDocuments.length >
    0
  )
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Shown to the partner, never printed for the client. */
export const PACK_RULE =
  "Beam issues the reviewed copies of security documents for a named client. Documents under NDA go out once the NDA is signed."

function documentLine(document: CatalogComplianceDocument) {
  const printed =
    document.availability === "confirm-version"
      ? "version and date to be confirmed by Beam"
      : `version ${document.version}, ${document.printedDate}`
  return `${document.title}, ${printed}`
}

function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("")
}

/** Beam's primary colour from the app's own theme, and its logo. */
const BEAM_ACCENT = "oklch(0.488 0.243 264.376)"

export function packTitle(pack: ClientPack) {
  return `Beam for ${pack.account.company || "your client"}`
}

/**
 * The document a partner saves as a PDF and sends: A4, Beam's colour and
 * logo, and only what they picked that may reach a client. Self-contained,
 * no script. Co-branded workspaces put the partner beside Beam on the cover;
 * anything beyond the approved brand mode is Beam's call, per the spec.
 * Use cases print their approved fields only; a time to production or an
 * outcome without a cited deployment is never printed.
 */
export function coverPageHtml(
  pack: ClientPack,
  { generatedOn, logoUrl }: { generatedOn: string; logoUrl?: string }
) {
  const company = escapeHtml(pack.account.company || "your client")
  const partner = escapeHtml(pack.partnerContext.workspaceDisplayName)
  const brandMode = pack.partnerContext.brandMode as BrandMode
  const title = escapeHtml(packTitle(pack))
  const preparedBy =
    brandMode === "beam-standard"
      ? `Prepared by ${partner}`
      : `Prepared by ${partner} with Beam`
  const logo = logoUrl
    ? `<img class="logo" src="${escapeHtml(logoUrl)}" alt="Beam">`
    : `<span class="wordmark">Beam</span>`
  const brandLine =
    brandMode === "beam-standard"
      ? logo
      : `${logo}<span class="with">×</span><span class="partner">${partner}</span>`

  const sections: string[] = []

  if (pack.decks.length) {
    sections.push(`<section><h2>Introduction</h2><ul class="links">${pack.decks
      .map(
        (deck) =>
          `<li><span class="t">${escapeHtml(deck.title)}</span><a href="${escapeHtml(deck.shareUrl ?? "")}">${escapeHtml(deck.shareUrl ?? "")}</a></li>`
      )
      .join("")}</ul></section>`)
  }

  if (pack.useCases.length) {
    sections.push(`<section><h2>How Beam would run it</h2>${pack.useCases
      .map((useCase) => {
        const detail = detailOf(useCase)
        const rows: Array<[string, string | undefined]> = [
          ["Starts when", detail.trigger],
          ["Today", detail.before],
          ["With Beam", detail.after],
          ["Human approval", detail.humanInLoop],
          ["Systems", detail.systems?.join(", ")],
          [
            "Result",
            detail.outcome
              ? `${detail.outcome.metric}: ${detail.outcome.value} (${detail.outcome.source})`
              : undefined,
          ],
        ]
        return `<article><h3>${escapeHtml(useCase.title)}</h3><p class="lead">${escapeHtml(useCase.summary)}</p><dl>${rows
          .filter(([, value]) => value)
          .map(([label, value]) => `<dt>${label}</dt><dd>${escapeHtml(value ?? "")}</dd>`)
          .join("")}</dl></article>`
      })
      .join("")}</section>`)
  }

  if (pack.answers.length) {
    sections.push(`<section><h2>Your questions, answered</h2>${pack.answers
      .map(
        (answer) =>
          `<article><h3>${escapeHtml(answer.title)}</h3>${paragraphs(answer.body)}</article>`
      )
      .join("")}</section>`)
  }

  if (pack.documents.length || pack.ndaDocuments.length) {
    const rows = pack.documents
      .map(
        (document) =>
          `<tr><td>${escapeHtml(document.title)}</td><td>${escapeHtml(document.version || "to confirm")}</td><td>${escapeHtml(document.printedDate || "to confirm")}</td><td>${document.pages}</td></tr>`
      )
      .join("")
    const nda = pack.ndaDocuments
      .map((document) => `<li>${escapeHtml(document.title)}</li>`)
      .join("")
    sections.push(`<section><h2>Security and compliance</h2><p class="lead">Documents Beam will issue for ${company}, listed as printed on each.</p>${
      rows
        ? `<table><thead><tr><th>Document</th><th>Version</th><th>Date as printed</th><th>Pages</th></tr></thead><tbody>${rows}</tbody></table>`
        : ""
    }${nda ? `<h3>Shared once an NDA is in place</h3><ul>${nda}</ul>` : ""}</section>`)
  }

  const closing =
    pack.documents.length || pack.ndaDocuments.length
      ? `Beam issues the reviewed copies of the documents above for ${company} and the deployment under discussion.`
      : ""

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>
@page { size: A4; margin: 16mm 18mm; }
:root { --accent: ${BEAM_ACCENT}; }
* { box-sizing: border-box; }
body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: #171717; max-width: 174mm; margin: 24px auto; padding: 0 16px; line-height: 1.55; font-size: 12.5px; }
.brand { display: flex; align-items: center; gap: 10px; padding-bottom: 18px; border-bottom: 2px solid var(--accent); }
.logo { height: 30px; width: auto; }
.wordmark { font-weight: 600; font-size: 18px; color: var(--accent); }
.with { color: #a3a3a3; } .partner { font-weight: 500; font-size: 15px; }
h1 { font-size: 26px; font-weight: 500; letter-spacing: -0.015em; margin: 28px 0 4px; }
.sub { color: #737373; margin: 0; }
section { margin-top: 30px; }
h2 { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); margin: 0 0 12px; }
h3 { font-size: 14px; font-weight: 600; margin: 18px 0 4px; }
article { break-inside: avoid; }
p { margin: 0 0 8px; } .lead { color: #525252; }
dl { display: grid; grid-template-columns: 30mm 1fr; gap: 4px 12px; margin: 8px 0 0; }
dt { color: #737373; } dd { margin: 0; }
ul { padding-left: 18px; margin: 6px 0; } li { margin: 4px 0; }
.links { list-style: none; padding: 0; } .links li { display: flex; flex-direction: column; padding: 8px 0; border-bottom: 1px solid #e5e5e5; }
.t { font-weight: 500; } a { color: var(--accent); word-break: break-all; }
table { border-collapse: collapse; width: 100%; margin-top: 6px; }
th, td { text-align: left; padding: 6px 8px 6px 0; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
th { font-weight: 500; color: #737373; font-size: 11px; } td:nth-child(n+2) { color: #525252; white-space: nowrap; }
footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e5e5e5; color: #737373; font-size: 11px; }
@media print { body { margin: 0; padding: 0; } a { color: var(--accent); } }
</style></head><body data-deck-type="materials" data-company="${company}">
<header class="brand">${brandLine}</header>
<h1>${title}</h1>
<p class="sub">${preparedBy} · ${escapeHtml(generatedOn)}</p>
${sections.join("\n")}
<footer>${closing ? `<p>${closing}</p>` : ""}<p>${preparedBy}, ${escapeHtml(generatedOn)}.</p></footer>
</body></html>
`
}

/** The email a partner sends with the PDF. Client voice, no claims. */
export function coverNote(pack: ClientPack) {
  const company = pack.account.company || "[client]"
  const lines = [
    `Subject: Beam for ${company}, as discussed`,
    "",
    "Hi [client name],",
    "",
    `As discussed, here is what we put together on Beam for ${company}. The full pack is attached as a PDF.`,
  ]
  if (pack.decks.length) {
    lines.push("", "Introduction:")
    for (const deck of pack.decks) lines.push(`- ${deck.title}: ${deck.shareUrl}`)
  }
  if (pack.useCases.length) {
    lines.push("", "How Beam would run it:")
    for (const useCase of pack.useCases) lines.push(`- ${useCase.title}`)
  }
  if (pack.answers.length) {
    lines.push("", "Your questions, answered in the PDF:")
    for (const answer of pack.answers) lines.push(`- ${answer.title}`)
  }
  if (pack.documents.length || pack.ndaDocuments.length) {
    lines.push("", "Security and compliance documents, listed as printed:")
    for (const document of pack.documents) lines.push(`- ${documentLine(document)}`)
    for (const document of pack.ndaDocuments) lines.push(`- ${document.title} (once an NDA is in place)`)
    lines.push("", "Beam issues the reviewed copies for you and the deployment we discussed; I will send them as soon as they are issued.")
  }
  lines.push("", "Happy to walk through any of this.", "", "[your name]", pack.partnerContext.workspaceDisplayName)
  return lines.join("\n")
}

export function packItemsParam(slugs: readonly string[]) {
  return slugs.join(",")
}

export function parsePackItems(value: string | null | undefined) {
  if (!value) return []
  return value
    .split(",")
    .map((slug) => slug.trim())
    .filter((slug) => /^[a-z0-9-]+$/.test(slug))
}

/** Request text for Beam: the clients and the documents to issue, titles as printed. */
export function packRequestText({
  clients,
  documents,
}: {
  clients: readonly string[]
  documents: readonly CatalogComplianceDocument[]
}) {
  const named = clients.length ? clients.join(", ") : "the named client"
  const lines = [
    `Please issue the reviewed copies for ${named} and the deployment under discussion:`,
    ...documents.map((document) =>
      document.ndaRequired
        ? `- ${document.title} (under NDA; NDA to be arranged)`
        : `- ${documentLine(document)}`
    ),
  ]
  const confirm = documents.filter((document) => document.availability === "confirm-version")
  if (confirm.length) {
    lines.push("", `Please confirm the version and date of: ${confirm.map((document) => document.title).join("; ")}.`)
  }
  return lines.join("\n") + "\n\n"
}
