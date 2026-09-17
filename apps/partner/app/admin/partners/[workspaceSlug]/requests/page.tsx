"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { RiSearchLine } from "@remixicon/react"

import type { Id } from "@partner/convex/_generated/dataModel"
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

type RequestStatus = "open" | "assigned" | "closed"

export default function PartnerRequestsPage() {
  const workspace = useAdminWorkspace()
  const requests = useQuery(api.partner.listRequestsForStaff, {
    workspaceId: workspace._id,
  })
  const assignRequest = useMutation(api.partner.assignRequest)
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState("")
  const [owner, setOwner] = useState("")
  const [status, setStatus] = useState<RequestStatus>("open")
  const [notice, setNotice] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return requests ?? []
    return (requests ?? []).filter((request) =>
      [
        request.requestKey,
        request.accountName ?? "",
        request.candidateProcess,
        request.stage,
        request.supportType,
        request.status,
        request.owner ?? "",
      ].some((value) => value.toLowerCase().includes(query)),
    )
  }, [requests, search])

  function selectRequest(requestId: string) {
    setSelectedId(requestId)
    const request = requests?.find((item) => String(item._id) === requestId)
    if (!request) return
    setOwner(request.owner ?? "")
    setStatus(request.status)
  }

  async function update(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedId) return
    try {
      await assignRequest({
        workspaceId: workspace._id,
        requestId: selectedId as Id<"requests">,
        owner,
        status,
      })
      setNotice("Request assignment updated.")
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Update failed")
    }
  }

  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Requests"
        description={`Review and assign support requests raised by ${workspace.displayName}.`}
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Assign a request</h2>
          <p className="text-sm text-muted-foreground">
            Select a request from this partner space, then set its Beam owner
            and status.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-[minmax(14rem,1.5fr)_minmax(12rem,1fr)_10rem_auto] md:items-end"
            onSubmit={update}
          >
            <div className="space-y-2">
              <Label htmlFor="request">Request</Label>
              <select
                id="request"
                required
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={selectedId}
                onChange={(event) => selectRequest(event.target.value)}
              >
                <option value="">Select a request…</option>
                {(requests ?? []).map((request) => (
                  <option key={request._id} value={request._id}>
                    {request.requestKey} · {request.candidateProcess}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Beam owner</Label>
              <Input
                id="owner"
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
                placeholder="owner@beam.ai"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as RequestStatus)
                }
              >
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <Button type="submit" disabled={!selectedId}>
              Update request
            </Button>
          </form>
          {notice ? (
            <p className="mt-3 text-sm text-muted-foreground">{notice}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-medium">All requests</h2>
              <p className="text-sm text-muted-foreground">
                {requests?.length ?? 0} requests in this space
              </p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter requests…"
                aria-label="Filter requests"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Request</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Support</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((request) => (
                <TableRow
                  key={request._id}
                  className="cursor-pointer"
                  onClick={() => selectRequest(String(request._id))}
                >
                  <TableCell className="max-w-sm whitespace-normal pl-5">
                    <p className="font-medium">{request.candidateProcess}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {request.requestKey}
                    </p>
                  </TableCell>
                  <TableCell>{request.accountName || "—"}</TableCell>
                  <TableCell>{label(request.stage)}</TableCell>
                  <TableCell>{label(request.supportType)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        request.status === "open" ? "secondary" : "outline"
                      }
                    >
                      {label(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.owner || "Unassigned"}</TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                </TableRow>
              ))}
              {requests !== undefined && filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No requests match this filter.
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

function label(value: string) {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(timestamp)
}
