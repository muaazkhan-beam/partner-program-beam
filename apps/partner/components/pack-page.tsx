"use client"

import Link from "next/link"
import { RiArrowRightLine, RiDeleteBinLine } from "@remixicon/react"

import { PackTray, usePackState } from "@/components/pack-tray"
import { useWorkspace } from "@/components/workspace-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getWorkspaceItem } from "@/lib/catalog/static"
import { workspacePath } from "@/lib/workspace-resolver"

const KIND_LABEL: Record<string, string> = {
  faq: "Answer",
  material: "Material",
  playbook: "Playbook",
  tool: "Tool",
  "use-case": "Use case",
}

const KIND_SURFACE: Record<string, string> = {
  faq: "faq",
  material: "materials",
  playbook: "playbooks",
  tool: "tools",
  "use-case": "use-cases",
}

/**
 * Everything a partner has picked up for one client, in one place.
 *
 * The compliance tray already handled documents; this adds what they collected
 * everywhere else, so the pack is the whole thing they are about to send rather
 * than only its security half.
 */
export function PackPage() {
  const workspace = useWorkspace()
  const { state, toggleItem, clear } = usePackState(workspace.slug)

  const picked = state.items
    .map((entry) => {
      const item = getWorkspaceItem(
        workspace.slug,
        entry.kind as never,
        entry.slug,
      )
      return item ? { entry, item } : null
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  const total = picked.length + state.documentSlugs.length

  return (
    <div className="space-y-8">
      {total === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing in the pack yet. Add a use case, an answer, a deck or a
            compliance document as you work through a client, and assemble it
            here.
          </p>
          <Link
            href={workspacePath(workspace.slug, "/use-cases")}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Start with the use cases <RiArrowRightLine className="size-4" />
          </Link>
        </div>
      ) : null}

      {picked.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3 border-b pb-2">
            <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              Picked for this client
            </h2>
            <Button variant="ghost" size="sm" onClick={() => clear()}>
              Clear pack
            </Button>
          </div>
          <ul className="divide-y rounded-2xl border bg-card">
            {picked.map(({ entry, item }) => (
              <li
                key={`${entry.kind}:${entry.slug}`}
                className="flex items-start gap-3 p-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {KIND_LABEL[entry.kind] ?? entry.kind}
                    </Badge>
                    {"forwardable" in item && item.forwardable ? (
                      <Badge variant="outline">Client-forwardable</Badge>
                    ) : (
                      <Badge variant="outline">Partner-internal</Badge>
                    )}
                  </div>
                  <Link
                    href={workspacePath(
                      workspace.slug,
                      `/${KIND_SURFACE[entry.kind] ?? entry.kind}/${entry.slug}`,
                    )}
                    className="block text-sm font-medium hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {item.summary}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${item.title} from the pack`}
                  onClick={() => toggleItem(entry.kind, entry.slug)}
                  className="shrink-0 rounded-lg border p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RiDeleteBinLine className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Only client-forwardable items should reach a client. Partner-internal
            ones are here to brief yourself.
          </p>
        </section>
      ) : null}

      <PackTray layout="card" />
    </div>
  )
}
