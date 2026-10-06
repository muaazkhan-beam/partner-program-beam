"use client"

import Link from "next/link"
import { useMemo, useSyncExternalStore } from "react"
import { RiArrowRightLine, RiCloseLine, RiShoppingBag3Line } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace-context"
import {
  getWorkspaceItem,
  listWorkspaceCompliance,
} from "@/lib/catalog/static"
import { printedLine } from "@/lib/compliance"
import { PACK_RULE, type PackContent } from "@/lib/pack"
import {
  addClients,
  addDocuments,
  addItems,
  clearDocuments,
  parsePackState,
  readPackRaw,
  readPackState,
  removeClient,
  subscribeToPack,
  toggleDocument,
  toggleItem,
  writePackState,
  type PackItem,
  type PackState,
} from "@/lib/pack-store"
import { workspacePath } from "@/lib/workspace-resolver"
import type { ContentKind } from "@/convex/catalogTypes"

/**
 * The client pack for this workspace, shared by every surface that edits it.
 * Each change reads the stored pack first, so two quick clicks, or two open
 * tabs, add to each other instead of overwriting.
 */
export function usePackState(workspaceSlug: string) {
  const raw = useSyncExternalStore(
    subscribeToPack,
    () => readPackRaw(workspaceSlug),
    () => "{}"
  )
  const state = useMemo(() => parsePackState(raw), [raw])
  const update = (change: (current: PackState) => PackState) =>
    writePackState(workspaceSlug, change(readPackState(workspaceSlug)))
  return {
    state,
    toggle: (slug: string) => update((current) => toggleDocument(current, slug)),
    toggleItem: (kind: string, slug: string) =>
      update((current) => toggleItem(current, kind, slug)),
    addItems: (items: readonly PackItem[]) =>
      update((current) => addItems(current, items)),
    addDocuments: (slugs: readonly string[]) =>
      update((current) => addDocuments(current, slugs)),
    setDocuments: (documentSlugs: string[]) =>
      update((current) => ({ ...current, documentSlugs })),
    clearDocuments: () => update(clearDocuments),
    addClients: (names: readonly string[]) =>
      update((current) => addClients(current, names)),
    removeClient: (name: string) => update((current) => removeClient(current, name)),
    replace: (next: PackState) => writePackState(workspaceSlug, next),
  }
}

/**
 * What the stored pack points at, resolved against this workspace's catalog.
 * Entries that no longer resolve (retired, or not granted here) drop out, so
 * the header count and the pack page always agree.
 */
export function resolvePack(workspaceSlug: string, state: PackState) {
  const picked = state.items
    .map((entry) => {
      const item = getWorkspaceItem(workspaceSlug, entry.kind as ContentKind, entry.slug)
      return item ? { entry, item: item as PackContent } : null
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
  const library = listWorkspaceCompliance(workspaceSlug)
  const documents = state.documentSlugs
    .map((slug) => library.find((document) => document.slug === slug))
    .filter((document): document is NonNullable<typeof document> => Boolean(document))
  return { picked, documents, count: picked.length + documents.length }
}

export function usePackContents() {
  const workspace = useWorkspace()
  const pack = usePackState(workspace.slug)
  const resolved = useMemo(
    () => resolvePack(workspace.slug, pack.state),
    [workspace.slug, pack.state]
  )
  return { ...pack, ...resolved }
}

/**
 * The pack beside the compliance library: the documents chosen here, a way to
 * take them out, and one way on to the pack page where everything is sent.
 */
export function PackAside() {
  const workspace = useWorkspace()
  const { documents, picked, toggle, clearDocuments } = usePackContents()
  const others = picked.length

  return (
    <section
      aria-labelledby="pack-aside-heading"
      className="rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-[calc(var(--header-height)+1rem)]"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <RiShoppingBag3Line className="size-4" aria-hidden="true" />
        Client pack
      </div>
      <h2 id="pack-aside-heading" className="mt-2 text-lg font-medium tracking-tight">
        {documents.length === 0
          ? "No documents yet"
          : `${documents.length} ${documents.length === 1 ? "document" : "documents"}`}
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground" aria-live="polite">
        {documents.length === 0
          ? "Tick the documents a client's security team needs."
          : others > 0
            ? `Plus ${others} other ${others === 1 ? "item" : "items"} in the pack.`
            : "Sent together with anything else you add."}
      </p>

      {documents.length > 0 ? (
        <>
          <ul className="mt-4 divide-y">
            {documents.map((document) => (
              <li key={document.slug} className="flex items-start justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{document.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {printedLine(document)}
                    {document.ndaRequired ? " · once an NDA is in place" : ""}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${document.title}`}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  onClick={() => toggle(document.slug)}
                >
                  <RiCloseLine className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={clearDocuments}
          >
            Remove all documents
          </button>
        </>
      ) : null}

      <Button
        className="mt-5 w-full"
        render={<Link href={workspacePath(workspace.slug, "/pack")} />}
      >
        Review and send
        <RiArrowRightLine aria-hidden="true" />
      </Button>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{PACK_RULE}</p>
    </section>
  )
}

/** One line on pages that feed the pack, so it never takes over the page. */
export function PackSummary() {
  const workspace = useWorkspace()
  const { count } = usePackContents()
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
      <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        <RiShoppingBag3Line className="size-4 shrink-0" aria-hidden="true" />
        {count === 0
          ? "Use Add to pack as you work a client. What can go to the client goes in the PDF; the rest stays as your prep."
          : `Your client pack has ${count} ${count === 1 ? "item" : "items"}.`}
      </p>
      {count > 0 ? (
        <Link
          href={workspacePath(workspace.slug, "/pack")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Review and send <RiArrowRightLine className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  )
}
