"use client"

import { createContext, useContext } from "react"
import { useQuery } from "convex/react"
import Link from "next/link"
import type { FunctionReturnType } from "convex/server"

import { api } from "@partner/convex/_generated/api"
import { Button } from "@/components/ui/button"

type Workspace = FunctionReturnType<
  typeof api.partner.listWorkspacesForStaff
>[number]

const AdminWorkspaceContext = createContext<Workspace | null>(null)

export function AdminWorkspaceGate({
  children,
  workspaceSlug,
}: {
  children: React.ReactNode
  workspaceSlug: string
}) {
  const workspaces = useQuery(api.partner.listWorkspacesForStaff, {})
  const workspace = workspaces?.find((item) => item.slug === workspaceSlug)

  if (workspaces === undefined) {
    return (
      <p className="text-sm text-muted-foreground">Loading partner space…</p>
    )
  }
  if (!workspace) {
    return (
      <div className="space-y-4 py-12 text-center">
        <h2 className="text-xl font-medium">Partner space not found</h2>
        <Button variant="outline" render={<Link href="/admin/partners" />}>
          Back to partner spaces
        </Button>
      </div>
    )
  }

  return (
    <AdminWorkspaceContext.Provider value={workspace}>
      {children}
    </AdminWorkspaceContext.Provider>
  )
}

export function useAdminWorkspace() {
  const workspace = useContext(AdminWorkspaceContext)
  if (!workspace) {
    throw new Error("useAdminWorkspace must be used inside AdminWorkspaceGate")
  }
  return workspace
}
