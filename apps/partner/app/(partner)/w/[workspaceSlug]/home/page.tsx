"use client"

import Link from "next/link"
import { useMemo, useSyncExternalStore, type CSSProperties } from "react"
import {
  RiArrowRightLine,
  RiMedalLine,
  RiShoppingBag3Line,
  RiTerminalBoxLine,
  type RemixiconComponentType,
} from "@remixicon/react"

import { HomeAsk } from "@/components/content-views"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { usePackContents } from "@/components/pack-tray"
import { deliverableKey, journeyStorageKey } from "@/components/partner-journey"
import { useWorkspace } from "@/components/workspace-context"
import { parseStore, readStore, subscribeToStore } from "@/lib/browser-store"
import { journeyPhases, type JourneyPhase } from "@/lib/partner-journey"
import { cn } from "@/lib/utils"
import { workspacePath } from "@/lib/workspace-resolver"

const totalDeliverables = journeyPhases.reduce(
  (sum, phase) => sum + phase.deliverables.length,
  0
)

/**
 * The lifecycle, as ways in rather than a path: a partner picks the phase
 * their client is in and lands on what helps there. The ticks come from the
 * journey page, so Home shows where a client stands without a second store.
 */
function JourneyStrip({ slug }: { slug: string }) {
  const href = workspacePath(slug, "/journey")
  const storageKey = journeyStorageKey(slug)
  const raw = useSyncExternalStore(
    subscribeToStore,
    () => readStore(storageKey, "{}"),
    () => "{}"
  )
  const progress = useMemo(() => parseStore<Record<string, boolean>>(raw, {}), [raw])
  const done = (phase: JourneyPhase) =>
    phase.deliverables.filter((deliverable) => progress[deliverableKey(phase, deliverable.id)])
      .length
  const ticked = journeyPhases.reduce((sum, phase) => sum + done(phase), 0)
  // The first phase with something left is where the client stands.
  const current =
    ticked > 0
      ? journeyPhases.find((phase) => done(phase) < phase.deliverables.length)
      : undefined

  return (
    <section className="space-y-3" aria-labelledby="home-phases">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
        <h2 id="home-phases" className="text-sm font-medium">
          Where is your client?
        </h2>
        <p className="text-xs text-muted-foreground">
          {ticked > 0 ? `${ticked} of ${totalDeliverables} ticked · ` : null}
          <Link href={href} className="font-medium text-primary hover:underline">
            Open the journey
          </Link>
        </p>
      </div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {journeyPhases.map((phase, index) => {
          const count = done(phase)
          const total = phase.deliverables.length
          const here = phase === current
          return (
            <li key={phase.slug} className="rise-in" style={{ "--i": index } as CSSProperties}>
              <Link
                href={`${href}?phase=${phase.slug}`}
                aria-current={here ? "step" : undefined}
                className={cn(
                  "pressable flex h-full flex-col gap-1.5 rounded-xl border bg-card p-3 hover:border-primary/30 hover:shadow-lift",
                  here && "border-primary/40"
                )}
              >
                <span className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                  <span>{phase.number}</span>
                  {ticked > 0 ? <span>{count === total ? "Done" : `${count} of ${total}`}</span> : null}
                </span>
                <span className="text-sm font-medium tracking-tight">{phase.name}</span>
                <span className="text-xs leading-snug text-muted-foreground">{phase.goal}</span>
                {ticked > 0 ? (
                  <span
                    className="mt-auto block h-1 w-full overflow-hidden rounded-full bg-muted"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full rounded-full bg-primary transition-[width] duration-300 ease-out-quint"
                      style={{ width: `${(count / total) * 100}%` }}
                    />
                  </span>
                ) : null}
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

type Shortcut = { icon: RemixiconComponentType; title: string; detail: string; href: string }

/** What else lives here, as rows beside the ask: the pack first, since it is where the work ends. */
function Shortcuts({ slug }: { slug: string }) {
  const { count } = usePackContents()
  const rows: Shortcut[] = [
    {
      icon: RiShoppingBag3Line,
      title: "Your pack",
      detail:
        count === 0
          ? "Empty. Add to pack as you go, then send it as one PDF."
          : `${count} ${count === 1 ? "item" : "items"}. Review what goes to the client and send it.`,
      href: workspacePath(slug, "/pack"),
    },
    {
      icon: RiTerminalBoxLine,
      title: "Starter prompts for Claude or Codex",
      detail: "Your assistant uses only approved Beam content.",
      href: workspacePath(slug, "/tools/partner-cli"),
    },
    {
      icon: RiMedalLine,
      title: "Certifications",
      detail: "Four levels, from Beam basics to delivering on your own.",
      href: workspacePath(slug, "/certifications"),
    },
  ]
  return (
    <aside className="space-y-3" aria-labelledby="home-shortcuts">
      <h2 id="home-shortcuts" className="border-b pb-2 text-sm font-medium">
        Shortcuts
      </h2>
      <ul className="divide-y rounded-xl border bg-card">
        {rows.map((row, index) => (
          <li
            key={row.href}
            className="rise-in relative flex items-start gap-3 p-3 transition-colors hover:bg-muted/40"
            style={{ "--i": index } as CSSProperties}
          >
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <row.icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <Link
                href={row.href}
                className="block text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none"
              >
                {row.title}
              </Link>
              <span className="block text-xs leading-5 text-muted-foreground">{row.detail}</span>
            </span>
            <RiArrowRightLine
              className="mt-1 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default function HomePage() {
  const workspace = useWorkspace()

  // One headline, then the two ways in the program review asked for: say what the client
  // needs, or pick where the client is. The track cards (Layer, Beachhead,
  // Clearance) stay in the catalog; on Home they were a second framework
  // beside the lifecycle.
  return (
    <PageContainer className="space-y-10">
      <PageHeading
        title={workspace.homeHeadline}
        description={workspace.homeDescription}
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <HomeAsk />
        <Shortcuts slug={workspace.slug} />
      </div>
      <JourneyStrip slug={workspace.slug} />
    </PageContainer>
  )
}
