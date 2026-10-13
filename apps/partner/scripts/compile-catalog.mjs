import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "yaml"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const catalogDir = path.join(root, "catalog")
const outDir = path.join(root, "convex", "generated")

function loadYaml(relativePath) {
  return parse(readFileSync(path.join(catalogDir, relativePath), "utf8"))
}

function loadItems(fileName) {
  const parsed = loadYaml(fileName)
  return Array.isArray(parsed.items) ? parsed.items : []
}

const workspaces = readdirSync(path.join(catalogDir, "workspaces"))
  .filter((file) => file.endsWith(".yaml"))
  .map((file) => loadYaml(path.join("workspaces", file)))
  .sort((a, b) => String(a.slug).localeCompare(String(b.slug)))

const COMPLEXITIES = new Set(["starter", "standard", "complex"])
const COMPLIANCE_DOMAINS = new Set([
  "information-security",
  "access-and-identity",
  "data-privacy",
  "hipaa-and-phi",
  "continuity-and-backup",
  "secure-development",
  "operations-and-suppliers",
  "people-and-conduct",
])
const COMPLIANCE_AVAILABILITY = new Set(["on-request", "under-nda", "confirm-version"])

/**
 * The compliance index lists documents by what is printed on them and nothing
 * more. A posture word in a summary, a document with a version but no date
 * marked as available, or an NDA flag that disagrees with its availability
 * would each let a partner say something Beam has not signed.
 */
function validateCompliance(items) {
  const problems = []
  const seen = new Set()
  for (const item of items) {
    const at = `compliance.yaml → ${item.slug ?? "(missing slug)"}`
    if (!item.slug) problems.push(`${at}: needs a slug`)
    else if (seen.has(item.slug)) problems.push(`${at}: duplicate slug`)
    else seen.add(item.slug)
    if (item.kind !== "compliance") problems.push(`${at}: kind must be compliance`)
    if (!item.title) problems.push(`${at}: missing title`)
    if (!COMPLIANCE_DOMAINS.has(item.domain)) problems.push(`${at}: unknown domain ${item.domain}`)
    if (!COMPLIANCE_AVAILABILITY.has(item.availability)) problems.push(`${at}: unknown availability ${item.availability}`)
    const missingPrint = !item.version || !item.printedDate
    if (missingPrint !== (item.availability === "confirm-version")) {
      problems.push(`${at}: availability must be confirm-version exactly when the version or date is not printed`)
    }
    if (Boolean(item.ndaRequired) !== (item.availability === "under-nda")) {
      problems.push(`${at}: ndaRequired must match availability under-nda`)
    }
    if (!Number.isInteger(item.pages) || item.pages <= 0) problems.push(`${at}: pages must be a positive integer`)
    if (typeof item.summary !== "string" || item.summary.length > 200) problems.push(`${at}: summary must be a string of at most 200 characters`)
    if (/certif|\bISO\b|\bSOC\b|guarantee/i.test(item.summary ?? "")) problems.push(`${at}: summary carries a posture claim`)
    if (!item.requestLabel) problems.push(`${at}: requestLabel is required`)
    if (!item.reviewer) problems.push(`${at}: reviewer is required`)
  }
  if (problems.length > 0) {
    console.error("Compliance index is not publishable:\n" + problems.map((p) => `  - ${p}`).join("\n"))
    process.exit(1)
  }
  return items
}

/**
 * Fail the build rather than let an unsafe use case reach a partner.
 *
 * Two rules. Every use case must name the step that keeps a human approver,
 * because that is the first objection in every regulated vertical. And any
 * outcome must carry its source, because a partner who repeats a number to a
 * client will be asked where it came from — an absent outcome is honest, a
 * sourceless one is not.
 */
function validateUseCases(items) {
  const problems = []
  const seen = new Set()
  for (const item of items) {
    const at = `use-cases.yaml → ${item.slug ?? "(missing slug)"}`
    if (!item.slug) problems.push(`${at}: needs a slug`)
    else if (seen.has(item.slug)) problems.push(`${at}: duplicate slug`)
    else seen.add(item.slug)

    for (const field of ["title", "vertical", "department", "trigger", "before", "after"]) {
      if (!item[field]) problems.push(`${at}: missing ${field}`)
    }
    if (!item.humanInLoop) {
      problems.push(`${at}: humanInLoop is required — name the step that keeps a human approver`)
    }
    if (!Array.isArray(item.systems) || item.systems.length === 0) {
      problems.push(`${at}: list at least one system the agent touches`)
    }
    if (item.complexity && !COMPLEXITIES.has(item.complexity)) {
      problems.push(`${at}: complexity must be one of ${[...COMPLEXITIES].join(", ")}`)
    }
    if (item.outcome) {
      for (const field of ["metric", "value", "source"]) {
        if (!item.outcome[field]) {
          problems.push(`${at}: outcome.${field} is required when an outcome is claimed`)
        }
      }
    }
  }
  if (problems.length > 0) {
    console.error("Use case catalog is not publishable:\n" + problems.map((p) => `  - ${p}`).join("\n"))
    process.exit(1)
  }
  return items
}

/**
 * Demo content (catalog/demo/demo.yaml) is written for the demo, not reviewed
 * by Beam. It may only reach a workspace marked demo, carries no number and
 * no posture claim, and every item names the internal answer it came from.
 * The fixed fields are set here, so the YAML cannot loosen them.
 */
const DEMO_REVIEWER = "Demo content, not reviewed by Beam"
const DEMO_POSTURE =
  /certif|\bISO\b|\bSOC\b|guarantee|complian|accredit|HIPAA|GDPR|audited|auditor|attest|penetration|encrypt|residen|hosted|hosting|data cent|uptime|\bSLA\b|on-prem|sovereign|retain|retention/i

function loadDemo(real) {
  const parsed = loadYaml(path.join("demo", "demo.yaml"))
  const fixed = {
    contentClass: "workspace-only",
    audience: "client-forwardable",
    forwardable: true,
    claimState: "approved",
    allowedBrandModes: ["beam-standard", "co-branded", "partner-fronted"],
    reviewer: DEMO_REVIEWER,
  }
  const faq = (parsed.faq ?? []).map((item) => ({ ...item, ...fixed }))
  const useCases = (parsed.useCases ?? []).map((item) => ({ ...item, ...fixed }))
  const demoWorkspaces = parsed.workspaces ?? []
  const problems = []
  const realSlugs = new Set([...real.faq, ...real.useCases].map((item) => item.slug))
  const seen = new Set()
  for (const slug of demoWorkspaces) {
    const workspace = workspaces.find((entry) => entry.slug === slug)
    if (!workspace) problems.push(`demo.yaml: workspace ${slug} does not exist`)
    else if (workspace.demo !== true) problems.push(`demo.yaml: workspace ${slug} is not marked demo: true`)
  }
  for (const workspace of workspaces) {
    const granted = [
      ...(workspace.faqSlugs ?? []),
      ...(workspace.useCaseSlugs ?? []),
      ...(workspace.materialSlugs ?? []),
      ...(workspace.toolSlugs ?? []),
    ]
    for (const slug of granted.filter((entry) => entry.startsWith("demo-"))) {
      problems.push(`${workspace.slug}.yaml grants ${slug}: demo content is granted only by demo.yaml`)
    }
  }
  for (const item of [...faq, ...useCases]) {
    const at = `demo.yaml → ${item.slug ?? "(missing slug)"}`
    if (!item.slug?.startsWith("demo-")) problems.push(`${at}: slug must start with demo-`)
    else if (seen.has(item.slug)) problems.push(`${at}: duplicate slug`)
    seen.add(item.slug)
    if (!realSlugs.has(item.sourceSlug)) problems.push(`${at}: sourceSlug ${item.sourceSlug} is not a real answer or use case`)
    if (!item.group) problems.push(`${at}: needs a group`)
    if (item.reviewedOn || item.revalidateOn) problems.push(`${at}: demo content is never dated as reviewed`)
    const text = ["title", "summary", "body", "trigger", "before", "after", "humanInLoop"]
      .map((field) => item[field] ?? "")
      .join("\n")
    if (/\d/.test(text)) problems.push(`${at}: no numbers in demo content`)
    const posture = text.match(DEMO_POSTURE)
    if (posture) problems.push(`${at}: posture word "${posture[0]}" is Beam's to state`)
  }
  if (problems.length > 0) {
    console.error("Demo content is not publishable:\n" + problems.map((p) => `  - ${p}`).join("\n"))
    process.exit(1)
  }
  return { workspaces: demoWorkspaces, faq, useCases: validateUseCases(useCases) }
}

const catalog = {
  workspaces,
  tools: loadItems("tools.yaml"),
  materials: loadItems("materials.yaml"),
  faq: loadItems("faq.yaml"),
  playbooks: loadItems("playbooks.yaml"),
  useCases: validateUseCases(loadItems("use-cases.yaml")),
  compliance: validateCompliance(loadItems("compliance.yaml")),
}

const demo = loadDemo(catalog)

mkdirSync(outDir, { recursive: true })
writeFileSync(
  path.join(outDir, "catalog.json"),
  `${JSON.stringify(catalog, null, 2)}\n`
)
// Read only by lib/catalog/static.ts, never by convex/seed.ts.
writeFileSync(
  path.join(root, "lib", "catalog", "demo.generated.json"),
  `${JSON.stringify(demo, null, 2)}\n`
)
console.log(
  `Compiled partner catalog: ${workspaces.length} workspaces, ${catalog.tools.length} tools, ${catalog.materials.length} materials, ${catalog.faq.length} faq, ${catalog.playbooks.length} playbooks, ${catalog.useCases.length} use cases, ${catalog.compliance.length} compliance documents; demo: ${demo.faq.length} answers and ${demo.useCases.length} use cases for ${demo.workspaces.join(", ")}`
)
