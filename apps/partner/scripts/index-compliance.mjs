#!/usr/bin/env node
// Staff-only. Indexes the policy PDFs that live OUTSIDE the repo into
// catalog/compliance.yaml. Only what is printed on each document is recorded:
// title, version, date, page count, classification. Files never enter git.
//
//   COMPLIANCE_SRC=~/Documents/Beam\ AI/Beam-Compliance-Policies node scripts/index-compliance.mjs
//
// Hand-edited fields (domain, availability, ndaRequired, summary) survive a
// re-run: entries are merged by slug. Never wired into prebuild.
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parse, stringify } from "yaml"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const outFile = path.join(root, "catalog", "compliance.yaml")
const src =
  process.env.COMPLIANCE_SRC ??
  path.join(os.homedir(), "Documents", "Beam AI", "Beam-Compliance-Policies")

const DOMAIN_RULES = [
  ["hipaa-and-phi", /hipaa|\bphi\b|limited data set/i],
  ["data-privacy", /privacy|gdpr|dpia|data subject|ropa|cookie|anonymi|personal data|retention|information transfer|data breach/i],
  ["access-and-identity", /access control|password|byod|mobile devices|clear desk|acceptable usage/i],
  ["continuity-and-backup", /backup|business continuity|incident management|logging and monitoring|threat intelligence|anti-malware|patch/i],
  ["secure-development", /secure development|software development|system acquisition|hardening|cryptography|installation of software|change management/i],
  ["operations-and-suppliers", /supplier|asset management|media handling|network security|physical|communication procedure|risk management|continual improvement|management review|non conformity|information classification/i],
  ["people-and-conduct", /code of conduct|disciplinary|human resource|whistle|roles and responsibilities/i],
]
const REQUEST_LABEL = "Request the reviewed copy for a named client and deployment."
const MONTHS = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" }

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (entry.toLowerCase().endsWith(".pdf")) out.push(full)
  }
  return out
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function toIso(printed) {
  const m = printed.match(/^(\d{1,2})-([A-Za-z]{3,9}|\d{2})-(\d{4})$/)
  if (!m) return ""
  const [, d, mon, y] = m
  const mm = /^\d{2}$/.test(mon) ? mon : MONTHS[mon.slice(0, 3).toLowerCase()]
  if (!mm) return ""
  return `${y}-${mm}-${d.padStart(2, "0")}`
}

function domainFor(title) {
  for (const [domain, rule] of DOMAIN_RULES) if (rule.test(title)) return domain
  return "information-security"
}

function indexPdf(file) {
  const info = execFileSync("pdfinfo", [file], { encoding: "utf8" })
  const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1] ?? 0)
  const infoTitle = info.match(/^Title:\s+(.+)$/m)?.[1]?.trim() ?? ""
  const text = execFileSync("pdftotext", ["-l", "3", "-layout", file, "-"], { encoding: "utf8" })
  const title = infoTitle || path.basename(path.dirname(file))
  const version =
    text.match(/Version\s*-\s*(\d+(?:\.\d+)?)/)?.[1] ??
    text.match(/^\s*Version\s+(\d+(?:\.\d+)?)\s*$/m)?.[1] ??
    ""
  const printedDate =
    text.match(/Release Date\s*-\s*(\d{1,2}-[A-Za-z]{3,9}-\d{4})/)?.[1] ??
    text.match(/^\s*Date of Version\s+(\d{1,2}-(?:[A-Za-z]{3,9}|\d{2})-\d{4})\s*$/m)?.[1] ??
    ""
  const classification = text.match(/Document Classification\s+([A-Za-z]+)/)?.[1] ?? ""
  return {
    slug: slugify(title),
    kind: "compliance",
    title,
    domain: domainFor(title),
    version,
    releaseDate: toIso(printedDate),
    printedDate,
    pages,
    classification,
    availability: version && printedDate ? "on-request" : "confirm-version",
    ndaRequired: false,
    summary: "",
    requestLabel: REQUEST_LABEL,
    reviewer: "Partner Success",
    sourceFile: path.relative(src, file),
  }
}

if (!existsSync(src)) {
  console.error(`Policy folder not found: ${src} (set COMPLIANCE_SRC)`)
  process.exit(1)
}
const previous = existsSync(outFile)
  ? new Map((parse(readFileSync(outFile, "utf8"))?.items ?? []).map((item) => [item.slug, item]))
  : new Map()

const items = walk(src)
  .map(indexPdf)
  .map((item) => {
    const kept = previous.get(item.slug)
    return kept
      ? { ...item, domain: kept.domain ?? item.domain, availability: kept.availability ?? item.availability, ndaRequired: kept.ndaRequired ?? item.ndaRequired, summary: kept.summary ?? item.summary }
      : item
  })
  .sort((a, b) => a.slug.localeCompare(b.slug))

const dupes = items.map((i) => i.slug).filter((s, i, arr) => arr.indexOf(s) !== i)
if (dupes.length) {
  console.error(`Duplicate slugs: ${dupes.join(", ")}`)
  process.exit(1)
}
writeFileSync(outFile, `# Generated by scripts/index-compliance.mjs from the policy PDFs kept outside the repo.\n# Only printed metadata is recorded. Edit domain / availability / ndaRequired / summary by hand; re-runs keep them.\n${stringify({ items })}`)
console.log(`Indexed ${items.length} documents → catalog/compliance.yaml (${items.filter((i) => i.availability === "confirm-version").length} need a version or date confirmed)`)
