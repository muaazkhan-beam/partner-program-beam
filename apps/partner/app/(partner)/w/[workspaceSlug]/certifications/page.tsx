"use client"

import { CertificationRoadmap } from "@/components/certification-roadmap"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"

export default function CertificationsPage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Certifications"
        description="A role-based path from Beam fundamentals to independently scoping, building, and defending production agents."
      />
      <CertificationRoadmap />
    </PageContainer>
  )
}
