---
name: partner-portal
type: skill
version: "0.3"
description: "Design, operate, and extend the multi-tenant Beam Partner app for consulting and channel partners (PwC, Roboyo, BIT, Roland Berger, Strategy&). Load for 'partner portal', 'partner app', 'PwC enablement', 'partner FAQ', or 'Beam Core for partners'. The v1 app lives in apps/partner/. This skill captures the GTM/Core inventory, live partner-call pain, workspace/brand/URL architecture, claim governance, and the partner-safe tool map."
category: gtm-enablement
tags:
  - gtm
  - partners
  - enablement
  - portal
maturity: work-in-progress
updated: "2026-08-14"
visibility: team
---

# Partner Portal

## Safety Contract

This skill is the operating playbook for Beam Partner. The v1 app is
[`apps/partner/`](../../../apps/partner/). It does not change Beam Core auth,
publish unreviewed materials, or grant partners access to internal apps.
Before inviting a partner tenant or exposing a new tool/material, show the
proposed audience, data boundary, and overwrite risk. Require explicit user
approval for mutating production work. Never share unapproved customer names,
unpublished pricing, internal repositories, or staff-only systems with a
partner.

Use this skill when the question is **what partners need in order to sell and
deliver with Beam**, not when the task is already a specific artifact
(`partner-deck-builder`, `operating-diagnostic`, `proof-pack`).

Canonical product contract: [`specs/apps/partner-portal.md`](../../../specs/apps/partner-portal.md).

## Why this exists

Beam Core (`core.beam.ai`) is the staff starting point: apps, systems,
repositories, skills, agents. Sign-in is Google-only and fail-closed to exact
`@beam.ai` accounts. That is the right boundary for Beam employees. It is the
wrong product for PwC, BIT, Roland Berger, or Strategy&.

Partners do not need the staff catalog. They need a **sell-and-deliver operating
system**: how to take Beam to a client, what to say when SAP/Oracle/Anaplan
come up, which tools to use before the first meeting, and how the commercial
motion works without a joint-venture argument.

The PwC Middle East call made this explicit. Paul (managed services) did not
ask for another platform tour. He asked how to get traction against Tier-1
vendors, how deployment works in KSA/Kuwait, who owns the brand, and how PwC
and Beam split the work. The portal should be built for those questions.

## Read these first

1. [`references/current-state.md`](references/current-state.md) — what already
   exists in Beam Core, Beam Library, and GTM Core.
2. [`references/partner-pain.md`](references/partner-pain.md) — PwC, BID, and
   Roland Berger call synthesis.
3. [`references/tool-map.md`](references/tool-map.md) — which tools help a
   partner, which stay staff-only, which wait.
4. [`references/faq-seed.md`](references/faq-seed.md) — first Partner FAQ
   drafted from the live objections.
5. [`specs/apps/partner-portal.md`](../../../specs/apps/partner-portal.md) — product
   contract for the app.

## Default recommendation

Do **not** open Beam Core to partner emails. Keep Core staff-only.

Build a sibling app, **Beam Partner** (working name), that reuses Core's
design system and patterns with a different identity, partner data boundary,
and a much smaller surface:

| Surface | Beam Core | Beam Partner |
| --- | --- | --- |
| Audience | `@beam.ai` staff | Invited partner orgs + Beam staff |
| Auth | Google Workspace `@beam.ai` | Google for Beam staff; magic-link or Google on allowlisted partner domains |
| Job | Find the right internal app/repo/skill | Take a named client from first meeting to a scoped first workflow |
| Default home | `/start` (Codex / Claude / Prism) | `/home` (future of shared services, first workflow, risk & delivery readiness) |

PwC is the first workspace, not the product. Roboyo, BIT, Roland Berger,
Strategy&, and later SIs use the same app with their own approved content,
brand mode, and URL; do not fork the app or deploy a tenant-specific copy.

### Workspace, brand, and URL default

Use a canonical workspace URL (`partners.beam.ai/w/{workspaceSlug}`) and an
approved partner-facing subdomain (`{partnerSlug}.partners.beam.ai`) that
resolve to the same workspace. Keep custom partner-owned domains for a later
verified-DNS and security/legal-reviewed phase. A workspace config controls
the brand mode (Beam standard, co-branded, or approved partner-fronted), logo,
home copy, enabled surfaces, members, materials, and support owner. The host
never grants access: every material and request is checked against the
server-side workspace membership.

## The three pages the user asked for

These are the MVP. They are not the whole product.

### a) Login

- Beam staff: Continue with Google, same `@beam.ai` exact-domain rule as Core.
- Partner users: invite-only. Preferred v1 is email magic link to an
  allowlisted domain (`pwc.com`, later `strategyand.pwc.com`, BIT, Roland
  Berger). Optional Google on those domains if the partner's Workspace allows
  it. Do not offer open registration.
- Every partner user belongs to one **partner org**. Staff can switch orgs.
- Fail closed: unknown domain, unknown invite, or missing org → access denied,
  same tone as Core's staff gate.

### b) Tools

A partner-safe catalog, not the staff Apps/Systems/Repositories/Skills dump.
v1 is documentation plus deep links, not live write access into Iris, Discovery,
or Platform.

Group tools by the partner's job, not by Beam's internal org chart. See
[`references/tool-map.md`](references/tool-map.md).

### c) Marketing materials + Partner FAQ

Two first-class pages:

- **Materials**: approved decks, one-pagers, proof packs, leave-behinds, with
  audience tags (`internal sponsor`, `client forwardable`, `technical bake-off`).
- **FAQ**: the questions partners actually get asked internally and by clients.
  Seed from [`references/faq-seed.md`](references/faq-seed.md).

Every material must declare: workspace collection, audience, forwardability,
approved brand mode, claim-safety, reviewer, review date, and revalidation
date. Content is either shared partner-safe, workspace-only, or staff-draft.

## What else actually helps

Ranked by whether it unblocks a partner taking Beam to market. The PwC call is
the source of truth, not a feature wishlist.

### Build in v1 if cheap, v1.1 if not

1. **Competitive fit one-pager + battlecards** — SAP / Oracle / ServiceNow /
   Workday / Anaplan / "our ERP already has AI". This was the room's actual
   blocker.
2. **Joint-motion RACI** — white-label vs co-brand vs co-sell; who speaks; who
   owns the outcome. Mo already offered "PwC platform powered by Beam".
3. **One-client, one-workflow playbook** — Paul's explicit next step. Shadow
   environment for one shared-services process, then a repeatable pack.
4. **Approved proof library** — partner-safe cases with maps-to-this-client
   lines. Reuse `proof-pack` and `partner-deck-builder` appendix rules.
5. **Discovery kit** — how to run the process-bank / Iris / operating-graph
   motion in a partner-led workshop, with share links rather than admin access.
6. **Deployment and sovereignty FAQ** — KSA, Kuwait, UAE hosting, on-prem,
   data-pull vs store. Alexander's question.
7. **Independence / conflict checklist** — audit-firm specific. Do not pretend
   this is a normal SI motion.

### Build after the first live deal, not before

8. Partner-safe artifact studio (deck, diagnostic, proof pack) with Beam review
   before anything is client-forwardable.
9. Shared deal room for one named account (evidence, next meeting, open
   questions, approved claims).
10. Enablement path: 90-minute sell certification, then a delivery sandbox.
11. Request-an-FDE flow (Beam engineer on assignment to the partner).
12. Joint pipeline view. Do not start here; PwC does not have a motion yet.

### Do not build for partners

- Staff repository browser, GitHub snapshots, cost dashboard, Prism internals.
- Unfiltered GTM Core account folders, invoices, or HubSpot.
- Open Platform admin or the ability to publish as Beam.
- A joint-venture legal workspace. The product should make lightweight
  co-sell/white-label work; JV is a commercial decision, not an app feature.

## First slice: PwC Middle East shared services

Do not start with a generic partner CMS. Start with the motion Paul named:

> Baby steps in shared services. One client, one workflow, in a shadow
> environment, then a playbook.

v1 tenant contents for PwC:

1. Login + org (PwC ME) + Beam staff overlay.
2. Home: "Take one shared-services process live" with the four steps (qualify
   the client, run a 60-minute diagnostic, show a shadow workflow, agree
   success criteria).
3. Tools: Discovery/Iris (share-link explained), Platform (what it is, how a
   demo is requested), Interfaces (when a custom app is the leave-behind).
4. Materials: latest PwC partnership briefing, proof pack, competitive
   one-pager, shared-services packaging note.
5. FAQ: the Paul / Alexander / Speaker 5 questions, answered in writing.
6. Playbook: one-workflow shadow engagement, including what PwC brings
   (client, process, humans in the delivery center) and what Beam brings
   (platform, FDE, agent graph, evals).

Roboyo, BIT, and Roland Berger get the same shell later with different home
copy and materials. Do not fork the app per partner.

## How to use this skill in a working session

1. Confirm the partner and the decision (`build the app`, `write the FAQ`,
   `choose v1 tools`, `prep the next PwC meeting`).
2. Read the matching reference. Do not re-derive the inventory from memory.
3. Propose one slice. Default is the PwC shared-services slice above.
4. If implementation is requested, change [`apps/partner/`](../../../apps/partner/)
   and keep Core's staff gate untouched. Isolation tests in
   `apps/partner/tests/isolation.test.ts` must stay green.
5. If an artifact is requested instead (deck, diagnostic, proof), route to
   that skill. This skill does not replace `partner-deck-builder`.

## Related skills

- `partner-deck-builder` — the deck a partner forwards internally.
- `gcc-account-qualifier` — when a partner sends a target list.
- `gtm-artifact-router` — which client-facing artifact to build next.
- `operating-diagnostic` / `use-case-proposal` / `proof-pack` — the actual
  sell motion partners will run.
- `call-prep` — partner-call mode already exists; use it for the next meeting.
