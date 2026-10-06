"use client"

import { ContentGrid } from "@/components/content-views"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"

export default function UseCasesPage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Use cases"
        description="What Beam runs in production today, by department. Each names the step a person approves. A result is quoted only where a named deployment backs it."
      />
      <ContentGrid
        kind="use-case"
        empty="No use cases are attached to this workspace yet."
      />
    </PageContainer>
  )
}
