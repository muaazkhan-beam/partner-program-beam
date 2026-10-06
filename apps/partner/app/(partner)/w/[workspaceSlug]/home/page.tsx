"use client"

import Link from "next/link"
import {
  RiArrowRightLine,
  RiMedalLine,
  RiTerminalBoxLine,
} from "@remixicon/react"

import { HomeAsk } from "@/components/content-views"
import { useWorkspace } from "@/components/workspace-context"
import { journeyPhases } from "@/lib/partner-journey"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { workspacePath } from "@/lib/workspace-resolver"

/**
 * The lifecycle, as ways in rather than a path: a partner picks the phase
 * their client is in and lands on what helps there.
 */
function JourneyStrip({ slug }: { slug: string }) {
  const href = workspacePath(slug, "/journey")
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium">Where is your client?</h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          See every phase
          <RiArrowRightLine className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {journeyPhases.map((phase) => (
          <li key={phase.slug}>
            <Link
              href={`${href}?phase=${phase.slug}`}
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

  // One headline, then the two ways in the program review asked for: say what the client
  // needs, or pick where the client is. The track cards (Layer, Beachhead,
  // Clearance) stay in the catalog; on Home they were a second framework
  // beside the lifecycle.
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title={workspace.homeHeadline}
        description={workspace.homeDescription}
      />
      <HomeAsk />
      <JourneyStrip slug={workspace.slug} />
      <section className="grid gap-4 md:grid-cols-2">
        <article className="flex flex-col justify-between gap-5 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
              <RiTerminalBoxLine className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-medium">Use Beam content in Claude or Codex</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Starter prompts that tell your assistant to use only approved
                Beam content.
              </p>
            </div>
          </div>
          <Link
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            href={workspacePath(workspace.slug, "/tools/partner-cli")}
          >
            See the starter prompts <RiArrowRightLine className="size-4" aria-hidden="true" />
          </Link>
        </article>
        <article className="flex flex-col justify-between gap-5 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
              <RiMedalLine className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-medium">Certifications</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Learn, submit practical work, and scope and deliver without
                Beam in the room.
              </p>
            </div>
          </div>
          <Link
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            href={workspacePath(workspace.slug, "/certifications")}
          >
            See certifications <RiArrowRightLine className="size-4" aria-hidden="true" />
          </Link>
        </article>
      </section>
    </PageContainer>
  )
}
