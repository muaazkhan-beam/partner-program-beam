"use client"

import { PackTray, usePackState } from "@/components/pack-tray"
import { Checkbox } from "@/components/ui/checkbox"
import { useWorkspace } from "@/components/workspace-context"
import { listWorkspaceCompliance } from "@/lib/catalog/static"
import { printedLine, reviewerQuestions } from "@/lib/compliance"

/**
 * Variant B: start from the questions a client's security reviewer asks;
 * ticking a question adds the documents that answer it, and each document
 * can still be pruned.
 */
export function ComplianceQuestionnaire() {
  const workspace = useWorkspace()
  const documents = listWorkspaceCompliance(workspace.slug)
  const bySlug = new Map(documents.map((document) => [document.slug, document]))
  const { state, toggle, setDocuments } = usePackState(workspace.slug)
  const inPack = new Set(state.documentSlugs)
  const questions = reviewerQuestions
    .map((question) => ({
      ...question,
      documents: question.documentSlugs
        .map((slug) => bySlug.get(slug))
        .filter((document): document is NonNullable<typeof document> => Boolean(document)),
    }))
    .filter((question) => question.documents.length > 0)

  function toggleQuestion(slugs: string[]) {
    const allIn = slugs.every((slug) => inPack.has(slug))
    setDocuments(
      allIn
        ? state.documentSlugs.filter((slug) => !slugs.includes(slug))
        : [...state.documentSlugs, ...slugs.filter((slug) => !inPack.has(slug))]
    )
  }

  const answered = questions.filter((question) =>
    question.documents.some((document) => inPack.has(document.slug))
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px] lg:items-start">
      <section className="rounded-2xl border bg-card p-5" aria-labelledby="questions-heading">
        <p className="text-xs font-medium text-muted-foreground">Questions the client asks</p>
        <h2 id="questions-heading" className="mt-2 text-lg font-medium">
          Pick what the security review asked
        </h2>
        <ul className="mt-3 divide-y">
          {questions.map((question) => {
            const slugs = question.documents.map((document) => document.slug)
            const checked = slugs.every((slug) => inPack.has(slug))
            return (
              <li key={question.id}>
                <label className="flex cursor-pointer items-start gap-3 py-3">
                  <Checkbox
                    className="mt-1"
                    checked={checked}
                    onCheckedChange={() => toggleQuestion(slugs)}
                    aria-label={question.question}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{question.question}</span>
                    <span className="block text-xs text-muted-foreground">
                      {question.documents.length}{" "}
                      {question.documents.length === 1 ? "document" : "documents"}
                    </span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="rounded-2xl border bg-card p-5" aria-labelledby="answers-heading">
        <p className="text-xs font-medium text-muted-foreground">Documents that answer them</p>
        <h2 id="answers-heading" className="mt-2 text-lg font-medium">
          {answered.length === 0 ? "Nothing selected yet" : `${state.documentSlugs.length} documents`}
        </h2>
        {answered.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Pick the questions your client asked; the matching documents appear here and you can remove any you do not need.
          </p>
        ) : (
          <div className="mt-3 space-y-5">
            {answered.map((question) => (
              <div key={question.id}>
                <p className="text-xs font-medium text-muted-foreground">{question.question}</p>
                <ul className="mt-1 divide-y">
                  {question.documents.map((document) => (
                    <li key={`${question.id}:${document.slug}`}>
                      <label className="flex cursor-pointer items-start gap-3 py-2.5">
                        <Checkbox
                          className="mt-1"
                          checked={inPack.has(document.slug)}
                          onCheckedChange={() => toggle(document.slug)}
                          aria-label={`Keep ${document.title} in the pack`}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{document.title}</span>
                          <span className="block text-xs text-muted-foreground">{printedLine(document)}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <PackTray layout="aside" />
    </div>
  )
}
