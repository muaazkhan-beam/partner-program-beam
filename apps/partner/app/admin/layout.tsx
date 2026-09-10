"use client"

import { useQuery } from "convex/react"

import { api } from "@partner/convex/_generated/api"
import { AccessDenied } from "@/components/access-denied"
import { BeamLogo } from "@/components/beam-logo"
import { authBypass, convexReady, previewMembership } from "@/components/providers"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (authBypass) {
    const email = previewMembership?.email ?? ""
    if (!email.endsWith("@beam.ai")) {
      return <AccessDenied email={email || undefined} />
    }
    return <AdminChrome>{children}</AdminChrome>
  }
  if (!convexReady) {
    return (
      <main className="flex min-h-svh items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Authentication is not configured.
        </p>
      </main>
    )
  }
  return <StaffAdminInner>{children}</StaffAdminInner>
}

function StaffAdminInner({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.auth.getCurrentUser, {})
  if (user === undefined) {
    return (
      <main className="flex min-h-svh items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Verifying staff access…</p>
      </main>
    )
  }
  if (!user?.email?.endsWith("@beam.ai")) {
    return <AccessDenied email={user?.email} />
  }
  return <AdminChrome>{children}</AdminChrome>
}

function AdminChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh">
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <BeamLogo className="size-8 rounded-lg" />
        <div>
          <p className="text-sm font-medium">Beam Partner</p>
          <p className="text-xs text-muted-foreground">Staff admin</p>
        </div>
      </header>
      <div className="p-6">{children}</div>
    </div>
  )
}
