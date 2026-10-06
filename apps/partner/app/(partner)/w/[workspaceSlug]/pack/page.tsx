"use client"

import { PackPage } from "@/components/pack-page"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"

export default function Page() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Client pack"
        description="What you are putting together for a client. Add as you go, then send it as one PDF."
      />
      <PackPage />
    </PageContainer>
  )
}
