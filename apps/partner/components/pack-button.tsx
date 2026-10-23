"use client"

import Link from "next/link"
import { RiShoppingBag3Line } from "@remixicon/react"

import { usePackContents } from "@/components/pack-tray"
import { useWorkspace } from "@/components/workspace-context"
import { workspacePath } from "@/lib/workspace-resolver"

/**
 * The pack, always in reach: what a partner has collected follows them across
 * the pages they collect it from, as a cart does. The count is of entries
 * that resolve in this workspace, so it matches the pack page exactly.
 */
export function PackButton() {
  const workspace = useWorkspace()
  const { count } = usePackContents()

  return (
    <Link
      href={workspacePath(workspace.slug, "/pack")}
      aria-label={
        count === 0
          ? "Client pack, empty"
          : `Client pack, ${count} ${count === 1 ? "item" : "items"}`
      }
      className="relative inline-flex h-9 items-center gap-2 rounded-lg border px-2.5 text-sm font-medium transition-colors hover:bg-accent"
    >
      <RiShoppingBag3Line className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">Pack</span>
      {count > 0 ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
          {count}
        </span>
      ) : null}
    </Link>
  )
}
