type AuthBypassEnvironment = {
  NODE_ENV?: string
  VERCEL_ENV?: string
  NEXT_PUBLIC_DEPLOYMENT_ENV?: string
  NEXT_PUBLIC_LOCAL_AUTH_BYPASS?: string
  NEXT_PUBLIC_PREVIEW_AUTH_BYPASS?: string
  NEXT_PUBLIC_PARTNER_BYPASS_WORKSPACE?: string
  NEXT_PUBLIC_PARTNER_BYPASS_EMAIL?: string
}

export function isLocalAuthBypass(
  environment: AuthBypassEnvironment = process.env
) {
  return (
    environment.NODE_ENV !== "production" &&
    environment.NEXT_PUBLIC_LOCAL_AUTH_BYPASS === "true"
  )
}

export function isPreviewAuthBypass(
  environment: AuthBypassEnvironment = process.env
) {
  return (
    environment.VERCEL_ENV === "preview" &&
    environment.NEXT_PUBLIC_DEPLOYMENT_ENV === "preview" &&
    environment.NEXT_PUBLIC_PREVIEW_AUTH_BYPASS === "true"
  )
}

export function isClientAuthBypass(
  environment: AuthBypassEnvironment = process.env
) {
  return (
    isLocalAuthBypass(environment) ||
    (environment.NEXT_PUBLIC_DEPLOYMENT_ENV === "preview" &&
      environment.NEXT_PUBLIC_PREVIEW_AUTH_BYPASS === "true")
  )
}

export function isServerAuthBypass(
  environment: AuthBypassEnvironment = process.env
) {
  return isLocalAuthBypass(environment) || isPreviewAuthBypass(environment)
}

export function bypassMembership(
  environment: AuthBypassEnvironment = process.env
) {
  if (!isClientAuthBypass(environment)) return null
  const workspace = environment.NEXT_PUBLIC_PARTNER_BYPASS_WORKSPACE?.trim()
  const email = environment.NEXT_PUBLIC_PARTNER_BYPASS_EMAIL?.trim()
  if (!workspace || !email) return null
  return { workspaceSlug: workspace, email }
}
