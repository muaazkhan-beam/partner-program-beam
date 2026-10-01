import { parseStore, readStore, subscribeToStore, writeStore } from "./browser-store"

/** What a partner has put together for one client, kept in this browser. */
export type PackState = {
  clientName: string
  documentSlugs: string[]
}

export const emptyPack: PackState = { clientName: "", documentSlugs: [] }

export function packStorageKey(workspaceSlug: string) {
  return `beam-partner-pack:${workspaceSlug}`
}

function normalize(value: Partial<PackState>): PackState {
  return {
    clientName: typeof value.clientName === "string" ? value.clientName : "",
    documentSlugs: Array.isArray(value.documentSlugs)
      ? value.documentSlugs.filter((slug): slug is string => typeof slug === "string")
      : [],
  }
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
