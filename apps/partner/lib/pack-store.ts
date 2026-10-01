import { parseStore, readStore, subscribeToStore, writeStore } from "./browser-store"

/**
 * Anything else a partner has picked up while working a deal — a use case, an
 * FAQ answer, a tool, a deck. Compliance documents stay in `documentSlugs`,
 * which the compliance library and questionnaire already drive.
 */
export type PackItem = { kind: string; slug: string }

/** What a partner has put together for one client, kept in this browser. */
export type PackState = {
  clientName: string
  documentSlugs: string[]
  items: PackItem[]
}

export const emptyPack: PackState = {
  clientName: "",
  documentSlugs: [],
  items: [],
}

export function packStorageKey(workspaceSlug: string) {
  return `beam-partner-pack:${workspaceSlug}`
}

function normalize(value: Partial<PackState>): PackState {
  return {
    clientName: typeof value.clientName === "string" ? value.clientName : "",
    documentSlugs: Array.isArray(value.documentSlugs)
      ? value.documentSlugs.filter((slug): slug is string => typeof slug === "string")
      : [],
    items: Array.isArray(value.items)
      ? value.items.filter(
          (item): item is PackItem =>
            typeof item?.kind === "string" && typeof item?.slug === "string"
        )
      : [],
  }
}

export function hasItem(state: PackState, kind: string, slug: string) {
  return state.items.some((item) => item.kind === kind && item.slug === slug)
}

export function toggleItem(
  state: PackState,
  kind: string,
  slug: string
): PackState {
  return {
    ...state,
    items: hasItem(state, kind, slug)
      ? state.items.filter((item) => !(item.kind === kind && item.slug === slug))
      : [...state.items, { kind, slug }],
  }
}

/** Everything in the pack, compliance included — what the cart badge counts. */
export function packCount(state: PackState) {
  return state.documentSlugs.length + state.items.length
}

export function parsePackState(raw: string): PackState {
  return normalize(parseStore<Partial<PackState>>(raw, {}))
}

export function readPackRaw(workspaceSlug: string) {
  return readStore(packStorageKey(workspaceSlug), "{}")
}

export function readPackState(workspaceSlug: string): PackState {
  return parsePackState(readPackRaw(workspaceSlug))
}

export function writePackState(workspaceSlug: string, state: PackState) {
  writeStore(packStorageKey(workspaceSlug), normalize(state))
}

export function toggleDocument(state: PackState, slug: string): PackState {
  const has = state.documentSlugs.includes(slug)
  return {
    ...state,
    documentSlugs: has
      ? state.documentSlugs.filter((entry) => entry !== slug)
      : [...state.documentSlugs, slug],
  }
}

export { subscribeToStore as subscribeToPack }
