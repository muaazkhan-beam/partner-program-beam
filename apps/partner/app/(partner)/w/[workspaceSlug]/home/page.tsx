"use client"

import Link from "next/link"
import {
  RiArrowRightLine,
  RiMedalLine,
  RiTerminalBoxLine,
} from "@remixicon/react"

import { useWorkspace } from "@/components/workspace-context"
import { journeyPhases } from "@/lib/partner-journey"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { workspacePath } from "@/lib/workspace-resolver"

const framingLabel = {
  layer: "Layer",
  beachhead: "Beachhead",
  clearance: "Clearance",
} as const

/**
 * The journey used to be its own nav entry, which meant a partner had to know
 * it existed. It belongs on the page they land on: five phases, where the work
 * actually happens, one click in.
 */
function JourneyStrip({ slug }: { slug: string }) {
  const href = workspacePath(slug, "/journey")
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Take one client process from scope to delivery
        </h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Open the journey
          <RiArrowRightLine className="size-4" />
        </Link>
      </div>
      <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {journeyPhases.map((phase) => (
          <li key={phase.slug}>
            <Link
              href={`${href}#${phase.slug}`}
              className="flex h-full flex-col gap-1 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40"
            >
              <span className="font-mono text-[10px] text-muted-foreground">
                {phase.number}
              </span>
              <span className="text-sm font-medium tracking-tight">
                {phase.name}
              </span>
              <span className="text-xs leading-snug text-muted-foreground">
                {phase.goal}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function HomePage() {
  const workspace = useWorkspace()

  return (
    <PageContainer className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">{workspace.brandHeader}</Badge>
        <PageHeading
          title={workspace.homeHeadline}
          description={workspace.homeDescription}
        />
        <p className="text-sm text-muted-foreground">{workspace.homeTitle}</p>
      </div>
      <JourneyStrip slug={workspace.slug} />
      <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <article
          className="partner-feature-card relative isolate flex min-h-64 overflow-hidden rounded-3xl border border-white/10 p-6 text-white shadow-xl sm:p-7"
          data-tone="cli"
        >
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
          <div className="relative mt-auto flex w-full flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl space-y-4">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
                <RiTerminalBoxLine className="size-5" />
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase">
                  Partner CLI · Start profile
                </p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight">
                  Start partner-safe work in your agent.
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Use the same reviewed workspace from Codex, Claude, or Beam
                  Prism.
                </p>
              </div>
            </div>
            <Link
              className="inline-flex shrink-0 items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black hover:bg-white/90"
              href={workspacePath(workspace.slug, "/tools/partner-cli")}
            >
              Start <RiArrowRightLine className="size-4" />
            </Link>
          </div>
        </article>
        <article className="flex min-h-64 flex-col justify-between rounded-3xl border bg-card p-6 sm:p-7">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">
            <RiMedalLine className="size-5" />
          </div>
          <div className="mt-8">
            <p className="text-xs font-medium text-muted-foreground">
              Capability path
            </p>
            <h2 className="mt-2 text-xl font-medium tracking-tight">
              Certifications
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Learn, submit practical work, and become ready to scope and
              deliver without Beam in the room.
            </p>
            <Link
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              href={workspacePath(workspace.slug, "/certifications")}
            >
              View pathway <RiArrowRightLine className="size-4" />
            </Link>
          </div>
        </article>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        {workspace.tracks.map((track) => (
          <Card key={track.id}>
            <CardHeader className="space-y-2">
              <Badge variant="outline">{framingLabel[track.framing]}</Badge>
              <h2 className="text-lg font-medium">{track.title}</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-6 text-muted-foreground">
                {track.summary}
              </p>
              <Link
                className="text-sm font-medium text-primary hover:underline"
                href={workspacePath(workspace.slug, track.href)}
              >
                {track.action}
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>
    </PageContainer>
  )
}
