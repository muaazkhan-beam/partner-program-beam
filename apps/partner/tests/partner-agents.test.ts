import assert from "node:assert/strict"
import test from "node:test"

import {
  AGENT_STATUS_LABEL,
  agentRequest,
  partnerAgents,
} from "../lib/partner-agents"
import { journeyPhases } from "../lib/partner-journey"
import { describeRequestSubject, requestHref } from "../lib/request-links"
import { workspacePath } from "../lib/workspace-resolver"

const active = partnerAgents.filter((agent) => agent.status === "active")
const planned = partnerAgents.filter((agent) => agent.status === "coming-soon")

test("every agent is used in a journey phase that exists", () => {
  const slugs = new Set(journeyPhases.map((phase) => phase.slug))
  for (const agent of partnerAgents) {
    assert.ok(
      slugs.has(agent.phase),
      `${agent.id} points at an unknown phase "${agent.phase}"`
    )
  }
})

test("every agent Beam runs today opens a tool inside the portal", () => {
  assert.ok(active.length > 0)
  for (const agent of active) {
    assert.ok(agent.tool, `${agent.id} has no tool link`)
    assert.match(agent.tool.href, /^\//, `${agent.id} tool must stay in the portal`)
    assert.match(agent.tool.label, /^Open /, `${agent.id} tool uses the Open verb`)
  }
})

test("every planned agent's request link carries the agent", () => {
  assert.ok(planned.length > 0)
  for (const agent of planned) {
    assert.equal(agent.tool, undefined, `${agent.id} is planned, so has no tool`)
    const href = requestHref("partner-demo", agentRequest(agent))
    assert.ok(
      href.startsWith(workspacePath("partner-demo", "/requests?about=agent%3A")),
      href
    )
    assert.ok(href.includes(`about=agent%3A${agent.id}`), href)
  }
})

test("the request form names the agent and whether Beam runs it", () => {
  assert.equal(
    describeRequestSubject("partner-demo", "agent:qualifier")?.label,
    "Opportunity Qualifier (Beam runs it today)"
  )
  assert.equal(
    describeRequestSubject("partner-demo", "agent:rfp")?.label,
    "RFP & Proposal Agent (planned agent)"
  )
})

test("status words follow the portal vocabulary", () => {
  assert.equal(AGENT_STATUS_LABEL.active, "Beam runs it today")
  assert.equal(AGENT_STATUS_LABEL["coming-soon"], "Planned")
})
