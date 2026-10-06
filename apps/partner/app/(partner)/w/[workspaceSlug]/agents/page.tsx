import { AgentMissionControl } from "@/components/agent-mission-control"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"

export default function AgentsPage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Agents"
        description="The agents behind each step, from first meeting to delivery. Some are coming soon."
      />
      <AgentMissionControl />
    </PageContainer>
  )
}
