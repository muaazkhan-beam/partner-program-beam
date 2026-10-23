import { AgentMissionControl } from "@/components/agent-mission-control"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"

export default function AgentsPage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Agents"
        description="Beam's agents for partner work. Pick one to see what it needs from you and what it returns; Beam runs it for your client."
      />
      <AgentMissionControl />
    </PageContainer>
  )
}
