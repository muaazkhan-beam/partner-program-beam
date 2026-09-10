"use client"

import { ContentGrid } from "@/components/content-views"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"

export default function ToolsPage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Tools"
        description="Partner-safe catalog. v1 is documentation plus a request path into Beam, not live write access."
      />
      <ContentGrid kind="tool" empty="No tools are attached to this workspace yet." />
    </PageContainer>
  )
}
