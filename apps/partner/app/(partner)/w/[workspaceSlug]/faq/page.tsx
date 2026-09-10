"use client"

import { ContentGrid } from "@/components/content-views"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"

export default function FaqPage() {
  return (
    <PageContainer className="space-y-8">
      <div className="mx-auto w-full max-w-4xl">
        <PageHeading
          title="Partner FAQ"
          description="Staff-published answers. Restricted deployment, exclusivity, independence, and pricing questions route to Beam."
        />
      </div>
      <ContentGrid
        kind="faq"
        empty="No FAQ entries are attached to this workspace yet."
      />
    </PageContainer>
  )
}
