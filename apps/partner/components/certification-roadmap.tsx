"use client"

import Link from "next/link"
import {
  RiBookOpenLine,
  RiCheckboxCircleLine,
  RiFileTextLine,
  RiMedalLine,
  RiShieldUserLine,
  RiToolsLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace-context"
import { certifications } from "@/lib/certifications"
import { workspacePath } from "@/lib/workspace-resolver"

const credentialIcons = {
  "beam-foundations": RiBookOpenLine,
  "discovery-lead": RiFileTextLine,
  builder: RiToolsLine,
  "solution-architect": RiShieldUserLine,
} as const

export function CertificationRoadmap() {
  const workspace = useWorkspace()

  return (
    <div className="space-y-8">
      <section className="partner-cert-hero relative isolate overflow-hidden rounded-3xl border border-white/10 p-6 text-white shadow-2xl sm:p-8 lg:p-10">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
          <div className="max-w-2xl space-y-5">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
              <RiMedalLine className="size-6" />
            </div>
            <div className="space-y-3">
              <p className="font-mono text-[11px] tracking-[0.22em] text-white/55 uppercase">
                {workspace.displayName} · Capability path
              </p>
              <h2 className="text-3xl font-medium tracking-[-0.035em] text-balance sm:text-5xl">
                Learn it. Prove it. Take it to a client.
              </h2>
              <p className="max-w-xl text-sm leading-7 text-white/65 sm:text-base">
                Credentials belong to people. Your firm&apos;s tier follows from
                certified roles, delivered agents, and customer outcomes.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/12 bg-black/20 p-5 backdrop-blur">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Your pathway</span>
              <span className="font-medium">0 of 4</span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/12">
              <div className="h-full w-[6%] rounded-full bg-white" />
            </div>
            <p className="mt-4 text-xs leading-5 text-white/50">
              Cohort access and assessment results will appear here.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {certifications.map((certification, index) => {
          const Icon =
            credentialIcons[
              certification.slug as keyof typeof credentialIcons
            ]
          return (
            <article
              key={certification.slug}
              className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition-shadow hover:shadow-lg sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <Icon className="size-5" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  0{index + 1}
                </span>
              </div>
              <div className="mt-6 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {certification.eyebrow}
                  </p>
                  <h3 className="mt-1 text-xl font-medium tracking-tight">
                    {certification.name}
                  </h3>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {certification.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline">{certification.duration}</Badge>
                  <Badge variant="outline">{certification.assessment}</Badge>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4 border-t pt-4">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {certification.active ? (
                    <RiCheckboxCircleLine className="size-4 text-primary" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                  )}
                  {certification.status}
                </span>
                <Link
                  className={buttonVariants({
                    size: "sm",
                    variant: "outline",
                  })}
                  href={workspacePath(
                    workspace.slug,
                    `/certifications/${certification.slug}`
                  )}
                >
                  View certification
                </Link>
              </div>
            </article>
          )
        })}
      </section>

      <section className="grid gap-4 rounded-2xl border bg-muted/30 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div>
          <p className="font-medium">The outcome is activation, not a badge.</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Target: first partner-sourced opportunity within 90 days of
            certification, supported by weekly office hours for the first eight
            weeks.
          </p>
        </div>
        <Badge variant="outline" className="w-fit bg-background">
          90-day target
        </Badge>
      </section>
    </div>
  )
}
