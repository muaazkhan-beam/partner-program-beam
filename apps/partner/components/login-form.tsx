"use client"

import * as React from "react"
import { RiGoogleFill, RiMailLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { getSafeAuthReturnPath } from "@/lib/auth-redirect"

export function LoginForm({
  returnTo,
  initialError = null,
}: {
  returnTo: string
  initialError?: string | null
}) {
  const [busy, setBusy] = React.useState<"google" | "magic" | null>(null)
  const [email, setEmail] = React.useState("")
  const [notice, setNotice] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(initialError)
  const authConfigured = Boolean(
    process.env.NEXT_PUBLIC_CONVEX_URL &&
      process.env.NEXT_PUBLIC_CONVEX_SITE_URL
  )

  async function signInWithGoogle() {
    if (!authConfigured || busy) return
    setBusy("google")
    setError(null)
    try {
      const safeReturnTo = getSafeAuthReturnPath(returnTo)
      const errorQuery = new URLSearchParams({ from: safeReturnTo })
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: safeReturnTo,
        errorCallbackURL: `/login?${errorQuery.toString()}`,
      })
      if (result.error) {
        setError("Google sign-in could not be started. Use your @beam.ai account.")
        setBusy(null)
      }
    } catch {
      setError("Google sign-in could not be started. Use your @beam.ai account.")
      setBusy(null)
    }
  }

  async function requestMagicLink(event: React.FormEvent) {
    event.preventDefault()
    if (!authConfigured || busy) return
    setBusy("magic")
    setError(null)
    setNotice(null)
    try {
      const result = await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL: getSafeAuthReturnPath(returnTo),
      })
      if (result.error) {
        setError(
          "We could not find an invitation for that email. Ask your partner admin or Beam staff to send a named invite."
        )
        setBusy(null)
        return
      }
      setNotice(
        "If you have a named invitation, check your email for a sign-in link. An email domain is not access."
      )
      setBusy(null)
    } catch {
      setError(
        "We could not find an invitation for that email. Ask your partner admin or Beam staff to send a named invite."
      )
      setBusy(null)
    }
  }

  return (
    <div className="space-y-5">
      <Button
        className="w-full"
        size="lg"
        disabled={!authConfigured || busy !== null}
        onClick={signInWithGoogle}
      >
        <RiGoogleFill />
        {busy === "google" ? "Redirecting to Google…" : "Beam staff · Continue with Google"}
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Partner invitation
          </span>
        </div>
      </div>
      <form className="space-y-3" onSubmit={requestMagicLink}>
        <div className="space-y-2">
          <Label htmlFor="partner-email">Work email</Label>
          <Input
            id="partner-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@partner.com"
          />
        </div>
        <Button
          className="w-full"
          size="lg"
          variant="outline"
          type="submit"
          disabled={!authConfigured || busy !== null}
        >
          <RiMailLine />
          {busy === "magic" ? "Sending link…" : "Email me a sign-in link"}
        </Button>
      </form>
      {!authConfigured ? (
        <p className="text-center text-xs text-muted-foreground">
          Authentication is not configured in this deployment.
        </p>
      ) : null}
      {notice ? (
        <p className="text-center text-xs text-muted-foreground">{notice}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-center text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
