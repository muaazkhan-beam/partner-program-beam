"use client"

import { useEffect, useRef, useState } from "react"
import { useConvexAuth, useMutation, useQuery } from "convex/react"

import { api } from "@partner/convex/_generated/api"
import { AccessDenied } from "@/components/access-denied"
import {
  authBypass,
  convexReady,
  previewMembership,
} from "@/components/providers"
import {
  WorkspaceProvider,
  type PartnerSession,
} from "@/components/workspace-context"
import { getWorkspaceBySlug } from "@/lib/catalog/static"
import { authClient } from "@/lib/auth-client"
import { getLoginPath, shouldRedirectPartnerLogin } from "@/lib/auth-redirect"

export function PartnerGate({
  workspaceSlug,
  children,
}: {
  workspaceSlug: string
  children: React.ReactNode
}) {
  if (authBypass) {
    const membership = previewMembership
    if (!membership || membership.workspaceSlug !== workspaceSlug) {
      return (
        <AuthStatus
          title="Bypass membership is not scoped to this workspace"
          description="Set NEXT_PUBLIC_PARTNER_BYPASS_WORKSPACE to the workspace slug you are viewing. Bypass never opens every tenant."
        />
      )
    }
    const workspace = getWorkspaceBySlug(workspaceSlug)
    if (!workspace) {
      return (
        <AuthStatus
          title="Unknown workspace"
          description="The bypass slug is not in the reviewed partner catalog."
        />
      )
    }
    const session: PartnerSession = {
      workspaceId: `bypass:${workspace.slug}`,
      slug: workspace.slug,
      name: workspace.name,
      displayName: workspace.displayName,
      brandMode: workspace.brandMode,
      brandHeader: workspace.brandHeader,
      homeTitle: workspace.homeTitle,
      homeHeadline: workspace.homeHeadline,
      homeDescription: workspace.homeDescription,
      tracks: workspace.tracks,
      steps: workspace.steps,
      enabledSurfaces: workspace.enabledSurfaces,
      supportOwner: workspace.supportOwner,
      email: membership.email,
      role: "partner_seller",
      isStaff: membership.email.endsWith("@beam.ai"),
    }
    return <WorkspaceProvider session={session}>{children}</WorkspaceProvider>
  }

  if (!convexReady) {
    return (
      <AuthStatus
        title="Authentication is not configured"
        description="This deployment is closed until its Convex and auth settings are complete."
      />
    )
  }

  return (
    <PartnerGateInner workspaceSlug={workspaceSlug}>
      {children}
    </PartnerGateInner>
  )
}

function PartnerGateInner({
  workspaceSlug,
  children,
}: {
  workspaceSlug: string
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, isRefreshing } = useConvexAuth()
  const betterAuthSession = authClient.useSession()
  const attemptedSessionKey = useRef<string | null>(null)
  const [sessionSetup, setSessionSetup] = useState<{
    key: string
    status: "ready" | "denied"
  } | null>(null)
  const user = useQuery(api.auth.getCurrentUser, isAuthenticated ? {} : "skip")
  const workspace = useQuery(api.partner.resolveWorkspace, {
    slug: workspaceSlug,
  })
  const ensureSession = useMutation(api.partner.ensureSession)
  const sessionKey =
    workspace && user?.email ? `${workspace._id}:${user._id}` : null
  const session = useQuery(
    api.partner.getWorkspaceSession,
    workspace &&
      isAuthenticated &&
      sessionKey &&
      sessionSetup?.key === sessionKey &&
      sessionSetup.status === "ready"
      ? { workspaceId: workspace._id }
      : "skip",
  )

  useEffect(() => {
    if (
      !shouldRedirectPartnerLogin({
        convexLoading: isLoading,
        convexRefreshing: isRefreshing,
        convexAuthenticated: isAuthenticated,
        sessionPending: betterAuthSession.isPending,
        hasSession: Boolean(betterAuthSession.data?.session),
      })
    ) {
      return
    }
    const requestedPath = `${window.location.pathname}${window.location.search}`
    void authClient.signOut().finally(() => {
      window.location.replace(getLoginPath(requestedPath))
    })
  }, [
    betterAuthSession.data?.session,
    betterAuthSession.isPending,
    isAuthenticated,
    isLoading,
    isRefreshing,
  ])

  useEffect(() => {
    if (
      !workspace ||
      !user?.email ||
      !sessionKey ||
      attemptedSessionKey.current === sessionKey
    ) {
      return
    }
    attemptedSessionKey.current = sessionKey
    void ensureSession({
      workspaceId: workspace._id,
      email: user.email,
      name: user.name,
      now: Date.now(),
    }).then(
      () => setSessionSetup({ key: sessionKey, status: "ready" }),
      () => setSessionSetup({ key: sessionKey, status: "denied" }),
    )
  }, [ensureSession, sessionKey, user, workspace])

  if (workspace === null) {
    return (
      <AuthStatus
        title="Unknown partner workspace"
        description="This host or path is not an approved Beam Partner workspace."
      />
    )
  }

  if (
    isLoading ||
    isRefreshing ||
    betterAuthSession.isPending ||
    !isAuthenticated ||
    user === undefined ||
    workspace === undefined
  ) {
    return (
      <AuthStatus
        title="Verifying partner access…"
        description="Completing the secure session for this workspace."
      />
    )
  }

  if (user === null) {
    return (
      <AuthStatus
        title="Completing sign-in…"
        description="Waiting for the authenticated session to propagate."
      />
    )
  }

  if (
    sessionKey &&
    sessionSetup?.key === sessionKey &&
    sessionSetup.status === "denied"
  ) {
    return <AccessDenied email={user.email} />
  }

  if (
    !sessionKey ||
    sessionSetup?.key !== sessionKey ||
    sessionSetup.status !== "ready" ||
    session === undefined
  ) {
    return (
      <AuthStatus
        title="Verifying partner access…"
        description="Completing the secure session for this workspace."
      />
    )
  }

  if (session === null) {
    return <AccessDenied email={user.email} />
  }

  const partnerSession: PartnerSession = {
    workspaceId: session.workspace._id,
    slug: session.workspace.slug,
    name: session.workspace.name,
    displayName: session.workspace.displayName,
    brandMode: session.workspace.brandMode,
    brandHeader: session.workspace.brandHeader,
    homeTitle: session.workspace.homeTitle,
    homeHeadline: session.workspace.homeHeadline,
    homeDescription: session.workspace.homeDescription,
    tracks: session.workspace.tracks,
    steps: session.workspace.steps,
    enabledSurfaces: session.workspace.enabledSurfaces,
    supportOwner: session.workspace.supportOwner,
    email: session.user.email,
    role: session.membership.role,
    isStaff: session.user.isStaff,
  }

  return (
    <WorkspaceProvider session={partnerSession}>{children}</WorkspaceProvider>
  )
}

function AuthStatus({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-2">
        <h1 className="text-xl font-medium">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </main>
  )
}
