import catalogJson from "../../convex/generated/catalog.json"
import type {
  CatalogContent,
  CatalogUseCase,
  CatalogWorkspace,
  ContentKind,
  PartnerCatalog,
  UseCaseDetail,
} from "../../convex/catalogTypes"

const catalog = catalogJson as PartnerCatalog

export type { CatalogWorkspace, CatalogContent }

export function listWorkspaces() {
  return catalog.workspaces
}

export function getWorkspaceBySlug(slug: string): CatalogWorkspace | null {
  return catalog.workspaces.find((workspace) => workspace.slug === slug) ?? null
}

/**
 * The catalog stores a use case's structured fields at the top level, while
 * Convex nests them under `useCase`. Normalise here so both data paths hand
 * components the same shape — otherwise the bypass path silently loses the
 * fields the use case renderer depends on.
 */
function withUseCaseDetail(item: CatalogUseCase): CatalogContent & {
  useCase: UseCaseDetail
} {
  return {
    ...item,
    useCase: {
      vertical: item.vertical,
      department: item.department,
      systems: item.systems,
      trigger: item.trigger,
      before: item.before,
      after: item.after,
      humanInLoop: item.humanInLoop,
      outcome: item.outcome,
      timeToProduction: item.timeToProduction,
      complexity: item.complexity,
    },
  }
}

function allItems() {
  return [
    ...catalog.tools,
    ...catalog.materials,
    ...catalog.faq,
    ...catalog.playbooks,
    ...catalog.useCases.map(withUseCaseDetail),
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
          : kind === "use-case"
            ? (workspace.useCaseSlugs ?? [])
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
