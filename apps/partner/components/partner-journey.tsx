"use client"

import Link from "next/link"
import { useMemo, useState, useSyncExternalStore } from "react"
import {
  RiArrowRightUpLine,
  RiCheckboxCircleFill,
  RiFocus3Line,
  RiLock2Line,
  RiRefreshLine,
  RiRoadMapLine,
  RiSendPlaneLine,
} from "@remixicon/react"

import { authBypass } from "@/components/providers"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useWorkspace } from "@/components/workspace-context"
import { listWorkspaceItems } from "@/lib/catalog/static"
import {
  journeyPhases,
  type JourneyPhase,
  type JourneyResourceKind,
} from "@/lib/partner-journey"
import { requestHref } from "@/lib/request-links"
import { cn } from "@/lib/utils"
import { workspacePath } from "@/lib/workspace-resolver"
import { api } from "@partner/convex/_generated/api"
import { useQuery } from "convex/react"

type JourneyItem = {
  kind: JourneyResourceKind
  slug: string
  title: string
  summary: string
  status?: string
}

type Progress = Record<string, boolean>

const kindLabel: Record<JourneyResourceKind, string> = {
  tool: "Tool",
  material: "Material",
  faq: "FAQ",
  playbook: "Playbook",
  "use-case": "Use case",
}

const totalDeliverables = journeyPhases.reduce(
  (sum, phase) => sum + phase.deliverables.length,
  0
)

// Prototype persistence: progress lives in this browser until it moves to a
// per-workspace table in Convex. The in-memory copy covers blocked storage.
const memoryProgress = new Map<string, string>()
const progressListeners = new Set<() => void>()

function subscribeToProgress(listener: () => void) {
  progressListeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    progressListeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function readProgress(key: string) {
  try {
    const stored = window.localStorage.getItem(key)
    if (stored !== null) return stored
  } catch {
    // Storage is blocked; fall back to the in-memory copy.
  }
  return memoryProgress.get(key) ?? "{}"
}

function writeProgress(key: string, progress: Progress) {
  const value = JSON.stringify(progress)
  memoryProgress.set(key, value)
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage is blocked; the in-memory copy lasts for this visit.
  }
  progressListeners.forEach((listener) => listener())
}

function parseProgress(raw: string): Progress {
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? (parsed as Progress) : {}
  } catch {
    return {}
  }
}

function deliverableKey(phase: JourneyPhase, deliverableId: string) {
  return `${phase.slug}:${deliverableId}`
}

function resourceHref(workspaceSlug: string, item: JourneyItem) {
  if (item.kind === "faq") {
    return workspacePath(workspaceSlug, `/faq/${item.slug}`)
  }
  if (item.kind === "tool") {
    return workspacePath(workspaceSlug, `/tools/${item.slug}`)
  }
  if (item.kind === "use-case") {
    return workspacePath(workspaceSlug, `/use-cases/${item.slug}`)
  }
  return workspacePath(workspaceSlug, `/materials/${item.slug}`)
}

export function PartnerJourney() {
  if (authBypass) return <BypassPartnerJourney />
  return <LivePartnerJourney />
}

function BypassPartnerJourney() {
  const workspace = useWorkspace()
  const items = (
    ["tool", "material", "faq", "playbook", "use-case"] as const
  ).flatMap(
    (kind) => listWorkspaceItems(workspace.slug, kind) as JourneyItem[]
  )
  return <JourneyBody items={items} />
}

function LivePartnerJourney() {
  const workspace = useWorkspace()
  const workspaceId = workspace.workspaceId as never
  const tools = useQuery(api.partner.listContent, { workspaceId, kind: "tool" })
  const materials = useQuery(api.partner.listContent, {
    workspaceId,
    kind: "material",
  })
  const faq = useQuery(api.partner.listContent, { workspaceId, kind: "faq" })
  const playbooks = useQuery(api.partner.listContent, {
    workspaceId,
    kind: "playbook",
  })
  const useCases = useQuery(api.partner.listContent, {
    workspaceId,
    kind: "use-case",
  })
  const items =
    tools && materials && faq && playbooks && useCases
      ? ([
          ...tools,
          ...materials,
          ...faq,
          ...playbooks,
          ...useCases,
        ] as JourneyItem[])
      : undefined
  return <JourneyBody items={items} />
}

function JourneyBody({ items }: { items: JourneyItem[] | undefined }) {
  const workspace = useWorkspace()
  const storageKey = `beam-partner-journey:${workspace.slug}`
  const rawProgress = useSyncExternalStore(
    subscribeToProgress,
    () => readProgress(storageKey),
    () => "{}"
  )
  const progress = useMemo(() => parseProgress(rawProgress), [rawProgress])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const itemsByKey = useMemo(
    () =>
      new Map(
        items?.map((item) => [`${item.kind}:${item.slug}`, item] as const)
      ),
    [items]
  )

  const isDone = (phase: JourneyPhase, deliverableId: string) =>
    Boolean(progress[deliverableKey(phase, deliverableId)])
  const phaseDone = journeyPhases.map((phase) =>
    phase.deliverables.every((deliverable) => isDone(phase, deliverable.id))
  )
  const firstOpen = phaseDone.indexOf(false)
  const currentIndex = firstOpen === -1 ? journeyPhases.length - 1 : firstOpen
  const isUnlocked = (index: number) => firstOpen === -1 || index <= firstOpen
  const completedPhases = phaseDone.filter(Boolean).length
  const completedDeliverables = journeyPhases.reduce(
    (sum, phase, index) =>
      isUnlocked(index)
        ? sum +
          phase.deliverables.filter((deliverable) =>
            isDone(phase, deliverable.id)
          ).length
        : sum,
    0
  )
  const percent = Math.round((completedDeliverables / totalDeliverables) * 100)

  const requestedIndex = journeyPhases.findIndex(
    (phase) => phase.slug === selectedSlug
  )
  const selectedIndex = requestedIndex === -1 ? currentIndex : requestedIndex
  const phase = journeyPhases[selectedIndex]
  if (!phase) return null

  const phaseLocked = !isUnlocked(selectedIndex)
  const blockingPhase = firstOpen === -1 ? undefined : journeyPhases[firstOpen]
  const resources = phase.resources
    .map((resource) => itemsByKey.get(`${resource.kind}:${resource.slug}`))
    .filter((item): item is JourneyItem => Boolean(item))

  function setDeliverable(deliverableId: string, checked: boolean) {
    if (!phase || phaseLocked) return
    writeProgress(storageKey, {
      ...progress,
      [deliverableKey(phase, deliverableId)]: checked,
    })
  }

  return (
    <div className="space-y-8">
      <section className="partner-cert-hero relative isolate overflow-hidden rounded-3xl border border-white/10 p-6 text-white shadow-2xl sm:p-8 lg:p-10">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
          <div className="max-w-2xl space-y-5">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
              <RiRoadMapLine className="size-6" />
            </div>
            <div className="space-y-3">
              <p className="font-mono text-[11px] tracking-[0.22em] text-white/55 uppercase">
                {workspace.displayName} · Partner journey
              </p>
              <h3 className="text-3xl font-medium tracking-[-0.035em] text-balance sm:text-5xl">
                Scope it. Build it. Ship it. Prove it. Hand it over.
              </h3>
              <p className="max-w-xl text-sm leading-7 text-white/65 sm:text-base">
                One client process from scope to delivery. Each phase unlocks
                when the one before it is done, and every resource stays open
                the whole way.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/12 bg-black/20 p-5 backdrop-blur">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Phases complete</span>
              <span className="font-medium">
                {completedPhases} of {journeyPhases.length}
              </span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-white transition-[width]"
                style={{ width: `${Math.max(percent, 4)}%` }}
              />
            </div>
            <p className="mt-4 text-xs leading-5 text-white/50">
              {completedDeliverables} of {totalDeliverables} deliverables done.
              Prototype: progress is saved in this browser only.
            </p>
          </div>
        </div>
      </section>

      <ol className="grid gap-3 sm:grid-cols-5">
        {journeyPhases.map((item, index) => {
          const done = Boolean(phaseDone[index])
          const unlocked = isUnlocked(index)
          const selected = index === selectedIndex
          const doneCount = item.deliverables.filter((deliverable) =>
            isDone(item, deliverable.id)
          ).length
          const Icon = done
            ? RiCheckboxCircleFill
            : unlocked
              ? RiFocus3Line
              : RiLock2Line
          return (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => setSelectedSlug(item.slug)}
                aria-pressed={selected}
                aria-current={index === currentIndex ? "step" : undefined}
                className={cn(
                  "flex h-full w-full flex-col gap-3 rounded-2xl border bg-card p-4 text-left transition-shadow hover:shadow-md",
                  selected && "border-primary ring-3 ring-primary/15",
                  !unlocked && "bg-muted/40"
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.number}
                  </span>
                  <Icon
                    className={cn(
                      "size-4",
                      unlocked ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </span>
                <span>
                  <span className="block font-medium">{item.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {done
                      ? "Complete"
                      : unlocked
                        ? `${doneCount} of ${item.deliverables.length} done`
                        : "Locked"}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">
              {phase.eyebrow}
            </p>
            {phaseLocked ? (
              <Badge variant="outline">
                <RiLock2Line /> Locked
              </Badge>
            ) : phaseDone[selectedIndex] ? (
              <Badge>Complete</Badge>
            ) : (
              <Badge variant="outline">In progress</Badge>
            )}
          </div>
          <h3 className="mt-2 text-2xl font-medium tracking-tight">
            {phase.name}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {phase.goal}
          </p>
          {phaseLocked && blockingPhase ? (
            <p className="mt-4 rounded-xl border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
              Unlocks when {blockingPhase.name} is complete. Every resource for
              this phase is already open.
            </p>
          ) : null}
          <div className="mt-6">
            <p className="text-xs font-medium text-muted-foreground">
              Deliverables
            </p>
            <ul className="mt-1 divide-y">
              {phase.deliverables.map((deliverable) => {
                const checked = isDone(phase, deliverable.id)
                return (
                  <li key={deliverable.id}>
                    <label
                      className={cn(
                        "flex gap-3 py-3",
                        phaseLocked
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer"
                      )}
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={checked}
                        disabled={phaseLocked}
                        onCheckedChange={(value) =>
                          setDeliverable(deliverable.id, value)
                        }
                      />
                      <span>
                        <span
                          className={cn(
                            "block text-sm font-medium",
                            checked && "text-muted-foreground line-through"
                          )}
                        >
                          {deliverable.title}
                        </span>
                        <span className="mt-0.5 block text-sm leading-6 text-muted-foreground">
                          {deliverable.detail}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="mt-4 rounded-xl bg-muted/40 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Done when
            </p>
            <p className="mt-1 text-sm leading-6">{phase.exit}</p>
          </div>
        </article>

        <aside className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:p-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Resources for this phase
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Open to every approved partner, whatever phase you are in.
            </p>
          </div>
          {items === undefined ? (
            <p className="text-sm text-muted-foreground">Loading resources…</p>
          ) : resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No resources for this phase are attached to this workspace yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {resources.map((item) => (
                <li key={`${item.kind}:${item.slug}`}>
                  <Link
                    href={resourceHref(workspace.slug, item)}
                    className="group flex items-start justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{kindLabel[item.kind]}</Badge>
                        {item.status === "pending" ? (
                          <Badge variant="secondary">Pending</Badge>
                        ) : null}
                      </span>
                      <span className="mt-2 block text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                        {item.summary}
                      </span>
                    </span>
                    <RiArrowRightUpLine className="mt-1 size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            className={cn(buttonVariants({ variant: "outline" }), "mt-auto w-full")}
            href={requestHref(workspace.slug, {
              about: `journey:${phase.slug}`,
              support: phase.requestSupport,
            })}
          >
            <RiSendPlaneLine /> {phase.requestLabel}
          </Link>
        </aside>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-muted/30 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div>
          <p className="font-medium">Progress is gated. Content is not.</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            A phase unlocks when the one before it is complete, so the next step
            is always clear. Every resource stays open to approved partners
            throughout.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="w-fit bg-background">
            Prototype
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => writeProgress(storageKey, {})}
          >
            <RiRefreshLine /> Reset progress
          </Button>
        </div>
      </section>
    </div>
  )
}
