"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"

import { api } from "@partner/convex/_generated/api"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { authBypass } from "@/components/providers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { listWorkspaces } from "@/lib/catalog/static"

export default function AdminPage() {
  const workspaces = useQuery(
    api.partner.listWorkspacesForStaff,
    authBypass ? "skip" : {}
  )
  const content = useQuery(
    api.partner.listAllContentForStaff,
    authBypass ? "skip" : {}
  )
  const seedCatalog = useMutation(api.seed.seedCatalog)
  const createInvitation = useMutation(api.partner.createInvitation)
  const attachContent = useMutation(api.partner.attachContent)
  const approveClaim = useMutation(api.partner.approveClaim)
  const assignRequest = useMutation(api.partner.assignRequest)
  const [workspaceId, setWorkspaceId] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [contentId, setContentId] = useState("")
  const [requestId, setRequestId] = useState("")
  const [owner, setOwner] = useState("partner-success@beam.ai")
  const [notice, setNotice] = useState<string | null>(null)
  const invitations = useQuery(
    api.partner.listInvitations,
    !authBypass && workspaceId
      ? { workspaceId: workspaceId as never }
      : "skip"
  )

  const workspaceOptions = authBypass ? listWorkspaces() : workspaces ?? []

  async function run(label: string, work: () => Promise<unknown>) {
    try {
      await work()
      setNotice(label)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Request failed")
    }
  }

  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Staff admin"
        description="Workspaces, invitations, reviewed material attachment, claim approval, and request assignment. Not a CMS."
      />
      {authBypass ? (
        <p className="text-sm text-muted-foreground">
          Preview bypass lists catalog workspaces only. Live admin mutations
          require an @beam.ai staff session.
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Workspaces</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2 text-sm">
            {workspaceOptions.map((workspace) => (
              <li key={workspace.slug}>
                <button
                  type="button"
                  className="text-left hover:underline"
                  onClick={() =>
                    "_id" in workspace
                      ? setWorkspaceId(String(workspace._id))
                      : setWorkspaceId(workspace.slug)
                  }
                >
                  {workspace.displayName} · {workspace.slug} ·{" "}
                  {workspace.brandMode}
                </button>
              </li>
            ))}
          </ul>
          <Button
            disabled={authBypass}
            onClick={() =>
              run("Catalog seeded", () => seedCatalog({ now: Date.now() }))
            }
          >
            Seed reviewed catalog
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Invite a partner user</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
          />
          <Button
            disabled={authBypass || !workspaceId}
            onClick={() =>
              run("Invitation created", () =>
                createInvitation({
                  workspaceId: workspaceId as never,
                  email: inviteEmail,
                  role: "partner_seller",
                  expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
                })
              )
            }
          >
            Send named invite
          </Button>
          {invitations?.length ? (
            <ul className="text-sm text-muted-foreground">
              {invitations.map((invite) => (
                <li key={invite._id}>
                  {invite.email} · {invite.role} ·{" "}
                  {invite.consumedAt ? "consumed" : "open"}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Attach reviewed content</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="content-id">Content id</Label>
          <Input
            id="content-id"
            value={contentId}
            onChange={(event) => setContentId(event.target.value)}
          />
          <Button
            disabled={authBypass || !workspaceId || !contentId}
            onClick={() =>
              run("Content attached", () =>
                attachContent({
                  workspaceId: workspaceId as never,
                  contentId: contentId as never,
                })
              )
            }
          >
            Attach to workspace
          </Button>
          {content ? (
            <ul className="max-h-48 overflow-auto text-xs text-muted-foreground">
              {content.map((item) => (
                <li key={item._id}>
                  <button
                    type="button"
                    onClick={() => setContentId(item._id)}
                    className="hover:underline"
                  >
                    {item.kind}/{item.slug} · {item.claimState} · {item._id}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <Button
            variant="outline"
            disabled={authBypass || !contentId}
            onClick={() =>
              run("Claim updated", () =>
                approveClaim({
                  contentId: contentId as never,
                  claimState: "approved",
                  reviewer: "Partner Success",
                  reviewedAt: Date.now(),
                  revalidateAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
                })
              )
            }
          >
            Mark claim approved
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Assign a request</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="request-id">Request id</Label>
          <Input
            id="request-id"
            value={requestId}
            onChange={(event) => setRequestId(event.target.value)}
          />
          <Label htmlFor="owner">Owner</Label>
          <Input
            id="owner"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
          />
          <Button
            disabled={authBypass || !workspaceId || !requestId}
            onClick={() =>
              run("Request assigned", () =>
                assignRequest({
                  workspaceId: workspaceId as never,
                  requestId: requestId as never,
                  owner,
                  status: "assigned",
                })
              )
            }
          >
            Assign
          </Button>
        </CardContent>
      </Card>
      {notice ? <p className="text-sm">{notice}</p> : null}
    </PageContainer>
  )
}
