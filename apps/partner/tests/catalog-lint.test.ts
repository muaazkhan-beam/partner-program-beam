import assert from "node:assert/strict"
import test from "node:test"

import catalogJson from "../convex/generated/catalog.json"
import type {
  CatalogContent,
  CatalogUseCase,
  ContentKind,
  PartnerCatalog,
} from "../convex/catalogTypes"

// The compile step validates use cases only. These rules encode the catalog
// conventions every other kind relies on, so a YAML edit cannot ship a partner
// a dead end (pending with no request path), an unreviewed item, a grant that
// resolves to nothing, or a number nobody can source.
const catalog = catalogJson as PartnerCatalog

const lists: Array<[ContentKind, CatalogContent[]]> = [
  ["tool", catalog.tools],
  ["material", catalog.materials],
  ["faq", catalog.faq],
  ["playbook", catalog.playbooks],
  ["use-case", catalog.useCases],
]

const items = lists.flatMap(([listKind, list]) =>
  list.map((item) => ({ listKind, item }))
)

const grantLists: Array<[keyof PartnerCatalog, ContentKind, string]> = [
  ["tools", "tool", "toolSlugs"],
  ["materials", "material", "materialSlugs"],
  ["faq", "faq", "faqSlugs"],
  ["playbooks", "playbook", "playbookSlugs"],
  ["useCases", "use-case", "useCaseSlugs"],
]

function id(item: CatalogContent) {
  return `${item.kind}:${item.slug}`
}

function isStaffDraft(item: CatalogContent) {
  return item.claimState === "staff-draft" || item.contentClass === "staff-draft"
}

test("every catalog item names its reviewer", () => {
  const missing = items
    .filter(({ item }) => !item.reviewer || !item.reviewer.trim())
    .map(({ item }) => id(item))
  assert.deepEqual(missing, [])
})

test("every pending or restricted item gives the partner a request path", () => {
  // Use cases use `pending` to mean "no sourced outcome yet"; their view has
  // no request link, so the label would be dead data.
  const missing = items
    .filter(({ item }) => item.kind !== "use-case")
    .filter(
      ({ item }) => item.status === "pending" || item.claimState === "restricted"
    )
    .filter(({ item }) => !item.requestBeamLabel || !item.requestBeamLabel.trim())
    .map(({ item }) => id(item))
  assert.deepEqual(missing, [])
})

test("every workspace grant resolves to an item of that kind", () => {
  const problems: string[] = []
  for (const workspace of catalog.workspaces) {
    for (const [listName, kind, slugsField] of grantLists) {
      const list = catalog[listName] as CatalogContent[]
      const slugs = (workspace as unknown as Record<string, string[] | undefined>)[
        slugsField
      ]
      for (const slug of slugs ?? []) {
        const item = list.find((entry) => entry.slug === slug)
        if (!item) {
          problems.push(`${workspace.slug}: ${slugsField} → ${slug} does not exist`)
          continue
        }
        if (item.kind !== kind) {
          problems.push(`${workspace.slug}: ${slug} has kind ${item.kind}, expected ${kind}`)
        }
        if (!Array.isArray(item.allowedBrandModes)) {
          problems.push(`${workspace.slug}: ${slug} has no allowedBrandModes list`)
        }
      }
    }
  }
  assert.deepEqual(problems, [])
})

test("no partner-visible copy carries an unsourced percentage, multiplier or currency", () => {
  // Pending and restricted bodies render verbatim in preview mode, so no
  // status is exempt. A use case may carry a number only inside a sourced
  // outcome, which lives outside summary/body.
  const patterns = [/\d+\s?%/, /\d+\s?[x×]\b/, /[$€£]/]
  const problems = items
    .filter(({ item }) => !isStaffDraft(item))
    .filter(({ item }) => {
      const sourced = item.kind === "use-case" && (item as CatalogUseCase).outcome?.source
      return !sourced
    })
    .flatMap(({ item }) =>
      patterns
        .filter((pattern) => pattern.test(item.summary) || pattern.test(item.body))
        .map((pattern) => `${id(item)} matches ${pattern}`)
    )
  assert.deepEqual(problems, [])
})

test("no staff draft is granted to a workspace", () => {
  const drafts = new Set(
    items.filter(({ item }) => isStaffDraft(item)).map(({ item }) => item.slug)
  )
  const problems: string[] = []
  for (const workspace of catalog.workspaces) {
    for (const [, , slugsField] of grantLists) {
      const slugs = (workspace as unknown as Record<string, string[] | undefined>)[
        slugsField
      ]
      for (const slug of slugs ?? []) {
        if (drafts.has(slug)) problems.push(`${workspace.slug}: ${slug}`)
      }
    }
  }
  assert.deepEqual(problems, [])
})
