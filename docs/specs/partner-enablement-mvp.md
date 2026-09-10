# Partner Enablement MVP

Status: proposed

Target: iterative MVP in September 2026

Related: [`partner-portal.md`](partner-portal.md)

## Objective

Help an invited partner move from platform access to a working, evaluated first
agent without relying on Beam's Solutions team. This is a guided enablement
path, not a learning-management system.

## Principles

- Prefer practical challenges, starter cases, and templates over long courses.
- Support two paths: **Beam Run** for technical users and **Beam Platform** for
  guided in-product building.
- Award certification for demonstrated capability, not attendance.
- Mark missing tools or guidance as **Pending** rather than implying readiness.
- Reuse the core journey for customers later, while keeping partner access and
  content permissions separate.

## Workspace and access infrastructure

Run one multi-tenant application at `partner.beam.ai`. Start with canonical
workspace routes at `/w/roboyo` and `/w/alloyed`; partner subdomains can be
added later without creating separate deployments.

Each workspace owns its branding, verified email domains, members, enabled
surfaces, and content grants. Roboyo and Alloyed start from the same shared
catalog; workspace-specific content is attached only when needed.

Access policies are explicit per workspace:

- **Invite only** is the default. Beam staff invites a named email, and the user
  signs in by magic link.
- **Verified-domain join** is optional. A confirmed mailbox on a verified,
  uniquely mapped domain receives the lowest partner role and an audited
  membership. A domain allowlist is never authorization by itself.

The MVP has one global `/admin`, restricted to Beam staff. It manages workspace
creation/configuration, domains and access policy, invitations and memberships,
branding and enabled surfaces, content grants, and the audit trail. There is no
partner-facing admin surface in v1; a partner-admin role may be added later.

Every server read and write verifies the authenticated membership and
`workspaceId`; hostnames and URL slugs are routing context only.

## MVP journey

1. Choose Beam Run or Beam Platform.
2. Select a small approved starter case.
3. Build the first agent.
4. Connect test data or an integration.
5. Add evaluations, exceptions, and human approval.
6. Run and troubleshoot the agent.
7. Submit the working agent and evidence.
8. Receive a credential or readiness feedback.

## Portal scope

- **Home:** prominent “Start building” choices for Beam Run and Beam Platform.
- **Tools:** Beam Run, Platform, headless deployment, workspace/API access,
  integrations, and evaluation guidance.
- **Materials:** starter cases, sample process specifications, test data,
  evaluation examples, playbooks, and deployment checklists.
- **FAQ:** external blockers and reviewed answers collected from onboarding.
- **Certifications:** Beam Foundations as a light prerequisite, followed by
  Business Case & Qualification, Agent Builder — Beam Run, and Agent Builder —
  Platform. Discovery remains Pending; Solution Architect remains a later,
  experience-gated credential.

## Product dependencies

The portal must expose rather than conceal product gaps. Parallel work is
required for first-session guidance in Beam Platform, a canonical build/deploy
path, external access to required build capabilities, workspace creation APIs,
and headless deployment.

Infrastructure MVP also requires workspace creation/configuration, invitation
and membership management, domain verification and access policy, content
grants, and a minimal audit trail.

## Validation

Run one representative build with a capable user on a new external account and
no Beam-internal tools. Record the Roboyo onboarding session and capture the
same evidence: access gaps, missing documentation, blocked APIs/integrations,
time to first successful run, time to deployment, and Beam interventions.

## Success measures

- Time to first successful and first deployed agent
- Completion rate without Beam intervention
- Number and type of support escalations
- Percentage of submitted agents meeting evaluation and deployment standards

## Out of scope for MVP

Video production, games, a full academy/LMS, elaborate course authoring, and
customer-wide rollout before the partner journey is validated.
