"use client"

import { RiAddLine, RiBookmarkLine, RiCheckLine } from "@remixicon/react"

import { useClaimState } from "@/components/claim-state"
import { usePackState } from "@/components/pack-tray"
import { useWorkspace } from "@/components/workspace-context"
import { sendable } from "@/lib/claim-state"
import type { PackContent } from "@/lib/pack"
import { hasItem } from "@/lib/pack-store"

/**
 * One button, on every kind of thing a partner might send a client.
 *
 * The program review asked for a shopping cart: browse, add what is relevant to the
 * deal in front of you, and assemble it at the end instead of rebuilding it by
 * hand in PowerPoint. Compliance documents already had this through the
 * compliance library; this is the same action everywhere else.
 *
 * The verb says what will happen. "Add to pack" when the send rule lets the
 * item reach the client; "Save for prep" when it stays with the partner. Pass
 * the item so the button can ask the rule; without it the button assumes the
 * item goes.
 */
export function AddToPack({
  kind,
  slug,
  label,
  item,
}: {
  kind: string
  slug: string
  /** Named so the button reads as an action on this thing, not a generic add. */
  label?: string
  item?: PackContent
}) {
  const workspace = useWorkspace()
  const { state, toggleItem } = usePackState(workspace.slug)
  const stateOf = useClaimState()
  const added = hasItem(state, kind, slug)
  const goes = item ? sendable(stateOf(item)) : true
  const verb = goes ? "Add to pack" : "Save for prep"
  const addedLabel = goes ? "In pack" : "Saved for prep"
  const Icon = goes ? RiAddLine : RiBookmarkLine

  return (
    <button
      type="button"
      // The name starts with the visible words, as WCAG's label-in-name asks.
      aria-label={
        added
          ? `${addedLabel}: ${label ?? "this"}. Remove it`
          : `${verb}: ${label ?? "this"}`
      }
      onClick={(event) => {
        // Cards are clickable through a stretched title link; the button sits
        // above it and must not also open the card.
        event.stopPropagation()
        toggleItem(kind, slug)
      }}
      className={
        added
          ? "pressable inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 text-xs font-medium text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          : "pressable inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border bg-background px-3 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      }
    >
      {added ? (
        <>
          <RiCheckLine className="size-3.5" aria-hidden="true" />
          {addedLabel}
        </>
      ) : (
        <>
          <Icon className="size-3.5" aria-hidden="true" />
          {verb}
        </>
      )}
    </button>
  )
}
