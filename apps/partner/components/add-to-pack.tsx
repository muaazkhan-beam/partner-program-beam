"use client"

import { RiAddLine, RiCheckLine } from "@remixicon/react"

import { usePackState } from "@/components/pack-tray"
import { useWorkspace } from "@/components/workspace-context"
import { hasItem } from "@/lib/pack-store"

/**
 * One button, on every kind of thing a partner might send a client.
 *
 * Jack described this as a shopping cart: browse, add what is relevant to the
 * deal in front of you, and assemble it at the end instead of rebuilding it by
 * hand in PowerPoint. Compliance documents already had this through the
 * compliance library; this is the same action everywhere else.
 */
export function AddToPack({
  kind,
  slug,
  label,
}: {
  kind: string
  slug: string
  /** Named so the button reads as an action on this thing, not a generic add. */
  label?: string
}) {
  const workspace = useWorkspace()
  const { state, toggleItem } = usePackState(workspace.slug)
  const added = hasItem(state, kind, slug)

  return (
    <button
      type="button"
      aria-pressed={added}
      aria-label={
        added
          ? `Remove ${label ?? "this"} from the client pack`
          : `Add ${label ?? "this"} to the client pack`
      }
      onClick={(event) => {
        // These sit inside cards that are themselves links.
        event.preventDefault()
        event.stopPropagation()
        toggleItem(kind, slug)
      }}
      className={
        added
          ? "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          : "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      }
    >
      {added ? (
        <>
          <RiCheckLine className="size-3.5" aria-hidden="true" />
          In pack
        </>
      ) : (
        <>
          <RiAddLine className="size-3.5" aria-hidden="true" />
          Add
        </>
      )}
    </button>
  )
}
