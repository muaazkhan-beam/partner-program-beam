# Current state: Core, Library, GTM Core

This inventory is what exists today. It is the baseline for the partner portal,
not a proposal.

## Beam Core (this repository)

Beam Core is the staff starting point. Production intent: `https://core.beam.ai`.

What it does well, and should keep doing for Beam employees:

- `/start` into Codex, Claude, and Beam Prism with the same verified map.
- Apps, Systems, Designs, Repositories, Skills, Agents catalogs.
- Google sign-in via Better Auth + Convex.
- Fail-closed staff gate: exact `@beam.ai` email domain (`convex/lib/authPolicy.ts`).
- `hd` restriction on the Google provider so non-Beam Google accounts never
  complete sign-in (`convex/auth.ts`).
- Read-only v1 API and `beam-core` CLI for agents.

What it must not become:

- A partner extranet.
- A place where `pwc.com` users can see repositories, cost traces, or staff
  systems.
- A second copy of Iris, Discovery, or Platform.

Relevant catalog apps a partner will *hear about* (they should not get staff
admin of these from Core):

| App | URL | Partner relevance |
| --- | --- | --- |
| Beam Platform | `https://app.beam.ai` | Where agents actually run. Public product. |
| Beam Discovery | `https://discovery.beam.ai` | Process discovery / ranking. Shown in the PwC call. |
| Iris | `https://iris.beam.ai` | Outside-in reports, interviews. Shown in the PwC call (Zurich NA, Aramco, Al Jomaih). |
| Beam Shares | `https://shares.beam.ai` | How reviewed HTML artifacts get share links. |
| GTM Intelligence | `https://intelligence.beam.ai` | Staff research. Not a v1 partner tool. |
| Beam Prism | `https://prism.beam.ai` | Staff OS. Not a v1 partner tool. |
| Cost Dashboard | internal | Staff-only. Never partner-facing. |

Auth pattern to copy, not to weaken: staff Google + exact domain + access-denied
screen. Partner auth should be a second policy, not a hole in this one.

## Beam Library (portable catalog)

Partner-relevant skills already in this repo:

| Skill | Job for a partner motion |
| --- | --- |
| `partner-deck-builder` | Deck a consulting partner forwards internally. Canonical Strategy& example. |
| `gcc-account-qualifier` | Triage a partner-supplied target list against the KSA/GCC ICP. |
| `gtm-artifact-router` | Pick the next client-facing artifact. Has a partner/channel route. |
| `operating-diagnostic` | Process bank + value ranking before a priced proposal. |
| `use-case-proposal` | Portfolio + recommended first use case. |
| `prospect-brief` | Short research-led opener. |
| `executive-brief` | One-slide economic leave-behind. |
| `proof-pack` | Deep live cases + safe path in. The bake-off artifact. |
| `gtm-deck-builder` | Board/CEO narrative. Beta until Shares registration completes. |
| `proposal-creation` / `contract-creation` | Priced commercial. Staff-gated commercially. |
| `call-prep` | Already has a **partner call** mode. |
| `account-planning` | Internal v4 account plan; ships into GTM Core. Not partner-facing. |

GTM collection journeys already cover research → artifact → commercial. There
is **no partner-enablement journey** yet. That is the gap this skill fills.

Design assets live under `design/beam-ai/`. Partner decks should keep using
those contracts rather than growing a second design system inside the portal.

## GTM Core (workspace repo, not cloned here)

This environment cannot read `beam-ai-team/gtm-core` (GitHub 404 from the
cloud-agent token). The Library already records what was promoted out of it.

Known partner kit paths referenced by Library skills:

- `exec-team/projects/active/gtm-hy2-2026/gcc-partnership/04-partner-kit/`
  - `03-gcc-icp-qualification-playbook.md` (inlined into `gcc-account-qualifier`)
  - `11-top-25-targets.md`
  - `06-beam-25-target-companies.md`
  - `10-tadawul-listed-targets.md`
- Canonical partner-deck worked example:
  `03-projects/125-strategy-partnership/`
- Demo-assets migration workstream: GTM Core PR #76, destination
  `beam-ai-team/beam-demos` (confirmed, content not yet available).
- Account-planning packages are meant to ship as PRs back to GTM Core.

From the Roland Berger prep call, GTM already has partner briefing decks for:

- PwC (the long Strategy&/PwC follow-up, plus a shorter briefing)
- Strategy& partnership briefing
- Deloitte (Figma: agent suites, customer stories, six phases)
- BCG (kept short)

Jonas's instruction in that call is the right product instinct: **define the
chapters first, then pull from the existing decks**, rather than sending PwC's
deep follow-up to every new partner.

Boundary from `collections/gtm/README.md`:

- GTM Core = account and project working context.
- Beam Library = reusable methods, skills, design contracts.
- Beam Shares = registered templates and published artifacts.
- HubSpot = CRM lifecycle.

The partner portal should consume **Library methods + Shares-published
artifacts**. It should not become a third copy of GTM Core deal files.

## What "we have a lot of tools" actually means

Internally, the stack Jonas described on the PwC call is:

1. **Beam Platform** — graphs, evals, code execution, 800+ integrations,
   self-learning.
2. **Beam Discovery** — voice/process understanding and ranking.
3. **Iris** — outside-in company reports + interviewable agent.
4. **Operating diagnostic / process bank** — workshop with department heads,
   then the value-vs-effort graph.
5. **Solutions OS / skills / CLI** — how SEs build agents at leverage
   (one SE on six or seven clients).
6. **Beam Interfaces** — custom apps (ATS-like CV screening, dashboards)
   in front of agents.
7. **GTM artifact factory** — briefs, decks, proof packs, proposals.

Partners need a **guided subset** of that stack, explained in their language,
with request paths into the live tools. They do not need the staff CLI on day
one.
