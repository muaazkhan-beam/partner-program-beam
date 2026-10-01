"use client"

import { useMemo, useState } from "react"
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiSearchLine,
} from "@remixicon/react"

import { PackTray, usePackState } from "@/components/pack-tray"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useWorkspace } from "@/components/workspace-context"
import type { ComplianceDomain } from "@/convex/catalogTypes"
import { listWorkspaceCompliance } from "@/lib/catalog/static"
import {
  complianceDomains,
  domainLabel,
  filterDocuments,
} from "@/lib/compliance"
import { requestHref } from "@/lib/request-links"

const PAGE_SIZE = 12

/**
 * Variant A: the library as a list a security reviewer can scan, with the
 * client pack beside it. Reads the static catalog in both modes until a
 * Convex query exists; grants are still per workspace.
 */
export function ComplianceLibrary() {
  const workspace = useWorkspace()
  const documents = listWorkspaceCompliance(workspace.slug)
  const { state, toggle } = usePackState(workspace.slug)
  const [query, setQuery] = useState("")
  const [domain, setDomain] = useState<ComplianceDomain | "all">("all")
  const [page, setPage] = useState(1)
  const visible = useMemo(
    () => filterDocuments(documents, { query, domain }),
    [documents, query, domain]
  )
  const inPack = new Set(state.documentSlugs)
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * PAGE_SIZE
  const rows = visible.slice(start, start + PAGE_SIZE)

  function search(next: string) {
    setQuery(next)
    setPage(1)
  }

  function filterByDomain(next: ComplianceDomain | "all") {
    setDomain(next)
    setPage(1)
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No security or compliance documents are attached to this workspace yet.{" "}
        <a
          className="font-medium text-primary hover:underline"
          href={requestHref(workspace.slug, { support: "deployment-review" })}
        >
          Request the pack for a named deployment
        </a>
        .
      </p>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="space-y-5">
        <div className="rounded-2xl border bg-muted/25 p-3 sm:p-4">
          <div className="relative">
            <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 bg-background pl-10"
              placeholder="Search documents…"
              aria-label="Search documents"
              value={query}
              onChange={(event) => search(event.target.value)}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[{ id: "all" as const, label: "All" }, ...complianceDomains].map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={domain === entry.id}
                className={
                  domain === entry.id
                    ? "rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
                    : "rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                }
                onClick={() => filterByDomain(entry.id)}
              >
                {entry.label}
              </button>
            ))}
            <span className="ml-auto self-center px-1 text-xs text-muted-foreground">
              {visible.length} of {documents.length} documents
            </span>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="font-medium">No matching documents</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another search or reset the filter.
            </p>
          </div>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card px-4 sm:px-5">
            {rows.map((document, index) => {
              const checked = inPack.has(document.slug)
              return (
                <li key={document.slug}>
                  <label className="flex cursor-pointer items-center gap-4 py-3">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(document.slug)}
                      aria-label={`Add ${document.title} to the pack`}
                    />
                    <span className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
                      {start + index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{document.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {domainLabel(document.domain)}
                      </span>
                    </span>
                    <span className="hidden w-28 shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:block">
                      {document.printedDate || "Date to confirm"}
                    </span>
                    <span className="hidden w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:block">
                      {document.pages} {document.pages === 1 ? "page" : "pages"}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}

        {visible.length > 0 && pageCount > 1 ? (
          <nav
            aria-label="Document pages"
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-xs text-muted-foreground tabular-nums">
              {start + 1}–{Math.min(start + PAGE_SIZE, visible.length)} of {visible.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage === 1}
                className="rounded-lg border bg-background p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() => setPage(currentPage - 1)}
              >
                <RiArrowLeftSLine className="size-4" aria-hidden="true" />
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  aria-label={`Page ${number}`}
                  aria-current={number === currentPage ? "page" : undefined}
                  className={
                    number === currentPage
                      ? "size-8 rounded-lg bg-foreground text-xs font-medium text-background tabular-nums"
                      : "size-8 rounded-lg border bg-background text-xs font-medium text-muted-foreground tabular-nums transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  }
                  onClick={() => setPage(number)}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage === pageCount}
                className="rounded-lg border bg-background p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() => setPage(currentPage + 1)}
              >
                <RiArrowRightSLine className="size-4" aria-hidden="true" />
              </button>
            </div>
          </nav>
        ) : null}
      </div>
      <PackTray layout="aside" />
    </div>
  )
}
