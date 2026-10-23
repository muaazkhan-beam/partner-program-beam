"use client"

import { MaterialsGrid } from "@/components/content-views"
import { PackSummary } from "@/components/pack-tray"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"

export default function MaterialsPage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Materials"
        description="Decks, guides and playbooks, in the order you use them with a client. Anything marked Can go to a client can be sent as it is."
      />
      <PackSummary />
      <MaterialsGrid empty="No materials are attached to this workspace yet." />
    </PageContainer>
  )
}
