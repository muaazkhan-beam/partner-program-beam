"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { RiArrowRightLine, RiSparkling2Line } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWorkspace } from "@/components/workspace-context"
import {
  resolveAsk,
  routeReasonText,
  type AskCandidate,
} from "@/lib/faq-answer"
import { workspacePath } from "@/lib/workspace-resolver"

const SUGGESTIONS = [
  "Why not SAP?",
  "Where does client data go?",
  "How do we make money?",
  "When should I walk away?",
]

function tag(value: string) {
  return value ? `${value[0]?.toUpperCase()}${value.slice(1)}` : value
}

/**
 * Ask a question instead of browsing twenty-two answers.
 *
 * A restricted or unpublished answer is never shown, however well it matches —
 * the partner is told it exists and routed to Beam. That is the same rule the
 * FAQ list already follows; it just has to hold here too, because this is the
 * surface a partner will actually use mid-call.
 */
export function FaqAsk({ items }: { items: AskCandidate[] }) {
  const workspace = useWorkspace()
  const [draft, setDraft] = useState("")
  const [question, setQuestion] = useState("")

  const outcome = useMemo(
    () => resolveAsk(question, items),
    [question, items],
  )

  const answerHref = (slug: string) =>
    workspacePath(workspace.slug, `/faq/${slug}`)
  const requestHref = workspacePath(workspace.slug, "/requests")

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setQuestion(draft)
        }}
        className="rounded-2xl border bg-card p-4 sm:p-5"
      >
        <label
          htmlFor="faq-ask"
          className="flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase"
        >
          <RiSparkling2Line className="size-3.5" />
          Ask Beam
        </label>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            id="faq-ask"
            className="h-11 flex-1"
            placeholder="Ask the question your client just asked you…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit" className="h-11 sm:w-28">
            Ask
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setDraft(suggestion)
                setQuestion(suggestion)
              }}
              className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Answers come only from what Beam has reviewed and published. Anything
          restricted or still pending routes to Beam instead of being answered
          here.
        </p>
      </form>

      {outcome.kind === "none" ? (
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-sm">
            Nothing published covers that yet.
          </p>
          <Link
            href={requestHref}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Ask Beam directly <RiArrowRightLine className="size-4" />
          </Link>
        </div>
      ) : null}

      {outcome.kind === "route-to-beam" ? (
        <div className="space-y-3 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {outcome.reason === "restricted" ? "Restricted" : "Pending"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Do not answer this from memory
            </span>
          </div>
          <h3 className="text-lg font-medium tracking-tight">
            {outcome.answer.title}
          </h3>
          <p className="text-sm leading-6">{routeReasonText(outcome)}</p>
          <Link
            href={requestHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {outcome.answer.requestBeamLabel ?? "Ask Beam"}
            <RiArrowRightLine className="size-4" />
          </Link>
        </div>
      ) : null}

      {outcome.kind === "answer" ? (
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{tag(outcome.answer.audience)}</Badge>
            <Badge variant="outline">{tag(outcome.answer.claimState)}</Badge>
          </div>
          <h3 className="text-lg font-medium tracking-tight">
            {outcome.answer.title}
          </h3>
          <p className="text-sm leading-7 whitespace-pre-wrap">
            {outcome.answer.body}
          </p>
          <Link
            href={answerHref(outcome.answer.slug)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Open the full answer <RiArrowRightLine className="size-4" />
          </Link>
        </div>
      ) : null}

      {outcome.kind === "answer" || outcome.kind === "route-to-beam" ? (
        outcome.related.length > 0 ? (
          <div className="rounded-2xl border bg-card">
            <p className="border-b px-5 py-3 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Related
            </p>
            <ul className="divide-y">
              {outcome.related.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={answerHref(item.slug)}
                    className="flex items-start justify-between gap-3 px-5 py-3 transition-colors hover:bg-accent/40"
                  >
                    <span className="min-w-0 space-y-0.5">
                      <span className="block text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {item.summary}
                      </span>
                    </span>
                    <RiArrowRightLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null
      ) : null}
    </section>
  )
}
