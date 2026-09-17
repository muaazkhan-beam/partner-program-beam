"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import { RiAddLine, RiArrowRightLine, RiSearchLine } from "@remixicon/react"

import { api } from "@partner/convex/_generated/api"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function PartnerSpacesPage() {
  const summaries = useQuery(api.partner.listWorkspaceSummariesForStaff, {})
  const seedCatalog = useMutation(api.seed.seedCatalog)
  const [search, setSearch] = useState("")
  const [notice, setNotice] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return summaries ?? []
    return (summaries ?? []).filter(({ workspace }) =>
      [
        workspace.displayName,
        workspace.name,
        workspace.slug,
        workspace.supportOwner,
        ...workspace.allowedEmailDomains,
      ].some((value) => value.toLowerCase().includes(query)),
    )
  }, [search, summaries])

  async function seed() {
    try {
      await seedCatalog({ now: Date.now() })
      setNotice("Reviewed partner catalog is up to date.")
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Seeding failed")
    }
  }

  return (
    <PageContainer className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <PageHeading
          title="Partner spaces"
          description="Manage each partner as its own access, content, and request boundary."
        />
        <Button render={<Link href="/admin/partners/new" />}>
          <RiAddLine />
          New partner space
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-medium">All partner spaces</h2>
              <p className="text-sm text-muted-foreground">
                {summaries?.length ?? 0} configured spaces
              </p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter by partner, domain, or owner…"
                aria-label="Filter partner spaces"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Partner</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Open invites</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(
                ({
                  workspace,
                  memberCount,
                  openInvitationCount,
                  contentCount,
                  requestCount,
                }) => (
                  <TableRow key={workspace._id}>
                    <TableCell className="pl-5">
                      <Link
                        className="block font-medium hover:underline"
                        href={`/admin/partners/${workspace.slug}`}
                      >
                        {workspace.displayName}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {workspace.slug}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-56 whitespace-normal text-muted-foreground">
                      {workspace.allowedEmailDomains.join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Link
                        className="hover:underline"
                        href={`/admin/partners/${workspace.slug}/invitees`}
                      >
                        {memberCount}
                      </Link>
                    </TableCell>
                    <TableCell>{openInvitationCount}</TableCell>
                    <TableCell>
                      <Link
                        className="hover:underline"
                        href={`/admin/partners/${workspace.slug}/content`}
                      >
                        {contentCount}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        className="hover:underline"
                        href={`/admin/partners/${workspace.slug}/requests`}
                      >
                        {requestCount}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {workspace.brandMode.replaceAll("-", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Open ${workspace.displayName}`}
                        render={
                          <Link href={`/admin/partners/${workspace.slug}`} />
                        }
                      >
                        <RiArrowRightLine />
                      </Button>
                    </TableCell>
                  </TableRow>
                ),
              )}
              {summaries !== undefined && filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No partner spaces match this filter.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={seed}>
          Sync reviewed catalog
        </Button>
        {notice ? (
          <p className="text-sm text-muted-foreground">{notice}</p>
        ) : null}
      </div>
    </PageContainer>
  )
}
