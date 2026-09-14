# Beam Partner Program — Project Overview

The single document that orients anyone new to this project. Read this first; it links to
everything else.

Last updated 14 September 2026.

---

## 1. What the partner program is

Beam sells AI agents that automate enterprise processes — invoice exceptions, claims
handling, customer service queues. Beam is a small company and cannot sell to and deliver
for every enterprise directly.

Consulting firms already have those relationships. PwC, Roboyo, Roland Berger and others sit
with CFOs and COOs who are being asked what to do about AI.

**So: let those firms sell and deliver Beam.** That is the partner program.

| Side | What they get |
| --- | --- |
| **Partner** | Something concrete to sell to clients already asking about AI, plus the delivery work — discovery, integration, running it — which is how consultancies make money |
| **Beam** | Reach it could never build directly, and delivery capacity without hiring |

### How it works

1. Beam invites a firm and gives them a private, branded workspace in the portal
2. The firm learns what Beam does and how to answer the hard questions
3. Their people get certified — by submitting real work, not by attending
4. They find a client with a messy, high-volume process. One process, not a transformation
   programme
5. They scope it — what happens today, where humans get stuck, what good looks like
6. The agent is built and deployed. Beam supports; the partner stays in front of the client
7. One working process becomes the argument for the next five

### What the dashboard is

Steps 2–5 currently need someone from Beam on a call. That is the bottleneck. The dashboard
is the self-service version.

The one-line goal, from the spec:

> **Take one client process from discovery to production without Beam in the room.**

### Two properties that shape the whole build

- **Multi-tenant.** PwC and Roboyo use the same application but see different branding and
  different content, and neither can see the other's material. Much of the code is about
  workspaces and permissions for this reason.
- **Content is governed, not dumped.** Every item is labelled — may I forward this to a
  client, or is it internal? Is this claim approved, or does the question route back to
  Beam? A partner repeating an unapproved claim to a client is a real risk.

---

## 2. What this repo is

`apps/partner/` is a **copy of the Beam Partner v1 shell** built by Jonas, taken from
`beam-ai-team/beam-library`. We build on top of it here.

> **Upstream is read-only.** Never edit, commit or push to `beam-library`. It is reference
> and mapping only. All spec, plan and build work happens in this repo.

Copied at `effed19` (2026-09-04). One change from upstream: `better-auth` pinned to
`~1.6.25`, because the caret range resolves to 1.7.x outside the monorepo lockfile and
breaks the `@convex-dev/better-auth` peer requirement.

### Layout

| Path | What |
| --- | --- |
| `apps/partner/` | The app — Next.js 16, Convex, Better Auth, Tailwind v4, Playwright |
| `docs/specs/` | Product contracts from upstream. `partner-portal.md` governs Phase 1 |
| `docs/reference/` | Source material — the partner-portal skill, real partner-call synthesis, meeting notes, links |
| `docs/research/` | Competitive research on portals and programs |
| `docs/analysis/` | The spec-versus-code audit |
| `docs/scope/`, `docs/plan/` | Phase 1 scope and the build plan |

### Running it

```bash
pnpm install
pnpm catalog:compile
pnpm test
```

The app needs a Convex deployment. From `apps/partner/`:

```bash
CONVEX_AGENT_MODE=anonymous pnpm convex:dev
```

Then `pnpm dev` from the root, and open `http://127.0.0.1:3001/w/partner-demo/home`.

### How the app works

Content flows one way, and understanding it makes most changes predictable:

```
catalog/*.yaml
   → scripts/compile-catalog.mjs
      → convex/generated/catalog.json
         → convex/seed.ts        (seeds contentItems + contentGrants)
            → convex/partner.ts  (queries, membership-checked)
               → app/(partner)/w/[workspaceSlug]/<surface>/page.tsx
```

Three properties matter:

1. **`listContent(workspaceId, kind)` is generic** — a new content kind inherits queries,
   workspace grants and isolation with no new query code
2. **`contentItems` is one polymorphic table** discriminated by `kind` — new kinds add a
   validator literal, not a table
3. **Navigation is driven by `workspace.enabledSurfaces`** — a surface can ship dark and be
   switched on per workspace when its content is ready

**The golden rule:** every read and write verifies membership and `workspaceId` server-side.
A `workspaceSlug` in the URL is never authorization.

---

## 3. What we found

### The demo was not a mockup

The kickoff described the existing dashboard as a boring static page. It is a working
multi-tenant application. Verified in this repo: catalog compiles, typecheck clean, **12 of
12 tests pass**, including the tenant-isolation cases the spec lists as acceptance criteria.

This saved roughly a week and changed Phase 1 from *build* to *build on*.

### The spec audit

Section by section against the code — **31 done, 8 partly done, 7 not done, 2 beyond spec**.
Full detail with file references: [`analysis/spec-delta.md`](analysis/spec-delta.md).

The shell is solid: tenancy, host resolution, auth, content governance, the three-track home,
tools, materials, FAQ, playbooks and requests.

**The gap is concentrated in staff administration.** The spec promises that *"an internal
staff admin can manage each workspace without engineering a new site."* There is no workspace
creation, no configuration, no access-policy control and no audit trail — so adding a partner
today means editing YAML and re-seeding. **Open question: is finishing this ours, or Jonas's
to complete in the baseline?**

Three smaller findings, each under a day to fix:

- `allowedBrandModes` is stored and seeded but **never read** — a partner-fronted workspace
  can surface material approved only for Beam-standard
- `reviewedAt` / `revalidateAt` exist in the schema but are absent from `CatalogContent`, so
  content revalidation cannot be expressed
- Requests have an `owner` field and **no notification** — the Linear/Slack handoff in the
  spec was never built

### The research

Five documents in [`research/`](research/). The findings that changed what we build:

**Forrester: over 60% of partner portals fail their ROI because partners don't use them.**
The failure mode is consistent — generic content, buried navigation, nothing that helps close
the deal in front of the partner. So the design question is not *what content goes in* but
**why would a partner open this on a Tuesday morning?**

**Every mature program is simplifying, not elaborating.** Salesforce collapsed 170 Navigator
distinctions into 28 competencies; ServiceNow merged two designations into one tier;
Microsoft retired a specialization. Beam has no program debt — build the smallest program
that works.

**Recognition moved from revenue to outcomes.** Salesforce ties recognition strictly to
project outcomes, CSAT and certifications. The demo already states the modern position —
*"credentials belong to people; your firm's tier follows from certified roles, delivered
agents, and customer outcomes"* — it just isn't implemented.

**Partner margin moved from resale to services.** Profit now comes from data preparation,
integration, training and run-support. This reframes pricing: partners need to know how to
price a delivery engagement, not only what their markup is.

**Lovable is the closest model** ([`research/lovable-partner-program.md`](research/lovable-partner-program.md)),
because it runs at Beam's stage rather than with a channel org behind it. Its sharpest
mechanic: **certification is the gate between earning nothing and earning something** —
Registered earns 0%, Select earns 10%, and the only requirement is certification. Also worth
taking: credits as the reward currency, and a **dogfooding step** where partners build on the
product for their own business before certifying.

### What the business told us

From [`reference/derya-meeting-notes.md`](reference/derya-meeting-notes.md), 11 September.

**Live use cases** — the catalog seed list, and no longer guesswork:

| Department | Use cases |
| --- | --- |
| Finance | Invoice processing · expense management · debt collection · reporting |
| Procurement | Sales order processing · supplier communication · supplier FAQs |
| HR | CV screening · voice interviews |
| Customer support | Support tickets (hospitality) |

**Winning industries:** financial services, BPO/RPO, automotive manufacturing.

**Access:** no open signup. Approved partners see *everything* — so content is not tiered.
Tiers should gate program benefits instead.

**Pricing:** general agent pricing now exists and should be published. How a partner makes
money stays a one-to-one conversation and is explicitly not for the portal.

The line that makes the case for the whole catalog:

> *"If we don't know, they don't know… If we are specific on what we can do, they think about
> us when they have a certain challenge. So far that has been all relationship-based."*

---

## 4. Phase 1

Target 30 September 2026. Full detail: [`scope/phase-1-scope.md`](scope/phase-1-scope.md),
ordered file chains in [`plan/build-plan.md`](plan/build-plan.md).

The shell delivers the sell motion. It does not answer the two questions a partner asks
immediately after being convinced:

> **"What exactly can I sell?"** → the use case catalog
> **"What do I get for investing in this?"** → the program

### Five deliverables

1. **Use case catalog** — 12–15 structured records: vertical, department, systems, trigger,
   before, after, the step that keeps a human approver, outcome with a named source. Two
   fields are non-negotiable: `humanInLoop`, which forces every entry to answer the first
   objection in regulated verticals, and `outcome.source`, which enforces provenance.
2. **Tracks by business model** — Sell, Build, Operate. A BPO and an SI should not see the
   same first screen. Presentation only, never permission.
3. **Certification with a consequence** — per-user progress (currently static, "0 of 4" is
   hardcoded) plus firm tiers, with deal registration and co-sell requiring a certified
   person.
4. **Partner scorecard** — where do I stand and what moves me up. Without it, tiers are
   invisible and therefore inert.
5. **Compliance library** — GDPR, ISO 27001, SOC 2 Type II, HIPAA, hosting. Asked for in
   every regulated first meeting; currently scattered across FAQ entries.

### Out of scope

**Phase 1.5** — knowledge agent over published answers, deal registration, forwardable links
with engagement telemetry, CLI and MCP promoted. **Phase 2** — branded slide generation,
agent builder, partner-set markup, partner directory.

**Not planned** — five-tier ladders, MDF, stacked incentives, revenue-points tiering. All
need a channel org, finance ops or a product portfolio Beam does not have. And anything that
turns the portal into a CRM.

---

## 5. Open decisions

| # | Decision | Why it matters |
| --- | --- | --- |
| 1 | **A customer we can name, with a number** | The catalog's credibility rests on it. Laurin and Kalina are the next source |
| 2 | **A content owner who isn't Muaaz** | 12–15 use cases is the bulk of Phase 1, and it is writing rather than engineering |
| 3 | **Which certification ladder is correct** | The two specs disagree and four certifications already ship. Blocks progress tracking |
| 4 | **Staff admin — ours or Jonas's?** | The difference between onboarding a partner and filing a pull request |
| 5 | **Do we deploy?** | This repo has no Vercel or Convex project |
| 6 | **Hostname** | Spec says `partner.beam.ai`, code says `partners.beam.ai`. Must migrate resolver, catalog, OAuth redirects, docs and tests together |

---

## 6. Working rules

- **Upstream is read-only.** Never edit, commit or push to `beam-library`
- **`workspaceId` on every read and write.** No exceptions
- **`pnpm test` before every commit** — the isolation tests are the spec's acceptance criteria
- **Keep the diff clean** — follow existing patterns; upstream compatibility beats preference
- **Ship surfaces dark** — build behind `enabledSurfaces`, switch on when content is ready
- **Never invent a number.** An absent outcome beats a fabricated one

---

## 7. Everything else

| Document | What it covers |
| --- | --- |
| [`specs/partner-portal.md`](specs/partner-portal.md) | **The product contract.** Governs Phase 1 |
| [`specs/partner-enablement-mvp.md`](specs/partner-enablement-mvp.md) | A separate *proposed* spec — a guided build journey. Overlaps; not what we are building |
| [`analysis/spec-delta.md`](analysis/spec-delta.md) | Spec versus code, section by section, with file references |
| [`scope/phase-1-scope.md`](scope/phase-1-scope.md) | Phase 1 deliverables, cut line, risks, decisions |
| [`plan/build-plan.md`](plan/build-plan.md) | Ordered file chain for each deliverable |
| [`research/partner-portal-research.md`](research/partner-portal-research.md) | Demo teardown, AWS, OpenAI, Tropic, the 2026 PRM landscape |
| [`research/ideas-and-recommendations.md`](research/ideas-and-recommendations.md) | Ideas ranked by impact per unit of effort |
| [`research/deep-dive.md`](research/deep-dive.md) | Beam product grounding, partner archetypes, concrete schemas |
| [`research/partner-programs-benchmark.md`](research/partner-programs-benchmark.md) | Ten partner programs compared, and which mechanics suit Beam |
| [`research/lovable-partner-program.md`](research/lovable-partner-program.md) | The closest model to Beam's stage |
| [`reference/derya-meeting-notes.md`](reference/derya-meeting-notes.md) | Requirements from the business |
| [`reference/partner-pain.md`](reference/partner-pain.md) | Real PwC ME, BID and Roland Berger call synthesis |
| [`reference/tool-map.md`](reference/tool-map.md) | Which tools are partner-safe, which stay staff-only |
| [`reference/faq-seed.md`](reference/faq-seed.md) | First partner FAQ, drafted from live objections |
| [`reference/sources.md`](reference/sources.md) | Every external link, and who is who |
