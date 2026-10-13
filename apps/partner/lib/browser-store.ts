// A tiny per-browser store shared by the journey, the client pack and the
// scope workbench: localStorage when available, an in-memory copy when it is
// blocked, and a subscription that fires on writes from this tab and on the
// `storage` event from other tabs. Progress and drafts live here until they
// move to per-workspace tables in Convex.
const memory = new Map<string, string>()
const listeners = new Set<() => void>()

export function subscribeToStore(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

export function readStore(key: string, fallback = "{}") {
  // A write that storage refused (blocked, or full) lives in memory; it wins
  // over the older stored copy until the visit ends.
  const remembered = memory.get(key)
  if (remembered !== undefined && failed.has(key)) return remembered
  try {
    const stored = window.localStorage.getItem(key)
    if (stored !== null) return stored
  } catch {
    // Storage is blocked; fall back to the in-memory copy.
  }
  return remembered ?? fallback
}

const failed = new Set<string>()

/** Returns false when the browser refused to keep the write beyond this visit. */
export function writeStore(key: string, value: unknown) {
  const raw = JSON.stringify(value)
  memory.set(key, raw)
  let kept = true
  try {
    window.localStorage.setItem(key, raw)
    failed.delete(key)
  } catch {
    // Storage is blocked or full; the in-memory copy lasts for this visit.
    failed.add(key)
    kept = false
  }
  listeners.forEach((listener) => listener())
  return kept
}

export function removeStore(key: string) {
  memory.delete(key)
  failed.delete(key)
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Nothing stored to remove.
  }
  listeners.forEach((listener) => listener())
}

/** Every key under a prefix, stored or only in memory. */
export function listStoreKeys(prefix: string) {
  const keys = new Set([...memory.keys()].filter((key) => key.startsWith(prefix)))
  try {
    for (let index = 0; index < window.localStorage.length; index++) {
      const key = window.localStorage.key(index)
      if (key?.startsWith(prefix)) keys.add(key)
    }
  } catch {
    // Storage is blocked; memory holds everything.
  }
  return [...keys]
}

/** Parse a stored value defensively; anything malformed becomes the fallback. */
export function parseStore<T>(raw: string, fallback: T): T {
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}
