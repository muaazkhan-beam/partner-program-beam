# Partner Portal — Phase 1 Scope (revised)

**Owner:** Muaaz Khan · **Support:** Asad Raza
**Target:** 30 September 2026 · **Status:** revised against the real codebase
**Revised:** 11 September 2026 · *supersedes the 7 September draft*

---

## What changed since the first draft

The first draft was written without the source code or the specs. We now have both.

1. **The demo is a real, working multi-tenant application.** It is `apps/partner/` in
   `beam-ai-team/beam-library`, built by Jonas. Copied into this repo, verified: catalog
   compiles, typecheck clean, all 12 tests pass including the multi-tenant isolation
   cases the spec lists as acceptance criteria.
2. **`docs/specs/partner-portal.md` is the contract.** Its v1 scope is already
   implemented. **Our Phase 1 is what we add on top of that shell**, not a build from
   zero. That is a much better starting position than the 2 September call assumed.
3. **Unified tagging is done, and better than proposed.** Dropped from scope — see below.
4. **The programs benchmark changed what to build.** Tracks, competencies, certification
   gating and a scorecard are new here, from
   [`../research/partner-programs-benchmark.md`](../research/partner-programs-benchmark.md).

**Upstream is read-only.** All work happens in this repo. `beam-library` is reference and
mapping only — never edited, committed to, or pushed.

---

## 1. What we are adding, and why

The portal's job is unchanged: **take one client process from discovery to production
without Beam in the room.**

The v1 shell delivers the sell motion — tools, materials, FAQ, playbooks, requests, three
home tracks. What it does not yet answer is the two questions a partner asks immediately
after being convinced:

> **"What exactly can I sell?"** and **"What do I get for investing in this?"**

The first is the use case catalog. The second is the program — tracks, certification with
a real consequence, and a scorecard that makes progress visible. Everything below serves
one of those two.

The governing constraint from the earlier research still holds: Forrester finds **60%+ of
partner portals fail their ROI because partners don't use them**, and the benchmark adds a
second — **every mature program is simplifying, not elaborating.** Salesforce collapsed 170
distinctions into 28; ServiceNow merged two designations into one tier; Microsoft retired a
specialization. Beam has no program debt. Build the smallest program that works.

---

## 2. Dropped from the first draft

| Item | Why |
| --- | --- |
| **Unified tagging across surfaces** | Already implemented, more thoroughly than proposed. One polymorphic `contentItems` table carries `kind`, `contentClass`, `audience`, `forwardable`, `allowedBrandModes`, `claimState`, `reviewer`, `reviewedAt`, `revalidateAt`. Nothing to do. |
| **Extend-vs-rebuild decision** | Resolved. We extend, in this repo, from a copy. |

Also worth knowing: **`allowedBrandModes` already exists on every content item**, so the
groundwork for Phase 2 co-branded generation is further along than the first draft assumed.

---

## 3. Phase 1 deliverables

Five. Ordered by build sequence and by dependency.

### 3.1 Use case catalog — *the anchor*

The largest gap and the first thing a partner opens the portal to find. Nothing in the
schema, catalog or `contentKindValidator` covers it today.

12–15 use cases as **structured records**: vertical, department, systems touched, trigger,
before, after, human-in-the-loop step, outcome with named source, time to production,
complexity. Filterable by vertical, department and complexity.

Two fields are non-negotiable:

- **`humanInLoop`** — forces every use case to answer the first objection in every
  regulated vertical before it can be published.
- **`outcome.source`** — provenance. Beam publishes 70% cost reduction, 98% accuracy, 5×
  volume. A partner who repeats those to a client gets asked *"based on what?"*, and if
  they can't answer they quietly stop using the numbers.

**Depth in two verticals — finance and BPO/customer service — beats breadth across ten.**

*Cheaper than the first draft assumed:* `listContent(workspaceId, kind)` is generic, so a
new `use-case` kind inherits the queries, the workspace grants and the isolation
guarantees for free.

### 3.2 Tracks by business model — *cheapest high-impact change*

The app has exactly one partner role, `partner_seller`. But BPOs, SIs, boutique AI shops
and advisory firms need different first screens — and serving identical content to
everyone regardless of specialization is the single most-cited cause of portal failure.

Adopt Oracle's model (Build / Sell / Service), named for Beam:

| Track | Archetype | Sees first |
| --- | --- | --- |
| **Sell** | Advisory, SI front-end | Use cases, battlecards, FAQ, diagnostic kit |
| **Build** | Boutique AI shop, SI delivery | Partner CLI, Platform access, evaluation guidance |
| **Operate** | BPO, managed services | Cost-per-transaction economics, run-support model, SLAs |

A `track` field that reorders home and filters tools. **It is not a permission model and
must not become one** — authorization stays with membership and `workspaceId`.

### 3.3 Certification with a real consequence

Four levels exist as static TypeScript in `lib/certifications.ts`. No Convex table, no
per-user progress — "0 of 4" is hardcoded. Two things to add:

**Per-user progress**, persisted. You cannot gate a benefit on a credential you don't
record.

**Firm-level consequence.** The levels state no benefit to the partner firm, which is why
people don't finish courses.

| Certified roles held | Firm tier | What the firm gets |
| --- | --- | --- |
| 1× Foundations | Registered | Portal access, use case catalog, forwardable materials |
| 1× Discovery Lead | Qualified | Deal registration, joint call support, directory listing |
| 1× Builder + 1 deployed agent | Certified | Sandbox environments, co-branded materials, priority support |
| 1× Solution Architect + 2 deployed agents with results | Advanced | Co-sell, referral flow *from* Beam, roadmap input |

**And the sharpest lever from the benchmark:** Microsoft's FY26 change made a certified
designation *mandatory* for consumed-revenue eligibility and GTM benefits. Beam's version
— **deal registration and co-sell require at least one certified person** — does more for
completion than any gamification, and costs nothing to introduce while the program is small.

*Incentives in Beam's currency:* Beam can't pay channel bonuses like Cisco, but sandbox
environments, platform credits and Beam engineering time are worth more to partners now.

### 3.4 Partner scorecard

AWS's Partner Scorecard and Cisco's Partner Value Index both answer one question in one
place: *where do I stand, and what moves me up?* Without it, tiers are invisible and
therefore inert.

One page over data §3.3 already produces: tier, certified people, competencies held,
agents in production, and the specific next action that moves the firm up.

### 3.5 Compliance document library

Beam's posture is genuinely strong — GDPR, ISO 27001, SOC 2 Type II, HIPAA, EU hosting
with GCC support, on-premises option. Partners selling into banking, insurance and
healthcare are asked for all of it in the first meeting.

Today it is scattered across FAQ entries (`security-review-pack`,
`deployment-ksa-kuwait`). It needs a real library with the documents themselves, each
carrying the audience and claim-review metadata the content model already supports.

---

## 4. Stretch — only if §3 lands early

- **Opportunity spine.** Make the client opportunity a first-class object and let every
  surface become a view onto it. `requests` is the natural foundation. The spec lists a
  "deal room for one named account" as v1.1, so this is aligned but not required.
- **Tasks-style progress.** AWS's model: next actions derived from real signals rather
  than a static checklist.

---

## 5. Out of scope for Phase 1

| Deferred to | Item |
| --- | --- |
| **Phase 1.5** | Knowledge agent over published answers · deal registration workflow · client-forwardable links with engagement telemetry · CLI and MCP promoted to first-class |
| **Phase 2** | Branded slide generation · agent builder · partner-set markup · partner directory · ATS mockups |
| **Not planned** | Five-tier ladders, MDF, stacked incentive bonuses, revenue-points tiering — all need a channel org, finance ops or a product portfolio Beam does not have. And anything that makes the portal a CRM; the spec's boundary holds. |

**On the knowledge agent:** worth saying plainly that portals are going agentic — AWS
onboarding agents, Cisco's AI assistant in PXP, Dell's agentic portal doing deal
registration. Within a year this is table stakes, which raises the bar specifically for
Beam: a partner portal for an agentic-automation company with no agent in it is an awkward
demo. It answers only from staff-published content, carries each source's audience label,
and routes to Beam when the best match is `pending` or `restricted` — inheriting the
existing governance model rather than inventing one.

---

## 6. Plan

Detailed steps: [`../plan/build-plan.md`](../plan/build-plan.md).

| Window | Focus | Exit condition |
| --- | --- | --- |
| **Fri 11 – Sun 14 Sep** | Use case schema through the whole pipeline; 3 use cases end to end | A use case renders in the portal, isolated per workspace, test passing |
| **Week 1 · 15–19 Sep** | Catalog to 12–15 entries; tracks; compliance library | Content complete; a BPO and an SI see different home screens |
| **Week 2 · 22–26 Sep** | Certification progress; firm tiers; scorecard | A partner can see their tier and what moves them up |
| **Week 3 · 29–30 Sep** | Polish, review with Daria and Fred, deploy | Live |

**Content is the critical path, not code.** Writing 12–15 use cases with real provenance
and assembling the compliance library will take longer than building the surfaces that
display them. It needs a named owner who is not Muaaz.

---

## 7. Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| **No citable customer outcome** | High | Catalog falls back to published benchmarks, which partners discount. Need one named, approved deployment from Daria/Fred. |
| **Content has no owner** | High | 12–15 use cases is the bulk of the work. Name an owner this week. |
| **Pricing stays `pending`** | High | Policy, not engineering. See §8. |
| **Certification tracks conflict** | Medium | Two specs disagree — see §8. Resolve before building progress tracking against the wrong ladder. |
| **Scope creep from Phase 2** | Medium | §5 is the cut line. |
| **Upstream drift** | Low | `apps/partner` will diverge from `beam-library`. Acceptable — but track what is worth contributing back. |

---

## 8. Open decisions

Carried forward, plus new ones from reading the specs.

1. **Is there a deployment with a measured outcome we may cite by name?** Still the top
   blocker on catalog credibility.
2. **Which two verticals get depth?** Finance and BPO/customer service recommended.
3. **Who owns content?**
4. **Which certification ladder is correct?** `partner-portal.md` lists "Sell
   certification" as v1.1, but four certifications are already shipped — and
   `partner-enablement-mvp.md` proposes a *different* track (Foundations → Business Case &
   Qualification → Agent Builder Beam Run → Agent Builder Platform) than the implemented
   one (Foundations → Discovery Lead → Builder → Solution Architect). We cannot build
   progress tracking until this is settled.
5. **Pricing — reframed.** The benchmark found partner margin has moved from resale to
   services: profitability now comes from data preparation, integration, training,
   optimization and run-support, while outcome-based pricing erodes resale margin. So the
   question is not only *"what is my markup"* but **"how do I price a delivery
   engagement."** That may be more answerable, sooner, than a licence markup.
6. **Which tenants are real?** The spec says Roboyo and Alloyed; the catalog ships PwC ME
   and Roboyo; the skill names PwC, Roboyo, BIT, Roland Berger and Strategy&.
7. **Hostname.** Spec says `partner.beam.ai`, the code and catalog say `partners.beam.ai`.
   The spec flags this and requires resolver, catalog hostnames, OAuth redirects, docs and
   tests migrate together at DNS cutover.
8. **Do we deploy anything?** This repo has no Vercel or Convex project. If Phase 1 must be
   demoable on a URL, that needs provisioning — and a decision about whether it is our own
   preview or a merge back upstream.

---

## 9. How we will know it worked

| Question | Metric | Target |
| --- | --- | --- |
| Are partners activating? | Days from onboarding to first opportunity | < 30 |
| Is enablement working? | Days to first Foundations pass | < 14 |
| Is the catalog used? | Use cases opened per active partner | tracked from day one |
| Where does the portal fail? | FAQ escalation rate by topic | falling month on month |
| Does it produce revenue? | **Partner-sourced pipeline** | the one that matters |

**Report on partner-sourced pipeline, never logins.** Logins are the metric that lets a
failing portal look healthy.
