import { journeyPhases } from "./partner-journey"

/**
 * The lifecycle every surface follows: the journey's phases,
 * from winning the client to handing over. Each item's phase comes from the
 * journey's own resource lists first, which already say where a tool, answer
 * or material is used; catalog groups only fill the gaps, so the upstream
 * tool and FAQ data is never rewritten to fit.
 */

const GROUP_PHASE: Record<string, string> = {
  "Know Beam": "win",
  "Sell with Beam": "win",
  Sell: "win",
  Prove: "build",
  Scope: "scope",
  "Scope and deliver": "scope",
  "Security and compliance": "deploy",
}

const RESOURCE_PHASE = new Map<string, string>()
for (const phase of journeyPhases) {
  for (const resource of phase.resources) {
    const key = `${resource.kind}:${resource.slug}`
    if (!RESOURCE_PHASE.has(key)) RESOURCE_PHASE.set(key, phase.slug)
  }
}

type Placeable = { kind: string; slug: string; group?: string }

export function phaseOf(item: Placeable): string | null {
  return (
    RESOURCE_PHASE.get(`${item.kind}:${item.slug}`) ??
    (item.group ? GROUP_PHASE[item.group] : undefined) ??
    null
  )
}

export type LifecycleGroup<T> = {
  slug: string
  name: string
  number?: string
  items: T[]
}

/**
 * Items grouped by phase, in lifecycle order, with anything outside it in one
 * last group. Empty phases are left out; input order is kept inside a phase.
 */
export function groupByLifecycle<T extends Placeable>(
  items: readonly T[],
  rest: { slug: string; name: string }
): LifecycleGroup<T>[] {
  const groups: LifecycleGroup<T>[] = journeyPhases.map((phase) => ({
    slug: phase.slug,
    name: phase.name,
    number: phase.number,
    items: [],
  }))
  const outside: LifecycleGroup<T> = { ...rest, items: [] }
  for (const item of items) {
    const phase = phaseOf(item)
    const group = groups.find((entry) => entry.slug === phase)
    ;(group ?? outside).items.push(item)
  }
  return [...groups, outside].filter((group) => group.items.length > 0)
}
