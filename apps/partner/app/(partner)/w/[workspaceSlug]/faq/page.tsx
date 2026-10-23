"use client"

import { FaqSurface } from "@/components/content-views"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"

export default function FaqPage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="FAQ"
        description="Answers Beam has approved for partners. Pricing, exclusivity and deployment questions go to the Beam team."
      />
      <FaqSurface />
    </PageContainer>
  )
}
