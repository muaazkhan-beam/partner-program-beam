import { parseStore, readStore, subscribeToStore, writeStore } from "./browser-store"

/**
 * Anything a partner has picked up while working a deal: a use case, an FAQ
 * answer, a tool, a deck. Compliance documents stay in `documentSlugs`, which
 * the compliance library and the client's-questions view drive.
 */
export type PackItem = { kind: string; slug: string }

/** What a partner has put together, kept in this browser. */
export type PackState = {
  /**
   * Who the pack is for. Each name gets its own PDF and email from the same
   * contents, so ten clients take ten clicks rather than ten rebuilt decks.
   */
  clients: string[]
  documentSlugs: string[]
  items: PackItem[]
}

export const emptyPack: PackState = {
  clients: [],
  documentSlugs: [],
  items: [],
}

const MAX_CLIENT_NAME = 80

export function packStorageKey(workspaceSlug: string) {
  return `beam-partner-pack:${workspaceSlug}`
}

export function cleanClientName(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_CLIENT_NAME)
}

function uniqueNames(names: readonly string[]) {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of names) {
    const name = cleanClientName(raw)
    const key = name.toLowerCase()
    if (!name || seen.has(key)) continue
    seen.add(key)
    result.push(name)
  }
  return result
}

function normalize(value: Partial<PackState> & { clientName?: unknown }): PackState {
  const clients = Array.isArray(value.clients)
    ? value.clients.filter((name): name is string => typeof name === "string")
    : // Packs saved before several clients existed held one `clientName`.
      typeof value.clientName === "string"
      ? [value.clientName]
      : []
  return {
    clients: uniqueNames(clients),
    documentSlugs: Array.isArray(value.documentSlugs)
      ? [...new Set(value.documentSlugs.filter((slug): slug is string => typeof slug === "string"))]
      : [],
    items: Array.isArray(value.items)
      ? value.items
          .filter(
            (item): item is PackItem =>
              typeof item?.kind === "string" && typeof item?.slug === "string"
          )
          .filter(
            (item, index, all) =>
              all.findIndex((entry) => entry.kind === item.kind && entry.slug === item.slug) === index
          )
          .map((item) => ({ kind: item.kind, slug: item.slug }))
      : [],
  }
}

/**
 * Undo after clearing: what was cleared comes back, and anything added since
 * the clear is kept rather than thrown away.
 */
export function mergePacks(restored: PackState, current: PackState): PackState {
  return normalize({
    clients: [...restored.clients, ...current.clients],
    documentSlugs: [...restored.documentSlugs, ...current.documentSlugs],
    items: [...restored.items, ...current.items],
  })
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

export function addItems(state: PackState, items: readonly PackItem[]): PackState {
  const next = [...state.items]
  for (const item of items) {
    if (!next.some((entry) => entry.kind === item.kind && entry.slug === item.slug)) {
      next.push({ kind: item.kind, slug: item.slug })
    }
  }
  return { ...state, items: next }
}

export function addDocuments(state: PackState, slugs: readonly string[]): PackState {
  return { ...state, documentSlugs: [...new Set([...state.documentSlugs, ...slugs])] }
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

/** Empties the documents only; what was picked elsewhere and the clients stay. */
export function clearDocuments(state: PackState): PackState {
  return { ...state, documentSlugs: [] }
}

export function addClients(state: PackState, names: readonly string[]): PackState {
  return { ...state, clients: uniqueNames([...state.clients, ...names]) }
}

export function removeClient(state: PackState, name: string): PackState {
  return { ...state, clients: state.clients.filter((entry) => entry !== name) }
}

/** Everything in the pack, compliance included: what the header badge counts. */
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

export { subscribeToStore as subscribeToPack }
