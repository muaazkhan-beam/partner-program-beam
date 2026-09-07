# Deep Dive — Product Grounding, Partner Archetypes, and Concrete Designs

Third research document, after [partner-portal-research.md](./partner-portal-research.md) and
[ideas-and-recommendations.md](./ideas-and-recommendations.md). Written 2026-09-07.

The first two documents reasoned from the demo and from competing portals. This one grounds
the design in **what Beam actually sells**, **who the partners actually are**, and turns the
abstract recommendations into concrete schemas and numbers.

---

## 1. What partners are actually selling

Everything in the portal has to be true about the product. Sourced from beam.ai.

**The product.** Beam is an agentic process automation platform — "Agent OS", a no-code
environment that turns standard operating procedures into production agents. Agents are
long-running and multi-agent: one extracts data from a document, another decides on it, a
third writes into a system of record. They are self-learning, adapting to edge cases and
exceptions over time, with human-in-the-loop approval on critical steps.

**Verticals.** Finance, HR & recruitment, customer service, healthcare, insurance, banking,
BPO, property management.

**Integrations.** 1000+ pre-built connectors — SAP, Salesforce, DATEV, Gmail, Airtable, Slack
— plus custom connectors for legacy systems, and RPA system integration.

**Deployment.** Cloud, on-premises, or hybrid. EU-hosted with GCC region support.

**Compliance posture.** GDPR, ISO 27001, SOC 2 Type II, HIPAA. Also listed on AWS Marketplace,
and present in the IBM PartnerPlus directory.

**Delivery timeline.** White-glove onboarding, pilot to production in 4 weeks.

**Numbers Beam publishes.** 98% accuracy improving with each interaction · 70% cost reduction ·
5× volume on existing headcount · 56% faster response times · 63% lower outsourcing costs ·
95% fewer errors · sub-2-minute data processing.

### What this changes about the portal

- **The compliance content is a real asset, not a chore.** GDPR + ISO 27001 + SOC 2 Type II +
  HIPAA + EU/GCC hosting + on-prem option is a genuinely strong posture for regulated
  verticals. Partners selling into banking, insurance and healthcare will be asked all of it
  in the first meeting. This deserves a proper document library, not FAQ entries.
- **"4 weeks pilot to production" is the sharpest sales asset Beam has** and should anchor the
  whole partner narrative — it is what makes a partner willing to stake a client relationship.
- **The published metrics need provenance.** A partner who repeats "70% cost reduction" to a
  client will be asked "based on what?" Every number in the portal should carry its source and
  its conditions, or partners will quietly stop using them.

---

## 2. Partner archetypes

The single most-cited cause of low portal engagement is serving identical content to everyone
regardless of specialization and lifecycle stage. Beam's partners are not one audience. The
demo currently assumes one role — `partner seller`.

| Archetype | What they sell today | What they need from the portal | Risk |
| --- | --- | --- | --- |
| **BPO** | Outsourced process capacity, priced per seat or per transaction | Margin model, cost-per-transaction economics, "scale without hiring" narrative, security for client data | Beam looks like a threat to their headcount-based revenue model |
| **SI / consultancy** | Transformation programmes | Scoping methodology, delivery playbooks, certification for billable staff, architecture evidence | Wants to own delivery; needs to know where Beam stops |
| **Boutique AI/automation shop** | Agent builds, often already on other platforms | Technical depth, builder certification, the CLI, competitive comparison vs building direct on LLMs | Smallest, fastest, most likely to actually use the CLI |
| **Advisory / process consultancy** | Assessment and process design, not implementation | Discovery and process-capture kits, use case catalog, ROI models | Sells the diagnosis, needs a delivery partner for the build |
| **Tech / ISV partner** | Their own product | Embedding and API docs, joint-motion one-pager | Different motion entirely — arguably out of scope for v1 |

**BPO deserves first-class treatment.** Beam already has a dedicated BPO landing page and the
economics are the most compelling of any segment — "scale to 1000 agents without hiring 1000
people," 63% lower outsourcing costs. It is also the archetype where the partner's own
business model is most disrupted, so the portal has the most persuading to do.

**Recommendation.** Do not build five separate portals. Add a single `archetype` field on the
workspace, set at onboarding, and use it to order and filter — surfacing the BPO margin model
first for a BPO, the builder track first for a boutique. Same content, different sequence.
Cheap to build, and directly targets the top failure cause.

---

## 3. The use case catalog — concrete schema

The largest content gap and the seed data for the Phase 2 agent builder. Structured records,
never prose.

```ts
interface UseCase {
  slug: string
  title: string                    // "Invoice exception handling"
  vertical: string                 // finance | healthcare | insurance | bpo | ...
  department: string               // finance | hr | customer-service | ops
  systems: string[]                // ["SAP", "DATEV", "Outlook"]
  trigger: string                  // what starts the process
  before: string                   // how it runs today, with volume and headcount
  after: string                    // how it runs with the agent
  humanInLoop: string              // which step keeps an approver — never omit this
  outcome?: {                      // absent until citable
    metric: string                 // "processing time"
    value: string                  // "from 4 days to under 2 minutes"
    source: string                 // named deployment or "Beam published benchmark"
  }
  timeToProduction: string         // "4 weeks"
  complexity: 'starter' | 'standard' | 'complex'
  audience: Audience
  status: Status
}
```

Three fields carry disproportionate weight:

- **`humanInLoop`** — the first objection in every regulated vertical is "what if it gets it
  wrong?" Making the approval step a required field means no use case can be published without
  answering it.
- **`outcome.source`** — enforces provenance on every number (see §1).
- **`complexity`** — lets a new partner filter to `starter` and find a beachhead they can
  actually win, rather than being shown the most impressive use case and losing the deal.

### Worked example

> **Invoice exception handling** · finance · finance dept · SAP, DATEV, Outlook
> **Trigger:** invoice fails three-way match
> **Before:** ~2,000/month routed to a shared mailbox, 3 FTE, average 4-day resolution
> **After:** agent reads the invoice, queries SAP for PO and receipt, classifies the exception,
> drafts the correction, routes to an approver
> **Human in loop:** approver signs off any correction above threshold
> **Complexity:** starter · **Time to production:** 4 weeks
> **Outcome:** *pending — needs a citable deployment*

**Recommendation:** 12–15 use cases, with real depth in **finance** and **BPO/customer
service** rather than one entry in each of ten verticals. Depth is what makes a partner
believe; breadth just looks like a menu.

---

## 4. Deal registration — concrete design

The FAQ already promises "deal registration and opportunity protection" but nothing implements
it. Channel research is unusually consistent on the mechanics, so this can be specified now:

- **Protection window: 90 days.** The rule of thumb is at least 75% of the average sales cycle.
  Beam's *delivery* is 4 weeks, but the enterprise process-automation *sales* cycle is longer;
  90 days is the industry norm and the safe starting point. Revisit once there is real cycle data.
- **Registration must take under 5 minutes.** The demo's Requests form is already close.
- **Approve or reject within 24 hours.** Delays are the most reliable way to kill partner
  confidence in the whole mechanism.
- **Status visible in real time.** A partner should never email to ask where a registration stands.
- **Expiry with reminders at 30, 14 and 7 days, plus one-click renewal** — keeps live deals
  protected without letting stale ones clog the pipeline.
- **Enforce it consistently.** The moment partners see exceptions being made for someone else,
  the system loses credibility permanently.
- **Require verified customer details and a minimum deal size** so registrations are real.

The last two are policy commitments, not features. They should be written into the program
document before the first registration is accepted, because they cannot be retrofitted after a
partner feels cheated.

---

## 5. Certification — attaching firm-level consequence

The demo's four levels are well-designed but state no benefit to the partner *firm*. Every
comparable program ties credentials to tier and tier to benefits. Proposed mapping:

| Certified roles held | Firm tier | What the firm gets |
| --- | --- | --- |
| 1× Foundations | **Registered** | Portal access, use case catalog, forwardable materials |
| 1× Discovery Lead | **Qualified** | Deal registration, joint call support, listed in partner directory |
| 1× Builder + 1 deployed agent | **Certified** | Sandbox environments, co-branded materials, priority technical support |
| 1× Solution Architect + 2 deployed agents with measured results | **Advanced** | Co-sell motion, referral flow *from* Beam, input into roadmap |

Two design notes carried from the benchmarks:

- **Role-based paths, not one ladder.** OpenAI's PartnerU and UiPath Academy both split
  enablement by role — sell, build, deliver. A partner seller should not have to pass the
  Builder practical to be considered activated. The demo's four levels map cleanly:
  Foundations is everyone, Discovery Lead is the sell/scope path, Builder is the build path,
  Solution Architect is the architect path.
- **Referral flow from Beam is the strongest incentive available** and costs nothing to
  promise at the top tier. It is what turns certification from a cost into an investment.

The demo's stated outcome — *"activation, not a badge,"* 90 days to first client engagement —
should stay as the program's headline metric.

---

## 6. The knowledge agent — grounding design

Bringing a narrow version forward from Phase 2. The design constraint that makes it safe:

**It answers only from staff-published content, and it inherits that content's labels.**

```
question
  → retrieve over { FAQ answers, materials, use cases } where status = 'published'
  → answer, with citations
  → carry the audience label of every source into the response
  → if the best-matching source is `pending` or `restricted`, do not answer —
    say so and offer the route into Beam
```

Three rules worth writing down before anyone builds it:

1. **Never synthesize a commercial answer.** Pricing, margin, exclusivity and independence
   route to Beam. This is already the demo's stated policy for its FAQ; the agent must not
   quietly become a loophole around it.
2. **Always show the audience label.** If the agent's answer is drawn from partner-internal
   material, the partner needs to know they cannot forward it verbatim to a client.
3. **Log every unanswered question.** The escalation log is the roadmap for what content to
   write next — the single most valuable by-product of the feature.

AWS shipped exactly this pattern in June 2026, using agents to walk partners from registration
to ready-to-sell. It is a proven shape, not a bet.

---

## 7. Measurement

Decide these before building, because the portal's own instrumentation is the only defence
against the 60% failure statistic.

| Question | Metric | Target |
| --- | --- | --- |
| Are partners activating? | Days from onboarding to first opportunity created | < 30 |
| Is enablement working? | Days to first Foundations pass | < 14 |
| Is content reaching clients? | % of forwardable assets actually forwarded | tracked from day one |
| Where does the portal fail? | FAQ escalation rate, by topic | falling month on month |
| Does it produce revenue? | Partner-sourced pipeline | the only metric that matters |

**Report on partner-sourced pipeline, never on logins.** Logins are the metric that lets a
failing portal look healthy — and the CLI/MCP strategy in
[ideas-and-recommendations.md](./ideas-and-recommendations.md) deliberately *reduces* logins
while increasing usage.

---

## 8. What is still unknown

Ranked by how much the design depends on it.

1. **Is there a deployment with a measured outcome Beam may cite by name?** The use case
   catalog's credibility rests on this. Without it, every entry falls back to published
   benchmark numbers, which partners will discount.
2. **What is the partner margin?** Still `pending` in the FAQ. Blocks the Commercials surface
   entirely, and it is the first question every archetype asks.
3. **Which archetype is the priority?** BPO and SI need materially different first screens.
4. **Which two verticals get depth?** Finance and BPO/customer service are the obvious
   candidates from Beam's own positioning, but this should be confirmed against actual pipeline.
5. **Is the demo's source available?** Determines whether three weeks is extension or rebuild.
6. **Who publishes and owns content after launch?** A portal with no editorial owner is stale
   within a quarter — and staleness is the second-most-cited cause of partner disengagement.

---

## Sources

- [Beam AI — platform](https://beam.ai/platform) · [AI agents](https://beam.ai/ai-agents) ·
  [agentic workflows](https://beam.ai/agentic-workflows) · [BPO](https://beam.ai/lp/bpo) ·
  [AWS Marketplace listing](https://beam.ai/agentic-insights/beam-ai-is-now-live-on-the-aws-marketplace)
- [Beam AI in the IBM PartnerPlus directory](https://www.ibm.com/partnerplus/directory/company/9526)
- [Deal Registration: A Founder's Guide to the Policy — PartnerStandard](https://pro.partnerstandard.com/guides/deal-registration)
- [Deal registration best practices — Kademi](https://www.kademi.co/blogs/resources/deal-registration-best-practices/)
- [Deal Registration: The Complete Guide for Channel Sales Teams — Magentrix](https://www.magentrix.com/blog/unified-deal-registration-improves-prm-a-channel-sales-must-have)
- [Channel Partner Programs: Operator's Guide — PartnerStandard](https://pro.partnerstandard.com/guides/channel-partner-programs)
- [AWS Partner Central agents guide new partners from registration to ready-to-sell](https://aws.amazon.com/about-aws/whats-new/2026/06/aws-partner-central/)
- [Grow as a UiPath Partner](https://www.uipath.com/partners/grow)
- [HubSpot Solutions Partner Program Benefits 2026](https://www.hubspot.com/solutions-partners-tiers-and-benefits-2026)
