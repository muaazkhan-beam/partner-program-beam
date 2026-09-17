"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import { RiExternalLinkLine } from "@remixicon/react"

import { api } from "@partner/convex/_generated/api"
import { useAdminWorkspace } from "@/components/admin-workspace-context"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PartnerOverviewPage() {
  const workspace = useAdminWorkspace()
  const [renderedAt] = useState(() => Date.now())
  const memberships = useQuery(api.partner.listMembershipsForStaff, {
    workspaceId: workspace._id,
  })
  const invitations = useQuery(api.partner.listInvitations, {
    workspaceId: workspace._id,
  })
  const content = useQuery(api.partner.listContentForStaff, {
    workspaceId: workspace._id,
  })
  const requests = useQuery(api.partner.listRequestsForStaff, {
    workspaceId: workspace._id,
  })
  const updateWorkspace = useMutation(api.partner.updateWorkspaceConfiguration)
  const [displayName, setDisplayName] = useState(workspace.displayName)
  const [brandHeader, setBrandHeader] = useState(workspace.brandHeader)
  const [brandMode, setBrandMode] = useState(workspace.brandMode)
  const [homeTitle, setHomeTitle] = useState(workspace.homeTitle)
  const [homeHeadline, setHomeHeadline] = useState(workspace.homeHeadline)
  const [homeDescription, setHomeDescription] = useState(
    workspace.homeDescription,
  )
  const [supportOwner, setSupportOwner] = useState(workspace.supportOwner)
  const [domains, setDomains] = useState(
    workspace.allowedEmailDomains.join(", "),
  )
  const [notice, setNotice] = useState<string | null>(null)

  const memberCount =
    memberships?.filter((member) => !member.isStaff).length ?? 0
  const openInvites =
    invitations?.filter(
      (invite) => !invite.consumedAt && invite.expiresAt > renderedAt,
    ).length ?? 0
  const attachedContent = content?.filter((item) => item.attached).length ?? 0

  async function save(event: React.FormEvent) {
    event.preventDefault()
    try {
      await updateWorkspace({
        workspaceId: workspace._id,
        displayName,
        brandMode,
        brandHeader,
        homeTitle,
        homeHeadline,
        homeDescription,
        supportOwner,
        allowedEmailDomains: domains.split(","),
      })
      setNotice("Partner space settings saved.")
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Save failed")
    }
  }

  const base = `/admin/partners/${workspace.slug}`

  return (
    <PageContainer className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <PageHeading
          title={workspace.displayName}
          description={`Partner space · ${workspace.slug}`}
        />
        <Button
          variant="outline"
          render={<Link href={`/w/${workspace.slug}/home`} target="_blank" />}
        >
          Open partner portal
          <RiExternalLinkLine />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          href={`${base}/invitees`}
          label="People"
          value={`${memberCount} members`}
          detail={`${openInvites} open invitations`}
        />
        <SummaryCard
          href={`${base}/content`}
          label="Content"
          value={`${attachedContent} attached items`}
          detail={`${content?.length ?? 0} available in the library`}
        />
        <SummaryCard
          href={`${base}/requests`}
          label="Requests"
          value={`${requests?.length ?? 0} total requests`}
          detail={`${requests?.filter((request) => request.status === "open").length ?? 0} open`}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium">Space identity</h2>
              <p className="text-sm text-muted-foreground">
                Stable identifiers and access boundary.
              </p>
            </div>
            <Badge variant="outline">
              {workspace.brandMode.replaceAll("-", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Legal name" value={workspace.name} />
          <Detail label="URL slug" value={workspace.slug} />
          <Detail label="Primary hostname" value={workspace.primaryHostname} />
          <Detail label="Support owner" value={workspace.supportOwner} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Portal settings</h2>
          <p className="text-sm text-muted-foreground">
            Presentation, eligible domains, and the content shown on the partner
            homepage.
          </p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5 md:grid-cols-2" onSubmit={save}>
            <Field
              label="Display name"
              id="display-name"
              value={displayName}
              onChange={setDisplayName}
            />
            <Field
              label="Portal header"
              id="brand-header"
              value={brandHeader}
              onChange={setBrandHeader}
            />
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
            <Field
              label="Allowed email domains"
              id="domains"
              value={domains}
              onChange={setDomains}
            />
            <Field
              label="Homepage title"
              id="home-title"
              value={homeTitle}
              onChange={setHomeTitle}
            />
            <Field
              label="Beam support owner"
              id="support-owner"
              value={supportOwner}
              onChange={setSupportOwner}
              type="email"
            />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="home-headline">Homepage headline</Label>
              <Input
                id="home-headline"
                value={homeHeadline}
                onChange={(event) => setHomeHeadline(event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="home-description">Homepage description</Label>
              <textarea
                id="home-description"
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={homeDescription}
                onChange={(event) => setHomeDescription(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Button type="submit">Save settings</Button>
              {notice ? (
                <p className="text-sm text-muted-foreground">{notice}</p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  )
}

function SummaryCard({
  href,
  label,
  value,
  detail,
}: {
  href: string
  label: string
  value: string
  detail: string
}) {
  return (
    <Card className="transition-colors hover:border-foreground/20">
      <Link href={href} className="block h-full">
        <CardContent className="space-y-2 p-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="text-xl font-medium">{value}</p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </CardContent>
      </Link>
    </Card>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium break-words">{value || "—"}</p>
    </div>
  )
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
}: {
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
