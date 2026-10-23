import catalogJson from "../../convex/generated/catalog.json"
import demoJson from "./demo.generated.json"
import type {
  CatalogComplianceDocument,
  CatalogContent,
  CatalogUseCase,
  CatalogWorkspace,
  ContentKind,
  PartnerCatalog,
  UseCaseDetail,
} from "../../convex/catalogTypes"

const catalog = catalogJson as PartnerCatalog

/** Written for the demo, not reviewed by Beam; see catalog/demo/demo.yaml. */
const demo = demoJson as {
  workspaces: string[]
  faq: CatalogContent[]
  useCases: CatalogUseCase[]
}

export type { CatalogWorkspace, CatalogContent, CatalogComplianceDocument }

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

/** True for the demo workspace, the only place demo content may be sent from. */
export function isDemoWorkspace(slug: string) {
  const workspace = getWorkspaceBySlug(slug)
  return Boolean(workspace?.demo && demo.workspaces.includes(workspace.slug))
}

function demoItems(slug: string) {
  if (!isDemoWorkspace(slug)) return []
  return [...demo.faq, ...demo.useCases.map(withUseCaseDetail)]
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
  const real = allItems().filter(
    (item) =>
      item.kind === kind &&
      granted.includes(item.slug) &&
      item.claimState !== "staff-draft" &&
      item.contentClass !== "staff-draft"
  )
  return [...real, ...demoItems(slug).filter((item) => item.kind === kind)]
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

/** The compliance documents granted to a workspace, in catalog order. */
export function listWorkspaceCompliance(slug: string): CatalogComplianceDocument[] {
  const workspace = getWorkspaceBySlug(slug)
  if (!workspace) return []
  const granted = new Set(workspace.complianceSlugs ?? [])
  return catalog.compliance.filter((item) => granted.has(item.slug))
}

/**
 * The "Security and compliance pack" record lists eight policies by hand; where
 * a workspace holds the library, every page sends a partner there instead, so
 * the pack never reads as a stale document beside its own button.
 */
export function isLibraryPack(slug: string, item: { slug: string }) {
  return item.slug === "security-compliance-pack" && listWorkspaceCompliance(slug).length > 0
}
