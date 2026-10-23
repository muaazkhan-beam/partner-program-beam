"use client"

import type { CSSProperties } from "react"
import Link from "next/link"
import { RiCheckboxCircleLine, RiLockLine } from "@remixicon/react"

import { buttonVariants } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace-context"
import {
  certifications,
  firstOutcomeClause,
  prerequisiteLine,
} from "@/lib/certifications"
import { cn } from "@/lib/utils"
import { workspacePath } from "@/lib/workspace-resolver"

// Nothing is tracked yet: cohort access and assessment results are not wired,
// so the path honestly starts at zero for everyone.
const completed = 0

export function CertificationRoadmap() {
  const workspace = useWorkspace()
  const total = certifications.length

  return (
    <div className="space-y-8">
      <section className="grid gap-5 rounded-xl bg-muted/40 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-sm font-medium">Your path</h3>
            <span className="text-xs text-muted-foreground">
              {completed} of {total}
            </span>
          </div>
          <div
            aria-label="Your path"
            aria-valuemax={total}
            aria-valuemin={0}
            aria-valuenow={completed}
            className="mt-3 grid gap-1"
            role="progressbar"
            style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
          >
            {certifications.map((certification, index) => (
              <span
                key={certification.slug}
                className={cn(
                  "h-1 rounded-full",
                  index < completed ? "bg-primary" : "bg-border"
                )}
              />
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Progress appears here once Beam opens your cohort.
          </p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground lg:max-w-sm lg:justify-self-end">
          Credentials belong to people; your firm&apos;s tier follows from
          certified roles and delivered agents.
        </p>
      </section>

      <ol aria-label="Certification path" className="grid gap-4 lg:grid-cols-4">
        {certifications.map((certification, index) => {
          const open = Boolean(certification.active)
          const status = open
            ? "Open to you now"
            : (prerequisiteLine(certification) ?? certification.status)
          const StatusIcon = open ? RiCheckboxCircleLine : RiLockLine
          const clause = firstOutcomeClause(certification)

          return (
            <li
              key={certification.slug}
              className="group/step relative grid rise-in grid-cols-[2rem_minmax(0,1fr)] gap-x-3 lg:grid-cols-1 lg:grid-rows-[auto_1fr] lg:gap-y-3"
              style={{ "--i": index } as CSSProperties}
            >
              <span
                aria-hidden="true"
                className="absolute top-8 bottom-[-1rem] left-4 w-px bg-border group-last/step:hidden lg:top-4 lg:right-[-1rem] lg:bottom-auto lg:left-8 lg:h-px lg:w-auto"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full text-sm font-medium",
                  open
                    ? "bg-primary text-primary-foreground"
                    : "border bg-background text-muted-foreground"
                )}
              >
                {index + 1}
              </span>
              <article
                className={cn(
                  "flex h-full flex-col gap-3 rounded-xl border bg-card p-5",
                  open && "border-primary/40"
                )}
              >
                <h3 className="text-base font-medium">
                  <span className="sr-only">Step {index + 1}: </span>
                  {certification.name}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {certification.description}
                </p>
                {clause ? (
                  <p className="text-sm leading-6">
                    <span className="font-medium">After this you can:</span>{" "}
                    {clause}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {certification.duration} · {certification.assessment}
                </p>
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    open ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <StatusIcon
                    aria-hidden="true"
                    className={cn("size-4", open && "text-primary")}
                  />
                  {status}
                </p>
                <div className="mt-auto pt-1">
                  <Link
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                    href={workspacePath(
                      workspace.slug,
                      `/certifications/${certification.slug}`
                    )}
                  >
                    View certification
                  </Link>
                </div>
              </article>
            </li>
          )
        })}
      </ol>

      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
        The outcome is activation, not a badge: a first partner-sourced
        opportunity within 90 days of certification, with weekly office hours
        for the first eight weeks.
      </p>
    </div>
  )
}
