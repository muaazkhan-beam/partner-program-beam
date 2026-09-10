"use client"

import Link from "next/link"
import { useState } from "react"
import {
  RiArrowDownSLine,
  RiArrowRightLine,
  RiBookOpenLine,
  RiCheckLine,
  RiClipboardLine,
  RiExternalLinkLine,
  RiFileList3Line,
  RiPresentationLine,
  RiQuestionLine,
  RiRobot2Line,
  RiSearchLine,
  RiTerminalBoxLine,
  RiToolsLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWorkspace } from "@/components/workspace-context"
import { authBypass } from "@/components/providers"
import { getWorkspaceItem, listWorkspaceItems } from "@/lib/catalog/static"
import { workspacePath } from "@/lib/workspace-resolver"
import { api } from "@partner/convex/_generated/api"
import { useQuery } from "convex/react"

type ContentKind = "tool" | "material" | "faq" | "playbook"

function contentSurface(kind: ContentKind) {
  if (kind === "faq") return "faq"
  if (kind === "tool") return "tools"
  if (kind === "material") return "materials"
  return "playbooks"
}

type ContentCard = {
  kind: ContentKind
  slug: string
  title: string
  summary: string
  body: string
  group?: string
  claimState: string
  audience: string
  forwardable: boolean
  requestBeamLabel?: string
  format?: string
  shareUrl?: string
  embedUrl?: string
  href?: string
  status?: "pending"
}

function tagLabel(value: string) {
  return value ? `${value[0]?.toUpperCase()}${value.slice(1)}` : value
}

function toolDestination(workspaceSlug: string, item: ContentCard) {
  if (item.href?.startsWith("https://")) return item.href
  if (item.href) return workspacePath(workspaceSlug, item.href)
  return workspacePath(workspaceSlug, `/tools/${item.slug}`)
}

function LiveContentGrid({
  kind,
  empty,
}: {
  kind: ContentKind
  empty: string
}) {
  const workspace = useWorkspace()
  const items = useQuery(api.partner.listContent, {
    workspaceId: workspace.workspaceId as never,
    kind,
  })
  return <ContentGridBody kind={kind} empty={empty} items={items} />
}

function BypassContentGrid({
  kind,
  empty,
}: {
  kind: ContentKind
  empty: string
}) {
  const workspace = useWorkspace()
  const items = listWorkspaceItems(workspace.slug, kind) as ContentCard[]
  return <ContentGridBody kind={kind} empty={empty} items={items} />
}

export function ContentGrid({
  kind,
  empty,
}: {
  kind: ContentKind
  empty: string
}) {
  if (authBypass) {
    return <BypassContentGrid kind={kind} empty={empty} />
  }
  return <LiveContentGrid kind={kind} empty={empty} />
}

function LiveMaterialsGrid({ empty }: { empty: string }) {
  const workspace = useWorkspace()
  const materials = useQuery(api.partner.listContent, {
    workspaceId: workspace.workspaceId as never,
    kind: "material",
  })
  const playbooks = useQuery(api.partner.listContent, {
    workspaceId: workspace.workspaceId as never,
    kind: "playbook",
  })
  const items =
    materials === undefined || playbooks === undefined
      ? undefined
      : [...materials, ...playbooks]
  return <MaterialsGridBody empty={empty} items={items} />
}

function BypassMaterialsGrid({ empty }: { empty: string }) {
  const workspace = useWorkspace()
  const items = [
    ...listWorkspaceItems(workspace.slug, "material"),
    ...listWorkspaceItems(workspace.slug, "playbook"),
  ] as ContentCard[]
  return <MaterialsGridBody empty={empty} items={items} />
}

export function MaterialsGrid({ empty }: { empty: string }) {
  if (authBypass) return <BypassMaterialsGrid empty={empty} />
  return <LiveMaterialsGrid empty={empty} />
}

function MaterialsGridBody({
  empty,
  items,
}: {
  empty: string
  items: ContentCard[] | undefined
}) {
  if (items === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }
  return <PreviewCatalog kind="material" items={items} surface="materials" />
}

function ContentGridBody({
  kind,
  empty,
  items,
}: {
  kind: ContentKind
  empty: string
  items: ContentCard[] | undefined
}) {
  if (items === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }

  if (kind === "tool") {
    return <ToolCatalog items={items} />
  }
  if (kind === "faq") {
    return <FaqRows items={items} />
  }
  return <PreviewCatalog kind={kind} items={items} />
}

const featuredToolSlugs = ["partner-cli", "partner-faq", "operating-diagnostic"]

function ToolIcon({ item }: { item: ContentCard }) {
  const className = "size-5"
  if (item.slug === "partner-cli")
    return <RiTerminalBoxLine className={className} />
  if (item.slug === "partner-faq")
    return <RiQuestionLine className={className} />
  if (item.slug === "beam-platform")
    return <RiRobot2Line className={className} />
  if (item.group === "Prove")
    return <RiPresentationLine className={className} />
  if (item.group === "Scope") return <RiFileList3Line className={className} />
  return <RiToolsLine className={className} />
}

function ToolCatalog({ items }: { items: ContentCard[] }) {
  const workspace = useWorkspace()
  const featured = featuredToolSlugs
    .map((slug) => items.find((item) => item.slug === slug))
    .filter((item): item is ContentCard => Boolean(item))
  const featuredSlugs = new Set(featured.map((item) => item.slug))
  const remaining = items.filter((item) => !featuredSlugs.has(item.slug))
  const grouped = new Map<string, ContentCard[]>()
  for (const item of remaining) {
    const key = item.group ?? "Library"
    grouped.set(key, [...(grouped.get(key) ?? []), item])
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-4 lg:grid-cols-3">
        {featured.map((item, index) => {
          const external = item.href?.startsWith("https://")
          return (
            <article
              key={item.slug}
              className="partner-feature-card group relative isolate flex min-h-80 overflow-hidden rounded-3xl border border-white/10 p-6 text-white shadow-xl"
              data-tone={
                index === 0 ? "cli" : index === 1 ? "knowledge" : "scope"
              }
            >
              <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
              <div className="relative mt-auto w-full space-y-5">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
                  <ToolIcon item={item} />
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase">
                    {item.group ?? "Partner tool"}
                  </p>
                  <h2 className="text-2xl font-medium tracking-tight">
                    {item.title}
                  </h2>
                  <p className="text-sm leading-6 text-white/65">
                    {item.summary}
                  </p>
                </div>
                <Link
                  className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90"
                  href={toolDestination(workspace.slug, item)}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                >
                  {item.href ? "Open tool" : "View details"}
                  {external ? (
                    <RiExternalLinkLine className="size-4" />
                  ) : (
                    <RiArrowRightLine className="size-4" />
                  )}
                </Link>
              </div>
            </article>
          )
        })}
      </section>

      {[...grouped.entries()].map(([group, groupItems]) => (
        <section key={group} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium">{group}</h2>
            <span className="text-xs text-muted-foreground">
              {groupItems.length} tools
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groupItems.map((item) => {
              const external = item.href?.startsWith("https://")
              return (
                <article
                  key={item.slug}
                  className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                      <ToolIcon item={item} />
                    </div>
                    <Badge variant="outline">{tagLabel(item.audience)}</Badge>
                  </div>
                  <h3 className="mt-5 font-medium">{item.title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                    {item.summary}
                  </p>
                  <Link
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    href={toolDestination(workspace.slug, item)}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noreferrer" : undefined}
                  >
                    {item.href ? "Open tool" : "View details"}
                    {external ? (
                      <RiExternalLinkLine className="size-4" />
                    ) : (
                      <RiArrowRightLine className="size-4" />
                    )}
                  </Link>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function FaqRows({ items }: { items: ContentCard[] }) {
  const workspace = useWorkspace()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<
    "all" | "partner" | "technical" | "pending" | "restricted"
  >("all")
  const normalizedQuery = query.trim().toLowerCase()
  const visibleItems = items.filter((item) => {
    const matchesQuery =
      !normalizedQuery ||
      `${item.title} ${item.summary} ${item.body}`
        .toLowerCase()
        .includes(normalizedQuery)
    const matchesFilter =
      filter === "all" ||
      (filter === "partner" && item.audience === "partner-internal") ||
      (filter === "technical" && item.audience === "technical") ||
      (filter === "pending" && item.status === "pending") ||
      (filter === "restricted" && item.claimState === "restricted")
    return matchesQuery && matchesFilter
  })
  const filters = [
    ["all", "All"],
    ["partner", "Partner"],
    ["technical", "Technical"],
    ["pending", "Pending"],
    ["restricted", "Restricted"],
  ] as const

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="rounded-2xl border bg-muted/25 p-3 sm:p-4">
        <div className="relative">
          <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 bg-background pl-10"
            placeholder="Search questions and answers…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={
                filter === value
                  ? "rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
                  : "rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              }
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto self-center px-1 text-xs text-muted-foreground">
            {visibleItems.length}{" "}
            {visibleItems.length === 1 ? "answer" : "answers"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {visibleItems.map((item) => (
          <details
            key={item.slug}
            className="group overflow-hidden rounded-2xl border bg-card open:shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-start gap-4 p-5 marker:content-none sm:p-6">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <RiQuestionLine className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="max-w-2xl font-medium leading-6">
                    {item.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    {item.status === "pending" ? (
                      <Badge variant="outline">Pending</Badge>
                    ) : null}
                    {item.claimState === "restricted" ? (
                      <Badge variant="outline">Restricted</Badge>
                    ) : null}
                    <Badge variant="outline">{tagLabel(item.audience)}</Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.summary}
                </p>
              </div>
              <RiArrowDownSLine className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t px-5 py-5 sm:pr-16 sm:pl-[5.25rem]">
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/85">
                {item.status === "pending"
                  ? (item.requestBeamLabel ??
                    "This answer is pending Beam review.")
                  : item.claimState === "restricted"
                    ? (item.requestBeamLabel ??
                      "Request Beam for an approved answer.")
                    : item.body}
              </p>
              <Link
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                href={workspacePath(workspace.slug, `/faq/${item.slug}`)}
              >
                Open full answer <RiArrowRightLine className="size-4" />
              </Link>
            </div>
          </details>
        ))}
        {visibleItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="font-medium">No matching questions</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another search or reset the filter.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function PreviewCatalog({
  kind,
  items,
  surface,
}: {
  kind: "material" | "playbook"
  items: ContentCard[]
  surface?: "materials" | "playbooks"
}) {
  const workspace = useWorkspace()
  return (
    <div
      className={
        kind === "playbook"
          ? "grid gap-5 lg:grid-cols-2"
          : "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      }
    >
      {items.map((item, index) => (
        <article
          key={item.slug}
          className="group overflow-hidden rounded-2xl border bg-card"
        >
          <div
            className="partner-preview-art relative aspect-[16/10] overflow-hidden border-b p-5"
            data-tone={
              index % 3 === 0 ? "blue" : index % 3 === 1 ? "violet" : "cyan"
            }
          >
            <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(white_.6px,transparent_.6px)] [background-size:5px_5px]" />
            <div className="relative flex h-full flex-col justify-between rounded-xl border border-white/15 bg-black/15 p-4 text-white shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex size-9 items-center justify-center rounded-lg bg-white/12">
                  {item.kind === "playbook" ? (
                    <RiBookOpenLine className="size-4" />
                  ) : (
                    <RiPresentationLine className="size-4" />
                  )}
                </div>
                <span className="font-mono text-[9px] tracking-[0.2em] text-white/55 uppercase">
                  Beam Partner
                </span>
              </div>
              <div>
                <p className="text-xs text-white/55">
                  {tagLabel(
                    item.format ??
                      (item.kind === "playbook" ? "Playbook" : "Material")
                  )}
                </p>
                <p className="mt-1 max-w-xs text-lg font-medium tracking-tight">
                  {item.title}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{tagLabel(item.audience)}</Badge>
              <Badge variant="outline">
                {item.forwardable ? "Forwardable" : "Internal"}
              </Badge>
              {item.status === "pending" ? (
                <Badge variant="outline">Pending</Badge>
              ) : null}
            </div>
            <div>
              <h2 className="font-medium">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.summary}
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              href={workspacePath(
                workspace.slug,
                `/${surface ?? contentSurface(item.kind)}/${item.slug}`
              )}
            >
              Preview <RiArrowRightLine className="size-4" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}

export function ContentDetail({
  kind,
  slug,
}: {
  kind: ContentKind
  slug: string
}) {
  if (authBypass) {
    return <BypassContentDetail kind={kind} slug={slug} />
  }
  return <LiveContentDetail kind={kind} slug={slug} />
}

export function MaterialsContentDetail({ slug }: { slug: string }) {
  if (authBypass) return <BypassMaterialsContentDetail slug={slug} />
  return <LiveMaterialsContentDetail slug={slug} />
}

function LiveMaterialsContentDetail({ slug }: { slug: string }) {
  const workspace = useWorkspace()
  const material = useQuery(api.partner.getContent, {
    workspaceId: workspace.workspaceId as never,
    kind: "material",
    slug,
  })
  const playbook = useQuery(api.partner.getContent, {
    workspaceId: workspace.workspaceId as never,
    kind: "playbook",
    slug,
  })
  const item =
    material === undefined || playbook === undefined
      ? undefined
      : (material ?? playbook)
  return (
    <ContentDetailBody
      kind={item?.kind ?? "material"}
      item={item as ContentCard | null | undefined}
    />
  )
}

function BypassMaterialsContentDetail({ slug }: { slug: string }) {
  const workspace = useWorkspace()
  const item = (getWorkspaceItem(workspace.slug, "material", slug) ??
    getWorkspaceItem(workspace.slug, "playbook", slug)) as ContentCard | null
  return <ContentDetailBody kind={item?.kind ?? "material"} item={item} />
}

function LiveContentDetail({
  kind,
  slug,
}: {
  kind: ContentKind
  slug: string
}) {
  const workspace = useWorkspace()
  const item = useQuery(api.partner.getContent, {
    workspaceId: workspace.workspaceId as never,
    kind,
    slug,
  })
  return <ContentDetailBody kind={kind} item={item} />
}

function BypassContentDetail({
  kind,
  slug,
}: {
  kind: ContentKind
  slug: string
}) {
  const workspace = useWorkspace()
  const item = getWorkspaceItem(
    workspace.slug,
    kind,
    slug
  ) as ContentCard | null
  return <ContentDetailBody kind={kind} item={item} />
}

function ContentDetailBody({
  kind,
  item,
}: {
  kind: ContentKind
  item: ContentCard | null | undefined
}) {
  const workspace = useWorkspace()

  if (item === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (item === null) {
    return (
      <p className="text-sm text-muted-foreground">
        This item is not attached to your workspace.
      </p>
    )
  }
  if (item.slug === "partner-cli") {
    return <PartnerCliDetail item={item} />
  }
  if (kind === "material" || kind === "playbook") {
    return <SharePreviewDetail item={item} kind={kind} />
  }
  return (
    <article className="max-w-3xl space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{tagLabel(item.audience)}</Badge>
        <Badge variant="outline">
          {item.status === "pending" ? "Pending" : tagLabel(item.claimState)}
        </Badge>
        {item.format ? (
          <Badge variant="outline">{tagLabel(item.format)}</Badge>
        ) : null}
      </div>
      <h2 className="text-3xl font-medium tracking-tight">{item.title}</h2>
      <p className="text-muted-foreground">{item.summary}</p>
      <div className="whitespace-pre-wrap text-sm leading-7">{item.body}</div>
      {item.href ? (
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          href={toolDestination(workspace.slug, item)}
          target={item.href.startsWith("https://") ? "_blank" : undefined}
          rel={item.href.startsWith("https://") ? "noreferrer" : undefined}
        >
          Open tool
          {item.href.startsWith("https://") ? (
            <RiExternalLinkLine className="size-4" />
          ) : (
            <RiArrowRightLine className="size-4" />
          )}
        </Link>
      ) : null}
      {item.claimState === "restricted" || item.requestBeamLabel ? (
        <p className="rounded-lg border p-3 text-sm">
          {item.requestBeamLabel ?? "Request Beam"}
        </p>
      ) : null}
    </article>
  )
}

const partnerStartProfiles = [
  {
    name: "Codex",
    tone: "cli",
    description:
      "Use the partner workspace while you research, draft, and prepare client work.",
  },
  {
    name: "Claude",
    tone: "knowledge",
    description:
      "Work through discovery and positioning with the reviewed partner context.",
  },
  {
    name: "Beam Prism",
    tone: "scope",
    description:
      "Start inside Beam’s agent workspace with the same partner-safe boundaries.",
  },
] as const

function PartnerCliDetail({ item }: { item: ContentCard }) {
  const workspace = useWorkspace()
  const [copied, setCopied] = useState<string | null>(null)

  function promptFor(profile: string) {
    return `Work with me as an approved ${workspace.displayName} partner in the ${workspace.brandHeader} workspace. Start by asking for the client outcome and candidate process. Use only reviewed partner tools, materials (including playbooks), and FAQ answers. Flag restricted claims and route them to Beam instead of inventing an answer. Help me qualify, scope, and prepare the next action for ${profile}.`
  }

  async function copyPrompt(profile: string) {
    await navigator.clipboard.writeText(promptFor(profile))
    setCopied(profile)
    window.setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div className="space-y-8">
      <div className="max-w-3xl space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Partner-safe</Badge>
          <Badge variant="outline">{tagLabel(item.audience)}</Badge>
        </div>
        <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
          Start with Beam Partner.
        </h2>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Choose where you want to work. Each start profile carries the same
          reviewed workspace boundaries into your agent.
        </p>
      </div>
      <section className="grid gap-4 lg:grid-cols-3">
        {partnerStartProfiles.map((profile) => (
          <article
            key={profile.name}
            className="partner-feature-card relative isolate flex min-h-80 overflow-hidden rounded-3xl border border-white/10 p-6 text-white shadow-xl"
            data-tone={profile.tone}
          >
            <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
            <div className="relative mt-auto w-full space-y-5">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <RiTerminalBoxLine className="size-5" />
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase">
                  Start profile
                </p>
                <h3 className="mt-2 text-2xl font-medium tracking-tight">
                  {profile.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  {profile.description}
                </p>
              </div>
              <Button
                className="w-full bg-white text-black hover:bg-white/90"
                onClick={() => copyPrompt(profile.name)}
              >
                {copied === profile.name ? (
                  <RiCheckLine />
                ) : (
                  <RiClipboardLine />
                )}
                {copied === profile.name
                  ? "Prompt copied"
                  : "Copy start prompt"}
              </Button>
            </div>
          </article>
        ))}
      </section>
      <p className="text-xs leading-5 text-muted-foreground">
        The Partner CLI currently starts a reviewed agent session. A native
        shell command can be added once the external CLI authentication contract
        is approved.
      </p>
    </div>
  )
}

function SharePreviewDetail({
  item,
  kind,
}: {
  item: ContentCard
  kind: "material" | "playbook"
}) {
  const hasPublishedShare = item.shareUrl?.startsWith(
    "https://shares.beam.ai/s/"
  )

  return (
    <div className="space-y-6">
      <div className="max-w-3xl space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{tagLabel(item.audience)}</Badge>
          {kind === "material" && item.status === "pending" ? (
            <Badge variant="outline">Pending</Badge>
          ) : (
            <Badge variant="outline">{tagLabel(item.claimState)}</Badge>
          )}
          <Badge variant="outline">
            {tagLabel(
              item.format ?? (kind === "playbook" ? "playbook" : "material")
            )}
          </Badge>
        </div>
        <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
          {item.title}
        </h2>
        <p className="text-base leading-7 text-muted-foreground">
          {item.summary}
        </p>
      </div>
      <section className="overflow-hidden rounded-3xl border bg-muted/25 p-3 shadow-sm sm:p-5">
        <div className="partner-share-frame mx-auto aspect-[16/9] max-w-5xl overflow-auto rounded-2xl border bg-background shadow-xl">
          {hasPublishedShare ? (
            <iframe
              className="h-full min-h-[32rem] w-full bg-background"
              src={`/api/share-preview/${encodeURIComponent(item.slug)}`}
              title={`${item.title} Beam Share`}
              loading="lazy"
              sandbox="allow-scripts allow-popups"
            />
          ) : (
            <>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-5 py-3 backdrop-blur">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Beam Share preview
                </div>
                <Badge variant="outline">
                  {item.forwardable ? "Forwardable" : "Partner internal"}
                </Badge>
              </div>
              <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10 sm:py-14">
                <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  {kind === "playbook"
                    ? "Partner playbook"
                    : item.status === "pending"
                      ? "Pending material"
                      : "Approved material"}
                </p>
                <h3 className="mt-4 text-3xl font-medium tracking-tight sm:text-5xl">
                  {item.title}
                </h3>
                <p className="mt-5 text-base leading-7 text-muted-foreground">
                  {item.summary}
                </p>
                <div className="mt-10 whitespace-pre-wrap border-t pt-8 text-sm leading-7 text-foreground/85">
                  {item.body}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
      {item.shareUrl ? (
        <Button
          variant="outline"
          render={<a href={item.shareUrl} target="_blank" rel="noreferrer" />}
        >
          <RiExternalLinkLine />
          Open in Beam Shares
        </Button>
      ) : null}
      <p className="text-xs leading-5 text-muted-foreground">
        {hasPublishedShare
          ? "Embedded from the reviewed Beam Share attached to this workspace."
          : "This preview uses the same presentation shell intended for Beam Shares. When a reviewed Share URL is attached, this frame renders that published page directly."}
      </p>
    </div>
  )
}
