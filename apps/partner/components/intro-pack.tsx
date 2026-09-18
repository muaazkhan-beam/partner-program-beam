"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  RiArrowRightLine,
  RiCheckLine,
  RiClipboardLine,
  RiExternalLinkLine,
} from "@remixicon/react"
import { useQuery } from "convex/react"

import { authBypass } from "@/components/providers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace-context"
import { listWorkspaceItems } from "@/lib/catalog/static"
import {
  introEmail,
  introPack,
  type IntroPackItem,
  type PackReason,
} from "@/lib/intro-pack"
import { requestHref, supportForKind } from "@/lib/request-links"
import { api } from "@partner/convex/_generated/api"

const reasonLabel: Record<PackReason, string> = {
  "brand mode": "Not cleared for this brand mode",
  pending: "Awaiting Beam review",
  "no share link": "No published link",
}

export function IntroPack() {
  if (authBypass) return <BypassIntroPack />
  return <LiveIntroPack />
}

function LiveIntroPack() {
  const workspace = useWorkspace()
  const materials = useQuery(api.partner.listContent, {
    workspaceId: workspace.workspaceId as never,
    kind: "material",
  })
  const playbooks = useQuery(api.partner.listContent, {
    workspaceId: workspace.workspaceId as never,
    kind: "playbook",
  })
  if (materials === undefined || playbooks === undefined) return null
  return <IntroPackBody items={[...materials, ...playbooks]} />
}

function BypassIntroPack() {
  const workspace = useWorkspace()
  const items = [
    ...listWorkspaceItems(workspace.slug, "material"),
    ...listWorkspaceItems(workspace.slug, "playbook"),
  ]
  return <IntroPackBody items={items} />
}

function IntroPackBody({ items }: { items: IntroPackItem[] }) {
  const workspace = useWorkspace()
  const { pack, notYet } = introPack(items, workspace.brandMode)
  const email = introEmail({
    workspaceDisplayName: workspace.displayName,
    items: pack,
  })
  const [copied, setCopied] = useState(false)
  const [copyBlocked, setCopyBlocked] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    []
  )

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email)
      setCopyBlocked(false)
      setCopied(true)
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopyBlocked(true)
    }
  }

  return (
    <section
      aria-labelledby="intro-pack-heading"
      className="grid gap-8 rounded-2xl border bg-card p-5 sm:p-7 lg:grid-cols-[1.15fr_.85fr]"
    >
      <div>
        <p className="text-xs font-medium text-muted-foreground">Intro pack</p>
        <h2
          id="intro-pack-heading"
          className="mt-2 text-2xl font-medium tracking-tight"
        >
          Send the approved intro
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Only approved, client-forwardable items with a published link, in
          this workspace&apos;s brand mode.
        </p>
        {pack.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nothing is cleared for clients in this workspace yet.
          </p>
        ) : (
          <>
            <ul className="mt-4 divide-y">
              {pack.map((item) => (
                <li
                  key={item.slug}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    <Badge variant="outline" className="capitalize">
                      {item.format ?? item.kind}
                    </Badge>
                  </span>
                  <a
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    href={item.shareUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Beam Shares
                    <RiExternalLinkLine className="size-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={copyEmail}>
                {copied ? (
                  <RiCheckLine aria-hidden="true" />
                ) : (
                  <RiClipboardLine aria-hidden="true" />
                )}
                <span aria-live="polite">
                  {copied ? "Email copied" : "Copy intro email"}
                </span>
              </Button>
              {copyBlocked ? (
                <p className="text-sm text-muted-foreground">
                  Copy blocked by the browser; select the text below.
                </p>
              ) : null}
            </div>
            <details className="mt-4 rounded-lg border" open={copyBlocked}>
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                Preview the email
              </summary>
              <pre className="border-t px-3 py-3 font-sans text-sm leading-7 whitespace-pre-wrap text-foreground/85">
                {email}
              </pre>
            </details>
          </>
        )}
      </div>
      <div className="border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
        <p className="text-xs font-medium text-muted-foreground">
          Not yet in the pack
        </p>
        {notYet.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Everything meant for clients is in the pack.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notYet.map(({ item, reason }) => (
              <li key={item.slug}>
                <Link
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/40"
                  href={requestHref(workspace.slug, {
                    about: `${item.kind}:${item.slug}`,
                    support: supportForKind(item.kind),
                  })}
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{item.title}</span>
                    <span className="block text-muted-foreground">
                      {reasonLabel[reason]}
                    </span>
                  </span>
                  <RiArrowRightLine
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
