"use client"

import { PackAside, usePackState } from "@/components/pack-tray"
import { Checkbox } from "@/components/ui/checkbox"
import { useWorkspace } from "@/components/workspace-context"
import type { CatalogComplianceDocument } from "@/convex/catalogTypes"
import { listWorkspaceCompliance } from "@/lib/catalog/static"
import { printedLine, reviewerQuestions } from "@/lib/compliance"

function DocumentLine({ document }: { document: CatalogComplianceDocument }) {
  return (
    <span className="min-w-0">
      <span className="block text-sm font-medium">{document.title}</span>
      <span className="block text-xs text-muted-foreground">
        {printedLine(document)}
        {document.ndaRequired ? " · once an NDA is in place" : ""}
      </span>
    </span>
  )
}

/**
 * Start from the questions a client's security reviewer asks: ticking a
 * question adds the documents that answer it, and each document can still be
 * removed. The case partners bring most often, so /compliance opens here.
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

  // A question is ticked when all its documents are in the pack. Each document
  // is listed once, under the first ticked question that needs it; anything
  // else in the pack is listed after, so the column always matches the pack.
  const ticked = questions.filter((question) =>
    question.documents.every((document) => inPack.has(document.slug))
  )
  const listed = new Set<string>()
  const groups = ticked.map((question) => ({
    question,
    documents: question.documents.filter((document) => {
      if (listed.has(document.slug)) return false
      listed.add(document.slug)
      return true
    }),
  }))
  const others = state.documentSlugs
    .filter((slug) => !listed.has(slug))
    .map((slug) => bySlug.get(slug))
    .filter((document): document is NonNullable<typeof document> => Boolean(document))
  const total = state.documentSlugs.filter((slug) => bySlug.has(slug)).length

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
            const inCount = slugs.filter((slug) => inPack.has(slug)).length
            const checked = inCount === slugs.length
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
                      {slugs.length} {slugs.length === 1 ? "document" : "documents"}
                      {!checked && inCount > 0 ? ` · ${inCount} already in the pack` : ""}
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
          {total === 0 ? "Nothing selected yet" : `In the pack · ${total}`}
        </h2>
        {total === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Pick the questions your client asked; the documents that answer them
            appear here, and you can remove any you do not need.
          </p>
        ) : (
          <div className="mt-3 space-y-5">
            {groups.map(({ question, documents: own }) =>
              own.length === 0 ? null : (
                <div key={question.id}>
                  <p className="text-xs font-medium text-muted-foreground">{question.question}</p>
                  <ul className="mt-1 divide-y">
                    {own.map((document) => (
                      <li key={document.slug}>
                        <label className="flex cursor-pointer items-start gap-3 py-2.5">
                          <Checkbox
                            className="mt-1"
                            checked={inPack.has(document.slug)}
                            onCheckedChange={() => toggle(document.slug)}
                            aria-label={`Keep ${document.title} in the pack`}
                          />
                          <DocumentLine document={document} />
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
            {others.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Also in the pack</p>
                <ul className="mt-1 divide-y">
                  {others.map((document) => (
                    <li key={document.slug}>
                      <label className="flex cursor-pointer items-start gap-3 py-2.5">
                        <Checkbox
                          className="mt-1"
                          checked
                          onCheckedChange={() => toggle(document.slug)}
                          aria-label={`Keep ${document.title} in the pack`}
                        />
                        <DocumentLine document={document} />
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <PackAside />
    </div>
  )
}
