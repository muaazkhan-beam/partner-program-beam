"use client"

import { Badge } from "@/components/ui/badge"
import { useWorkspace } from "@/components/workspace-context"
import { sendLabel, type PackContent } from "@/lib/pack"

/**
 * Whether this item can go to a client, in the words every page uses. One
 * rule (lib/pack.ts) decides it, so a card, a detail page and the pack can
 * never say different things about the same item.
 */
export function SendBadge({ item }: { item: PackContent }) {
  const workspace = useWorkspace()
  return <Badge variant="outline">{sendLabel(item, workspace.brandMode)}</Badge>
}

export function useSendLabel() {
  const workspace = useWorkspace()
  return (item: PackContent) => sendLabel(item, workspace.brandMode)
}
