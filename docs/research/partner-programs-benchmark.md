# Partner Programs Benchmark

How AWS, Cisco, Oracle, Microsoft, ServiceNow, Salesforce, Dell, HubSpot, OpenAI and
UiPath structure their partner *programs* — and which mechanics are worth adopting for
Beam. Written 2026-09-11.

The earlier documents in [`../research/`](.) looked at partner *portals* — the software.
This one looks at the **program** behind the portal: tiers, tracks, specializations,
incentives, and how partners are recognized. Program design decides what the portal has
to do, so it comes first.

Assessed against what exists today in [`../../apps/partner/`](../../apps/partner/) and
the contract in [`../specs/partner-portal.md`](../specs/partner-portal.md).

---

## 1. What each program actually does

### AWS — journey phases and sequencing

Everything is organized into four APN phases: **Build → Market → Sell → Grow**. Nav bar,
menus and tasks all follow it. The differentiator is not content volume, it is
*sequencing*: a Partner Scorecard tracks progression against path and tier requirements,
and personalized **Tasks** derive next actions from what the partner said at
registration. Since June 2026, onboarding agents walk new partners conversationally from
registration to ready-to-sell.

### Cisco — simplification and specialization bonuses

The **Cisco 360 Partner Program** launched 25 January 2026, co-designed with partners
and explicitly framed around *simplicity*. A **Preferred Partner** designation is earned
against objective, transparent criteria. Incentives reward two different things
separately: a **Cross Sell Bonus** for portfolio breadth and a **Next Generation
Specialization Bonus** for depth. Two new specializations — Secure AI Infrastructure and
Secure Networking — arrived February 2026. A **Partner Value Index** plus the Partner
Experience Platform gives partners visibility into performance and progress, and PXP now
carries an AI assistant.

### Oracle — tracks by business model

OPN's defining idea is that partners pick **tracks matching how they go to market**:
**Build, Sell, Service, License & Hardware**. A partner can hold more than one. Above
that sits a five-level membership ladder — Remarketer, Silver, Gold, Platinum, Diamond.
Benefits include Oracle Expertise validation, Cloud Marketplace listing, and discounted
Oracle University.

### Microsoft — designations and mandatory certification

Three Solutions Partner designation badges across six designation pathways, each with
core plus incremental benefits. Notably for FY26, holding a **certified software
designation is now mandatory** to stay eligible for partner-reported Azure consumed
revenue, prioritized sales engagement and go-to-market benefits — certification as a
gate on commercial benefit, not a nice-to-have. Microsoft is also *pruning*: the
Adoption Change Management specialization was retired and folded into product-aligned
specializations, and Teamwork Deployment was renamed Secure AI Productivity.

### ServiceNow — one ladder, four evaluation axes

Since April 2026 every ServiceNow program uses the same five tiers: **Registered →
Select → Premier → Elite → Global Elite**. The April realignment *merged* the former
Specialist and Platform designations into Select. Partners are evaluated on four axes —
**capacity, competency, customer success, capability** — so tier reflects certified
bench, deployments, CSAT and business contribution together.

### Salesforce — the biggest signal in the set

Salesforce replaced tiers and Navigator distinctions with a model centred on
**competencies, customer outcomes, and Agentforce expertise**. It collapsed **170
Navigator distinctions into 28 competencies**. Each competency can be held at
**Accredited** or **Expert** level, separating demonstrated capability from scaled
delivery experience. Recognition is tied *strictly* to project outcomes, CSAT and
certifications. Competencies display on AgentExchange so customers can find verified
expertise. Coverage of the change described it as *"recasting partners as outcome
architects."*

### Dell — agentic AI inside the program

Dell's 2026 blueprint incentivizes **AI outcomes**, not just transactions, and it
deployed an **agentic AI partner portal** doing automated deal registration and dynamic
pricing. The broader pattern: agentic systems that surface opportunities, flag
disengaged partners before they churn, and recommend next-best actions.

### HubSpot, OpenAI, UiPath — recap from earlier research

HubSpot: four tiers earned on sourced and managed revenue points; portal built on
Mindmatrix; co-brandable collateral and MDF at eligible tiers; Partner Advisory Council
and Partner Pulse Survey as formal feedback channels. OpenAI: Select → Advanced → Elite
gated on capability, PartnerU role-based learning, badges and specializations as the
progression mechanism, Partner Locator, targeting 300k certified consultants. UiPath:
Academy for Partners inside the portal, role-based learning, and a Unified Services
Network of company-level certified delivery partners.

---

## 2. Five patterns that hold across all of them

### 2.1 Everyone is collapsing complexity, not adding to it

Salesforce 170 → 28. ServiceNow merged two designations into one tier. Microsoft retired
a specialization and folded it into others. Cisco launched a program whose stated
headline is simplicity.

**This is the most important finding in the document.** Every mature program is
simplifying because complexity is where partner programs go to die. Beam has a handful
of partners and no program debt. The temptation will be to design the program Beam wants
in three years; the evidence says design the smallest one that works now.

### 2.2 Recognition has moved from revenue to outcomes

Salesforce ties recognition strictly to project outcomes, CSAT and certifications.
ServiceNow evaluates capacity, competency, customer success and capability. OpenAI gates
tiers on capability, co-sell engagement and deployment experience rather than revenue
alone. Only HubSpot still leads with revenue points, and it is the most resale-shaped
program in the set.

Beam's demo already states the modern position: *"Credentials belong to people. Your
firm's tier follows from certified roles, delivered agents, and customer outcomes."*
That sentence would be at home in the Salesforce announcement. **It is right, and it is
already written down — it just is not implemented.**

### 2.3 Margin has moved from resale to services

The clearest finding for Beam's commercial model. Partner profitability is shifting away
from resale toward **services that operationalize AI** — data preparation and
integration, training customer teams, optimizing for real-world use cases, ongoing
support. Outcome-based and consumption pricing is actively eroding traditional
implementation and resale margin. MSPs are moving to pricing tied to guaranteed
outcomes.

For Beam this reframes the pricing question that is still `pending` in the FAQ. The
partner's money is unlikely to come from a markup on Beam licences; it comes from
discovery, process design, integration, evaluation design, exception handling and
run-support around the agent. **The portal should be teaching partners how to price a
delivery engagement, not just publishing a licence markup.**

### 2.4 The portal itself is becoming agentic

AWS onboarding agents. Cisco's AI assistant in PXP. Dell's agentic portal doing deal
registration and dynamic pricing. Within a year this stops being differentiation and
becomes table stakes — which *raises* the bar for Beam specifically, because a partner
portal for an agentic-automation company that has no agent in it is an awkward thing to
demo.

### 2.5 Programs are two-sided

Salesforce competencies show on AgentExchange. Oracle lists partners on Cloud
Marketplace. OpenAI has a Partner Locator. AWS has partner finder. The portal is a
**lead source**, not just a cost centre — which is what makes partners maintain their
profile without being chased.

---

## 3. What is worth adopting for Beam

Ranked. Each assessed against the current app.

### 3.1 Tracks by business model — adopt (Oracle) ⭐

Oracle's Build / Sell / Service split is the cleanest answer to a problem Beam already
has: BPOs, SIs, boutique AI shops and advisory firms need different things, and the
current app has one role, `partner_seller`.

Proposed Beam tracks, mapped to the archetypes in
[`deep-dive.md`](deep-dive.md):

| Track | Archetype | What they need first |
| --- | --- | --- |
| **Sell** | Advisory, SI front-end | Use cases, battlecards, FAQ, diagnostic kit |
| **Build** | Boutique AI shop, SI delivery | Partner CLI, Platform access, evaluation guidance |
| **Operate** | BPO, managed services | Cost-per-transaction economics, run-support model, SLAs |

Cheap to implement: a `track` field on the membership or workspace that reorders home
and filters tools. It is not a permission model and should not become one.

### 3.2 A small competency set — adopt (Salesforce), but start at five

Salesforce's 28 competencies with Accredited / Expert levels is the right *shape*.
Beam's version should start far smaller — competencies where Beam can actually assess
quality:

Finance operations · Customer service operations · Healthcare & regulated ·
Agent engineering · Process discovery

Two levels, following Salesforce: **Accredited** (demonstrated once) and **Expert**
(delivered at scale). Resist adding a sixth until the first five are earned by someone.

### 3.3 Outcome-based tier — adopt, and it is already half-written

Beam's stated position is already the modern one. What is missing is the mechanism.
ServiceNow's four axes adapt directly:

| Axis | Beam signal |
| --- | --- |
| Capacity | Certified people on the bench |
| Competency | Competencies held, at which level |
| Customer success | Agents in production with measured results |
| Capability | Verticals and process types delivered |

The [Phase 1 scope](../scope/phase-1-scope.md) tier table stands, with one change from
this research: make **delivered outcomes** — not headcount — the gate on the top tier,
as Salesforce does.

### 3.4 Certification as a gate on commercial benefit — adopt (Microsoft)

Microsoft's FY26 change is the sharpest lever in the entire benchmark: a certified
designation is now *mandatory* for consumed-revenue eligibility, prioritized sales
engagement and GTM benefits. Certification stops being training and becomes the key to
the commercial relationship.

Beam's equivalent: **deal registration, co-sell support and referral flow require at
least one certified person.** That single rule does more for certification completion
than any amount of gamification, and it costs nothing to introduce while the program is
small.

### 3.5 Platform credits as the incentive — adopt in Beam's own currency

Microsoft gives bulk Azure credits and launch benefits; Cisco pays bonuses. Beam is not
in a position to pay channel bonuses, but it has something partners want more at this
stage: **sandbox environments, platform credits, and Beam engineering time.** Those are
the incentives to attach to tiers.

### 3.6 A partner scorecard — adopt (AWS / Cisco)

AWS's Partner Scorecard and Cisco's Partner Value Index both answer one question in one
place: *where do I stand, and what moves me up?* Without it, tiers are invisible and
therefore inert. This is a single page over data the tier model already produces.

### 3.7 Partner directory — adopt later, design for now

The strongest retention mechanism available: partners maintain their profile because it
wins them work. The workspace record already holds display name, brand mode and
hostname. Add the profile fields — competencies, verticals, regions, delivered agents —
when the tier model lands, and turn the directory on once there are enough partners for
it to be worth browsing.

---

## 4. What to deliberately not adopt

| Mechanic | Why not for Beam |
| --- | --- |
| **Five-tier ladders** (ServiceNow, Oracle) | Beam has a handful of partners. Five tiers with a handful of partners is theatre, and ServiceNow itself just merged two rungs. Three tiers, maximum. |
| **MDF and co-marketing funds** (HubSpot, Microsoft) | Requires finance operations, claims handling and audit that do not exist yet. Revisit past twenty partners. |
| **Stacked incentive bonuses** (Cisco) | Cross-sell and specialization bonuses need a channel org to administer and a portfolio broad enough to cross-sell. Beam has one product. |
| **Revenue-points tiering** (HubSpot) | Optimizes for resale volume. Beam's partner value is delivery quality; points would reward the wrong thing and are hard to reverse once published. |
| **Marketplace resale mechanics** (Oracle, AWS) | Beam is already on AWS Marketplace; a *partner-facing* resale motion is a different and much larger commitment. |
| **A full LMS/academy** (UiPath) | The enablement MVP spec explicitly rules this out: *"prefer practical challenges, starter cases, and templates over long courses."* |

---

## 5. Features these programs have that Beam's app does not

Checked against the Convex schema and catalog in `apps/partner/`.

| Feature | Status in app | Source | Worth adding |
| --- | --- | --- | --- |
| Partner tier / scorecard | No tier field anywhere | AWS, Cisco, ServiceNow | **Yes** — the missing half of the certification model |
| Competencies / specializations | None | Salesforce, Cisco, OpenAI | **Yes** — start at five |
| Tracks by business model | Single `partner_seller` role | Oracle | **Yes** — cheapest high-impact change |
| Certification progress | Static TS, no per-user state | All | **Yes** — cannot gate benefits on an unrecorded credential |
| Deal registration | Promised in FAQ, not built | All | **Yes** — Phase 1.5 |
| Partner directory | None | Salesforce, OpenAI, Oracle | Later; design the profile now |
| Portal AI assistant | None | AWS, Cisco, Dell | **Yes** — Phase 1.5 knowledge agent |
| Partner feedback channel | None | HubSpot | **Yes** — cheapest thing on this list |
| Co-branded asset generation | `allowedBrandModes` exists, no generation | HubSpot, Microsoft | Phase 2 |
| MDF / incentives | None | HubSpot, Cisco, Microsoft | No |

Two notes on that table. **`allowedBrandModes` already exists on every content item** —
the brand-mode groundwork for Phase 2 co-branded generation is done, which is further
along than the Phase 1 scope assumed. And **a partner feedback channel is the cheapest
item here**: HubSpot runs a Partner Advisory Council and a Partner Pulse Survey, and
Beam has few enough partners to simply ask them.

---

## 6. What this changes in the Phase 1 scope

The [Phase 1 scope](../scope/phase-1-scope.md) was written before we had the source or
the specs. Against this research and the real codebase:

**Still stands.** Use case catalog, compliance library, opportunity spine, Tasks-style
progress, certification firm-benefit tiers.

**Now obsolete.** Unified tagging (§3.4) — already implemented in `contentItems`, and
more thoroughly than proposed, with claim-review state, reviewer and revalidation dates.

**Newly added by this research.** Tracks by business model; a five-competency set;
certification as a gate on commercial benefit; a partner scorecard page; a partner
feedback channel.

**Reframed.** The pricing question. The answer partners need is not only "what is my
markup" but "how do I price a delivery engagement" — because that is where the industry
says the margin now lives.

---

## Sources

- [Cisco 360 Partner Program](https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2025/m11/cisco-360-partner-program-empowers-partners-to-drive-profitability-in-an-ai-era.html) · [investor release](https://investor.cisco.com/news/news-details/2025/Cisco-360-Partner-Program-Empowers-Partners-to-Drive-Profitability-in-an-AI-Era/default.aspx) · [partner designations FAQ](https://www.cisco.com/c/dam/en_us/partners/cisco-partner-designations-faq.pdf)
- [Oracle PartnerNetwork FAQ](https://www.oracle.com/partnernetwork/program/faq/) · [Cloud Service Track](https://www.oracle.com/partnernetwork/program/service/) · [OPN definition, TechTarget](https://www.techtarget.com/searchitchannel/definition/Oracle-PartnerNetwork)
- [Introduction to the Solutions Partner Program — Microsoft Learn](https://learn.microsoft.com/en-us/partner-center/membership/introduction-to-pcs) · [Benefits FAQ](https://learn.microsoft.com/en-us/partner-center/benefits/benefits-faq-new) · [2026 designation and specialization changes](https://thepartnermasters.com/blog/microsoft-partner-program-changes-2026)
- [ServiceNow Partner Program](https://www.servicenow.com/partners.html) · [ServiceNow partner tiers explained](https://www.partnerintelligence.now/guides/servicenow-partner-tiers-explained)
- [The Outcome Advantage: the new Salesforce Partner Program](https://www.salesforce.com/news/stories/rewarding-value-through-new-salesforce-partner-program/) · [Salesforce recasts partners as outcome architects — Futurum](https://futurumgroup.com/insights/salesforce-overhauls-consulting-track-recasting-partners-as-outcome-architects/) · [FY2027 changes — Noltic](https://noltic.com/stories/salesforce-partner-program-updates)
- [Dell's new partner program blueprint for the AI era — Futurum](https://futurumgroup.com/insights/dells-new-partner-program-blueprint-for-the-ai-era/)
- [The State of Channel Partnerships 2026: how AI is reshaping partner-led growth — TSIA](https://www.tsia.com/blog/the-state-of-channel-partnerships-2026-ai)
- [Why reselling AI isn't where MSP margins are made — ChannelPro](https://www.itpro.com/technology/artificial-intelligence/why-reselling-ai-isnt-where-msp-margins-are-made)
- [2026 partner ecosystem transformation — Futurum](https://futurumgroup.com/insights/partners-weary-on-saas-as-infrastructure-surges-again/)
- [AWS Partner Central documentation](https://docs.aws.amazon.com/partner-central/) · [onboarding agents, June 2026](https://aws.amazon.com/about-aws/whats-new/2026/06/aws-partner-central/)
- [HubSpot Solutions Partner Program benefits 2026](https://www.hubspot.com/solutions-partners-tiers-and-benefits-2026)
- [Introducing the OpenAI Partner Network](https://openai.com/index/introducing-openai-partner-network/)
- [Grow as a UiPath Partner](https://www.uipath.com/partners/grow)
