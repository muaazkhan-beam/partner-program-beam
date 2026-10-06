"use client"

import { ContentGrid } from "@/components/content-views"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"

export default function ToolsPage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Tools"
        description="Tools for each stage of a deal, and the ones the Beam team runs for you."
      />
      <ContentGrid kind="tool" empty="No tools are attached to this workspace yet." />
    </PageContainer>
  )
}
