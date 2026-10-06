import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { ScopeSurface } from "@/components/scope/scope-surface"

export default function ScopePage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Scope"
        description="Match a client's process to one Beam runs, note what is different, and send Beam a brief."
      />
      <ScopeSurface />
    </PageContainer>
  )
}
