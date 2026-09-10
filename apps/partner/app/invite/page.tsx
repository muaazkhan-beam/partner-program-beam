import type { Metadata } from "next"
import Link from "next/link"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

export const metadata: Metadata = { title: "Invitation help" }

export default function InvitePage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="max-w-md">
        <CardHeader>
          <h1 className="text-xl font-medium">Need an invitation?</h1>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            Beam Partner is invite-only. An approved company email domain is
            eligibility, not access. Ask the partner admin or a Beam staff
            member to create a named invitation for your work email.
          </p>
          <p>
            Beam staff sign in with Google using an exact @beam.ai account. Do
            not add partner domains to Beam Core.
          </p>
          <Link className="text-primary hover:underline" href="/login">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
