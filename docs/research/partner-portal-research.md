# Partner Portal Research

Research input for the Beam partner program dashboard. Compiled 2026-09-07 by Muaaz Khan.

Sources: the existing Beam demo portal, AWS Partner Central, the OpenAI Partner Network,
Tropic, and the 2026 PRM/partner-portal software landscape.

---

## 1. The existing Beam demo portal

<https://partner-portal-beam.vercel.app/w/partner-demo>

This is further along than the 2026-09-02 call implied. It is not the "boring static page" —
it already encodes a point of view about what a Beam partner needs. Treat it as the baseline
to extend, not a throwaway.

### Navigation

`Home` · `Tools` · `Materials` · `FAQ` · `Certifications` (New) · `Requests`

Scoped per workspace: `/w/{workspace}/...`. Demo user is `demo@partner.example`, role
`partner seller` — so a role model already exists in the URL and session shape.

### Home

Framing headline: **"Take one client process from discovery to production."** The supporting
copy splits responsibility — partner owns the client relationship, Beam owns platform and
agent infrastructure.

Four concept cards, which are really the sales narrative in order:

| Card | Job it does |
| --- | --- |
| Partner CLI | Start partner-safe work inside the partner's own agent |
| Layer | Position Beam as fitting over existing systems, not replacing them |
| Beachhead | Pick the first workflow — exception-heavy processes |
| Clearance | Clear delivery readiness using approved governance answers |

Plus a Certifications entry point: "Learn, submit practical work, and become ready to scope
and deliver without Beam in the room."

### Tools

Descriptor: *"Partner-safe catalog. v1 is documentation plus a request path into Beam, not
live write access."* — an explicit, well-judged Phase 1 boundary. Organized by journey stage:

- **Start** (1) — Partner CLI for Codex, Claude, or Beam Prism work
- **Sell** (3) — competitive battlecards vs incumbents; call prep (partner mode) with RACI;
  materials library with decks and proof packs
- **Prove** (4) — Iris company analysis; proof pack for technical buyers; platform demo path
  (graphs, audit logs); Beam Interfaces for custom UI
- **Scope** (5) — discovery process capture; one-workflow playbook with shadow environments;
  Beam Platform deployment environment; self-learning explainer; success-criteria kit

Every tool carries a classification label: `Technical` or `Partner-internal`.

### Materials

Assets grouped by type — one-pagers, proof materials, executive decks, operational playbooks.
The important design decision here is the **two-axis tagging**:

- *Audience*: `partner-internal`, `client-forwardable`, `technical`, `internal`
- *Status*: `pending`, `forwardable`

That distinction — can I send this to my client, or is it for my eyes only — is the single
most valuable primitive in the whole demo. It is what a partner actually needs to know at the
moment they're about to attach a file to an email.

### FAQ

20 answers, filterable by `All` / `Partner` / `Technical` / `Pending` / `Restricted`. Covers:

- **Competitive** — vs SAP, Oracle, ServiceNow, Workday AI; vs EPM (Anaplan, OneStream);
  build-in-house; "won't this become another departmental AI tool?"
- **Operational** — ideal first workflow; when to walk away; measuring success and baselines;
  engagement phases; what to hand leadership
- **Technical** — data integration and storage; human approval points; accuracy maintenance
  via production feedback; security/architecture evidence; demo vs sandbox vs production access
- **Commercial** — partner-fronted / joint / Beam-fronted branding; revenue models and margins;
  deal registration and opportunity protection; pricing (marked pending)

Answers are staff-published with restriction levels; hard questions on exclusivity,
independence and pricing route to Beam rather than being answered inline.

### Requests

Two types — **Client Opportunity** and **Support Request**. Fields: named account (optional),
candidate process stage (`qualify` / `diagnostic` / `shadow` / `success-criteria`), requested
support type (`shadow-demo` / `deployment-review` / `faq-escalation` / `other`), problem
statement. Explicitly framed: *"A small request into Beam, not a CRM. Do not upload client
data."*

### Certifications

Tagline: "Learn it. Prove it. Take it to a client." Philosophy: *"Credentials belong to people.
Your firm's tier follows from certified roles, delivered agents, and customer outcomes."*

| Level | Time | Assessment | Gate |
| --- | --- | --- | --- |
| 1. Beam Foundations | 3 hours | 40-item exam | — |
| 2. Discovery Lead | 1 day | Process spec submission, 7 review dimensions | L1 |
| 3. Builder | 2 days | Working agent prototype + cost estimate (practical) | L2 |
| 4. Solution Architect | 2 days + panel | Live design review | 2 deployed agents with results |

Progress shown as "Your pathway 0 of 4". Stated outcome: *"activation, not a badge"* — a
90-day target to first client engagement, with weekly guidance sessions for two months.

---

## 2. AWS Partner Central

<https://docs.aws.amazon.com/partner-central/>

The reference implementation for **journey-phase navigation**. Everything — nav bar, menus,
tasks — is organized into four APN phases: **Build → Market → Sell → Grow**. Partner Central
2.0 was an explicit redesign around this.

What is worth stealing:

- **Journey phases as the top-level IA.** Not "Resources / Training / Support" but the stages
  of actually getting to revenue. Beam's demo already does a version of this with
  Start / Sell / Prove / Scope.
- **Partner Scorecard** — tracks progression against path and tier requirements. One place
  that answers "where do I stand?"
- **Personalized Tasks** — calls to action customized from what the partner said at
  registration. Split into *Account tasks* (set up / link accounts) and *Solution tasks*
  (track a solution across build/market/sell/grow). This is the mature version of Jack's
  "progress checklist."
- **Guides** — step-by-step resources at introductory and advanced levels for each journey
  stage, launched Dec 2024.
- **Onboarding agents** (Jun 2026) — AWS now walks new partners from registration to
  ready-to-sell conversationally: profile setup, verifications, tax, payment, first listing.
  Directly relevant to Beam's Phase 2 NL compliance agent.

The lesson: AWS's differentiator is not content volume, it is **sequencing**. The portal
always knows what you should do next.

---

## 3. OpenAI Partner Network

<https://openai.com/business/partners/> · portal at <https://partners.openai.com>

The closest analogue to Beam's situation — an AI vendor whose partners must be able to scope,
build and deliver AI solutions without the vendor in the room. Launched with a **$150M**
ecosystem investment.

- **Three tiers**: Select → Advanced → Elite. Progression is gated on sales performance,
  technical capability, co-sell engagement, and deployment experience — not just revenue.
- **PartnerU** — the enablement and role-based learning section. Explicitly role-based:
  separate paths to *sell*, *build*, and *deploy*.
- **Enablement is the progression mechanism.** Badges, specializations and expert designations
  are what move a firm across tiers. This is exactly the Beam demo's "credentials belong to
  people; your firm's tier follows" stance — validated by the biggest player in the category.
- **Specializations** in high-impact areas — Codex, cybersecurity, agents.
- **Partner Locator** so enterprise customers can find qualified partners. Two-sided: the
  portal is a lead source, not just a library.
- Target of **300,000 certified consultants by end of 2026** — the scale of ambition around
  certification as the engagement engine.

The lesson: **certification is not gamification garnish, it is the core loop.** Jack listed it
as a Phase 2 "gamification" item; OpenAI and the Beam demo both treat it as structural.

---

## 4. Tropic

<https://www.tropicapp.io/partners>

Smaller and less instructive as a portal, but useful as a positioning model. Tropic's partner
pitch is entirely about **what the partner can now offer their own book of business**: pricing
data across hundreds of software suppliers, an intake-to-procure platform, and access to
negotiation experts.

The lesson: lead with *"here is what you can now sell,"* not *"here is our program's rules."*
The Beam demo's "Take one client process from discovery to production" headline already does
this well.

---

## 5. The 2026 PRM landscape

Table stakes across commercial PRM platforms (Introw, Mindmatrix, ZINFI, PartnerStack,
PartnerPortal.io):

partner portal · deal registration · CMS for assets · LMS for training and enablement ·
partner tiering and compliance · partner business planning · partner performance dashboards ·
co-marketing · incentives/MDF

The notable **2026 trend**: the category is splitting into *portals partners are forced to log
into* and *platforms that meet partners where they already work* — their own CRM, Slack, or AI
assistant.

This matters a lot for Beam. The demo's **Partner CLI** — "start partner-safe work in your
agent," usable from Codex, Claude, or Beam Prism — is already on the right side of that split,
and is genuinely differentiated. Most PRMs cannot do this. It should be promoted, not buried
as one of thirteen tools.

---

## 6. Gap analysis — demo vs. Phase 1 requirements from the call

| Phase 1 requirement (Jack, 2026-09-02) | Status in demo |
| --- | --- |
| Compliance docs | Partial — FAQ covers security/architecture, governance; no document library |
| Use case catalog | **Missing** — the biggest gap |
| Product explanations | Covered — Layer, self-learning explainer, FAQ |
| Vertical demos | **Missing** — proof pack is an explicit placeholder |
| Progress checklist | **Missing** — certification pathway exists, no overall checklist |
| Intake form | Covered — Requests page |

And items the demo delivers that the call assigned to Phase 2: **certification program**
(full 4-level track) and **deal registration** (FAQ answer exists; Requests is the mechanism).

---

## 7. Recommendations

### 7.1 Extend the demo; do not restart

The demo has three original ideas worth keeping: the audience/status tagging on every asset,
the "partner-safe, documentation not write-access" boundary, and the Partner CLI. Rebuilding
from scratch loses all three and burns most of the three-week budget.

### 7.2 Close the two real content gaps first

**Use case catalog** and **vertical demos** are the only Phase 1 items with nothing behind
them, and they are what a partner opens the portal to find. Everything else in Phase 1 has at
least a stub. Filterable by vertical, department, and process type; each entry needs the
before/after, the integrations touched, and the measured outcome.

### 7.3 Make the tagging system the backbone

Every asset, FAQ answer, tool and use case should carry the same two labels — audience
(`partner-internal` / `client-forwardable` / `technical`) and status (`published` / `pending`
/ `restricted`). It already exists in Materials and FAQ inconsistently. Unify it into one
schema, apply it everywhere, and expose it as a global filter. This is Beam's differentiator
and it costs almost nothing to finish.

### 7.4 Add the checklist as a real progress model, not a widget

Follow AWS Tasks rather than a static list: derive next actions from what the partner has
actually done — certifications passed, requests opened, materials viewed. Even a hardcoded
Phase 1 version should be *stateful per workspace* so Phase 2 can make it dynamic without a
rewrite.

### 7.5 Promote the Partner CLI to a first-class surface

It is the "meet partners where they work" play, it is already built, and no competing PRM has
it. Give it its own nav entry and a real setup guide instead of one card under Tools → Start.

### 7.6 Reclassify certification as Phase 1

It is built, it is the progression engine for both AWS and OpenAI, and the demo's own stance
("credentials belong to people; firm tier follows") is the right one. Treat the four levels as
core IA. What is missing is only the tier consequence — what a firm *gets* at each level.

### 7.7 Design Phase 1 data shapes for Phase 2

Three cheap decisions now that avoid a rewrite later:

- Store partner **branding** (logo, colors) on the workspace from day one, even if unused —
  Phase 2 slide generation needs it.
- Keep use cases as **structured records** (vertical, department, systems, outcome), not prose
  — the Phase 2 "McDonald's menu" agent builder is a query over exactly this.
- Model **pricing as a base value plus a partner markup field**, even if the markup is locked
  to 1x and pricing is `pending`.

### 7.8 Answer the pricing question

Pricing is marked `pending` in the FAQ, and it is the thing partners most need. This is a
content and policy blocker, not an engineering one — it needs Derya, Fred, and whoever owns
commercial terms. Raise it now; it will not resolve itself in three weeks.

---

## Sources

- [Beam partner demo portal](https://partner-portal-beam.vercel.app/w/partner-demo)
- [AWS Partner Central Documentation](https://docs.aws.amazon.com/partner-central/)
- [AWS Partner Central navigation bar](https://docs.aws.amazon.com/partner-central/latest/getting-started/navigation-bar.html)
- [Redefining the partner digital experience with AWS Partner Central 2.0](https://aws.amazon.com/blogs/apn/redefining-the-partner-digital-experience-with-aws-partner-central-2-0)
- [AWS Partner Central agents guide new partners from registration to ready-to-sell](https://aws.amazon.com/about-aws/whats-new/2026/06/aws-partner-central/)
- [New Guides on AWS Partner Central](https://aws.amazon.com/about-aws/whats-new/2024/12/guides-aws-partner-central)
- [Introducing the OpenAI Partner Network](https://openai.com/index/introducing-openai-partner-network/)
- [OpenAI Partner Network](https://openai.com/business/partners/)
- [OpenAI goes live with its new partner network — IT Europa](https://www.iteuropa.com/news/openai-goes-live-its-new-partner-network)
- [OpenAI Debuts Partner Network Backed by $150M Investment — Channel Insider](https://www.channelinsider.com/news-and-trends/openai-debuts-partner-network-backed-by-150m-investment/)
- [Become a Tropic Partner](https://www.tropicapp.io/partners)
- [12 Best Partner Portal Software Platforms (2026) — Introw](https://www.introw.io/blog/best-partner-portal-software)
- [Best Partner Relationship Management Software in 2026 — ZINFI](https://www.zinfi.com/blog/partner-relationship-management-software-2026/)
- [Top PRM software for your partner program in 2026 — Partner Fleet](https://www.partnerfleet.io/blog/best-prm-tools-for-your-partner-program)
