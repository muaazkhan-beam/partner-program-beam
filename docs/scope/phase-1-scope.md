# Partner Portal — Phase 1 Scope

**Owner:** Muaaz Khan · **Support:** Asad Raza
**Target:** 30 September 2026 · **Status:** draft for review
**Prepared:** 7 September 2026, for the scope sync

Backed by three research documents: [portal research](../research/partner-portal-research.md),
[ideas and recommendations](../research/ideas-and-recommendations.md), and the
[deep dive](../research/deep-dive.md).

---

## 1. What we are building

A self-service portal that lets a Beam partner **take one client process from discovery to
production without Beam in the room.**

That sentence is already the demo's headline. This scope keeps it and builds the portal around
it rather than around a content library.

### The constraint that shapes the whole design

> Forrester: **over 60% of partner portals fail to meet their ROI because partners don't use
> them.**

The consistent failure mode is a well-organized library that nobody opens. So the question
this scope answers is not *"what content goes in?"* but **"why would a partner open this on a
Tuesday morning, unprompted?"**

Two decisions follow from that, and they are the main departures from the 2 September call:

1. **The portal is organized around the partner's live deal, not around content types.**
2. **We ship one thing partners cannot get anywhere else** — visibility into what their client
   actually opened.

---

## 2. Starting point

The demo at <https://partner-portal-beam.vercel.app/w/partner-demo> is **ahead of where the
call assumed**. It already has a working information architecture, a 20-answer FAQ with
restriction levels, a four-level certification track, and a request intake path.

It also contains three genuinely original ideas we should protect:

- **Two-axis tagging** — every asset is labelled by audience (`partner-internal` /
  `client-forwardable` / `technical`) and status (`published` / `pending` / `restricted`). This
  answers the question a partner actually has when about to attach a file to a client email.
- **The partner-safe boundary** — *"v1 is documentation plus a request path into Beam, not live
  write access."* A well-judged scope line, already written down.
- **The Partner CLI** — "start partner-safe work in your agent," from Codex, Claude, or Beam
  Prism. No competing PRM has this.

**Recommendation: extend the demo, do not rebuild it.** A rewrite spends most of the
three-week budget re-deriving decisions that are already correct.

> ⚠️ **Blocker:** we do not have the demo's source code. This is the single largest schedule
> risk in the plan — see §7.

---

## 3. Phase 1 deliverables

Seven items. Ordered by build sequence.

### 3.1 Use case catalog — *the largest gap*

Nothing behind it today, and it is the first thing a partner opens the portal to find.

- 12–15 use cases as **structured records**, not prose
- Fields: vertical, department, systems touched, trigger, before, after, **human-in-the-loop
  step**, outcome with **named source**, time to production, complexity
- Filterable by vertical, department and complexity
- **Depth in two verticals — finance and BPO/customer service — rather than breadth across ten**

Two fields are non-negotiable. `humanInLoop` forces every use case to answer the first
objection in every regulated vertical. `outcome.source` enforces provenance, so a partner who
repeats "70% cost reduction" to a client can say where it comes from.

*Structured records also make this the source data for the Phase 2 agent builder, which becomes
a UI over existing data rather than a fresh content project.*

### 3.2 Opportunity spine

Make the client opportunity a first-class object — *"Acme Corp · invoice exception handling ·
finance · diagnostic"* — and make every other surface a view onto it.

Opening an opportunity shows the matching use cases, the battlecard for the incumbent that
client actually runs, the FAQ answers asked at that stage, the scoping kit for the next step,
and one clear next action.

**Nothing here is dynamic.** Content stays static; the assembly is a filter over vertical,
department, stage and systems. But it converts a filing cabinet into something that works on
the partner's live deal — and gives Beam pipeline visibility without becoming a CRM.

### 3.3 Client-forwardable links with engagement telemetry — *highest leverage*

Promote the existing `client-forwardable` tag from a **label** to an **action**:

- **Send to client** produces a hosted, partner-branded, client-safe view of an asset or bundle
- The partner shares a link rather than downloading and re-attaching a PDF
- **The partner sees what their client opened, and for how long**

This is the Tuesday-morning answer. Client engagement telemetry is not available from a shared
drive, from email, or from the partner's own CRM. It also fixes version control — Beam updates
the asset and every link already sent stays current — and every view tells Beam which content
works.

### 3.4 Unified tagging across every surface

The two-axis tagging exists today only in Materials and the FAQ, applied inconsistently. Extend
one schema to tools, use cases, compliance documents and everything else, and expose it as a
global filter. This is Beam's differentiator and it is nearly free to finish.

### 3.5 Compliance document library

Beam's posture is genuinely strong — GDPR, ISO 27001, SOC 2 Type II, HIPAA, EU hosting with GCC
support, and an on-premises option. Partners selling into banking, insurance and healthcare are
asked for all of it in the first meeting.

Today this is scattered across FAQ entries. It needs a proper library with the actual
documents, each tagged for audience and forwardability.

### 3.6 Progress as Tasks, not a checklist

Jack asked for a progress checklist; the better model is AWS Partner Central **Tasks** —
personalized next actions derived from what the partner has actually done.

Phase 1 can hardcode the logic, but it must be **stateful per workspace** and each item must
name the *signal* that completes it (certification passed, request opened, CLI connected), so
Phase 2 can make it genuinely dynamic without reshaping the data.

### 3.7 Certification: firm-level consequence

The four levels are well designed but state no benefit to the partner **firm**, which is why
people do not finish courses. Add the tier mapping:

| Certified roles held | Firm tier | What the firm gets |
| --- | --- | --- |
| 1× Foundations | Registered | Portal access, use case catalog, forwardable materials |
| 1× Discovery Lead | Qualified | Deal registration, joint call support, directory listing |
| 1× Builder + 1 deployed agent | Certified | Sandbox environments, co-branded materials, priority support |
| 1× Solution Architect + 2 deployed agents with results | Advanced | Co-sell, **referral flow from Beam**, roadmap input |

Also split the ladder into role-based paths — sell, build, deliver — as OpenAI's PartnerU and
UiPath Academy both do. A partner seller should not need the Builder practical to be activated.

*Referral flow from Beam is the strongest incentive available and costs nothing to promise at
the top tier.*

---

## 4. Explicitly out of scope for Phase 1

Cut deliberately, not by accident.

| Deferred to | Item |
| --- | --- |
| **Phase 1.5** | Knowledge agent over published answers · CLI/MCP promoted to first-class · deal registration workflow |
| **Phase 2** | Branded slide generation · agent builder ("McDonald's menu") · partner-set pricing markup · partner locator · ATS mockups in HubSpot/Workday/Salesforce |
| **Not planned** | Anything that makes the portal a CRM. The demo's boundary — *"a small request into Beam, not a CRM. Do not upload client data."* — is correct and should hold. |

### Three cheap decisions now that avoid a Phase 2 rewrite

1. Store partner **branding** (logo, colors) on the workspace from day one, even unused — slide
   generation needs it, and backfilling means a migration.
2. Keep use cases as **structured records** — the agent builder is a query over exactly those fields.
3. Model pricing as **base + partner markup**, markup locked to 1× and status `pending` — Phase 2
   unlocks the field rather than reshaping the model.

---

## 5. Proposed phase reframe

The call split this as Phase 1 static / Phase 2 dynamic. Two Phase 2 items are cheaper than
they look and carry most of the differentiation, so:

| Phase | Window | Contents |
| --- | --- | --- |
| **Phase 1** | to 30 Sep | The seven deliverables in §3 |
| **Phase 1.5** | +2–3 weeks | Knowledge agent · CLI and MCP · deal registration · forwarding telemetry surfaced |
| **Phase 2** | as scoped | Slide generation · agent builder · markup · locator · certification tiers live |

**On the knowledge agent:** a narrow version is a few days of work and is the most impressive
surface to demo. It answers only from staff-published content, carries each source's audience
label, and routes to Beam whenever the best-matching source is `pending` or `restricted` — so
it inherits the existing governance model instead of inventing a new one. AWS shipped exactly
this pattern in June 2026.

**On the CLI/MCP:** the defining 2026 trend is PRM splitting into *portals partners must log
into* versus *platforms that meet partners where they already work*. Beam's partners are
AI-literate by definition. An MCP server letting a partner's own Claude or Codex query the
catalog inverts the 60% problem — we stop competing for logins and become an API. This is
Beam's most defensible position in the category.

---

## 6. Three-week plan

| Week | Dates | Focus | Exit condition |
| --- | --- | --- | --- |
| **0** | 8–9 Sep | Unblock: demo source from Yunus, content owners confirmed, §8 decisions made | Source access resolved either way |
| **1** | 8–12 Sep | Content model + use case catalog structure; compliance library assembled; tagging schema unified | Schema frozen; 5 use cases written end-to-end |
| **2** | 15–19 Sep | Opportunity spine; forwardable links; Tasks-style progress | Partner can open an opportunity and see matched content |
| **3** | 22–26 Sep | Certification tiers; remaining use cases to 12–15; polish; internal review with Daria and Fred | Feature complete |
| **Buffer** | 29–30 Sep | Fixes from review, deploy | Live |

**Content is the critical path, not code.** Writing 12–15 use cases with real provenance and
assembling the compliance library will take longer than building the pages that display them.
Week 1 should start with content, and it needs a named owner who is not Muaaz.

---

## 7. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| **Demo source unavailable** | High — rebuild vs extend is roughly a week's difference | Resolve with Yunus by 9 Sep. If unavailable, scope drops to §3.1, 3.4, 3.5, 3.6 |
| **Pricing/margin stays `pending`** | High — it is the first question every partner asks, and "pending" undermines the rest of the page | Escalate now; it is a policy decision, not an engineering one |
| **No citable customer outcome** | Medium — catalog falls back to published benchmarks, which partners discount | Ask Daria/Fred for one named, approved deployment |
| **Content has no owner after launch** | Medium — a portal with no editorial owner is stale within a quarter | Name an owner as part of Phase 1, not after |
| **Scope creep from Phase 2** | Medium | §4 is the agreed cut line |

---

## 8. Decisions needed from this sync

Ranked by how much the build depends on them.

1. **Do we have the demo's source code?** Determines extend vs rebuild — a week of difference.
2. **Is there a deployment with a measured outcome we may cite by name?** The catalog's
   credibility rests on it.
3. **Which two verticals get depth?** Finance and BPO/customer service are the obvious
   candidates from Beam's own positioning — confirm against real pipeline.
4. **Which partner archetype comes first?** BPO, SI, boutique AI shop and advisory need
   materially different first screens. *(Recommendation: one `archetype` field on the workspace
   that reorders content, rather than separate portals.)*
5. **Who owns content, during and after Phase 1?**
6. **Does content need gating by partner tier on day one,** or is everything open to signed-in
   partners in Phase 1?
7. **Can we commit to the deal registration policy** — 90-day protection window, 24-hour
   approve/reject, consistently enforced — before Phase 1.5 builds it? These are commitments
   that cannot be retrofitted after a partner feels cheated.

---

## 9. How we will know it worked

| Question | Metric | Target |
| --- | --- | --- |
| Are partners activating? | Days from onboarding to first opportunity | < 30 |
| Is enablement working? | Days to first Foundations pass | < 14 |
| Is content reaching clients? | % of forwardable assets actually forwarded | tracked from day one |
| Where does the portal fail? | FAQ escalation rate by topic | falling month on month |
| Does it produce revenue? | **Partner-sourced pipeline** | the metric that matters |

**Report on partner-sourced pipeline, never on logins.** Logins are the metric that lets a
failing portal look healthy — and the CLI/MCP direction deliberately reduces logins while
increasing usage.

---

## 10. Dependencies

| From | What we need | By |
| --- | --- | --- |
| **Yunus** | Current dashboard repository / demo source | 9 Sep |
| **Daria, Fred** | Most common partner requests; one citable deployment outcome | 12 Sep |
| **Commercial owner** | Margin model and pricing answer, or a date for one | 12 Sep |
| **Zhichao Li** | Interactive agent-building prototype (informs Phase 2) | Phase 2 |
| **Asad Raza** | Linear project with these deliverables as issues | 8 Sep |
