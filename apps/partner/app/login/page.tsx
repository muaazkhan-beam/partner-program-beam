import type { Metadata } from "next"
import { RiLock2Line } from "@remixicon/react"

import { BeamLogo } from "@/components/beam-logo"
import { LoginForm } from "@/components/login-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getSafeAuthReturnPath } from "@/lib/auth-redirect"

export const metadata: Metadata = { title: "Sign in" }

type LoginPageProps = {
  searchParams: Promise<{
    from?: string | string[]
    error?: string | string[]
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const returnTo = getSafeAuthReturnPath(params.from)
  const loginError = params.error
    ? "Sign-in did not complete. Staff use Google with @beam.ai. Partners need a named invitation."
    : null

  return (
    <main className="core-login relative flex min-h-svh items-center justify-center overflow-hidden p-6">
      <div className="core-orbit core-orbit-one" aria-hidden="true" />
      <div className="core-orbit core-orbit-two" aria-hidden="true" />
      <Card className="relative w-full max-w-md border-white/10 bg-background/90 shadow-2xl backdrop-blur-xl">
        <CardHeader className="gap-5 border-b pb-6">
          <div className="flex items-center justify-between">
            <BeamLogo
              className="size-10 rounded-xl shadow-lg shadow-blue-950/25"
              priority
            />
            <Badge variant="outline">
              <RiLock2Line /> Invite only
            </Badge>
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-2xl leading-snug font-medium">
              Beam Partner
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Take Beam to a client without opening Beam Core. Staff sign in
              with Google. Partners use a named invitation.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <LoginForm returnTo={returnTo} initialError={loginError} />
        </CardContent>
      </Card>
    </main>
  )
}
