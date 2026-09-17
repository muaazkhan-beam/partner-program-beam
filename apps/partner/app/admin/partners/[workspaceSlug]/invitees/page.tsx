"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { RiSearchLine, RiUserAddLine } from "@remixicon/react"

import { api } from "@partner/convex/_generated/api"
import { useAdminWorkspace } from "@/components/admin-workspace-context"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const invitationLifetime = 7 * 24 * 60 * 60 * 1000

export default function PartnerInviteesPage() {
  const workspace = useAdminWorkspace()
  const members = useQuery(api.partner.listMembershipsForStaff, {
    workspaceId: workspace._id,
  })
  const invitations = useQuery(api.partner.listInvitations, {
    workspaceId: workspace._id,
  })
  const createInvitation = useMutation(api.partner.createInvitation)
  const [renderedAt] = useState(() => Date.now())
  const [email, setEmail] = useState("")
  const [search, setSearch] = useState("")
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const partnerMembers = useMemo(
    () => (members ?? []).filter((member) => !member.isStaff),
    [members],
  )
  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return partnerMembers
    return partnerMembers.filter((member) =>
      [member.name, member.email, member.role].some((value) =>
        value.toLowerCase().includes(query),
      ),
    )
  }, [partnerMembers, search])
  const filteredInvitations = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return invitations ?? []
    return (invitations ?? []).filter((invitation) =>
      invitation.email.toLowerCase().includes(query),
    )
  }, [invitations, search])

  async function invite(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setNotice(null)
    try {
      await createInvitation({
        workspaceId: workspace._id,
        email,
        role: "partner_seller",
        expiresAt: Date.now() + invitationLifetime,
      })
      setEmail("")
      setNotice(`Invitation created for ${workspace.displayName}.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Invitation failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="People & access"
        description={`Members and invitations for ${workspace.displayName}. Access never carries across partner spaces.`}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <RiUserAddLine className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-medium">
                Invite to {workspace.displayName}
              </h2>
              <p className="text-sm text-muted-foreground">
                Invitations expire after seven days and must match an allowed
                domain.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={invite}
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email">Partner email</Label>
              <Input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={`name@${workspace.allowedEmailDomains[0] ?? "partner.com"}`}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create invitation"}
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Allowed domains: {workspace.allowedEmailDomains.join(", ")}
          </p>
          {notice ? (
            <p className="mt-3 text-sm text-muted-foreground">{notice}</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="relative max-w-md">
        <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filter members and invitations…"
          aria-label="Filter members and invitations"
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <h2 className="text-lg font-medium">Active members</h2>
          <p className="text-sm text-muted-foreground">
            {partnerMembers.length} partner{" "}
            {partnerMembers.length === 1 ? "member" : "members"}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell className="pl-5 font-medium">
                    {member.name}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">Partner member</Badge>
                  </TableCell>
                  <TableCell>{formatDate(member.joinedAt)}</TableCell>
                </TableRow>
              ))}
              {members !== undefined && filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No partner members match this filter.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <h2 className="text-lg font-medium">Invitations</h2>
          <p className="text-sm text-muted-foreground">
            Pending and previously accepted invitations for this space.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Email</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvitations.map((invitation) => {
                const status = invitation.consumedAt
                  ? "Accepted"
                  : invitation.expiresAt <= renderedAt
                    ? "Expired"
                    : "Open"
                return (
                  <TableRow key={invitation._id}>
                    <TableCell className="pl-5 font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>Partner member</TableCell>
                    <TableCell>
                      <Badge
                        variant={status === "Open" ? "secondary" : "outline"}
                      >
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(invitation.expiresAt)}</TableCell>
                  </TableRow>
                )
              })}
              {invitations !== undefined && filteredInvitations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No invitations match this filter.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  )
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(timestamp)
}
