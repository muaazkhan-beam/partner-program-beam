import { journeyPhases } from "../partner-journey"
import type { Phase } from "./types"

/**
 * The lifecycle lives on each client, never as a checklist for the partner.
 * A client's phase decides which shelf of the Library opens first, which
 * questions are offered under the ask box, the order of a pack, and the line
 * the client reads on the cover of what they receive.
 */
export const PHASES: Phase[] = ["win", "scope", "build", "deploy", "monitor", "deliver"]

export const PHASE_LABEL: Record<Phase, string> = {
  win: "Win",
  scope: "Scope",
  build: "Build",
  deploy: "Deploy",
  monitor: "Monitor",
  deliver: "Deliver",
}

/** What the client reads on the cover. Plain words, no partner jargon. */
export const CLIENT_PHASE_LABEL: Record<Phase, string> = {
  win: "Getting started",
  scope: "Choosing a process",
  build: "Building",
  deploy: "Going live",
  monitor: "Running",
  deliver: "Handover",
}

export type ShelfSlug = "know-us" | "sell-with-us" | "marketing" | "security"

/** The shelf a partner usually needs next for a client in each phase. */
export const PHASE_SHELF: Record<Phase, ShelfSlug> = {
  win: "know-us",
  scope: "sell-with-us",
  build: "sell-with-us",
  deploy: "security",
  monitor: "know-us",
  deliver: "marketing",
}

export function isPhase(value: unknown): value is Phase {
  return typeof value === "string" && (PHASES as string[]).includes(value)
}

export function phaseIndex(phase: Phase) {
  return PHASES.indexOf(phase)
}

/** The journey's own name and goal for a phase, for tooltips and the Library pin. */
export function phaseDetail(phase: Phase) {
  const detail = journeyPhases.find((entry) => entry.slug === phase)
  return { name: detail?.name ?? PHASE_LABEL[phase], goal: detail?.goal ?? "" }
}

/**
 * A suggestion only. Security questions usually mean a client is preparing to
 * go live, so a client still in an earlier phase is offered Deploy; the
 * partner confirms or ignores it. A phase never moves on its own.
 */
export function suggestPhase(current: Phase, { security }: { security: boolean }): Phase | null {
  if (security && phaseIndex(current) < phaseIndex("deploy")) return "deploy"
  return null
}
