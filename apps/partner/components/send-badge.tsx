"use client"

import { ItemClaimBadge } from "@/components/claim-state"
import type { PackContent } from "@/lib/pack"

/**
 * Whether this item can go to a client, in the words every page uses. One
 * rule (lib/pack.ts) decides it, so a card, a detail page and the pack can
 * never say different things about the same item.
 */
export function SendBadge({ item }: { item: PackContent }) {
  return <ItemClaimBadge item={item} />
}
