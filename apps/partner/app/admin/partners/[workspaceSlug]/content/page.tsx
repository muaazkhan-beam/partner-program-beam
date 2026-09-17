"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { RiSearchLine } from "@remixicon/react"

import { api } from "@partner/convex/_generated/api"
import { useAdminWorkspace } from "@/components/admin-workspace-context"
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

export default function PartnerContentPage() {
  const workspace = useAdminWorkspace()
  const rows = useQuery(api.partner.listContentForStaff, {
    workspaceId: workspace._id,
  })
  const attachContent = useMutation(api.partner.attachContent)
  const [search, setSearch] = useState("")
  const [scope, setScope] = useState<"all" | "attached" | "available">("all")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (rows ?? []).filter(({ content, attached }) => {
      if (scope === "attached" && !attached) return false
      if (scope === "available" && attached) return false
      if (!query) return true
      return [
        content.title,
        content.summary,
        content.kind,
        content.audience,
      ].some((value) => value.toLowerCase().includes(query))
    })
  }, [rows, scope, search])

  async function attach(
    contentId: (typeof filtered)[number]["content"]["_id"],
    title: string,
  ) {
    setBusyId(String(contentId))
    setNotice(null)
    try {
      await attachContent({ workspaceId: workspace._id, contentId })
      setNotice(`${title} is now available in ${workspace.displayName}.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Attachment failed")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Content"
        description={`Choose the reviewed materials, FAQs, tools, and certifications available to ${workspace.displayName}.`}
      />

      <Card>
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-medium">Content library</h2>
              <p className="text-sm text-muted-foreground">
                {rows?.filter((row) => row.attached).length ?? 0} items attached
                to this space
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex rounded-lg bg-muted p-1">
                {(["all", "attached", "available"] as const).map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={scope === value ? "secondary" : "ghost"}
                    onClick={() => setScope(value)}
                    className="capitalize"
                  >
                    {value}
                  </Button>
                ))}
              </div>
              <div className="relative w-full sm:w-80">
                <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Filter content…"
                  aria-label="Filter content"
                />
              </div>
            </div>
          </div>
          {notice ? (
            <p className="text-sm text-muted-foreground">{notice}</p>
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Content</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Review</TableHead>
                <TableHead className="text-right">Availability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(({ content, attached }) => (
                <TableRow key={content._id}>
                  <TableCell className="max-w-xl whitespace-normal pl-5">
                    <p className="font-medium">{content.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {content.summary}
                    </p>
                  </TableCell>
                  <TableCell className="capitalize">{content.kind}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{label(content.audience)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        content.status === "pending" ? "secondary" : "outline"
                      }
                    >
                      {content.status === "pending"
                        ? "Pending"
                        : label(content.claimState)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {attached ? (
                      <Badge variant="secondary">Attached</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === String(content._id)}
                        onClick={() => attach(content._id, content.title)}
                      >
                        {busyId === String(content._id)
                          ? "Attaching…"
                          : "Attach"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows !== undefined && filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No content matches this filter.
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
