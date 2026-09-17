"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"

import { api } from "@partner/convex/_generated/api"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NewPartnerSpacePage() {
  const router = useRouter()
  const createWorkspace = useMutation(api.partner.createWorkspace)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [brandHeader, setBrandHeader] = useState("")
  const [brandMode, setBrandMode] = useState<
    "beam-standard" | "co-branded" | "partner-fronted"
  >("co-branded")
  const [domains, setDomains] = useState("")
  const [headline, setHeadline] = useState(
    "Build the AI-native company with Beam.",
  )
  const [description, setDescription] = useState(
    "Partner resources, enablement, and delivery support in one place.",
  )
  const [supportOwner, setSupportOwner] = useState("partner-success@beam.ai")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await createWorkspace({
        slug,
        name,
        displayName: name,
        brandMode,
        brandHeader: brandHeader || `${name} × Beam`,
        homeHeadline: headline,
        homeDescription: description,
        supportOwner,
        allowedEmailDomains: domains.split(","),
      })
      router.push(`/admin/partners/${slug.trim().toLowerCase()}`)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to create space",
      )
      setBusy(false)
    }
  }

  return (
    <PageContainer className="max-w-4xl space-y-8">
      <PageHeading
        title="New partner space"
        description="Create a separate access and content boundary for one partner organization."
      />
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Partner details</h2>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5 md:grid-cols-2" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="partner-name">Partner name</Label>
              <Input
                id="partner-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Roboyo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-slug">URL slug</Label>
              <Input
                id="partner-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="roboyo"
                required
              />
              <p className="text-xs text-muted-foreground">
                partner.beam.ai/w/{slug || "partner"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-header">Portal header</Label>
              <Input
                id="brand-header"
                value={brandHeader}
                onChange={(event) => setBrandHeader(event.target.value)}
                placeholder={name ? `${name} × Beam` : "Partner × Beam"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-mode">Brand mode</Label>
              <select
                id="brand-mode"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={brandMode}
                onChange={(event) =>
                  setBrandMode(event.target.value as typeof brandMode)
                }
              >
                <option value="beam-standard">Beam standard</option>
                <option value="co-branded">Co-branded</option>
                <option value="partner-fronted">Partner-fronted</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="domains">Allowed email domains</Label>
              <Input
                id="domains"
                value={domains}
                onChange={(event) => setDomains(event.target.value)}
                placeholder="roboyo.global, roboyo.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated. A matching domain is eligible, but every person
                still needs a named invitation.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="headline">Homepage headline</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Homepage description</Label>
              <textarea
                id="description"
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="support-owner">Beam support owner</Label>
              <Input
                id="support-owner"
                type="email"
                value={supportOwner}
                onChange={(event) => setSupportOwner(event.target.value)}
                required
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive md:col-span-2">{error}</p>
            ) : null}
            <div className="md:col-span-2">
              <Button type="submit" disabled={busy}>
                {busy ? "Creating…" : "Create partner space"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
