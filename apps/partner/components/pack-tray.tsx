"use client"

import Link from "next/link"
import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  RiArrowRightLine,
  RiCheckLine,
  RiClipboardLine,
  RiCloseLine,
  RiDownloadLine,
  RiExternalLinkLine,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWorkspace } from "@/components/workspace-context"
import { listWorkspaceCompliance, listWorkspaceItems } from "@/lib/catalog/static"
import { printedLine } from "@/lib/compliance"
import type { IntroPackItem } from "@/lib/intro-pack"
import {
  PACK_RULE,
  buildPack,
  coverNote,
  coverPageHtml,
  packDownloadName,
} from "@/lib/pack"
import {
  parsePackState,
  readPackRaw,
  subscribeToPack,
  toggleDocument,
  writePackState,
} from "@/lib/pack-store"
import { requestHref } from "@/lib/request-links"
import { workspacePath } from "@/lib/workspace-resolver"

/** The client pack for this workspace, shared by every surface that edits it. */
export function usePackState(workspaceSlug: string) {
  const raw = useSyncExternalStore(
    subscribeToPack,
    () => readPackRaw(workspaceSlug),
    () => "{}"
  )
  const state = useMemo(() => parsePackState(raw), [raw])
  return {
    state,
    setClientName: (clientName: string) =>
      writePackState(workspaceSlug, { ...state, clientName }),
    toggle: (slug: string) =>
      writePackState(workspaceSlug, toggleDocument(state, slug)),
    setDocuments: (documentSlugs: string[]) =>
      writePackState(workspaceSlug, { ...state, documentSlugs }),
    clear: () => writePackState(workspaceSlug, { clientName: "", documentSlugs: [] }),
  }
}

function today() {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function PackTray({ layout = "aside" }: { layout?: "aside" | "card" }) {
  const workspace = useWorkspace()
  const { state, setClientName, toggle, clear } = usePackState(workspace.slug)
  const library = listWorkspaceCompliance(workspace.slug)
  const materials = listWorkspaceItems(workspace.slug, "material") as IntroPackItem[]
  const documents = state.documentSlugs
    .map((slug) => library.find((document) => document.slug === slug))
    .filter((document): document is NonNullable<typeof document> => Boolean(document))
  const pack = buildPack({
    workspaceDisplayName: workspace.displayName,
    brandMode: workspace.brandMode,
    clientName: state.clientName,
    materials,
    documents,
  })
  const named = pack.account.company.length > 0
  const [copied, setCopied] = useState(false)
  const [copyBlocked, setCopyBlocked] = useState(false)
  const timer = useRef<number | null>(null)

  function download() {
    const html = coverPageHtml(pack, { generatedOn: today() })
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = packDownloadName(pack.account.company)
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function copyNote() {
    try {
      await navigator.clipboard.writeText(coverNote(pack))
      setCopyBlocked(false)
      setCopied(true)
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopyBlocked(true)
    }
  }

  const requestLink = requestHref(workspace.slug, {
    about: "compliance:pack",
    support: "deployment-review",
    items: state.documentSlugs,
  })

  return (
    <section
      aria-labelledby="pack-heading"
      className={
        layout === "aside"
          ? "rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-[calc(var(--header-height)+1rem)]"
          : "grid gap-8 rounded-2xl border bg-card p-5 sm:p-7 lg:grid-cols-[1.15fr_.85fr]"
      }
    >
      <div>
        <p className="text-xs font-medium text-muted-foreground">Client pack</p>
        <h2 id="pack-heading" className="mt-2 text-2xl font-medium tracking-tight">
          Send a pack to a client
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{PACK_RULE}</p>

        <div className="mt-5 space-y-2">
          <Label htmlFor="pack-client">Client</Label>
          <Input
            id="pack-client"
            name="organization"
            autoComplete="organization"
            placeholder="Client company name…"
            value={state.clientName}
            onChange={(event) => setClientName(event.target.value)}
          />
        </div>

        <p className="mt-5 text-xs font-medium text-muted-foreground">Introduction</p>
        {pack.decks.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing is cleared for clients in this workspace yet.
          </p>
        ) : (
          <ul className="mt-2 divide-y">
            {pack.decks.map((deck) => (
              <li key={deck.slug} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <span className="text-sm font-medium">{deck.title}</span>
                <a
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  href={deck.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open <RiExternalLinkLine className="size-4" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
            Documents · {documents.length}
          </p>
          {documents.length > 0 ? (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={clear}
            >
              Clear
            </button>
          ) : null}
        </div>
        {documents.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No documents yet.{" "}
            {layout === "card" ? (
              <Link
                className="font-medium text-primary hover:underline"
                href={workspacePath(workspace.slug, "/compliance")}
              >
                Add documents from the library
              </Link>
            ) : (
              "Tick documents in the library to add them."
            )}
          </p>
        ) : (
          <ul className="mt-2 divide-y">
            {documents.map((document) => (
              <li key={document.slug} className="flex items-start justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{document.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {printedLine(document)}
                    {document.ndaRequired ? " · under NDA" : ""}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${document.title} from the pack`}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  onClick={() => toggle(document.slug)}
                >
                  <RiCloseLine className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={layout === "aside" ? "mt-6 border-t pt-5" : "lg:border-l lg:pl-8"}>
        <p className="text-xs font-medium text-muted-foreground">Send it</p>
        <div className="mt-3 flex flex-col gap-2">
          <Button onClick={download} disabled={!named}>
            <RiDownloadLine aria-hidden="true" /> Download cover page
          </Button>
          <Button variant="outline" onClick={copyNote} disabled={!named}>
            {copied ? <RiCheckLine aria-hidden="true" /> : <RiClipboardLine aria-hidden="true" />}
            <span aria-live="polite">{copied ? "Note copied" : "Copy cover note"}</span>
          </Button>
          <Link
            className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/40"
            href={requestLink}
          >
            <span>Request the documents from Beam</span>
            <RiArrowRightLine className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        </div>
        {!named ? (
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Name the client to download the cover page or copy the note.
          </p>
        ) : null}
        {copyBlocked ? (
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Copy blocked by the browser; select the text below.
          </p>
        ) : null}
        {named ? (
          <details className="mt-4 rounded-lg border" open={copyBlocked}>
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
              Preview the note
            </summary>
            <pre className="border-t px-3 py-3 font-sans text-sm leading-6 whitespace-pre-wrap text-foreground/85">
              {coverNote(pack)}
            </pre>
          </details>
        ) : null}
      </div>
    </section>
  )
}
