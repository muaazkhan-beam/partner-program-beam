"use client"

import { useMemo, useSyncExternalStore } from "react"

import { readStore, subscribeToStore, writeStore } from "./browser-store"

/**
 * One browser-kept table, read through `parse` so a malformed or older value
 * never breaks a page. Every update reads the stored value first, so two
 * quick changes, or two open tabs, add to each other instead of overwriting.
 * These hooks are the seam to Convex: a table moves there by swapping the
 * body of its hook, and no caller changes.
 */
export function useLocalStore<T>(key: string, parse: (raw: string) => T) {
  const raw = useSyncExternalStore(subscribeToStore, () => readStore(key), () => "{}")
  const value = useMemo(() => parse(raw), [raw, parse])
  const update = (change: (current: T) => T) => writeStore(key, change(parse(readStore(key))))
  return { value, update }
}
