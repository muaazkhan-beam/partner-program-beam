"use client"

import {
  RiEyeOffLine,
  RiFlaskLine,
  RiLinkUnlinkM,
  RiLockLine,
  RiShieldCheckFill,
  RiTimeLine,
  RiUserLine,
  type RemixiconComponentType,
} from "@remixicon/react"

import { useWorkspace } from "@/components/workspace-context"
import { CLAIM_LABEL, claimStateOf, type ClaimStateKey } from "@/lib/claim-state"
import type { HoldOptions, PackContent } from "@/lib/pack"
import { cn } from "@/lib/utils"

/**
 * Each state is shape, icon and words, never colour alone. Labels sit in ink
 * so they read at 12px; the icon carries the tone.
 */
const STATE_STYLE: Record<ClaimStateKey, { icon: RemixiconComponentType; tone: string; frame: string }> = {
  "can-go": { icon: RiShieldCheckFill, tone: "text-primary", frame: "border-primary/30 bg-primary/5" },
  demo: { icon: RiFlaskLine, tone: "text-ink-muted", frame: "border-dashed border-ink-muted/40 bg-muted/60" },
  "not-published": { icon: RiTimeLine, tone: "text-warning-text", frame: "border-warning/40" },
  "only-beam": { icon: RiLockLine, tone: "text-ink-muted", frame: "border-ink-muted/30 bg-muted/60" },
  "for-you": { icon: RiUserLine, tone: "text-muted-foreground", frame: "border-border" },
  "not-cleared": { icon: RiEyeOffLine, tone: "text-warning-text", frame: "border-warning/40" },
  "advisory-held": { icon: RiEyeOffLine, tone: "text-warning-text", frame: "border-warning/40" },
  "no-link": { icon: RiLinkUnlinkM, tone: "text-muted-foreground", frame: "border-border" },
}

export function ClaimBadge({ state, className }: { state: ClaimStateKey; className?: string }) {
  const { icon: Icon, tone, frame } = STATE_STYLE[state]
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium text-foreground",
        frame,
        className
      )}
    >
      <Icon className={cn("size-3.5", tone)} aria-hidden="true" />
      {CLAIM_LABEL[state]}
    </span>
  )
}

/**
 * The send rule as this partner sees it right now: their brand and whether
 * this is the demo workspace.
 */
export function useHoldOptions(): HoldOptions {
  const workspace = useWorkspace()
  return { demoWorkspace: workspace.isDemo }
}

export function useClaimState() {
  const workspace = useWorkspace()
  const options = useHoldOptions()
  return (item: PackContent) => claimStateOf(item, workspace.brandMode, options)
}

export function ItemClaimBadge({ item, className }: { item: PackContent; className?: string }) {
  const stateOf = useClaimState()
  return <ClaimBadge state={stateOf(item)} className={className} />
}
