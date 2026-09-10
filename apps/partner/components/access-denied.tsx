"use client"

import { useState } from "react"
import { RiLock2Line } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { getLoginPath } from "@/lib/auth-redirect"

export function AccessDenied({ email }: { email?: string }) {
  const [busy, setBusy] = useState(false)

  async function signOut() {
    if (busy) return
    setBusy(true)
    await authClient.signOut()
    window.location.replace(getLoginPath("/home"))
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md shadow-lg shadow-foreground/5">
        <CardHeader className="space-y-3 border-b">
          <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <RiLock2Line className="size-5" />
          </span>
          <div className="space-y-2">
            <h1 className="text-xl font-medium">This workspace is invite-only</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {email ? (
                <>
                  You signed in as <strong>{email}</strong>. An email domain is
                  not access. Ask your partner admin or Beam staff for a named
                  invitation to this workspace.
                </>
              ) : (
                "Ask your partner admin or Beam staff for a named invitation."
              )}
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <Button className="w-full" size="lg" disabled={busy} onClick={signOut}>
            {busy ? "Signing out…" : "Use a different account"}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
