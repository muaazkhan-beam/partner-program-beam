import type { Metadata } from "next"
import { LoginScreen } from "@/components/login-screen"
import { getSafeAuthReturnPath } from "@/lib/auth-redirect"

export const metadata: Metadata = { title: "Sign in" }

type LoginPageProps = {
  searchParams: Promise<{
    from?: string | string[]
    error?: string | string[]
    workspace?: string | string[]
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const returnTo = getSafeAuthReturnPath(params.from)
  const loginError = params.error
    ? "Sign-in did not complete. Staff use Google with @beam.ai. Partners need a named invitation."
    : null

  const workspaceSlug =
    typeof params.workspace === "string" ? params.workspace : undefined
  return (
    <LoginScreen
      returnTo={returnTo}
      workspaceSlug={workspaceSlug}
      initialError={loginError}
    />
  )
}
