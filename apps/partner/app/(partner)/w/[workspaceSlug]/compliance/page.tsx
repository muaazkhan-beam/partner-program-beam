import { ComplianceLibrary } from "@/components/compliance/library"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"

export default function CompliancePage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Security & compliance"
        description="Beam's policies and procedures, listed as printed. Build a pack for a client and request the reviewed copies from Beam."
      />
      <ComplianceLibrary />
    </PageContainer>
  )
}
