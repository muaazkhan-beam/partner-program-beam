import catalogJson from "../../convex/generated/catalog.json"
import type {
  CatalogContent,
  CatalogWorkspace,
  ContentKind,
  PartnerCatalog,
} from "../../convex/catalogTypes"

const catalog = catalogJson as PartnerCatalog

export type { CatalogWorkspace, CatalogContent }

export function listWorkspaces() {
  return catalog.workspaces
}

export function getWorkspaceBySlug(slug: string): CatalogWorkspace | null {
  return catalog.workspaces.find((workspace) => workspace.slug === slug) ?? null
}

function allItems() {
  return [
    ...catalog.tools,
    ...catalog.materials,
    ...catalog.faq,
    ...catalog.playbooks,
  ]
}

export function listWorkspaceItems(slug: string, kind: ContentKind) {
  const workspace = getWorkspaceBySlug(slug)
  if (!workspace) return []
  const granted =
    kind === "tool"
      ? workspace.toolSlugs
      : kind === "material"
        ? workspace.materialSlugs
        : kind === "faq"
          ? workspace.faqSlugs
          : workspace.playbookSlugs
  return allItems().filter(
    (item) =>
      item.kind === kind &&
      granted.includes(item.slug) &&
      item.claimState !== "staff-draft" &&
      item.contentClass !== "staff-draft"
  )
}

export function getWorkspaceItem(
  slug: string,
  kind: ContentKind,
  itemSlug: string
) {
  return (
    listWorkspaceItems(slug, kind).find((item) => item.slug === itemSlug) ??
    null
  )
}
