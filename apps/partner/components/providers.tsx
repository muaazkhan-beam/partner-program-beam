"use client"

import type { ComponentProps, ReactNode } from "react"
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import { ConvexReactClient } from "convex/react"

import { authClient } from "@/lib/auth-client"
import { bypassMembership } from "@/lib/auth-bypass"

type ProviderAuthClient = ComponentProps<
  typeof ConvexBetterAuthProvider
>["authClient"]

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL
export const authConfigured = Boolean(convexUrl && convexSiteUrl)
const convex = authConfigured && convexUrl ? new ConvexReactClient(convexUrl) : null

export const localAuthBypass =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_LOCAL_AUTH_BYPASS === "true"
export const previewAuthBypass =
  process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === "preview" &&
  process.env.NEXT_PUBLIC_PREVIEW_AUTH_BYPASS === "true"
export const authBypass = localAuthBypass || previewAuthBypass
export const convexReady = convex !== null && !authBypass
export const previewMembership = bypassMembership({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_DEPLOYMENT_ENV: process.env.NEXT_PUBLIC_DEPLOYMENT_ENV,
  NEXT_PUBLIC_PREVIEW_AUTH_BYPASS: process.env.NEXT_PUBLIC_PREVIEW_AUTH_BYPASS,
  NEXT_PUBLIC_LOCAL_AUTH_BYPASS: process.env.NEXT_PUBLIC_LOCAL_AUTH_BYPASS,
  NEXT_PUBLIC_PARTNER_BYPASS_WORKSPACE:
    process.env.NEXT_PUBLIC_PARTNER_BYPASS_WORKSPACE,
  NEXT_PUBLIC_PARTNER_BYPASS_EMAIL: process.env.NEXT_PUBLIC_PARTNER_BYPASS_EMAIL,
})

export function Providers({ children }: { children: ReactNode }) {
  if (!convex || authBypass) return <>{children}</>

  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={authClient as unknown as ProviderAuthClient}
    >
      {children}
    </ConvexBetterAuthProvider>
  )
}
