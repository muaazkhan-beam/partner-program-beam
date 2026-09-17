"use client"

import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { PartnerJourney } from "@/components/partner-journey"

export default function JourneyPage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Partner journey"
        description="Take one client process from scope to delivery. Complete each phase's deliverables to unlock the next, using the tools, materials, and answers attached to it."
      />
      <PartnerJourney />
    </PageContainer>
  )
}
