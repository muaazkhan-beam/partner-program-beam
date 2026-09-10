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

const catalog = {
  workspaces,
  tools: loadItems("tools.yaml"),
  materials: loadItems("materials.yaml"),
  faq: loadItems("faq.yaml"),
  playbooks: loadItems("playbooks.yaml"),
}

mkdirSync(outDir, { recursive: true })
writeFileSync(
  path.join(outDir, "catalog.json"),
  `${JSON.stringify(catalog, null, 2)}\n`
)
console.log(
  `Compiled partner catalog: ${workspaces.length} workspaces, ${catalog.tools.length} tools, ${catalog.materials.length} materials, ${catalog.faq.length} faq, ${catalog.playbooks.length} playbooks`
)
