import type { CatalogComplianceDocument } from "../convex/catalogTypes"
import { introPack, type IntroPackItem } from "./intro-pack"

/**
 * A client pack is what a partner sends after the intro call: the published
 * decks that are cleared for clients, and the security and compliance
 * documents Beam will issue for this engagement, listed as printed. The shape
 * follows Beam's own pack notion: an account, a partner context, and items.
 */
export type ClientPack = {
  account: { company: string }
  partnerContext: { workspaceDisplayName: string; brandMode: string }
  decks: IntroPackItem[]
  documents: CatalogComplianceDocument[]
  ndaDocuments: CatalogComplianceDocument[]
  confirmVersion: CatalogComplianceDocument[]
}

export function buildPack({
  workspaceDisplayName,
  brandMode,
  clientName,
  materials,
  documents,
}: {
  workspaceDisplayName: string
  brandMode: string
  clientName: string
  materials: readonly IntroPackItem[]
  documents: readonly CatalogComplianceDocument[]
}): ClientPack {
  return {
    account: { company: clientName.trim() },
    partnerContext: { workspaceDisplayName, brandMode },
    decks: introPack(materials, brandMode).pack,
    documents: documents.filter((document) => !document.ndaRequired),
    ndaDocuments: documents.filter((document) => document.ndaRequired),
    confirmVersion: documents.filter(
      (document) => document.availability === "confirm-version"
    ),
  }
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export const PACK_RULE =
  "Files are not stored in the partner portal. Beam issues the reviewed copies for a named client and deployment. Documents marked under NDA are listed but sent only after the NDA is in place."

function documentLine(document: CatalogComplianceDocument) {
  const printed =
    document.availability === "confirm-version"
      ? "version and date to be confirmed by Beam"
      : `version ${document.version}, ${document.printedDate}`
  return `${document.title}, ${printed}`
}

/**
 * The cover page a partner downloads: an A4 document in the field names of
 * Beam's deck schema (company, deckType, title, subtitle). Self-contained,
 * printable, no script. Every number on it is a printed version, date or
 * page count; nothing else is claimed.
 */
export function coverPageHtml(
  pack: ClientPack,
  { generatedOn }: { generatedOn: string }
) {
  const company = escapeHtml(pack.account.company)
  const partner = escapeHtml(pack.partnerContext.workspaceDisplayName)
  const cover = {
    company,
    deckType: "materials",
    title: `Beam materials for ${company}`,
    subtitle: `Prepared by ${partner}`,
  }
  const decks = pack.decks
    .map(
      (deck) =>
        `<li><span class="t">${escapeHtml(deck.title)}</span><br><a href="${escapeHtml(deck.shareUrl ?? "")}">${escapeHtml(deck.shareUrl ?? "")}</a></li>`
    )
    .join("")
  const rows = pack.documents
    .map(
      (document) =>
        `<tr><td>${escapeHtml(document.title)}</td><td>${escapeHtml(document.version || "to confirm")}</td><td>${escapeHtml(document.printedDate || "to confirm")}</td><td>${document.pages}</td></tr>`
    )
    .join("")
  const nda = pack.ndaDocuments
    .map((document) => `<li>${escapeHtml(document.title)} (under NDA)</li>`)
    .join("")
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${cover.title}</title>
<style>
@page { size: A4; margin: 18mm; }
body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: #171717; max-width: 174mm; margin: 24px auto; padding: 0 16px; line-height: 1.5; font-size: 13px; }
h1 { font-size: 24px; font-weight: 500; letter-spacing: -0.01em; margin: 0 0 4px; }
h2 { font-size: 13px; font-weight: 500; margin: 28px 0 8px; }
.sub, .meta, td:nth-child(n+2), .note { color: #737373; }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 6px 8px 6px 0; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
th { font-weight: 500; color: #737373; font-size: 11px; }
ul { padding-left: 18px; } li { margin: 4px 0; } .t { font-weight: 500; color: #171717; }
.note { border-top: 1px solid #e5e5e5; margin-top: 28px; padding-top: 12px; font-size: 11px; }
@media print { body { margin: 0; padding: 0; } }
</style></head><body data-deck-type="${cover.deckType}" data-company="${cover.company}">
<h1>${cover.title}</h1>
<p class="sub">${cover.subtitle}</p>
${decks ? `<h2>Introduction</h2><ul>${decks}</ul>` : ""}
${rows ? `<h2>Security and compliance documents Beam will issue for this engagement</h2><table><thead><tr><th>Document</th><th>Version</th><th>Date as printed</th><th>Pages</th></tr></thead><tbody>${rows}</tbody></table>` : ""}
${nda ? `<h2>Available under NDA</h2><ul>${nda}</ul>` : ""}
<p class="note">${escapeHtml(PACK_RULE)} Prepared on ${escapeHtml(generatedOn)}.</p>
</body></html>
`
}

/** The note a partner pastes into their own email. Client voice, no claims. */
export function coverNote(pack: ClientPack) {
  const lines = [
    `Subject: Beam: materials for ${pack.account.company}, as discussed`,
    "",
    "Hi [client name],",
    "",
    `As discussed, here are the Beam materials for ${pack.account.company}.`,
  ]
  if (pack.decks.length) {
    lines.push("", "Introduction:")
    for (const deck of pack.decks) lines.push(`- ${deck.title}: ${deck.shareUrl}`)
  }
  if (pack.documents.length || pack.ndaDocuments.length) {
    lines.push("", "Security and compliance documents Beam will issue for this engagement, listed as printed:")
    for (const document of pack.documents) lines.push(`- ${documentLine(document)}`)
    for (const document of pack.ndaDocuments) lines.push(`- ${document.title} (under NDA)`)
    lines.push("", "Beam issues the reviewed copies for a named client and deployment; I have requested them.")
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

export function packDownloadName(clientName: string) {
  const slug = clientName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return `beam-materials-for-${slug || "client"}.html`
}

/** Request text for Beam: the client and the documents to issue, titles as printed. */
export function packRequestText(pack: ClientPack) {
  const lines = [
    `Please issue the reviewed copies for ${pack.account.company || "the named client"} and the deployment under discussion:`,
    ...pack.documents.map((document) => `- ${documentLine(document)}`),
    ...pack.ndaDocuments.map((document) => `- ${document.title} (under NDA; NDA to be arranged)`),
  ]
  if (pack.confirmVersion.length) {
    lines.push("", `Please confirm the version and date of: ${pack.confirmVersion.map((document) => document.title).join("; ")}.`)
  }
  return lines.join("\n") + "\n\n"
}
