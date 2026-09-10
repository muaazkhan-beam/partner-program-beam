"use client"

import Link from "next/link"
import {
  RiArrowLeftLine,
  RiBookOpenLine,
  RiCheckLine,
  RiFileTextLine,
  RiMedalLine,
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

      <section className="partner-cert-hero relative isolate overflow-hidden rounded-3xl border border-white/10 p-6 text-white shadow-2xl sm:p-8 lg:p-10">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
              <Icon className="size-6" />
            </div>
            <p className="mt-6 font-mono text-[11px] tracking-[0.22em] text-white/55 uppercase">
              {certification.eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] text-balance sm:text-6xl">
              {certification.name}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
              {certification.description}
            </p>
          </div>
          <Link
            className={cn(
              buttonVariants(),
              "w-fit bg-white text-black hover:bg-white/90"
            )}
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

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Time", certification.duration],
          ["Assessment", certification.assessment],
          ["Prerequisite", certification.prerequisite],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border bg-card p-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-sm font-medium">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-8 rounded-2xl border bg-card p-5 sm:p-7 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <Badge variant="outline">Capability outcomes</Badge>
          <h2 className="mt-4 text-2xl font-medium tracking-tight">
            What you will be able to do
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This credential is awarded for demonstrated capability, not course
            attendance alone.
          </p>
        </div>
        <ul className="space-y-3">
          {certification.outcomes.map((outcome) => (
            <li
              key={outcome}
              className="flex gap-3 rounded-xl border bg-muted/20 p-4 text-sm leading-6"
            >
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <RiCheckLine className="size-3.5" />
              </span>
              {outcome}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-7">
        <div className="max-w-2xl">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
            <RiMedalLine className="size-5" />
          </div>
          <p className="mt-5 text-xs font-medium text-muted-foreground">
            Certification syllabus
          </p>
          <h2 className="mt-2 text-2xl font-medium tracking-tight">
            What the certification covers
          </h2>
        </div>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {certification.syllabus.map((module) => (
            <li key={module.number} className="rounded-xl border bg-muted/20 p-4">
              <span className="font-mono text-[10px] text-muted-foreground">
                {module.number}
              </span>
              <h3 className="mt-3 text-sm font-medium">{module.title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {module.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-muted/30 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
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
