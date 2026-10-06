"use client"

import Link from "next/link"
import { useState } from "react"
import {
  RiAddLine,
  RiArrowRightLine,
  RiCheckLine,
  RiClipboardLine,
  RiCloseLine,
  RiFilePdf2Line,
  RiShoppingBag3Line,
} from "@remixicon/react"

import { AddToPack } from "@/components/add-to-pack"
import { usePackContents } from "@/components/pack-tray"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWorkspace } from "@/components/workspace-context"
import { listWorkspaceItems } from "@/lib/catalog/static"
import { printedLine } from "@/lib/compliance"
import {
  HOLD_LABEL,
  PACK_RULE,
  buildPack,
  coverNote,
  coverPageHtml,
  hasClientContent,
  holdReason,
  packTitle,
  type PackContent,
} from "@/lib/pack"
import { hasItem, mergePacks, type PackState } from "@/lib/pack-store"
import { printDocument } from "@/lib/print-document"
import { requestHref } from "@/lib/request-links"
import { workspacePath } from "@/lib/workspace-resolver"

const KIND_LABEL: Record<string, string> = {
  faq: "Answer",
  material: "Material",
  playbook: "Playbook",
  tool: "Tool",
  "use-case": "Use case",
}

const KIND_SURFACE: Record<string, string> = {
  faq: "faq",
  material: "materials",
  playbook: "playbooks",
  tool: "tools",
  "use-case": "use-cases",
}

function today() {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function logoUrl() {
  return typeof window === "undefined" ? undefined : `${window.location.origin}/beam-logo.png`
}

/**
 * The client pack: everything a partner collected for a deal, and the one
 * place it is sent from. What reaches the client is decided by one rule
 * (lib/pack.ts holdReason); the rest stays here as the partner's own prep.
 * Several clients can share the same contents, one PDF each.
 */
export function PackPage() {
  const workspace = useWorkspace()
  const {
    state,
    picked,
    documents,
    count,
    toggleItem,
    toggle,
    clearDocuments,
    addClients,
    removeClient,
    replace,
  } = usePackContents()
  const [cleared, setCleared] = useState<PackState | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const items = picked.map(({ item }) => item)
  const base = buildPack({
    workspaceDisplayName: workspace.displayName,
    brandMode: workspace.brandMode,
    clientName: "",
    items,
    documents,
  })
  const ready = hasClientContent(base)
  const previewClient =
    selected && state.clients.includes(selected) ? selected : (state.clients[0] ?? "")
  const packFor = (clientName: string) =>
    buildPack({
      workspaceDisplayName: workspace.displayName,
      brandMode: workspace.brandMode,
      clientName,
      items,
      documents,
    })

  const suggestions = listWorkspaceItems(workspace.slug, "material")
    .map((item) => item as PackContent)
    .filter(
      (item) =>
        holdReason(item, workspace.brandMode) === null &&
        !hasItem(state, item.kind, item.slug)
    )

  function clearPack() {
    setCleared(state)
    replace({ clients: state.clients, documentSlugs: [], items: [] })
  }

  return (
    <div className="space-y-8">
      {cleared ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm"
        >
          <span>Pack cleared.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              replace(mergePacks(cleared, state))
              setCleared(null)
            }}
          >
            Undo
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-8">
          {count === 0 ? (
            <EmptyPack workspaceSlug={workspace.slug} />
          ) : (
            <>
              <ContentList
                title="Goes to the client"
                rows={[...base.decks, ...base.useCases, ...base.answers]}
                empty="Nothing here can go to a client yet. Add something marked Can go to a client."
                onRemove={(item) => toggleItem(item.kind, item.slug)}
              />

              {documents.length > 0 ? (
                <section aria-labelledby="pack-documents" className="space-y-3">
                  <div className="flex items-baseline justify-between gap-3 border-b pb-2">
                    <h2 id="pack-documents" className="text-sm font-medium">
                      Security documents · {documents.length}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={clearDocuments}>
                      Remove all documents
                    </Button>
                  </div>
                  <ul className="divide-y rounded-2xl border bg-card">
                    {documents.map((document) => (
                      <li key={document.slug} className="flex items-start gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{document.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {printedLine(document)}
                            {document.ndaRequired ? " · once an NDA is in place" : ""}
                          </p>
                        </div>
                        <RemoveButton
                          label={document.title}
                          onClick={() => toggle(document.slug)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {base.held.length > 0 ? (
                <section aria-labelledby="pack-held" className="space-y-3">
                  <div className="border-b pb-2">
                    <h2 id="pack-held" className="text-sm font-medium">
                      For your prep, not sent · {base.held.length}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      These stay with you. They are not in the PDF or the email.
                    </p>
                  </div>
                  <ul className="divide-y rounded-2xl border bg-card">
                    {base.held.map(({ item, reason }) => (
                      <PackRow
                        key={`${item.kind}:${item.slug}`}
                        item={item}
                        status={HOLD_LABEL[reason]}
                        onRemove={() => toggleItem(item.kind, item.slug)}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}

              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearPack}>
                  Clear pack
                </Button>
              </div>
            </>
          )}

          {suggestions.length > 0 ? (
            <section aria-labelledby="pack-suggested" className="space-y-3">
              <h2 id="pack-suggested" className="text-sm font-medium">
                Often sent first
              </h2>
              <ul className="divide-y rounded-2xl border bg-card">
                {suggestions.map((item) => (
                  <li key={item.slug} className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {item.summary}
                      </p>
                    </div>
                    <AddToPack kind={item.kind} slug={item.slug} label={item.title} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside
          aria-labelledby="pack-send"
          className="h-fit space-y-5 rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-[calc(var(--header-height)+1rem)]"
        >
          <div>
            <h2 id="pack-send" className="text-lg font-medium tracking-tight">
              Send it
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              One PDF and one email per client, from the same pack.
            </p>
          </div>

          <ClientsField clients={state.clients} onAdd={addClients} />

          {state.clients.length > 0 ? (
            <ul className="space-y-2" aria-label="Clients">
              {state.clients.map((client) => (
                <ClientRow
                  key={client}
                  client={client}
                  ready={ready}
                  selected={client === previewClient}
                  onSelect={() => setSelected(client)}
                  onRemove={() => removeClient(client)}
                  makePdf={() => {
                    const pack = packFor(client)
                    printDocument(
                      coverPageHtml(pack, { generatedOn: today(), logoUrl: logoUrl() }),
                      packTitle(pack)
                    )
                  }}
                  note={() => coverNote(packFor(client))}
                />
              ))}
            </ul>
          ) : null}

          {!ready ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Add something marked Can go to a client, or a security document,
              to make the PDF.
            </p>
          ) : null}

          {documents.length > 0 ? (
            <Link
              className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/40"
              href={requestHref(workspace.slug, {
                about: "compliance:pack",
                support: "deployment-review",
                items: state.documentSlugs,
              })}
            >
              <span>Ask Beam to issue the documents</span>
              <RiArrowRightLine className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          ) : null}
          <p className="text-xs leading-5 text-muted-foreground">{PACK_RULE}</p>
        </aside>
      </div>

      {ready ? (
        <section aria-labelledby="pack-preview" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
            <h2 id="pack-preview" className="text-sm font-medium">
              Preview{previewClient ? ` for ${previewClient}` : ""}
            </h2>
            <p className="text-xs text-muted-foreground">
              This is the PDF. Your prep items are not in it.
            </p>
          </div>
          <iframe
            title={`Preview of ${packTitle(packFor(previewClient))}`}
            sandbox=""
            className="h-[75vh] w-full rounded-2xl border bg-white"
            srcDoc={coverPageHtml(packFor(previewClient), {
              generatedOn: today(),
              logoUrl: logoUrl(),
            })}
          />
        </section>
      ) : null}
    </div>
  )
}

function EmptyPack({ workspaceSlug }: { workspaceSlug: string }) {
  const links = [
    { label: "Use cases", path: "/use-cases" },
    { label: "Materials", path: "/materials" },
    { label: "FAQ answers", path: "/faq" },
    { label: "Security documents", path: "/compliance" },
  ]
  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8">
      <RiShoppingBag3Line className="size-6 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-3 text-lg font-medium tracking-tight">Your pack is empty</h2>
      <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">
        While you work a client, press Add to pack on anything useful. What
        can go to the client becomes one PDF; the rest stays here as your prep.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {links.map((link) => (
          <Button
            key={link.path}
            variant="outline"
            size="sm"
            render={<Link href={workspacePath(workspaceSlug, link.path)} />}
          >
            {link.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

function ContentList({
  title,
  rows,
  empty,
  onRemove,
}: {
  title: string
  rows: PackContent[]
  empty: string
  onRemove: (item: PackContent) => void
}) {
  return (
    <section className="space-y-3">
      <h2 className="border-b pb-2 text-sm font-medium">
        {title} · {rows.length}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {rows.map((item) => (
            <PackRow
              key={`${item.kind}:${item.slug}`}
              item={item}
              onRemove={() => onRemove(item)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function PackRow({
  item,
  status,
  onRemove,
}: {
  item: PackContent
  status?: string
  onRemove: () => void
}) {
  const workspace = useWorkspace()
  return (
    <li className="flex items-start gap-3 p-4">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {KIND_LABEL[item.kind] ?? item.kind}
          </span>
          {status ? <Badge variant="outline">{status}</Badge> : null}
        </div>
        <Link
          href={workspacePath(
            workspace.slug,
            `/${KIND_SURFACE[item.kind] ?? item.kind}/${item.slug}`
          )}
          className="block text-sm font-medium hover:underline"
        >
          {item.title}
        </Link>
      </div>
      <RemoveButton label={item.title} onClick={onRemove} />
    </li>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={`Remove ${label}`}
      onClick={onClick}
      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <RiCloseLine className="size-4" aria-hidden="true" />
    </button>
  )
}

function ClientsField({
  clients,
  onAdd,
}: {
  clients: string[]
  onAdd: (names: string[]) => void
}) {
  const [draft, setDraft] = useState("")
  function commit() {
    const names = draft.split(/[,;\n]/)
    if (names.some((name) => name.trim())) onAdd(names)
    setDraft("")
  }
  return (
    <div className="space-y-2">
      <Label htmlFor="pack-client">Who is it for?</Label>
      <div className="flex gap-2">
        <Input
          id="pack-client"
          name="organization"
          autoComplete="organization"
          placeholder={clients.length ? "Add another client…" : "Client company…"}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              commit()
            }
          }}
        />
        <Button variant="outline" onClick={commit} disabled={!draft.trim()}>
          <RiAddLine aria-hidden="true" />
          Add
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Separate several with commas. Each gets its own PDF.
      </p>
      {clients.length === 0 ? null : (
        <span className="sr-only" aria-live="polite">
          {clients.length} {clients.length === 1 ? "client" : "clients"}
        </span>
      )}
    </div>
  )
}

function ClientRow({
  client,
  ready,
  selected,
  onSelect,
  onRemove,
  makePdf,
  note,
}: {
  client: string
  ready: boolean
  selected: boolean
  onSelect: () => void
  onRemove: () => void
  makePdf: () => void
  note: () => string
}) {
  const [copied, setCopied] = useState(false)
  const [fallback, setFallback] = useState<string | null>(null)
  async function copy() {
    const text = note()
    try {
      await navigator.clipboard.writeText(text)
      setFallback(null)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setFallback(text)
    }
  }
  return (
    <li className={`rounded-xl border p-3 ${selected ? "border-primary/40 bg-primary/5" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={`Preview the pack for ${client}`}
          className="min-w-0 truncate text-left text-sm font-medium hover:underline"
        >
          {client}
        </button>
        <RemoveButton label={client} onClick={onRemove} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button size="sm" onClick={makePdf} disabled={!ready}>
          <RiFilePdf2Line aria-hidden="true" />
          Save as PDF
        </Button>
        <Button size="sm" variant="outline" onClick={copy} disabled={!ready}>
          {copied ? <RiCheckLine aria-hidden="true" /> : <RiClipboardLine aria-hidden="true" />}
          <span aria-live="polite">{copied ? "Copied" : "Copy email"}</span>
        </Button>
      </div>
      {fallback ? (
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg border bg-muted/40 p-2 font-sans text-xs whitespace-pre-wrap">
          {fallback}
        </pre>
      ) : null}
    </li>
  )
}
