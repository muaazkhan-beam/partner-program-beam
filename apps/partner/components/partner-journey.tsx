"use client"

import Link from "next/link"
import { useMemo, useState, useSyncExternalStore } from "react"
import {
  RiArrowRightUpLine,
  RiCheckboxCircleFill,
  RiFocus3Line,
  RiRoadMapLine,
  RiSendPlaneLine,
} from "@remixicon/react"

import { authBypass } from "@/components/providers"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useWorkspace } from "@/components/workspace-context"
import { parseStore, readStore, subscribeToStore, writeStore } from "@/lib/browser-store"
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
// per-workspace table in Convex (see lib/browser-store.ts).
const subscribeToProgress = subscribeToStore
const readProgress = (key: string) => readStore(key, "{}")
const writeProgress = (key: string, progress: Progress) => writeStore(key, progress)
const parseProgress = (raw: string) => parseStore<Progress>(raw, {})

function subscribeToLocation(listener: () => void) {
  window.addEventListener("popstate", listener)
  return () => window.removeEventListener("popstate", listener)
}

function readPhaseParam() {
  const phase = new URLSearchParams(window.location.search).get("phase")
  return phase && journeyPhases.some((entry) => entry.slug === phase)
    ? phase
    : null
}

/** Journey keys other surfaces may tick, e.g. scope:use-case from the workbench. */
export function journeyStorageKey(workspaceSlug: string) {
  return `beam-partner-journey:${workspaceSlug}`
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
  const storageKey = journeyStorageKey(workspace.slug)
  const rawProgress = useSyncExternalStore(
    subscribeToProgress,
    () => readProgress(storageKey),
    () => "{}"
  )
  const progress = useMemo(() => parseProgress(rawProgress), [rawProgress])
  const [chosenSlug, setSelectedSlug] = useState<string | null>(null)
  // A link may open a phase directly (?phase=scope), e.g. from Home.
  const linkedSlug = useSyncExternalStore(
    subscribeToLocation,
    readPhaseParam,
    () => null
  )
  const selectedSlug = chosenSlug ?? linkedSlug
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
  // Every phase is open: no SaaS pathway. Without a link, the page
  // opens on the first phase with something left to tick.
  const firstOpen = phaseDone.indexOf(false)
  const currentIndex = firstOpen === -1 ? 0 : firstOpen
  const ticked = journeyPhases.reduce(
    (sum, phase) =>
      sum + phase.deliverables.filter((deliverable) => isDone(phase, deliverable.id)).length,
    0
  )

  const requestedIndex = journeyPhases.findIndex(
    (phase) => phase.slug === selectedSlug
  )
  const selectedIndex = requestedIndex === -1 ? currentIndex : requestedIndex
  const phase = journeyPhases[selectedIndex]
  if (!phase) return null

  const resources = phase.resources
    .map((resource) => itemsByKey.get(`${resource.kind}:${resource.slug}`))
    .filter((item): item is JourneyItem => Boolean(item))

  function setDeliverable(deliverableId: string, checked: boolean) {
    if (!phase) return
    writeProgress(storageKey, {
      ...progress,
      [deliverableKey(phase, deliverableId)]: checked,
    })
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
            <RiRoadMapLine className="size-5" aria-hidden="true" />
          </div>
          <div className="max-w-2xl">
            <h3 className="text-xl font-medium tracking-tight">
              From the first conversation to handover
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Open the phase your client is in and use what helps. Every phase
              is open; ticking is your own checklist.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {ticked} of {totalDeliverables} ticked
        </p>
      </section>

      <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {journeyPhases.map((item, index) => {
          const done = Boolean(phaseDone[index])
          const selected = index === selectedIndex
          const doneCount = item.deliverables.filter((deliverable) =>
            isDone(item, deliverable.id)
          ).length
          const Icon = done ? RiCheckboxCircleFill : RiFocus3Line
          return (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => setSelectedSlug(item.slug)}
                aria-pressed={selected}
                aria-current={index === currentIndex ? "step" : undefined}
                className={cn(
                  "flex h-full w-full flex-col gap-3 rounded-2xl border bg-card p-4 text-left transition-shadow hover:shadow-md",
                  selected && "border-primary ring-3 ring-primary/15"
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.number}
                  </span>
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium">{item.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {done
                      ? "All ticked"
                      : `${doneCount} of ${item.deliverables.length} ticked`}
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
            {phaseDone[selectedIndex] ? <Badge variant="outline">All ticked</Badge> : null}
          </div>
          <h3 className="mt-2 text-2xl font-medium tracking-tight">
            {phase.name}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {phase.goal}
          </p>
          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium text-muted-foreground">
                What to get done
              </p>
              {ticked > 0 ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() => writeProgress(storageKey, {})}
                >
                  Clear my ticks
                </button>
              ) : null}
            </div>
            <ul className="mt-1 divide-y">
              {phase.deliverables.map((deliverable) => {
                const checked = isDone(phase, deliverable.id)
                return (
                  <li key={deliverable.id}>
                    <label className="flex cursor-pointer gap-3 py-3">
                      <Checkbox
                        className="mt-0.5"
                        checked={checked}
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
              Use any of these, whatever phase you are in.
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
                          <Badge variant="secondary">
                            {item.kind === "use-case" ? "No cited result yet" : "Not published yet"}
                          </Badge>
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
          {phase.surface ? (
            <Link
              className={cn(buttonVariants(), "mt-auto w-full")}
              href={workspacePath(workspace.slug, phase.surface.href)}
            >
              {phase.surface.label}
            </Link>
          ) : null}
          <Link
            className={cn(buttonVariants({ variant: "outline" }), phase.surface ? "w-full" : "mt-auto w-full")}
            href={requestHref(workspace.slug, {
              about: `journey:${phase.slug}`,
              support: phase.requestSupport,
            })}
          >
            <RiSendPlaneLine /> {phase.requestLabel}
          </Link>
        </aside>
      </section>
    </div>
  )
}
