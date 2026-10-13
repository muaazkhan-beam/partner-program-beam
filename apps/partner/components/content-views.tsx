"use client"

import Link from "next/link"
import { useState, type CSSProperties } from "react"
import {
  RiArrowDownSLine,
  RiArrowRightLine,
  RiBookOpenLine,
  RiCheckLine,
  RiClipboardLine,
  RiCornerDownRightLine,
  RiExternalLinkLine,
  RiFileList3Line,
  RiFileTextLine,
  RiFolderLine,
  RiPresentationLine,
  RiQuestionLine,
  RiRobot2Line,
  RiSendPlaneLine,
  RiShieldCheckLine,
  RiTerminalBoxLine,
  RiToolsLine,
} from "@remixicon/react"

import { AddToPack } from "@/components/add-to-pack"
import { ItemClaimBadge, useClaimState } from "@/components/claim-state"
import { SendBadge } from "@/components/send-badge"
import { Badge } from "@/components/ui/badge"
import { FaqAsk } from "@/components/faq-ask"
import { FileDrop, type DroppedFile } from "@/components/file-drop"
import { rankAnswers, type AskCandidate } from "@/lib/faq-answer"
import { holdReason } from "@/lib/pack"
import { type ClaimStateKey } from "@/lib/claim-state"
import { foldClientVersions, rowsInOrder, type VersionedRow } from "@/lib/client-versions"
import { groupByLifecycle, phaseOf } from "@/lib/lifecycle"
import { journeyPhases } from "@/lib/partner-journey"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { WhereBeamFitsDetail } from "@/components/where-beam-fits"
import { useWorkspace } from "@/components/workspace-context"
import { authBypass } from "@/components/providers"
import type { ContentKind, UseCaseDetail } from "@/convex/catalogTypes"
import {
  getWorkspaceItem,
  isLibraryPack,
  listWorkspaceCompliance,
  listWorkspaceItems,
} from "@/lib/catalog/static"
import { requestHref, supportForKind } from "@/lib/request-links"
import { IntakeError, readIntake, sourceKind, type Intake } from "@/lib/desk/intake"
import { EmailParseError, parseEml } from "@/lib/intake/eml"
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
  /** Set on a client version: the answer or use case it was written from. */
  sourceSlug?: string
}


const COMPLEXITY_LABEL: Record<string, string> = {
  starter: "Starter",
  standard: "Standard",
  complex: "Complex",
}

/** One filter row for every list: chips with their counts, and what is showing. */
function FilterChips<K extends string>({
  label,
  options,
  value,
  onChange,
  readout,
}: {
  label: string
  options: ReadonlyArray<{ key: K; label: string; count: number }>
  value: K
  onChange: (key: K) => void
  readout: string
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      {options.map((option) => {
        const selected = value === option.key
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.key)}
            className={cn(
              "pressable inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              selected
                ? "border-foreground bg-foreground text-background"
                : "bg-background text-foreground hover:bg-muted"
            )}
          >
            {option.label}{" "}
            <span className={selected ? "text-background/70" : "text-muted-foreground"}>
              {option.count}
            </span>
          </button>
        )
      })}
      <span className="ml-auto text-xs text-muted-foreground" aria-live="polite">
        {readout}
      </span>
    </div>
  )
}

/** The client-voice version of the row above it, with its own state and pack button. */
function ClientVersionLine({ item }: { item: ContentCard }) {
  const workspace = useWorkspace()
  return (
    <div className="relative z-10 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pb-3 pl-12 sm:pl-16">
      <RiCornerDownRightLine className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="min-w-0 flex-1 basis-48 text-sm">
        <span className="text-muted-foreground">Client version: </span>
        <Link
          className="font-medium underline-offset-4 hover:underline"
          href={workspacePath(workspace.slug, `/${contentSurface(item.kind)}/${item.slug}`)}
        >
          {item.title}
        </Link>
      </p>
      <ItemClaimBadge item={item} />
      <AddToPack kind={item.kind} slug={item.slug} label={item.title} item={item} />
    </div>
  )
}

/**
 * Use cases are structured records, not documents, so they get their own
 * renderer rather than the share-preview one: by department, one row each,
 * with the systems it touches and whether a result is cited. A client version
 * sits under the use case it was written from, never as a second entry.
 */
function UseCaseCatalog({ items }: { items: ContentCard[] }) {
  const workspace = useWorkspace()
  const grouped = new Map<string, VersionedRow<ContentCard>[]>()
  for (const row of foldClientVersions(items)) {
    const key = row.item.group ?? "Other"
    grouped.set(key, [...(grouped.get(key) ?? []), row])
  }

  return (
    <div className="space-y-8">
      {[...grouped.entries()].map(([department, rows]) => (
        <section key={department} className="space-y-3">
          <div className="flex items-baseline justify-between gap-3 border-b pb-2">
            <h2 className="text-sm font-medium">{department}</h2>
            <span className="text-xs text-muted-foreground">
              {rows.length} {rows.length === 1 ? "use case" : "use cases"}
            </span>
          </div>
          <ul className="divide-y rounded-xl border bg-card">
            {rows.map(({ item, clientVersions }, index) => {
              const detail = item.useCase
              const meta = [
                detail?.complexity
                  ? (COMPLEXITY_LABEL[detail.complexity] ?? detail.complexity)
                  : null,
                detail?.systems?.length ? detail.systems.join(", ") : null,
                detail?.outcome
                  ? `${detail.outcome.metric}: ${detail.outcome.value}`
                  : "No cited result yet",
              ]
                .filter(Boolean)
                .join(" · ")
              return (
                <li
                  key={item.slug}
                  className="rise-in relative transition-colors focus-within:bg-muted/40 hover:bg-muted/40"
                  style={{ "--i": index } as CSSProperties}
                >
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <RiFileList3Line className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium">
                          <Link
                            href={workspacePath(workspace.slug, `/use-cases/${item.slug}`)}
                            className="after:absolute after:inset-0 focus-visible:outline-none"
                          >
                            {item.title}
                          </Link>
                        </h3>
                        <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                          {item.summary}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
                      </div>
                    </div>
                    <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 pl-12 sm:justify-end sm:pl-0">
                      <ItemClaimBadge item={item} />
                      <AddToPack kind="use-case" slug={item.slug} label={item.title} item={item} />
                    </div>
                  </div>
                  {clientVersions.map((version) => (
                    <ClientVersionLine key={version.slug} item={version} />
                  ))}
                </li>
              )
            })}
          </ul>
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
        <AddToPack kind="use-case" slug={item.slug} label={item.title} item={item} />
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

/**
 * The same ask box, with one more way in: drop the client's email or their
 * questionnaire. An email's text goes into the box as if pasted; a
 * questionnaire's questions go in numbered, and the sheet offers the file
 * back, filled. Nothing is uploaded.
 */
function HomeAskBody({ items }: { items: ContentCard[] | undefined }) {
  const workspace = useWorkspace()
  const [query, setQuery] = useState("")
  const [questionnaire, setQuestionnaire] = useState<Intake | null>(null)
  const [dropError, setDropError] = useState("")
  if (items === undefined) return null

  function takeFile(file: DroppedFile) {
    setDropError("")
    try {
      const kind = sourceKind(file.name)
      if (kind === "email") {
        setQuestionnaire(null)
        setQuery(parseEml(file.text).body)
      } else if (kind === "questionnaire") {
        const intake = readIntake({ kind: "questionnaire", csv: file.text, fileName: file.name })
        setQuestionnaire(intake)
        setQuery(intake.questions.map((question, index) => `${index + 1}. ${question.text}`).join("\n"))
      } else {
        setQuestionnaire(null)
        setQuery(file.text)
      }
    } catch (error) {
      if (error instanceof IntakeError || error instanceof EmailParseError) setDropError(error.message)
      else throw error
    }
  }

  return (
    <FaqAsk
      items={items as AskCandidate[]}
      query={query}
      onQueryChange={(value) => {
        setQuery(value)
        // Typing over a dropped questionnaire means it is no longer that file.
        if (questionnaire) setQuestionnaire(null)
      }}
      variant="home"
      questionnaire={questionnaire}
      extra={
        <div className="space-y-2">
          <FileDrop
            compact
            hint="Or drop the client's email (.eml) or questionnaire (.csv)"
            samples={
              workspace.isDemo
                ? [
                    { label: "Use the sample email", name: "orvane-vendor-review.eml" },
                    { label: "Use the sample questionnaire", name: "calderhay-questionnaire.csv" },
                  ]
                : []
            }
            onFile={takeFile}
          />
          {dropError ? (
            <p role="alert" className="text-xs text-warning-text">
              {dropError}
            </p>
          ) : null}
        </div>
      }
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
 * Materials in one consistent list, the shape of the compliance library: a
 * filter row on top, then rows in lifecycle order, each with its format, its
 * claim state and the one thing a partner can do with it. The first usable
 * item of each phase is marked "Start here" in words, not a badge.
 */
type MaterialFilter = "all" | "can-go" | "not-published" | "for-you"

const MATERIAL_FILTERS: Array<{ key: MaterialFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "can-go", label: "Can go to a client" },
  { key: "not-published", label: "Not published yet" },
  { key: "for-you", label: "For you only" },
]

function filterOf(state: ClaimStateKey): MaterialFilter {
  if (state === "can-go" || state === "demo") return "can-go"
  if (state === "not-published") return "not-published"
  return "for-you"
}

function MaterialIcon({ item }: { item: ContentCard }) {
  const className = "size-4"
  if (item.slug === "security-compliance-pack") return <RiShieldCheckLine className={className} />
  if (item.format === "deck") return <RiPresentationLine className={className} />
  if (item.format === "pack") return <RiFolderLine className={className} />
  if (item.kind === "playbook" || item.format === "playbook")
    return <RiBookOpenLine className={className} />
  return <RiFileTextLine className={className} />
}

function MaterialGroups({ items }: { items: ContentCard[] }) {
  const workspace = useWorkspace()
  const stateOf = useClaimState()
  const [filter, setFilter] = useState<MaterialFilter>("all")

  // The old pack record lists 8 policies by hand; the library holds all of
  // them as printed, so the row leads there instead of to a stale copy.
  const libraryCount = listWorkspaceCompliance(workspace.slug).length
  const isLibrary = (item: ContentCard) => isLibraryPack(workspace.slug, item)
  const href = (item: ContentCard) =>
    isLibrary(item)
      ? workspacePath(workspace.slug, "/compliance")
      : workspacePath(workspace.slug, `/${contentSurface(item.kind)}/${item.slug}`)
  const summaryOf = (item: ContentCard) =>
    isLibrary(item)
      ? `All ${libraryCount} policies, as printed. Start from the client's questions.`
      : item.summary
  const published = (item: ContentCard) => item.status !== "pending" || isLibrary(item)
  // The library's documents reach the client through Beam, so it answers
  // "what can I send" even though the pack record itself is pending.
  const bucket = (item: ContentCard): MaterialFilter =>
    isLibrary(item) ? "can-go" : filterOf(stateOf(item))
  const countOf = (key: MaterialFilter) =>
    key === "all" ? items.length : items.filter((item) => bucket(item) === key).length

  const visible = filter === "all" ? items : items.filter((item) => bucket(item) === filter)
  const groups = groupByLifecycle(visible, { slug: "more", name: "More material" })
  const formatLabel = (item: ContentCard) =>
    tagLabel(item.format ?? (item.kind === "playbook" ? "playbook" : "material"))

  return (
    <div className="space-y-8">
      <FilterChips
        label="Show materials"
        options={MATERIAL_FILTERS.map((entry) => ({ ...entry, count: countOf(entry.key) }))}
        value={filter}
        onChange={setFilter}
        readout={`${visible.length} of ${items.length} materials`}
      />

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing is marked {MATERIAL_FILTERS.find((entry) => entry.key === filter)?.label.toLowerCase()} yet.
        </p>
      ) : null}

      {groups.map(({ slug: group, name, items: groupItems }) => {
        // "Start here" belongs on something a partner can use today.
        const lead =
          groupItems.find((item) => item.highlight && published(item)) ??
          groupItems.find(published) ??
          groupItems.find((item) => item.highlight) ??
          groupItems[0]
        const ordered = lead ? [lead, ...groupItems.filter((item) => item !== lead)] : groupItems
        return (
          <section key={group} className="space-y-3">
            <div className="flex items-baseline justify-between gap-3 border-b pb-2">
              <h2 className="text-sm font-medium">{name}</h2>
              <span className="text-xs text-muted-foreground">
                {groupItems.length} {groupItems.length === 1 ? "item" : "items"}
              </span>
            </div>
            <ul className="divide-y rounded-xl border bg-card">
              {ordered.map((item, index) => (
                <li
                  key={item.slug}
                  className="rise-in relative flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-6"
                  style={{ "--i": index } as CSSProperties}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <MaterialIcon item={item} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        <Link
                          href={href(item)}
                          className="after:absolute after:inset-0 focus-visible:outline-none"
                        >
                          {item.title}
                        </Link>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {summaryOf(item)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {isLibrary(item) ? "Library" : formatLabel(item)}
                        {item === lead && published(item) ? " · Start here" : null}
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 pl-12 sm:justify-end sm:pl-0">
                    {isLibrary(item) ? (
                      <span
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                        aria-hidden="true"
                      >
                        Open the library <RiArrowRightLine className="size-4" />
                      </span>
                    ) : (
                      <>
                        <ItemClaimBadge item={item} />
                        <AddToPack kind={item.kind} slug={item.slug} label={item.title} item={item} />
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
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

/**
 * A tool is one of three things, and its group says which: a page the partner
 * opens here, a Beam product that needs a Beam login, or a skill the Beam team
 * runs on the client's process. One verb per group, so no button has to
 * explain itself. The lifecycle is a line on the row, not the structure; it
 * lives on the journey.
 */
type ToolKind = "portal" | "beam-product" | "beam-runs"

function toolKind(item: ContentCard): ToolKind {
  const href = item.href ?? ""
  if (href.startsWith("https://core.beam.ai/")) return "beam-runs"
  if (href.startsWith("/requests")) return "beam-runs"
  if (href.startsWith("https://")) return "beam-product"
  return "portal"
}

const TOOL_GROUPS: Array<{ kind: ToolKind; name: string; lead: string }> = [
  { kind: "portal", name: "In this portal", lead: "Pages and prompts you use yourself." },
  {
    kind: "beam-product",
    name: "Beam products",
    lead: "Beam's own apps. They need a Beam login; ask Beam if you do not have one.",
  },
  {
    kind: "beam-runs",
    name: "Beam runs it for you",
    lead: "Skills the Beam team runs on your client's process. Ask with the client's name and what you already have.",
  },
]

/** The product a link leaves for, named the way Beam names it. */
const OPEN_LABEL: Record<string, string> = {
  "iris.beam.ai": "Open in Iris",
  "discovery.beam.ai": "Open in Discovery",
  "app.beam.ai": "Open the Beam Platform",
  "core.beam.ai": "Open in Beam Core",
}

function openLabel(href: string) {
  const host = new URL(href).hostname
  return OPEN_LABEL[host] ?? `Open ${host}`
}

/** What a portal row opens, since "Open" alone does not say. */
function portalWhat(item: ContentCard) {
  if (item.href?.startsWith("/faq/")) return "FAQ answer"
  if (item.href?.startsWith("/materials/")) return "Playbook"
  if (!item.href) return "Start prompts"
  return "Page"
}

function phaseFor(item: ContentCard) {
  const slug = phaseOf(item)
  return journeyPhases.find((phase) => phase.slug === slug) ?? null
}

function ToolIcon({ item }: { item: ContentCard }) {
  const className = "size-4"
  if (item.slug === "partner-cli") return <RiTerminalBoxLine className={className} />
  if (item.slug === "beam-platform") return <RiRobot2Line className={className} />
  if (item.href === "/faq") return <RiQuestionLine className={className} />
  if (item.href?.startsWith("/materials")) return <RiBookOpenLine className={className} />
  if (toolKind(item) === "beam-product") return <RiPresentationLine className={className} />
  if (toolKind(item) === "beam-runs") return <RiFileList3Line className={className} />
  return <RiToolsLine className={className} />
}

function ToolRow({ item, index }: { item: ContentCard; index: number }) {
  const workspace = useWorkspace()
  const kind = toolKind(item)
  const phase = phaseFor(item)
  const destination = toolDestination(workspace.slug, item)
  const external = item.href?.startsWith("https://") ?? false
  const askHref = requestHref(workspace.slug, {
    about: `tool:${item.slug}`,
    support: item.slug === "platform-demo" ? "shadow-demo" : "other",
  })
  const phaseLine = phase ? (
    <>
      Used in:{" "}
      <Link
        className="relative z-10 underline-offset-4 hover:text-foreground hover:underline"
        href={workspacePath(workspace.slug, `/journey?phase=${phase.slug}`)}
      >
        {phase.name}
      </Link>
    </>
  ) : (
    "Any phase"
  )

  return (
    <li
      className="rise-in relative flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-6"
      style={{ "--i": index } as CSSProperties}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <ToolIcon item={item} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            <Link
              href={kind === "portal" ? destination : workspacePath(workspace.slug, `/tools/${item.slug}`)}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              {item.title}
            </Link>
          </p>
          <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{item.summary}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {kind === "portal" ? `${portalWhat(item)} · ` : null}
            {phaseLine}
            {external ? " · Beam login" : null}
          </p>
        </div>
      </div>
      <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 pl-12 sm:justify-end sm:pl-0">
        {kind === "portal" ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary" aria-hidden="true">
            Open <RiArrowRightLine className="size-4" />
          </span>
        ) : null}
        {kind === "beam-product" && item.href ? (
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={item.href}
            target="_blank"
            rel="noreferrer"
          >
            {openLabel(item.href)} <RiExternalLinkLine aria-hidden="true" />
          </Link>
        ) : null}
        {kind === "beam-runs" ? (
          <>
            {external && item.href ? (
              <Link
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                href={item.href}
                target="_blank"
                rel="noreferrer"
              >
                {openLabel(item.href)} <RiExternalLinkLine className="size-3.5" aria-hidden="true" />
              </Link>
            ) : null}
            <Link className={buttonVariants({ size: "sm" })} href={askHref}>
              <RiSendPlaneLine aria-hidden="true" /> Ask Beam
            </Link>
          </>
        ) : null}
      </div>
    </li>
  )
}

function ToolCatalog({ items }: { items: ContentCard[] }) {
  return (
    <div className="space-y-10">
      {TOOL_GROUPS.map((group) => {
        const groupItems = items.filter((item) => toolKind(item) === group.kind)
        if (groupItems.length === 0) return null
        return (
          <section key={group.kind} className="space-y-3">
            <div className="flex items-baseline justify-between gap-3 border-b pb-2">
              <div>
                <h2 className="text-sm font-medium">{group.name}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{group.lead}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {groupItems.length} {groupItems.length === 1 ? "tool" : "tools"}
              </span>
            </div>
            <ul className="divide-y rounded-xl border bg-card">
              {groupItems.map((item, index) => (
                <ToolRow key={item.slug} item={item} index={index} />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

type FaqFilter = "all" | "client" | "internal" | "beam"

const FAQ_FILTERS: Array<{ key: FaqFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "client", label: "Can go to a client" },
  { key: "internal", label: "For you only" },
  { key: "beam", label: "Waiting on Beam" },
]

/**
 * Every answer once, in the shape of the other lists: a filter row, then rows
 * by lifecycle phase. A client version sits under the answer it was written
 * from, and counts toward "Can go to a client" for that row.
 */
function FaqRows({
  items,
  query,
}: {
  items: ContentCard[]
  /** Owned by the ask box above: one input drives both the answer and the list. */
  query: string
}) {
  const workspace = useWorkspace()
  const [filter, setFilter] = useState<FaqFilter>("all")
  const rows = foldClientVersions(items)
  // The list ranks by the same terms the ask box answers from, so the two can
  // never disagree (an answer above, "no matching questions" below).
  const matched = query.trim()
    ? rowsInOrder(
        rows,
        rankAnswers(query, items as AskCandidate[]).map((candidate) => candidate.slug)
      )
    : rows
  const bucket = (item: ContentCard): FaqFilter => {
    const reason = holdReason(item, workspace.brandMode, { demoWorkspace: workspace.isDemo })
    if (reason === null) return "client"
    if (reason === "pending" || reason === "restricted") return "beam"
    return "internal"
  }
  const inFilter = (row: VersionedRow<ContentCard>, key: FaqFilter) =>
    key === "all" ||
    bucket(row.item) === key ||
    (key === "client" && row.clientVersions.some((version) => bucket(version) === "client"))
  const visible = matched.filter((row) => inFilter(row, filter))
  const rowOf = new Map(visible.map((row) => [row.item.slug, row] as const))
  const sections = query.trim()
    ? [{ slug: "matches", name: "", rows: visible }]
    : groupByLifecycle(
        visible.map((row) => row.item),
        { slug: "partnership", name: "About the partnership" }
      ).map((group) => ({
        slug: group.slug,
        name: group.name,
        rows: group.items.flatMap((item) => rowOf.get(item.slug) ?? []),
      }))

  return (
    <div className="space-y-6">
      <FilterChips
        label="Filter answers"
        options={FAQ_FILTERS.map((entry) => ({
          ...entry,
          count: matched.filter((row) => inFilter(row, entry.key)).length,
        }))}
        value={filter}
        onChange={setFilter}
        readout={`${visible.length} ${visible.length === 1 ? "answer" : "answers"}`}
      />

      {sections
        .filter((section) => section.rows.length > 0)
        .map((section) => (
          <section key={section.slug} className="space-y-3">
            {section.name ? (
              <div className="flex items-baseline justify-between gap-3 border-b pb-2">
                <h2 className="text-sm font-medium">{section.name}</h2>
                <span className="text-xs text-muted-foreground">
                  {section.rows.length} {section.rows.length === 1 ? "question" : "questions"}
                </span>
              </div>
            ) : null}
            <ul className="divide-y rounded-xl border bg-card">
              {section.rows.map((row, index) => (
                <FaqRow key={row.item.slug} row={row} index={index} />
              ))}
            </ul>
          </section>
        ))}

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">
            {query.trim() ? "No other answers mention that" : "No answers here"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === "all" ? "Try fewer words, or ask the Beam team." : "Try another filter."}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function FaqRow({ row, index }: { row: VersionedRow<ContentCard>; index: number }) {
  const { item, clientVersions } = row
  const workspace = useWorkspace()
  const [open, setOpen] = useState(false)
  // The answer is rendered the first time the row opens and kept after, so it
  // can fold shut as smoothly as it opened.
  const [rendered, setRendered] = useState(false)
  const panelId = `faq-panel-${item.slug}`
  const unpublished = item.status === "pending" || item.claimState === "restricted"
  const toggle = () => {
    setRendered(true)
    setOpen((value) => !value)
  }
  return (
    <li className="rise-in" style={{ "--i": index } as CSSProperties}>
      <div className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <RiQuestionLine className="size-4" aria-hidden="true" />
          </span>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={toggle}
            className="min-w-0 flex-1 rounded-md text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="block text-sm font-medium">{item.title}</span>
            <span className="mt-0.5 block text-sm leading-6 text-muted-foreground">
              {item.summary}
            </span>
          </button>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 pl-12 sm:pl-0">
          <ItemClaimBadge item={item} />
          <AddToPack kind="faq" slug={item.slug} label={item.title} item={item} />
          {/* A second place to click for the pointer; the question is the button. */}
          <span
            aria-hidden="true"
            onClick={toggle}
            className="hidden size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:flex"
          >
            <RiArrowDownSLine
              className={cn(
                "size-4 transition-transform duration-200 ease-out-quint",
                open && "rotate-180"
              )}
            />
          </span>
        </div>
      </div>
      {rendered ? (
        <div id={panelId} className="expand-grid" data-enter="" data-open={open} inert={!open}>
          <div>
            <div className="border-t px-4 py-4 sm:pl-16">
              <p className="max-w-3xl text-sm leading-7 whitespace-pre-wrap text-foreground/85">
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
          </div>
        </div>
      ) : null}
      {clientVersions.map((version) => (
        <ClientVersionLine key={version.slug} item={version} />
      ))}
    </li>
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
    return <PartnerCliDetail />
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
      {kind === "faq" ? (
        <AddToPack kind={kind} slug={item.slug} label={item.title} item={item} />
      ) : null}
      {item.href ? (
        <Link
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          href={toolDestination(workspace.slug, item)}
          target={item.href.startsWith("https://") ? "_blank" : undefined}
          rel={item.href.startsWith("https://") ? "noreferrer" : undefined}
        >
          {item.href.startsWith("https://") ? (
            <>
              {openLabel(item.href)} <RiExternalLinkLine className="size-4" aria-hidden="true" />
            </>
          ) : (
            <>
              Open <RiArrowRightLine className="size-4" aria-hidden="true" />
            </>
          )}
        </Link>
      ) : null}
      {item.href?.startsWith("https://") ? (
        <p className="text-xs text-muted-foreground">Beam login</p>
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

function PartnerCliDetail() {
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
        <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
          Start with Beam Partner.
        </h2>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Choose where you want to work. Each start profile carries the same
          partner-safe, reviewed workspace boundaries into your agent.
        </p>
      </div>
      <section className="grid gap-4 lg:grid-cols-3">
        {partnerStartProfiles.map((profile, index) => (
          <article
            key={profile.name}
            className="rise-in flex flex-col gap-4 rounded-xl border bg-card p-5"
            style={{ "--i": index } as CSSProperties}
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/8 text-primary">
              <RiTerminalBoxLine className="size-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium tracking-tight">{profile.name}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{profile.description}</p>
            </div>
            <Button
              variant="outline"
              className="pressable w-full"
              onClick={() => copyPrompt(profile.name)}
            >
              {copied === profile.name ? <RiCheckLine /> : <RiClipboardLine />}
              {copied === profile.name ? "Prompt copied" : "Copy start prompt"}
            </Button>
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
        <AddToPack kind={item.kind} slug={item.slug} label={item.title} item={item} />
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
