"use client"

import { useState } from "react"
import { RiLogoutBoxLine } from "@remixicon/react"

import { useWorkspace } from "@/components/workspace-context"
import { Button } from "@/components/ui/button"
import { authBypass } from "@/components/providers"
import { authClient } from "@/lib/auth-client"
import { getLoginPath } from "@/lib/auth-redirect"

export function AuthUserControl() {
  const workspace = useWorkspace()
  const [busy, setBusy] = useState(false)

  async function signOut() {
    if (authBypass || busy) return
    setBusy(true)
    await authClient.signOut()
    window.location.replace(getLoginPath(workspacePathSafe(workspace.slug)))
  }

  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{workspace.email}</p>
        <p className="truncate text-xs text-muted-foreground">
          {workspace.role.replace("_", " ")}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={authBypass || busy}
        onClick={signOut}
        aria-label="Sign out"
      >
        <RiLogoutBoxLine />
      </Button>
    </div>
  )
}

function workspacePathSafe(slug: string) {
  return `/w/${slug}/home`
}
