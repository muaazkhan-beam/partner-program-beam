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
  RiTerminalBoxLine,
  RiToolsLine,
} from "@remixicon/react"

import { AddToPack } from "@/components/add-to-pack"
import { SendBadge, useSendLabel } from "@/components/send-badge"
import { Badge } from "@/components/ui/badge"
import { FaqAsk } from "@/components/faq-ask"
import { rankAnswers, type AskCandidate } from "@/lib/faq-answer"
import { holdReason } from "@/lib/pack"
import { groupByLifecycle } from "@/lib/lifecycle"
import { Button } from "@/components/ui/button"
import { WhereBeamFitsDetail } from "@/components/where-beam-fits"
import { useWorkspace } from "@/components/workspace-context"
import { authBypass } from "@/components/providers"
import type { ContentKind, UseCaseDetail } from "@/convex/catalogTypes"
import {
  getWorkspaceItem,
  listWorkspaceCompliance,
  listWorkspaceItems,
} from "@/lib/catalog/static"
import { requestHref, supportForKind } from "@/lib/request-links"
import { workspacePath } from "@/lib/workspace-resolver"
import { api } from "@partner/convex/_generated/api"
import { useQuery } from "convex/react"


function contentSurface(kind: ContentKind) {
  if (kind === "faq") return "faq"
  if (kind === "tool") return "tools"
  if (kind === "material") return "materials"
  if (kind === "use-case") return "use-cases"
  return "playbooks"
}

type ContentCard = {
  kind: ContentKind
  slug: string
  title: string
  summary: string
  body: string
  group?: string
  highlight?: boolean
  claimState: string
  audience: string
  forwardable: boolean
  requestBeamLabel?: string
  format?: string
  shareUrl?: string
  embedUrl?: string
  href?: string
  status?: "pending"
  useCase?: UseCaseDetail
}


const COMPLEXITY_LABEL: Record<string, string> = {
  starter: "Starter",
  standard: "Standard",
  complex: "Complex",
}

/**
 * Use cases are structured records, not documents, so they get their own
 * renderer rather than the share-preview one. The systems and the
 * human-approval step are what a partner is actually scanning for.
 */
function UseCaseCatalog({ items }: { items: ContentCard[] }) {
  const workspace = useWorkspace()
  const grouped = new Map<string, ContentCard[]>()
  for (const item of items) {
    const key = item.group ?? "Other"
    grouped.set(key, [...(grouped.get(key) ?? []), item])
  }

  return (
    <div className="space-y-10">
      {[...grouped.entries()].map(([department, groupItems]) => (
        <section key={department} className="space-y-4">
          <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            {department}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {groupItems.map((item) => {
              const detail = item.useCase
              return (
                <div
                  key={item.slug}
                  className="group relative flex flex-col gap-3 rounded-2xl border bg-card p-5 transition-colors focus-within:border-primary/40 hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {detail?.complexity ? (
                      <Badge variant="outline">
                        {COMPLEXITY_LABEL[detail.complexity] ?? detail.complexity}
                      </Badge>
                    ) : null}
                    <SendBadge item={item} />
                  </div>
                  <h3 className="text-lg font-medium tracking-tight">
                    <Link
                      href={workspacePath(workspace.slug, `/use-cases/${item.slug}`)}
                      className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                    >
                      {item.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.summary}</p>
                  {detail?.systems?.length ? (
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {detail.systems.join(" · ")}
                    </p>
                  ) : null}
                  <span className="mt-auto flex items-center justify-between gap-3">
                    <span className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                        View <RiArrowRightLine className="size-4" aria-hidden="true" />
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {detail?.outcome
                          ? `${detail.outcome.metric}: ${detail.outcome.value}`
                          : "No cited result yet"}
                      </span>
                    </span>
                    <span className="relative z-10">
                      <AddToPack kind="use-case" slug={item.slug} label={item.title} />
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function UseCaseRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-t py-4 sm:grid-cols-[160px_1fr] sm:gap-6">
      <dt className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-sm leading-6">{children}</dd>
    </div>
  )
}

function UseCaseDetailView({
  item,
  detail,
}: {
  item: ContentCard
  detail: UseCaseDetail
}) {
  return (
    <article className="max-w-3xl space-y-5">
      <div className="flex flex-wrap gap-2">
        <SendBadge item={item} />
        {detail.complexity ? (
          <Badge variant="outline">
            {COMPLEXITY_LABEL[detail.complexity] ?? detail.complexity}
          </Badge>
        ) : null}
      </div>

      <h2 className="text-3xl font-medium tracking-tight">{item.title}</h2>
      <p className="text-muted-foreground">{item.summary}</p>
      <p className="text-sm leading-7">{item.body}</p>

      <dl className="mt-2">
        <UseCaseRow label="Trigger">{detail.trigger}</UseCaseRow>
        <UseCaseRow label="Today">{detail.before}</UseCaseRow>
        <UseCaseRow label="With the agent">{detail.after}</UseCaseRow>
        <UseCaseRow label="Systems">
          <span className="font-mono text-[13px]">{detail.systems.join(" · ")}</span>
        </UseCaseRow>
        {detail.timeToProduction ? (
          <UseCaseRow label="Typical time to production">
            {detail.timeToProduction}
            <span className="block text-xs text-muted-foreground">
              Beam&apos;s estimate for planning, not a client result.
            </span>
          </UseCaseRow>
        ) : null}
        <UseCaseRow label="Outcome">
          {detail.outcome ? (
            <>
              <span className="font-medium">
                {detail.outcome.metric}: {detail.outcome.value}
              </span>
              <span className="block text-muted-foreground">
                Source: {detail.outcome.source}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              No measured outcome cleared for partner use yet. Do not quote a number
              for this use case.
            </span>
          )}
        </UseCaseRow>
      </dl>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <p className="font-mono text-[11px] tracking-[0.14em] text-primary uppercase">
          Human in the loop
        </p>
        <p className="mt-1.5 text-sm leading-6">{detail.humanInLoop}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <AddToPack kind="use-case" slug={item.slug} label={item.title} />
        <UseCaseScopeAction slug={item.slug} />
      </div>
    </article>
  )
}

function UseCaseScopeAction({ slug }: { slug: string }) {
  const workspace = useWorkspace()
  return (
    <Link
      className="flex max-w-xl flex-1 items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/40"
      href={workspacePath(workspace.slug, `/scope?seed=${encodeURIComponent(slug)}`)}
    >
      <span>Scope this for a client</span>
      <RiArrowRightLine className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

/** Who an item is written for, in words a partner uses. */
function audienceLabel(audience: string) {
  if (audience === "client-forwardable") return "Written for clients"
  if (audience === "technical") return "Technical"
  return "For partners"
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

/**
 * One question box, not two.
 *
 * The ask panel and the list each had their own input, so a partner could type
 * into the lower one and get filtering when they expected an answer. A partner
 * wants one thing, to ask a question, so a single query now drives both: the
 * answer above, the ranked list below.
 */
function FaqSurfaceBody({ items }: { items: ContentCard[] | undefined }) {
  const [query, setQuery] = useState("")
  if (items === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  return (
    <div className="space-y-6">
      <FaqAsk
        items={items as AskCandidate[]}
        query={query}
        onQueryChange={setQuery}
      />
      <FaqRows items={items} query={query} />
    </div>
  )
}

function LiveFaqSurface() {
  const workspace = useWorkspace()
  const items = useQuery(api.partner.listContent, {
    workspaceId: workspace.workspaceId as never,
    kind: "faq",
  })
  return <FaqSurfaceBody items={items as ContentCard[] | undefined} />
}

function BypassFaqSurface() {
  const workspace = useWorkspace()
  const items = listWorkspaceItems(workspace.slug, "faq") as ContentCard[]
  return <FaqSurfaceBody items={items} />
}

function HomeAskBody({ items }: { items: ContentCard[] | undefined }) {
  const [query, setQuery] = useState("")
  if (items === undefined) return null
  return (
    <FaqAsk
      items={items as AskCandidate[]}
      query={query}
      onQueryChange={setQuery}
      variant="home"
    />
  )
}

function LiveHomeAsk() {
  const workspace = useWorkspace()
  const items = useQuery(api.partner.listContent, {
    workspaceId: workspace.workspaceId as never,
    kind: "faq",
  })
  return <HomeAskBody items={items as ContentCard[] | undefined} />
}

function BypassHomeAsk() {
  const workspace = useWorkspace()
  return (
    <HomeAskBody
      items={listWorkspaceItems(workspace.slug, "faq") as ContentCard[]}
    />
  )
}

/**
 * The ask on Home: a partner should be able to say what they need rather than
 * learn where it lives. Same guarded content as the FAQ.
 */
export function HomeAsk() {
  if (authBypass) return <BypassHomeAsk />
  return <LiveHomeAsk />
}

/** Same data path as the list, so the answer can never surface what the list hides. */
export function FaqSurface() {
  if (authBypass) return <BypassFaqSurface />
  return <LiveFaqSurface />
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
  return <MaterialGroups items={items} />
}

/**
 * Materials are grouped by what a partner is trying to do, and each group leads
 * with one item.
 *
 * Before this, every material rendered as an identical card with a colour
 * picked by list position — so the colours carried no meaning and a partner had
 * to open each one to find out what it was. Now the highlight answers "start
 * here" and the rest say, in a line, how they differ.
 */
function MaterialGroups({ items }: { items: ContentCard[] }) {
  const workspace = useWorkspace()
  const sendLabelFor = useSendLabel()
  // Grouped by the lifecycle on Home, so scoping material never
  // sits below selling material it follows.
  const groups = groupByLifecycle(items, { slug: "more", name: "More material" })

  // The old pack record lists 8 policies by hand; the library holds all of
  // them as printed, so the card leads there instead of to a stale copy.
  const libraryCount = listWorkspaceCompliance(workspace.slug).length
  const isLibrary = (item: ContentCard) =>
    item.slug === "security-compliance-pack" && libraryCount > 0
  const href = (item: ContentCard) =>
    isLibrary(item)
      ? workspacePath(workspace.slug, "/compliance")
      : workspacePath(workspace.slug, `/${contentSurface(item.kind)}/${item.slug}`)
  const summaryOf = (item: ContentCard) =>
    isLibrary(item)
      ? `All ${libraryCount} policies, as printed. Start from the client's questions.`
      : item.summary
  const published = (item: ContentCard) => item.status !== "pending" || isLibrary(item)

  return (
    <div className="space-y-12">
      {groups.map(({ slug: group, name, number, items: groupItems }) => {
        // "Start here" belongs on something a partner can use today.
        const lead =
          groupItems.find((item) => item.highlight && published(item)) ??
          groupItems.find(published) ??
          groupItems.find((item) => item.highlight) ??
          groupItems[0]
        if (!lead) return null
        const rest = groupItems.filter((item) => item !== lead)
        return (
          <section key={group} className="space-y-4">
            <div className="flex items-baseline justify-between gap-3 border-b pb-2">
              <h2 className="text-sm font-medium">
                {number ? (
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{number}</span>
                ) : null}
                {name}
              </h2>
              <span className="text-xs text-muted-foreground">
                {groupItems.length} {groupItems.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
              <div className="group relative flex flex-col gap-4 self-start rounded-2xl border bg-card p-6 transition-colors focus-within:border-primary/40 hover:border-primary/40">
                <div className="flex flex-wrap items-center gap-2">
                  {published(lead) ? <Badge variant="outline">Start here</Badge> : null}
                  <Badge variant="outline">
                    {tagLabel(
                      lead.format ??
                        (lead.kind === "playbook" ? "Playbook" : "Material"),
                    )}
                  </Badge>
                  {isLibrary(lead) ? (
                    <Badge variant="outline">Library</Badge>
                  ) : (
                    <SendBadge item={lead} />
                  )}
                </div>
                <h3 className="text-xl font-medium tracking-tight">
                  <Link
                    href={href(lead)}
                    className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                  >
                    {lead.title}
                  </Link>
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {summaryOf(lead)}
                </p>
                <span className="mt-auto flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    {isLibrary(lead) ? "Open the library" : "View"}{" "}
                    <RiArrowRightLine className="size-4" aria-hidden="true" />
                  </span>
                  <span className="relative z-10">
                    {isLibrary(lead) ? null : (
                      <AddToPack kind={lead.kind} slug={lead.slug} label={lead.title} />
                    )}
                  </span>
                </span>
              </div>

              {rest.length > 0 ? (
                <ul className="flex flex-col divide-y rounded-2xl border bg-card">
                  {rest.map((item) => (
                    <li
                      key={item.slug}
                      className="relative flex items-start gap-3 p-4 transition-colors focus-within:bg-accent/40 hover:bg-accent/40"
                    >
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm font-medium tracking-tight">
                            <Link
                              href={href(item)}
                              className="after:absolute after:inset-0 focus-visible:outline-none"
                            >
                              {item.title}
                            </Link>
                          </p>
                          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {summaryOf(item)}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {tagLabel(
                                item.format ??
                                  (item.kind === "playbook"
                                    ? "Playbook"
                                    : "Material"),
                              )}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              ·
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {isLibrary(item) ? "Library" : sendLabelFor(item)}
                            </span>
                          </div>
                        </div>
                        <span className="relative z-10 shrink-0">
                          {isLibrary(item) ? null : (
                            <AddToPack kind={item.kind} slug={item.slug} label={item.title} />
                          )}
                        </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        )
      })}
    </div>
  )
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
    return <FaqRows items={items} query="" />
  }
  if (kind === "use-case") {
    return <UseCaseCatalog items={items} />
  }
  return <PreviewCatalog kind={kind} items={items} />
}

const featuredToolSlugs = ["partner-cli", "partner-faq", "operating-diagnostic"]

/**
 * A tool's button says where it goes. Several tools point at Beam Core, which
 * needs a Beam login; saying so beats a partner discovering it.
 */
function toolAction(item: ContentCard): { label: string; note?: string } {
  const href = item.href
  if (!href) return { label: "View details" }
  if (href.startsWith("https://core.beam.ai/")) {
    return { label: "Open in Beam Core", note: "Needs a Beam login" }
  }
  if (href.startsWith("https://")) return { label: `Open ${new URL(href).hostname}` }
  if (href === "/faq") return { label: "Open the FAQ" }
  if (href === "/materials") return { label: "Open materials" }
  if (href.startsWith("/materials/")) return { label: "Open the playbook" }
  if (href.startsWith("/requests")) return { label: "Request it from Beam" }
  return { label: "Open" }
}

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
  const grouped = groupByLifecycle(remaining, { slug: "anytime", name: "Any time" })

  return (
    <div className="space-y-10">
      <section className="grid gap-4 lg:grid-cols-3">
        {featured.map((item, index) => {
          const external = item.href?.startsWith("https://")
          return (
            <article
              key={item.slug}
              className="flex min-h-64 flex-col justify-between gap-5 rounded-3xl border bg-card p-6 transition-colors hover:border-primary/40"
              data-tone={index === 0 ? "cli" : index === 1 ? "knowledge" : "scope"}
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                <ToolIcon item={item} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-medium tracking-tight">{item.title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{item.summary}</p>
              </div>
              <div className="space-y-1.5">
                <Button
                  className="w-full justify-between"
                  render={
                    <Link
                      href={toolDestination(workspace.slug, item)}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noreferrer" : undefined}
                    />
                  }
                >
                  {toolAction(item).label}
                  {external ? (
                    <RiExternalLinkLine aria-hidden="true" />
                  ) : (
                    <RiArrowRightLine aria-hidden="true" />
                  )}
                </Button>
                {toolAction(item).note ? (
                  <p className="text-xs text-muted-foreground">{toolAction(item).note}</p>
                ) : null}
              </div>
            </article>
          )
        })}
      </section>

      {grouped.map(({ slug: group, name, number, items: groupItems }) => (
        <section key={group} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium">
              {number ? (
                <span className="mr-2 font-mono text-sm text-muted-foreground">{number}</span>
              ) : null}
              {name}
            </h2>
            <span className="text-xs text-muted-foreground">
              {groupItems.length} {groupItems.length === 1 ? "tool" : "tools"}
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
                    <Badge variant="outline">{audienceLabel(item.audience)}</Badge>
                  </div>
                  <h3 className="mt-5 font-medium">{item.title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                    {item.summary}
                  </p>
                  {toolAction(item).note ? (
                    <p className="mt-2 text-xs text-muted-foreground">{toolAction(item).note}</p>
                  ) : null}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <Link
                      className="inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-primary hover:underline"
                      href={toolDestination(workspace.slug, item)}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noreferrer" : undefined}
                    >
                      {toolAction(item).label}
                      {external ? (
                        <RiExternalLinkLine className="size-4" aria-hidden="true" />
                      ) : (
                        <RiArrowRightLine className="size-4" aria-hidden="true" />
                      )}
                    </Link>
                    <AddToPack kind="tool" slug={item.slug} label={item.title} />
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function FaqRows({
  items,
  query,
}: {
  items: ContentCard[]
  /** Owned by the ask box above: one input drives both the answer and the list. */
  query: string
}) {
  const workspace = useWorkspace()
  const [filter, setFilter] = useState<"all" | "client" | "internal" | "beam">("all")
  // The list ranks by the same terms the ask box answers from, so the two can
  // never disagree (an answer above, "no matching questions" below).
  const matched = query.trim()
    ? rankAnswers(query, items as AskCandidate[]).map(
        (candidate) => items.find((item) => item.slug === candidate.slug)!
      )
    : items
  const bucket = (item: ContentCard) => {
    const reason = holdReason(item, workspace.brandMode)
    if (reason === null) return "client"
    if (reason === "pending" || reason === "restricted") return "beam"
    return "internal"
  }
  const visibleItems = matched.filter(
    (item) => filter === "all" || bucket(item) === filter
  )
  const filters = [
    ["all", "All"],
    ["client", "Can go to a client"],
    ["internal", "For you only"],
    ["beam", "Waiting on Beam"],
  ] as const

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="rounded-2xl border bg-muted/25 p-3 sm:p-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter answers">
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
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
          <span
            className="ml-auto self-center px-1 text-xs text-muted-foreground"
            aria-live="polite"
          >
            {visibleItems.length} {visibleItems.length === 1 ? "answer" : "answers"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {(query.trim()
          ? [{ slug: "matches", name: "", number: undefined, items: visibleItems }]
          : groupByLifecycle(visibleItems, { slug: "partnership", name: "About the partnership" })
        ).map((section) => (
          <section key={section.slug} className="space-y-3">
            {section.name ? (
              <h2 className="pt-3 text-sm font-medium">
                {section.number ? (
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{section.number}</span>
                ) : null}
                {section.name}
              </h2>
            ) : null}
            {section.items.map((item) => (
              <FaqRow key={item.slug} item={item} />
            ))}
          </section>
        ))}
        {visibleItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="font-medium">
              {query.trim() ? "No other answers mention that" : "No answers here"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === "all"
                ? "Try fewer words, or ask the Beam team."
                : "Try another filter."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function FaqRow({ item }: { item: ContentCard }) {
  const workspace = useWorkspace()
  const [open, setOpen] = useState(false)
  const panelId = `faq-panel-${item.slug}`
  const unpublished = item.status === "pending" || item.claimState === "restricted"
  return (
    <div className={`overflow-hidden rounded-2xl border bg-card ${open ? "shadow-sm" : ""}`}>
      <div className="flex items-start gap-3 p-5 sm:gap-4 sm:p-6">
        <div className="mt-0.5 hidden size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground sm:flex">
          <RiQuestionLine className="size-4" aria-hidden="true" />
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="min-w-0 flex-1 rounded-md text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="flex flex-wrap items-center gap-2">
            <span className="max-w-2xl font-medium leading-6">{item.title}</span>
          </span>
          <span className="mt-2 block text-sm leading-6 text-muted-foreground">
            {item.summary}
          </span>
        </button>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <SendBadge item={item} />
          <AddToPack kind="faq" slug={item.slug} label={item.title} />
        </div>
        <RiArrowDownSLine
          aria-hidden="true"
          className={`mt-1 hidden size-5 shrink-0 text-muted-foreground transition-transform sm:block ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open ? (
        <div id={panelId} className="border-t px-5 py-5 sm:pr-16 sm:pl-[5.25rem]">
          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/85">
            {item.status === "pending"
              ? (item.requestBeamLabel ?? "Beam has not published this answer yet.")
              : item.claimState === "restricted"
                ? (item.requestBeamLabel ?? "Ask Beam for an approved answer.")
                : item.body}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {unpublished ? (
              <Link
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                href={requestHref(workspace.slug, {
                  about: `faq:${item.slug}`,
                  support: "faq-escalation",
                })}
              >
                Ask the Beam team <RiArrowRightLine className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
            <Link
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              href={workspacePath(workspace.slug, `/faq/${item.slug}`)}
            >
              Open full answer <RiArrowRightLine className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : null}
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
              <SendBadge item={item} />
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
  if (kind === "material" && item.slug === "where-beam-fits") {
    return <WhereBeamFitsDetail item={item} />
  }
  if (kind === "material" || kind === "playbook") {
    return <SharePreviewDetail item={item} kind={kind} />
  }
  if (kind === "use-case" && item.useCase) {
    return <UseCaseDetailView item={item} detail={item.useCase} />
  }
  return (
    <article className="max-w-3xl space-y-4">
      <div className="flex flex-wrap gap-2">
        <SendBadge item={item} />
        {item.format ? (
          <Badge variant="outline">{tagLabel(item.format)}</Badge>
        ) : null}
      </div>
      <h2 className="text-3xl font-medium tracking-tight">{item.title}</h2>
      <p className="text-muted-foreground">{item.summary}</p>
      <div className="whitespace-pre-wrap text-sm leading-7">
        {item.claimState === "restricted"
          ? "Only Beam can answer this for a client."
          : item.status === "pending"
            ? "Beam has not published this answer yet."
            : item.body}
      </div>
      {kind === "faq" || kind === "tool" ? (
        <AddToPack kind={kind} slug={item.slug} label={item.title} />
      ) : null}
      {item.href ? (
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          href={toolDestination(workspace.slug, item)}
          target={item.href.startsWith("https://") ? "_blank" : undefined}
          rel={item.href.startsWith("https://") ? "noreferrer" : undefined}
        >
          {toolAction(item).label}
          {item.href.startsWith("https://") ? (
            <RiExternalLinkLine className="size-4" />
          ) : (
            <RiArrowRightLine className="size-4" />
          )}
        </Link>
      ) : null}
      {item.claimState === "restricted" || item.requestBeamLabel ? (
        <Link
          className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/40"
          href={requestHref(workspace.slug, {
            about: `${item.kind}:${item.slug}`,
            support: supportForKind(item.kind),
          })}
        >
          <span>{item.requestBeamLabel ?? "Ask the Beam team"}</span>
          <RiArrowRightLine className="size-4 shrink-0 text-muted-foreground" />
        </Link>
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
          <Badge variant="outline">{audienceLabel(item.audience)}</Badge>
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
  const workspace = useWorkspace()
  const hasPublishedShare = item.shareUrl?.startsWith(
    "https://shares.beam.ai/s/"
  )
  // A pending material has no file to open yet, so the request is the only
  // action on the page; keep it beside the title rather than under the frame.
  const requestLink =
    item.status === "pending" || item.requestBeamLabel ? (
      <Link
        className="flex max-w-xl items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/40"
        href={requestHref(workspace.slug, {
          about: `${item.kind}:${item.slug}`,
          support: supportForKind(item.kind),
        })}
      >
        <span>{item.requestBeamLabel ?? "Ask the Beam team"}</span>
        <RiArrowRightLine className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    ) : null

  return (
    <div className="space-y-6">
      <div className="max-w-3xl space-y-4">
        <div className="flex flex-wrap gap-2">
          <SendBadge item={item} />
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
        <AddToPack kind={item.kind} slug={item.slug} label={item.title} />
        {hasPublishedShare ? null : requestLink}
      </div>
      <section className="overflow-hidden rounded-3xl border bg-muted/25 p-3 shadow-sm sm:p-5">
        <div className="partner-share-frame mx-auto aspect-[16/9] max-w-5xl overflow-auto rounded-2xl border bg-background shadow-xl">
          {hasPublishedShare ? (
            <iframe
              className="h-full min-h-[32rem] w-full bg-background"
              src={`/api/share-preview/${encodeURIComponent(item.slug)}`}
              title={`${item.title} preview`}
              loading="lazy"
              sandbox="allow-scripts allow-popups"
            />
          ) : (
            <>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-5 py-3 backdrop-blur">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Preview
                </div>
                <SendBadge item={item} />
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
        // One action, named for what it does. A share is a web page, not a file the portal can download; the
        // PDF a client receives comes from the client pack.
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            render={<a href={item.shareUrl} target="_blank" rel="noreferrer" />}
          >
            <RiExternalLinkLine aria-hidden="true" />
            Open
          </Button>
        </div>
      ) : null}
      {hasPublishedShare ? requestLink : null}
      <p className="text-xs leading-5 text-muted-foreground">
        {hasPublishedShare
          ? "Reviewed and approved for this workspace."
          : "Preview only. The reviewed copy is attached once Beam publishes it."}
      </p>
    </div>
  )
}
