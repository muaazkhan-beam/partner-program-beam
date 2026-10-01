"use client"

import Link from "next/link"
import { RiShoppingBag3Line } from "@remixicon/react"

import { usePackState } from "@/components/pack-tray"
import { useWorkspace } from "@/components/workspace-context"
import { packCount } from "@/lib/pack-store"
import { workspacePath } from "@/lib/workspace-resolver"

/**
 * The pack, always in reach.
 *
 * Jack asked for a cart icon in the top corner, for the reason e-commerce has
 * one: what you have collected should follow you across the pages you collect
 * it from. Without it the tray only exists on the pages that happen to embed
 * it, and a partner has no sense of carrying anything.
 */
export function PackButton() {
  const workspace = useWorkspace()
  const { state } = usePackState(workspace.slug)
  const count = packCount(state)

  return (
    <Link
      href={workspacePath(workspace.slug, "/pack")}
      aria-label={
        count === 0
          ? "Client pack, empty"
          : `Client pack, ${count} ${count === 1 ? "item" : "items"}`
      }
      className="relative inline-flex size-9 items-center justify-center rounded-lg border transition-colors hover:bg-accent"
    >
      <RiShoppingBag3Line className="size-4" aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute -top-1.5 -right-1.5 inline-flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
          {count}
        </span>
      ) : null}
    </Link>
  )
}
