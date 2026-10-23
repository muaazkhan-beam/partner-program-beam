"use client"

import Link from "next/link"
import { useRef, useState, useSyncExternalStore } from "react"
import { RiArrowRightLine, RiCheckLine, RiLinkM } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/components/workspace-context"
import {
  decodeAnswers,
  encodeAnswers,
  evaluate,
  fitQuestions,
  nextSteps,
  verdictLabel,
  type Answer,
  type Answers,
  type FitQuestion,
} from "@/lib/fit-check"
import { workspacePath } from "@/lib/workspace-resolver"

function subscribeToLocation(listener: () => void) {
  window.addEventListener("popstate", listener)
  return () => window.removeEventListener("popstate", listener)
}

function readCode() {
  return new URLSearchParams(window.location.search).get("fit") ?? ""
}

/**
 * The answers live in the URL (?fit=), so a result is a link a colleague can
 * open. Writes go through the synchronous History API and each write reads
 * the current URL first, so two quick clicks never lose an answer.
 */
function useAnswers() {
  const code = useSyncExternalStore(subscribeToLocation, readCode, () => "")
  const answers = decodeAnswers(code)
  function setAnswer(id: FitQuestion["id"], answer: Answer) {
    const next = encodeAnswers({ ...decodeAnswers(readCode()), [id]: answer })
    const url = new URL(window.location.href)
    url.searchParams.set("fit", next)
    window.history.replaceState(window.history.state, "", url)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }
  return { answers, code: encodeAnswers(answers), setAnswer }
}

const answerOptions: Array<{ value: Answer; label: string }> = [
  { value: "y", label: "Yes" },
  { value: "n", label: "No" },
  { value: "u", label: "Unsure" },
]

export function QuestionField({
  question,
  value,
  onChange,
  autoFocus,
}: {
  question: FitQuestion
  value?: Answer
  onChange: (answer: Answer) => void
  autoFocus?: boolean
}) {
  const whyId = `fit-${question.id}-why`
  return (
    <fieldset className="py-4" aria-describedby={whyId}>
      <legend className="text-sm font-medium">{question.prompt}</legend>
      <p id={whyId} className="mt-1 text-xs leading-5 text-muted-foreground">
        {question.why}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2" role="radiogroup" aria-label={question.prompt}>
        {answerOptions.map((option, index) => (
          <label
            key={option.value}
            className="cursor-pointer rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground has-checked:border-foreground has-checked:bg-foreground has-checked:text-background has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input
              type="radio"
              className="sr-only"
              name={`fit-${question.id}`}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              autoFocus={autoFocus && index === 0}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function VerdictPanel({ answers, code }: { answers: Answers; code: string }) {
  const workspace = useWorkspace()
  const verdict = evaluate(answers)
  const steps = nextSteps(workspace.slug, verdict, code)
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // The URL bar still holds the link.
    }
  }

  return (
    <aside
      aria-live="polite"
      aria-labelledby="fit-verdict"
      className="rounded-2xl border bg-card p-5 transition-colors duration-150 sm:p-6 lg:sticky lg:top-[calc(var(--header-height)+1rem)]"
    >
      <p className="text-xs font-medium text-muted-foreground">Verdict</p>
      <h3 id="fit-verdict" className="mt-2 text-2xl font-medium tracking-tight">
        {verdictLabel[verdict.kind]}
      </h3>
      {verdict.kind === "incomplete" ? (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {verdict.answered === 0
            ? "Answer the eight questions. The verdict updates as you go."
            : `${verdict.answered} of ${fitQuestions.length} answered. The verdict appears when all eight are.`}
        </p>
      ) : null}
      {verdict.reasons.length ? (
        <ul className="mt-3 space-y-2">
          {verdict.reasons.map((reason) => (
            <li key={reason.text} className="text-sm leading-6">
              “{reason.text}”{" "}
              <Link
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                href={workspacePath(workspace.slug, `/faq/${reason.faq}`)}
              >
                FAQ
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {verdict.kind !== "incomplete" && verdict.missing.length ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">What to obtain</p>
          <ul className="mt-1 space-y-1">
            {verdict.missing.map((question) => (
              <li key={question.id} className="text-sm leading-6">{question.prompt}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {verdict.kind !== "incomplete" && verdict.open.length ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">Ask the client</p>
          <ul className="mt-1 space-y-1">
            {verdict.open.map((question) => (
              <li key={question.id} className="text-sm leading-6">{question.discovery}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {steps.length ? (
        <div className="mt-5 flex flex-col gap-2">
          {steps.map((step, index) => (
            <Link
              key={step.href}
              className={
                index === 0
                  ? "flex items-center justify-between gap-3 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
                  : "flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/40"
              }
              href={step.href}
            >
              <span>{step.label}</span>
              <RiArrowRightLine className="size-4 shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </div>
      ) : null}
      {verdict.kind !== "incomplete" ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs leading-5 text-muted-foreground">
            A quick check. Scoping confirms it.
          </p>
          <Button variant="ghost" size="sm" onClick={copyLink}>
            {copied ? <RiCheckLine aria-hidden="true" /> : <RiLinkM aria-hidden="true" />}
            <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
          </Button>
        </div>
      ) : null}
    </aside>
  )
}

/** Variant A: every question on one card, the verdict updates live beside it. */
export function FitCheckChecklist() {
  const { answers, code, setAnswer } = useAnswers()
  const groups: Array<{ id: FitQuestion["group"]; label: string }> = [
    { id: "shape", label: "Shape of the process" },
    { id: "needs", label: "What Beam needs" },
  ]
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
      <div className="rounded-2xl border bg-card p-5 sm:p-6">
        {groups.map((group) => (
          <div key={group.id} className="not-first:mt-6">
            <p className="text-xs font-medium text-muted-foreground">{group.label}</p>
            <div className="divide-y">
              {fitQuestions
                .filter((question) => question.group === group.id)
                .map((question) => (
                  <QuestionField
                    key={question.id}
                    question={question}
                    value={answers[question.id]}
                    onChange={(answer) => setAnswer(question.id, answer)}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
      <VerdictPanel answers={answers} code={code} />
    </div>
  )
}
