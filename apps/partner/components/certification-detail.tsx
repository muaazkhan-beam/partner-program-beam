"use client"

import Link from "next/link"
import {
  RiArrowLeftLine,
  RiBookOpenLine,
  RiCheckLine,
  RiFileTextLine,
  RiShieldUserLine,
  RiToolsLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace-context"
import type { Certification } from "@/lib/certifications"
import { cn } from "@/lib/utils"
import { workspacePath } from "@/lib/workspace-resolver"

const certificationIcons = {
  "beam-foundations": RiBookOpenLine,
  "discovery-lead": RiFileTextLine,
  builder: RiToolsLine,
  "solution-architect": RiShieldUserLine,
} as const

export function CertificationDetail({
  certification,
}: {
  certification: Certification
}) {
  const workspace = useWorkspace()
  const Icon =
    certificationIcons[
      certification.slug as keyof typeof certificationIcons
    ]

  return (
    <div className="space-y-8">
      <Link
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        href={workspacePath(workspace.slug, "/certifications")}
      >
        <RiArrowLeftLine className="size-4" />
        All certifications
      </Link>

      <section className="rounded-xl border bg-card p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/8 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <p className="mt-5 text-sm text-muted-foreground">{certification.eyebrow}</p>
            <h1 className="mt-1 text-3xl font-medium tracking-tight text-balance sm:text-4xl">
              {certification.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {certification.description}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {certification.duration} · {certification.assessment} · {certification.prerequisite}
            </p>
          </div>
          <Link
            className={cn(buttonVariants(), "w-fit")}
            href={workspacePath(
              workspace.slug,
              `/requests?certification=${certification.slug}`
            )}
          >
            {certification.active
              ? "Request cohort access"
              : "Request readiness review"}
          </Link>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 sm:p-7">
        <h2 className="text-2xl font-medium tracking-tight">What you will be able to do</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          This credential is awarded for demonstrated capability, not course attendance alone.
        </p>
        <ul className="mt-4 divide-y">
          {certification.outcomes.map((outcome) => (
            <li key={outcome} className="flex gap-3 py-3 text-sm leading-6">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <RiCheckLine className="size-3.5" aria-hidden="true" />
              </span>
              {outcome}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border bg-card p-5 sm:p-7">
        <p className="text-xs font-medium text-muted-foreground">Certification syllabus</p>
        <h2 className="mt-2 text-2xl font-medium tracking-tight">What the certification covers</h2>
        <ol className="mt-4 divide-y">
          {certification.syllabus.map((module) => (
            <li key={module.number} className="flex gap-4 py-3">
              <span className="w-6 shrink-0 text-sm text-muted-foreground tabular-nums">
                {module.number}
              </span>
              <div>
                <h3 className="text-sm font-medium">{module.title}</h3>
                <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{module.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 rounded-xl border bg-muted/30 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div>
          <p className="font-medium">Assessment</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Complete the learning path and submit the listed assessment for
            review. Results and next-step feedback will appear in your partner
            workspace once assessment functionality is enabled.
          </p>
        </div>
        <Badge variant="outline" className="w-fit bg-background">
          {certification.assessment}
        </Badge>
      </section>
    </div>
  )
}
