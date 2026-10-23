import { parseStore, readStore, subscribeToStore, writeStore } from "./browser-store"
import type { ScopedProcess } from "./scope"

export type ScopeState = { version: 2; processes: ScopedProcess[] }
export const emptyScope: ScopeState = { version: 2, processes: [] }

export function scopeStorageKey(workspaceSlug: string) {
  return `beam-partner-scope:${workspaceSlug}`
}

export function parseScopeState(raw: string): ScopeState {
  const parsed = parseStore<Partial<ScopeState>>(raw, emptyScope)
  return {
    version: 2,
    processes: Array.isArray(parsed.processes)
      ? parsed.processes.filter(
          (process): process is ScopedProcess =>
            Boolean(process) &&
            typeof process.id === "string" &&
            typeof process.useCaseSlug === "string"
        )
      : [],
  }
}

export function readScopeRaw(workspaceSlug: string) {
  return readStore(scopeStorageKey(workspaceSlug), JSON.stringify(emptyScope))
}

export function readScopeState(workspaceSlug: string) {
  return parseScopeState(readScopeRaw(workspaceSlug))
}

export function writeScopeState(workspaceSlug: string, state: ScopeState) {
  writeStore(scopeStorageKey(workspaceSlug), state)
}

export function upsertProcess(state: ScopeState, process: ScopedProcess): ScopeState {
  const next = { ...process, updatedAt: Date.now() }
  const exists = state.processes.some((entry) => entry.id === process.id)
  return {
    version: 2,
    processes: exists
      ? state.processes.map((entry) => (entry.id === process.id ? next : entry))
      : [...state.processes, next],
  }
}

export function removeProcess(state: ScopeState, id: string): ScopeState {
  return { version: 2, processes: state.processes.filter((entry) => entry.id !== id) }
}

export function readProcessById(workspaceSlug: string, id: string) {
  return readScopeState(workspaceSlug).processes.find((entry) => entry.id === id) ?? null
}

export { subscribeToStore as subscribeToScope }
