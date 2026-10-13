"use client"

import Link from "next/link"
import {
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react"
import {
  RiArrowDownSLine,
  RiArrowRightLine,
  RiBookOpenLine,
  RiFileTextLine,
  RiQuestionLine,
  RiSendPlaneLine,
  RiStackLine,
  RiToolsLine,
  type RemixiconComponentType,
} from "@remixicon/react"

import { authBypass } from "@/components/providers"
import { AddToPack } from "@/components/add-to-pack"
import { ItemClaimBadge } from "@/components/claim-state"
import { buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useWorkspace } from "@/components/workspace-context"
import {
  parseStore,
  readStore,
  subscribeToStore,
  writeStore,
} from "@/lib/browser-store"
import { isLibraryPack, listWorkspaceItems } from "@/lib/catalog/static"
import {
  journeyPhases,
  type JourneyPhase,
  type JourneyResourceKind,
} from "@/lib/partner-journey"
import { requestHref } from "@/lib/request-links"
import { cn } from "@/lib/utils"
import type { PackContent } from "@/lib/pack"
import { workspacePath } from "@/lib/workspace-resolver"
import { api } from "@partner/convex/_generated/api"
import { useQuery } from "convex/react"

type JourneyItem = PackContent & {
  kind: JourneyResourceKind
  status?: "pending"
}

type Progress = Record<string, boolean>

const kindLabel: Record<JourneyResourceKind, string> = {
  tool: "Tool",
  material: "Material",
  faq: "FAQ",
  playbook: "Playbook",
  "use-case": "Use case",
}

const kindIcon: Record<JourneyResourceKind, RemixiconComponentType> = {
  tool: RiToolsLine,
  material: RiFileTextLine,
  faq: RiQuestionLine,
  playbook: RiBookOpenLine,
  "use-case": RiStackLine,
}

const totalDeliverables = journeyPhases.reduce(
  (sum, phase) => sum + phase.deliverables.length,
  0
)

// Prototype persistence: progress lives in this browser until it moves to a
// per-workspace table in Convex (see lib/browser-store.ts).
const subscribeToProgress = subscribeToStore
const readProgress = (key: string) => readStore(key, "{}")
const writeProgress = (key: string, progress: Progress) =>
  writeStore(key, progress)
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

/** The tick for one deliverable, as stored; Home reads the same keys. */
export function deliverableKey(phase: JourneyPhase, deliverableId: string) {
  return `${phase.slug}:${deliverableId}`
}

function resourceHref(workspaceSlug: string, item: JourneyItem) {
  if (isLibraryPack(workspaceSlug, item)) {
    return workspacePath(workspaceSlug, "/compliance")
  }
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
  ).flatMap((kind) => listWorkspaceItems(workspace.slug, kind) as JourneyItem[])
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

/**
 * Six phases as tiles, then the chosen phase as one card: its actions first,
 * its checklist with the detail folded under each line, and what done looks
 * like. Resources sit beside it as rows. Every phase is open; nothing here
 * is a gate.
 */
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
  // Which deliverable shows its detail; by default the first one left to do.
  const [opened, setOpened] = useState<{
    phase: string
    id: string | null
  } | null>(null)
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
      sum +
      phase.deliverables.filter((deliverable) => isDone(phase, deliverable.id))
        .length,
    0
  )

  const requestedIndex = journeyPhases.findIndex(
    (phase) => phase.slug === selectedSlug
  )
  const selectedIndex = requestedIndex === -1 ? currentIndex : requestedIndex
  const phase = journeyPhases[selectedIndex]
  if (!phase) return null
  const next = journeyPhases[selectedIndex + 1]

  const resources = phase.resources
    .map((resource) => itemsByKey.get(`${resource.kind}:${resource.slug}`))
    .filter((item): item is JourneyItem => Boolean(item))
  const firstLeft = phase.deliverables.find(
    (deliverable) => !isDone(phase, deliverable.id)
  )
  const openedId =
    opened?.phase === phase.slug ? opened.id : (firstLeft?.id ?? null)

  function setDeliverable(deliverableId: string, checked: boolean) {
    if (!phase) return
    writeProgress(storageKey, {
      ...progress,
      [deliverableKey(phase, deliverableId)]: checked,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {ticked} of {totalDeliverables} ticked
        </p>
        {ticked > 0 ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
            onClick={() => writeProgress(storageKey, {})}
          >
            Clear my ticks
          </button>
        ) : null}
      </div>

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {journeyPhases.map((item, index) => {
          const done = Boolean(phaseDone[index])
          const selected = index === selectedIndex
          const doneCount = item.deliverables.filter((deliverable) =>
            isDone(item, deliverable.id)
          ).length
          return (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => setSelectedSlug(item.slug)}
                aria-pressed={selected}
                aria-current={index === currentIndex ? "step" : undefined}
                className={cn(
                  "pressable bg-card hover:border-primary/30 hover:shadow-lift flex h-full w-full flex-col rounded-xl border p-3 text-left",
                  selected &&
                    "border-primary ring-primary/15 hover:border-primary ring-3"
                )}
              >
                <span className="text-muted-foreground text-xs tabular-nums">
                  {item.number}
                </span>
                <span className="mt-1 block font-medium">{item.name}</span>
                <span className="text-muted-foreground mt-0.5 block text-xs">
                  {done
                    ? "All ticked"
                    : `${doneCount} of ${item.deliverables.length} ticked`}
                </span>
                <span
                  className="bg-muted mt-3 block h-1 w-full overflow-hidden rounded-full"
                  aria-hidden="true"
                >
                  <span
                    className="bg-primary ease-out-quint block h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${(doneCount / item.deliverables.length) * 100}%`,
                    }}
                  />
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
        <article
          key={phase.slug}
          className="rise-in bg-card rounded-xl border p-5 sm:p-6"
        >
          <h3 className="text-xl font-medium tracking-tight">{phase.name}</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {phase.goal}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {phase.surface ? (
              <Link
                className={buttonVariants()}
                href={workspacePath(workspace.slug, phase.surface.href)}
              >
                {phase.surface.label} <RiArrowRightLine aria-hidden="true" />
              </Link>
            ) : null}
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={requestHref(workspace.slug, {
                about: `journey:${phase.slug}`,
                support: phase.requestSupport,
              })}
            >
              <RiSendPlaneLine aria-hidden="true" /> {phase.requestLabel}
            </Link>
          </div>

          <p className="text-muted-foreground mt-6 border-b pb-2 text-xs font-medium">
            What to get done
          </p>
          <ul className="divide-y">
            {phase.deliverables.map((deliverable) => {
              const checked = isDone(phase, deliverable.id)
              const open = openedId === deliverable.id
              const panelId = `journey-${phase.slug}-${deliverable.id}`
              return (
                <li key={deliverable.id} className="py-2.5">
                  <div className="flex items-start gap-3">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 py-0.5">
                      <Checkbox
                        className="mt-1"
                        checked={checked}
                        onCheckedChange={(value) =>
                          setDeliverable(deliverable.id, value)
                        }
                      />
                      <span
                        className={cn(
                          "text-sm font-medium transition-colors duration-200",
                          checked && "text-muted-foreground line-through"
                        )}
                      >
                        {deliverable.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={panelId}
                      aria-label={
                        open
                          ? `Hide how: ${deliverable.title}`
                          : `Show how: ${deliverable.title}`
                      }
                      onClick={() =>
                        setOpened({
                          phase: phase.slug,
                          id: open ? null : deliverable.id,
                        })
                      }
                      className="pressable text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-md focus-visible:ring-3 focus-visible:outline-none"
                    >
                      <RiArrowDownSLine
                        className={cn(
                          "ease-out-quint size-4 transition-transform duration-200",
                          open && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  <div
                    id={panelId}
                    className="expand-grid pl-7"
                    data-open={open}
                    inert={!open}
                  >
                    <div>
                      <p className="text-muted-foreground pt-1 pb-1 text-sm leading-6">
                        {deliverable.detail}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="bg-muted/40 mt-4 rounded-lg p-4">
            <p className="text-muted-foreground text-xs font-medium">
              Done when
            </p>
            <p className="mt-1 text-sm leading-6">{phase.exit}</p>
            {phaseDone[selectedIndex] && next ? (
              <button
                type="button"
                className="pressable text-primary mt-2 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
                onClick={() => setSelectedSlug(next.slug)}
              >
                All ticked. Next: {next.name}{" "}
                <RiArrowRightLine className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </article>

        <aside className="bg-card rounded-xl border lg:sticky lg:top-20">
          <div className="flex items-baseline justify-between gap-3 border-b px-4 py-3">
            <h3 className="text-sm font-medium">Resources for this phase</h3>
            <span className="text-muted-foreground text-xs">
              {items === undefined ? "" : resources.length}
            </span>
          </div>
          {items === undefined ? (
            <p className="text-muted-foreground p-4 text-sm">
              Loading resources…
            </p>
          ) : resources.length === 0 ? (
            <p className="text-muted-foreground p-4 text-sm">
              No resources for this phase are attached to this workspace yet.
            </p>
          ) : (
            <ul className="divide-y">
              {resources.map((item, index) => {
                const Icon = kindIcon[item.kind]
                return (
                  <li
                    key={`${item.kind}:${item.slug}`}
                    className="rise-in focus-within:bg-muted/40 hover:bg-muted/40 relative flex flex-col gap-2 p-3 transition-colors"
                    style={{ "--i": index } as CSSProperties}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={resourceHref(workspace.slug, item)}
                          className="block text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none"
                        >
                          {item.title}
                        </Link>
                        <p className="text-muted-foreground line-clamp-1 text-xs leading-5">
                          {item.summary}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {isLibraryPack(workspace.slug, item) ? "Library" : kindLabel[item.kind]}
                          {item.kind === "use-case" && item.status === "pending"
                            ? " · No cited result yet"
                            : null}
                        </p>
                      </div>
                    </div>
                    <div className="relative z-10 flex flex-wrap items-center gap-2 pl-11">
                      {item.kind === "tool" || isLibraryPack(workspace.slug, item) ? (
                        <span
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                        aria-hidden="true"
                      >
                        Open{isLibraryPack(workspace.slug, item) ? " the library" : null}{" "}
                        <RiArrowRightLine className="size-4" />
                      </span>
                      ) : (
                        <>
                          <ItemClaimBadge item={item} />
                          <AddToPack
                            kind={item.kind}
                            slug={item.slug}
                            label={item.title}
                            item={item}
                          />
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </section>
    </div>
  )
}
