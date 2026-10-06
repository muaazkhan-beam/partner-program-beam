"use client"

import Link from "next/link"
import { RiArrowRightLine } from "@remixicon/react"

import { AddToPack } from "@/components/add-to-pack"
import { FitCheckChecklist } from "@/components/fit-check"
import { SendBadge } from "@/components/send-badge"
import { Badge } from "@/components/ui/badge"
import { useWorkspace } from "@/components/workspace-context"
import { parseOnePager } from "@/lib/fit-check"
import { requestHref, supportForKind } from "@/lib/request-links"

type OnePager = {
  kind: string
  slug: string
  title: string
  summary: string
  body: string
  audience: string
  claimState: string
  forwardable: boolean
  status?: "pending"
  requestBeamLabel?: string
}

/**
 * The Where Beam fits one-pager as a structured page: its four sections as
 * sections, the not-yet-published strip with its request path, then the
 * fit check that makes "when it gets in" answerable for one client process.
 */
export function WhereBeamFitsDetail({ item }: { item: OnePager }) {
  const workspace = useWorkspace()
  const sections = parseOnePager(item.body)
  const pending = sections.find((section) => /not yet published/i.test(section.heading))
  const content = sections.filter((section) => section !== pending)

  return (
    <div className="space-y-8">
      <div className="max-w-3xl space-y-4">
        <div className="flex flex-wrap gap-2">
          <SendBadge item={item} />
          <Badge variant="outline">One-pager</Badge>
        </div>
        <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">{item.title}</h2>
        <p className="text-base leading-7 text-muted-foreground">{item.summary}</p>
        <AddToPack kind={item.kind} slug={item.slug} label={item.title} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {content.map((section) => (
          <section key={section.heading} className="rounded-2xl border bg-card p-5">
            <h3 className="text-sm font-medium">{section.heading}</h3>
            <p className="mt-2 text-sm leading-6 text-foreground/85">{section.text}</p>
          </section>
        ))}
      </div>

      {pending ? (
        <section className="rounded-2xl border bg-muted/30 p-5">
          <h3 className="text-sm font-medium">{pending.heading}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{pending.text}</p>
          {item.status === "pending" || item.requestBeamLabel ? (
            <Link
              className="mt-3 flex max-w-xl items-center justify-between gap-3 rounded-lg border bg-background p-3 text-sm transition-colors hover:bg-muted/40"
              href={requestHref(workspace.slug, {
                about: `${item.kind}:${item.slug}`,
                support: supportForKind(item.kind),
              })}
            >
              <span>{item.requestBeamLabel ?? "Request this from Beam"}</span>
              <RiArrowRightLine className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="fit-check-heading" className="space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Fit check</p>
          <h3 id="fit-check-heading" className="mt-2 text-2xl font-medium tracking-tight">
            Is this process a fit?
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Eight yes or no questions about one client process. Share the result as
            a link.
          </p>
        </div>
        <FitCheckChecklist />
      </section>
    </div>
  )
}
