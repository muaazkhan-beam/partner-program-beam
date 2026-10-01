import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"
import { ScopeSurface } from "@/components/scope/scope-surface"

export default function ScopePage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Scope"
        description="A client describes a process. Match it to one Beam already runs, record what is different at this client, and send Beam a brief."
      />
      <ScopeSurface />
    </PageContainer>
  )
}
