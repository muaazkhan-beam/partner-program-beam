"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  RiArrowRightLine,
  RiCheckLine,
  RiShieldCheckLine,
  RiStackLine,
  RiDownload2Line,
} from "@remixicon/react"

import { AddToPack } from "@/components/add-to-pack"
import { useHoldOptions } from "@/components/claim-state"
import { usePackState } from "@/components/pack-tray"
import { SendBadge } from "@/components/send-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace-context"
import {
  answerQuestion,
  splitEmailWithRefs,
  type AskResult,
  type AskUseCase,
} from "@/lib/ask"
import { routesToBeam } from "@/lib/answer-sheet"
import { answerQuestions, filledQuestionnaire, newThread, type Intake } from "@/lib/desk/intake"
import { saveFile } from "@/lib/render/pdf-client"
import { FAQ_OPENERS, HOME_OPENERS, type Opener } from "@/lib/ask-openers"
import { listWorkspaceCompliance, listWorkspaceItems } from "@/lib/catalog/static"
import { printedLine } from "@/lib/compliance"
import { routeReasonText, type AskCandidate } from "@/lib/faq-answer"
import { HOLD_LABEL, holdReason, type HoldOptions, type PackContent } from "@/lib/pack"
import { hasItem } from "@/lib/pack-store"
import { requestHref } from "@/lib/request-links"
import { workspacePath } from "@/lib/workspace-resolver"

type AskItem = AskCandidate & PackContent

/** Wait for a pause in typing before answering, so "nothing published" never flashes mid-word. */
function useSettled(value: string, delay = 300) {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), value ? delay : 0)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return settled
}

function useAskSources() {
  const workspace = useWorkspace()
  return useMemo(() => {
    // Documents and use cases read the reviewed static catalog in both modes,
    // as the compliance library and the use case pages do (see SETUP notes).
    const documents = listWorkspaceCompliance(workspace.slug)
    const useCases = listWorkspaceItems(workspace.slug, "use-case").map((item) => {
      const detail = (item as { useCase?: { department?: string; trigger?: string; systems?: string[] } }).useCase
      return {
        ...item,
        department: detail?.department,
        trigger: detail?.trigger,
        systems: detail?.systems,
      } as AskUseCase & PackContent
    })
    return { documents, useCases }
  }, [workspace.slug])
}

/**
 * Ask instead of browsing. One question gets the answer Beam has published,
 * the security documents that cover it, or the use cases that fit; several
 * pasted questions (a client's email) get an answer sheet. A restricted or
 * unpublished answer is never shown, however well it matches: the partner is
 * told it exists and the question goes to Beam with them.
 */
export function FaqAsk({
  items,
  query,
  onQueryChange,
  variant = "faq",
  openers: givenOpeners,
  note,
  extra,
  afterResults,
  labelHidden = false,
  questionnaire = null,
}: {
  items: AskCandidate[]
  query: string
  onQueryChange: (value: string) => void
  /** "home" frames it as the way in; "faq" as the way through the answers. */
  variant?: "home" | "faq"
  /** Openers for the client in focus; otherwise the defaults for the page. */
  openers?: readonly Opener[]
  /** The line under the box. */
  note?: ReactNode
  /** Under the box: the file drop on the desk. */
  extra?: ReactNode
  /** After an answer sheet: filing the questions under a client. */
  afterResults?: (questionCount: number) => ReactNode
  /** When the page heading already asks the question, the label is for screen readers. */
  labelHidden?: boolean
  /** A dropped questionnaire: the sheet offers the client's file back, filled. */
  questionnaire?: Intake | null
}) {
  const settled = useSettled(query)
  const sources = useAskSources()
  const faq = items as AskItem[]
  // A pasted email's other lines ("Our client is a Saudi government entity")
  // travel as context: they can only make an answer more cautious.
  // A dropped questionnaire is answered row by row in the client's own
  // numbering; anything typed or pasted is split into its questions.
  const email = useMemo(
    () => (questionnaire ? { questions: questionnaire.questions, context: "" } : splitEmailWithRefs(settled)),
    [settled, questionnaire]
  )
  const results = useMemo(
    () =>
      email.questions.map((question) =>
        answerQuestion(
          question.text,
          { faq, documents: sources.documents, useCases: sources.useCases },
          email.context
        )
      ),
    [email, faq, sources]
  )
  const refs = email.questions.map((question) => question.ref)
  const openers = givenOpeners ?? (variant === "home" ? HOME_OPENERS : FAQ_OPENERS)
  const typing = query !== settled

  return (
    <section className="w-full space-y-4" aria-label="Ask">
      <form
        onSubmit={(event) => event.preventDefault()}
        className="rounded-2xl border bg-card p-4 sm:p-5"
      >
        <label htmlFor="faq-ask" className={labelHidden ? "sr-only" : "text-sm font-medium"}>
          {variant === "home" ? "What does your client need?" : "Ask a question"}
        </label>
        <div className={labelHidden ? "flex items-start gap-2" : "mt-3 flex items-start gap-2"}>
          <textarea
            id="faq-ask"
            rows={query.includes("\n") ? 5 : 2}
            className="min-h-11 flex-1 resize-y rounded-lg border bg-background px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder={
              variant === "home"
                ? "Type a question, or paste the client's email…"
                : "Type the question your client asked…"
            }
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            autoComplete="off"
          />
          {query ? (
            <Button type="button" variant="outline" className="h-11" onClick={() => onQueryChange("")}>
              Clear
            </Button>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {openers.map((opener) => (
            <button
              key={opener.text}
              type="button"
              onClick={() => onQueryChange(opener.text)}
              className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {opener.text}
            </button>
          ))}
        </div>
        {extra ? <div className="mt-3">{extra}</div> : null}
        <p className="mt-3 text-xs text-muted-foreground">
          {note ??
            "Answers come only from what Beam has reviewed. Anything else goes to the Beam team with your question."}
        </p>
      </form>

      <div aria-live="polite" aria-busy={typing}>
        {results.length === 1 ? <SingleAnswer result={results[0]!} /> : null}
        {results.length > 1 ? (
          <AnswerSheet results={results} refs={refs} questionnaire={questionnaire} faq={faq} />
        ) : null}
        {results.length > 1 && afterResults ? <div className="mt-3">{afterResults(results.length)}</div> : null}
      </div>
    </section>
  )
}

function askBeamHref(workspaceSlug: string, questions: string[], about?: string) {
  return requestHref(workspaceSlug, {
    about,
    support: "faq-escalation",
    question: questions.join("\n"),
  })
}

function SingleAnswer({ result }: { result: AskResult }) {
  const workspace = useWorkspace()
  const { faq } = result
  // Order of trust: a restricted claim goes to Beam first; evidence the library
  // does not hold comes from the Beam team; documents that cover the question
  // beat a FAQ answer that only shares a word with it.
  const restricted = faq.kind === "route-to-beam" && faq.reason === "restricted"
  const documentsShown = result.security && result.documents.length > 0
  const coveredByDocuments =
    documentsShown && (result.documentMode === "matched" || result.documentMode === "related")
  // A Beam-only ask (a SOC 2 report, a DPA) is never answered by an FAQ.
  const answered = faq.kind === "answer" && !coveredByDocuments && !result.beamOnly
  const pending = faq.kind === "route-to-beam" && faq.reason === "pending" && !documentsShown
  const nothing =
    !restricted && !answered && !pending && !documentsShown && !result.beamOnly && !result.useCase
  return (
    <div className="space-y-3">
      {restricted && faq.kind === "route-to-beam" ? (
        <RouteCard result={result} label={HOLD_LABEL.restricted} />
      ) : null}
      {result.beamOnly ? <BeamOnlyCard question={result.question} /> : null}
      {documentsShown ? <SecurityCard result={result} /> : null}
      {result.useCase ? <UseCaseCard result={result} /> : null}

      {answered && faq.kind === "answer" ? (
        <article className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SendBadge item={faq.answer as AskItem} />
            <AddToPack kind="faq" slug={faq.answer.slug} label={faq.answer.title} item={faq.answer as AskItem} />
          </div>
          <h3 className="text-lg font-medium tracking-tight">{faq.answer.title}</h3>
          <p className="text-sm leading-7 whitespace-pre-wrap">{faq.answer.body}</p>
          <Link
            href={workspacePath(workspace.slug, `/faq/${faq.answer.slug}`)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Open the full answer <RiArrowRightLine className="size-4" aria-hidden="true" />
          </Link>
        </article>
      ) : null}

      {pending ? <RouteCard result={result} label={HOLD_LABEL.pending} /> : null}

      {nothing ? (
        <article className="rounded-2xl border bg-card p-5">
          <p className="text-sm">No published answer for that yet.</p>
          <Link
            href={askBeamHref(workspace.slug, [result.question])}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Ask the Beam team <RiArrowRightLine className="size-4" aria-hidden="true" />
          </Link>
        </article>
      ) : null}

      {faq.kind !== "empty" && faq.related.length > 0 && !coveredByDocuments ? (
        <div className="rounded-2xl border bg-card">
          <p className="border-b px-5 py-3 text-xs font-medium text-muted-foreground">
            {answered || restricted || pending ? "Related answers" : "Answers that mention it"}
          </p>
          <ul className="divide-y">
            {faq.related.map((item) => (
              <li key={item.slug}>
                <Link
                  href={workspacePath(workspace.slug, `/faq/${item.slug}`)}
                  className="flex items-start justify-between gap-3 px-5 py-3 transition-colors hover:bg-accent/40"
                >
                  <span className="min-w-0 space-y-0.5">
                    <span className="block text-sm font-medium">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">{item.summary}</span>
                  </span>
                  <RiArrowRightLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function RouteCard({ result, label }: { result: AskResult; label: string }) {
  const workspace = useWorkspace()
  const { faq } = result
  if (faq.kind !== "route-to-beam") return null
  return (
    <article className="space-y-2 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5">
      <Badge variant="outline">{label}</Badge>
      <h3 className="text-base font-medium tracking-tight">{faq.answer.title}</h3>
      <p className="text-sm leading-6">{routeReasonText(faq)}</p>
      <Link
        href={askBeamHref(
          workspace.slug,
          [result.question],
          faq.standIn ? undefined : `faq:${faq.answer.slug}`
        )}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Ask the Beam team <RiArrowRightLine className="size-4" aria-hidden="true" />
      </Link>
    </article>
  )
}

/** Certificates, audit reports and contract documents are not in the library. */
function BeamOnlyCard({ question }: { question: string }) {
  const workspace = useWorkspace()
  return (
    <article className="space-y-2 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5">
      <Badge variant="outline">Comes from the Beam team</Badge>
      <p className="text-sm leading-6">
        Certifications, audit reports and contract documents such as a DPA are
        not in the portal. The Beam team answers these for a named client.
      </p>
      <Link
        href={askBeamHref(workspace.slug, [question])}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Ask the Beam team <RiArrowRightLine className="size-4" aria-hidden="true" />
      </Link>
    </article>
  )
}

function SecurityCard({ result }: { result: AskResult }) {
  const workspace = useWorkspace()
  const { state, addDocuments } = usePackState(workspace.slug)
  const allIn = result.documents.every((document) => state.documentSlugs.includes(document.slug))
  return (
    <article className="space-y-3 rounded-2xl border bg-card p-5">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <RiShieldCheckLine className="size-4" aria-hidden="true" />
        {result.documentMode === "starter"
          ? "Where a security review usually starts"
          : result.documentMode === "related"
            ? "Related policies"
            : "Security documents that cover this"}
      </p>
      {result.documentMode === "related" ? (
        <p className="text-xs leading-5 text-muted-foreground">
          These policies relate to it; whether it is supported for a client is
          confirmed by the Beam team.
        </p>
      ) : null}
      <ul className="divide-y">
        {result.documents.map((document) => (
          <li key={document.slug} className="py-2">
            <p className="text-sm font-medium">{document.title}</p>
            <p className="text-xs text-muted-foreground">
              {printedLine(document)}
              {document.ndaRequired ? " · once an NDA is in place" : ""}
            </p>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant={allIn ? "outline" : "default"}
          disabled={allIn}
          onClick={() => addDocuments(result.documents.map((document) => document.slug))}
        >
          {allIn ? <RiCheckLine aria-hidden="true" /> : null}
          {allIn ? "In your pack" : "Add these to the pack"}
        </Button>
        <Link
          href={workspacePath(workspace.slug, "/compliance?view=questions")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Start from the client&apos;s questions <RiArrowRightLine className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

function UseCaseCard({ result }: { result: AskResult }) {
  const workspace = useWorkspace()
  return (
    <article className="space-y-3 rounded-2xl border bg-card p-5">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <RiStackLine className="size-4" aria-hidden="true" />
        Use cases Beam runs today
      </p>
      {result.useCases.length === 0 ? (
        <p className="text-sm">
          None matches that yet.{" "}
          <Link
            href={askBeamHref(workspace.slug, [result.question])}
            className="font-medium text-primary hover:underline"
          >
            Ask the Beam team
          </Link>
        </p>
      ) : (
        <ul className="divide-y">
          {result.useCases.map((useCase) => (
            <li key={useCase.slug} className="flex items-start justify-between gap-3 py-2.5">
              <Link
                href={workspacePath(workspace.slug, `/use-cases/${useCase.slug}`)}
                className="min-w-0 hover:underline"
              >
                <span className="block text-sm font-medium">{useCase.title}</span>
                <span className="block text-xs text-muted-foreground">{useCase.summary}</span>
              </Link>
              <span className="flex shrink-0 flex-col items-end gap-1.5">
                <SendBadge item={useCase as unknown as AskItem} />
                <AddToPack kind="use-case" slug={useCase.slug} label={useCase.title} item={useCase as unknown as AskItem} />
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={workspacePath(workspace.slug, "/use-cases")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        See every use case <RiArrowRightLine className="size-4" aria-hidden="true" />
      </Link>
    </article>
  )
}

/** What a question in a pasted email resolves to, in one line, in the same order of trust. */
function sheetRow(result: AskResult, brandMode: string, hold: HoldOptions = {}) {
  const { faq } = result
  // A sensitive topic goes to Beam whatever else matched, including when the
  // only catalog answer for it is unpublished: policies on the same words
  // must never stand in for a commercial or contract answer.
  if (routesToBeam(result)) {
    return { kind: "beam" as const, label: HOLD_LABEL.restricted, detail: faq.kind === "route-to-beam" ? faq.answer.title : "" }
  }
  if (result.beamOnly) {
    return { kind: "beam" as const, label: "Comes from the Beam team", detail: "Not in the portal" }
  }
  if (
    result.security &&
    (result.documentMode === "matched" || result.documentMode === "related") &&
    result.documents.length
  ) {
    return { kind: "documents" as const, documents: result.documents }
  }
  if (result.useCase && result.useCases.length) {
    return { kind: "use-cases" as const, useCases: result.useCases }
  }
  if (faq.kind === "answer") {
    const sendable = holdReason(faq.answer as AskItem, brandMode, hold) === null
    return { kind: "answer" as const, answer: faq.answer, sendable }
  }
  if (result.security && result.documents.length) {
    return { kind: "documents" as const, documents: result.documents }
  }
  if (faq.kind === "route-to-beam") {
    return { kind: "beam" as const, label: HOLD_LABEL.pending, detail: faq.answer.title }
  }
  return { kind: "none" as const }
}

function AnswerSheet({
  results,
  refs,
  questionnaire,
  faq,
}: {
  results: AskResult[]
  refs: string[]
  questionnaire: Intake | null
  faq: AskItem[]
}) {
  const workspace = useWorkspace()
  const { state, addItems, addDocuments } = usePackState(workspace.slug)
  const hold = useHoldOptions()
  const sources = useAskSources()
  // The client's questionnaire back, in their columns, with three added: a
  // quote, a policy as printed, or the fixed line, through the same rule as
  // the PDF. Only once the sheet has settled on their questions.
  const filled = () => {
    if (!questionnaire || questionnaire.questions.length !== results.length) return null
    const answered = answerQuestions(questionnaire.questions, "", {
      sources: { faq: faq as AskCandidate[], documents: sources.documents, useCases: sources.useCases },
      find: (slug) => faq.find((item) => item.slug === slug) as PackContent | undefined,
      brandMode: workspace.brandMode,
      hold,
    })
    const thread = newThread(questionnaire, answered, { id: "sheet", workspaceSlug: workspace.slug, now: 0 })
    return filledQuestionnaire(thread, answered)
  }
  function downloadFilled() {
    const csv = filled()
    if (!csv || !questionnaire?.questionnaire) return
    const name = questionnaire.questionnaire.fileName.replace(/\.csv$/i, "")
    saveFile(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${name} - from Beam.csv`)
  }
  const rows = results.map((result) => ({ result, row: sheetRow(result, workspace.brandMode, hold) }))
  const toAdd = rows.flatMap(({ row }) =>
    row.kind === "answer" && row.sendable ? [{ kind: "faq", slug: row.answer.slug }] : []
  )
  const documents = [
    ...new Set(rows.flatMap(({ row }) => (row.kind === "documents" ? row.documents.map((d) => d.slug) : []))),
  ]
  const forBeam = rows
    .filter(({ row }) => row.kind === "beam" || row.kind === "none")
    .map(({ result }) => result.question)
  const addable = toAdd.length + documents.length
  const added =
    addable > 0 &&
    toAdd.every((item) => hasItem(state, item.kind, item.slug)) &&
    documents.every((slug) => state.documentSlugs.includes(slug))

  return (
    <section className="rounded-2xl border bg-card" aria-labelledby="answer-sheet">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h3 id="answer-sheet" className="text-base font-medium">
            Answer sheet · {results.length} questions
          </h3>
          <p className="text-xs text-muted-foreground">
            What Beam has published for each question in the email.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {addable > 0 ? (
            <Button
              size="sm"
              disabled={added}
              onClick={() => {
                addItems(toAdd)
                addDocuments(documents)
              }}
            >
              {added ? <RiCheckLine aria-hidden="true" /> : null}
              {added
                ? "Added to the pack"
                : `Add ${addable} ${addable === 1 ? "item" : "items"} to the pack`}
            </Button>
          ) : null}
          {questionnaire?.questionnaire?.rows ? (
            <Button size="sm" variant="outline" onClick={downloadFilled}>
              <RiDownload2Line aria-hidden="true" />
              Download the filled questionnaire
            </Button>
          ) : null}
          {forBeam.length > 0 ? (
            <Button
              size="sm"
              variant="outline"
              render={<Link href={askBeamHref(workspace.slug, forBeam)} />}
            >
              Ask the Beam team about {forBeam.length === 1 ? "the other one" : `the other ${forBeam.length}`}
            </Button>
          ) : null}
        </div>
      </div>
      <ol className="divide-y">
        {rows.map(({ result, row }, index) => (
          <li key={`${index}:${result.question}`} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_1fr] sm:gap-6">
            <p className="text-sm">
              <span className="mr-2 text-xs tabular-nums text-muted-foreground">{refs[index] ?? index + 1}</span>
              {result.question}
            </p>
            <div className="text-sm">
              {row.kind === "answer" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={workspacePath(workspace.slug, `/faq/${row.answer.slug}`)}
                    className="font-medium hover:underline"
                  >
                    {row.answer.title}
                  </Link>
                  <SendBadge item={row.answer as AskItem} />
                </div>
              ) : null}
              {row.kind === "documents" ? (
                <p>
                  <span className="font-medium">
                    {row.documents.length} {row.documents.length === 1 ? "security document" : "security documents"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {row.documents.map((document) => document.title).join(" · ")}
                  </span>
                </p>
              ) : null}
              {row.kind === "beam" ? (
                <p>
                  <Badge variant="outline">{row.label}</Badge>
                  <span className="mt-1 block text-xs text-muted-foreground">{row.detail}</span>
                </p>
              ) : null}
              {row.kind === "use-cases" ? (
                <p>
                  <span className="font-medium">
                    {row.useCases.length} {row.useCases.length === 1 ? "use case" : "use cases"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {row.useCases.map((useCase, index) => (
                      <span key={useCase.slug}>
                        {index > 0 ? " · " : null}
                        <Link
                          href={workspacePath(workspace.slug, `/use-cases/${useCase.slug}`)}
                          className="hover:underline"
                        >
                          {useCase.title}
                        </Link>
                      </span>
                    ))}
                  </span>
                </p>
              ) : null}
              {row.kind === "none" ? (
                <p className="text-muted-foreground">No published answer; goes to Beam.</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
