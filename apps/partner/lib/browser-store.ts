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
  try {
    const stored = window.localStorage.getItem(key)
    if (stored !== null) return stored
  } catch {
    // Storage is blocked; fall back to the in-memory copy.
  }
  return memory.get(key) ?? fallback
}

export function writeStore(key: string, value: unknown) {
  const raw = JSON.stringify(value)
  memory.set(key, raw)
  try {
    window.localStorage.setItem(key, raw)
  } catch {
    // Storage is blocked; the in-memory copy lasts for this visit.
  }
  listeners.forEach((listener) => listener())
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
