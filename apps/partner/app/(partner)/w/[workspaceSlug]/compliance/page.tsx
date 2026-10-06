import Link from "next/link"

import { ComplianceLibrary } from "@/components/compliance/library"
import { ComplianceQuestionnaire } from "@/components/compliance/questionnaire"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { workspacePath } from "@/lib/workspace-resolver"

const views = [
  { id: "questions", label: "From the client's questions" },
  { id: "library", label: "All documents" },
] as const

/**
 * Two ways into the same documents. A partner usually arrives with a client's
 * security questions, so that is where the page starts; the full library is
 * one click away for a reviewer who wants to scan everything.
 */
export default async function CompliancePage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { workspaceSlug } = await params
  const { view } = await searchParams
  const active = view === "library" ? "library" : "questions"

  return (
    <PageContainer className="space-y-6">
      <PageHeading
        title="Security & compliance"
        description="Beam's security and privacy policies, as printed. Tick what your client asked for; Beam issues the copies."
      />
      <nav aria-label="Ways in" className="inline-flex rounded-lg border bg-muted/30 p-1">
        {views.map((entry) => (
          <Link
            key={entry.id}
            href={workspacePath(workspaceSlug, `/compliance?view=${entry.id}`)}
            aria-current={active === entry.id ? "page" : undefined}
            className={
              active === entry.id
                ? "rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm"
                : "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            }
          >
            {entry.label}
          </Link>
        ))}
      </nav>
      {active === "questions" ? <ComplianceQuestionnaire /> : <ComplianceLibrary />}
    </PageContainer>
  )
}
