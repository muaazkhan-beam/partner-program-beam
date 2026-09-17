import { AgentMissionControl } from "@/components/agent-mission-control"
import { PageContainer } from "@/components/page-container"
import { PageHeading } from "@/components/page-heading"

export default function AgentsPage() {
  return (
    <PageContainer className="space-y-8">
      <PageHeading
        title="Agents"
        description="Your future Beam-powered consulting team, from first meeting to delivery."
      />
      <AgentMissionControl />
    </PageContainer>
  )
}
