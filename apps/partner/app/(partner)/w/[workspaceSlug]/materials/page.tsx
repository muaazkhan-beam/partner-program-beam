"use client"

import { MaterialsGrid } from "@/components/content-views"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"

export default function MaterialsPage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Materials"
        description="Reviewed decks, guides, and playbooks. Check audience, forwardability, and brand mode before sending anything to a client."
      />
      <MaterialsGrid empty="No materials are attached to this workspace yet." />
    </PageContainer>
  )
}
