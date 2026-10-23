"use client"

import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { PartnerJourney } from "@/components/partner-journey"

export default function JourneyPage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Partner journey"
        description="Six phases for one client process, from the first conversation to handover. Open the one you are in."
      />
      <PartnerJourney />
    </PageContainer>
  )
}
