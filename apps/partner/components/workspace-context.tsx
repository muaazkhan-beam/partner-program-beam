"use client"

import {
  createContext,
  useContext,
  type ReactNode,
} from "react"

export type PartnerSession = {
  workspaceId: string
  slug: string
  name: string
  displayName: string
  brandMode: "beam-standard" | "co-branded" | "partner-fronted"
  brandHeader: string
  homeTitle: string
  homeHeadline: string
  homeDescription: string
  tracks: Array<{
    id: string
    title: string
    framing: "layer" | "beachhead" | "clearance"
    summary: string
    action: string
    href: string
  }>
  steps: Array<{ title: string; detail: string }>
  enabledSurfaces: string[]
  supportOwner: string
  /** The partner's own email domains: who may forward to the Beam inbox. */
  allowedEmailDomains: string[]
  /** Output styles offered here: the brand mode, plus any Beam cleared. */
  allowedOutputStyles: Array<"beam-standard" | "co-branded" | "partner-fronted">
  /** The demo workspace: demo content, sample files and seeded clients. */
  isDemo: boolean
  email: string
  role: "staff" | "partner_admin" | "partner_seller"
  isStaff: boolean
}

const WorkspaceContext = createContext<PartnerSession | null>(null)

export function WorkspaceProvider({
  session,
  children,
}: {
  session: PartnerSession
  children: ReactNode
}) {
  return (
    <WorkspaceContext.Provider value={session}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const session = useContext(WorkspaceContext)
  if (!session) {
    throw new Error("WorkspaceProvider is missing")
  }
  return session
}
