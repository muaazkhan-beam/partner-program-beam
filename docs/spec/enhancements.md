# Enhancement & Innovation Spec

What to build on top of Jonas's app, and why. Written 17 September 2026.

Each item is judged on four things:

1. **Precedent** — how other companies do it, and whether theirs is better than ours
2. **Partner view** — would they want it, would they use it, is it easy
3. **Derya** — does it answer what she said partners ask for
4. **Beam edge** — how we go further than the precedent

---

## The number this is judged on

> Partners who close a first deal within **90 days** are **3–4× more likely to stay
> active**. Without structured onboarding, partners take 6–12 months to become
> productive; with it, 60–90 days.

So the portal's job is not "hold content". It is **shorten time to first deal**.

Two supporting findings shape everything below:

- **Ease of doing business ranks above short-term profitability** in why partners pick a
  vendor. Partners want fewer clicks, fewer logins, fewer obstacles between them and
  revenue.
- The standard failure list is exactly Derya's: *deals stall because partners don't have
  the answers · inconsistent messaging confuses buyers · slow ramp-up · partners give up
  and sell a competitor instead.*

---

## Enhancements

Improving what already exists.

### E1 · Use case catalog

Built already, on `main`. Port it to the branch.

**Precedent** — everyone has a solutions catalog; none we reviewed require the
human-approval step or refuse to print an unsourced number. **Partner view** — the first
thing they open; answers "what can I actually sell". **Derya** — directly: *"if we don't
know, they don't know."* **Beam edge** — the build fails if a use case omits its
human-in-the-loop step or claims a number without a source.

*Effort: done. Blocked on: 9–12 more entries, which is writing.*

---

### E2 · One next action, on the home screen

Replace the static three-track home with a single "do this next", derived from what the
partner has actually done — no certification yet, no opportunity yet, request waiting on
them.

**Precedent** — AWS Partner Central Tasks, personalised from registration. The strongest
thing in their portal. **Partner view** — removes the "where do I start" problem that
makes people close the tab. Zero learning curve. **Derya** — answers "how do they access
the platform, what do they do if they have problems". **Beam edge** — ours can name the
*client process* they're stuck on, not just a program step.

*Effort: small. The signals already exist — memberships, requests, certifications.*

---

### E3 · Search across everything

One box, all content kinds, respecting grants and brand mode.

**Precedent** — table stakes everywhere; notable that we don't have it. **Partner view** —
on a client call with a question they can't answer, browsing six tabs loses the room.
**Derya** — *"how are we different?"* is asked live, mid-meeting. **Beam edge** — results
carry the audience label, so a partner sees instantly whether they may forward it.

*Effort: small. All content is one table.*

---

### E4 · Send to client, with engagement telemetry

Turn the `client-forwardable` label into an action: a hosted, partner-branded link — and
show the partner **what their client opened, and for how long**.

**Precedent** — co-branded asset distribution is standard in PRM; the telemetry back to
the partner is not. **Partner view** — the one feature they cannot get from a shared
drive, email, or their own CRM. This is the reason to open the portal on a Tuesday.
**Derya** — supports "what can I forward" and the pitch-deck ask. **Beam edge** — every
view also tells Beam which content actually works, and links stay current when we update
the asset.

*Effort: medium. `forwardable` and `shareUrl` already exist.*

---

### E5 · Certification progress, firm tier, scorecard

Progress is hardcoded at "0 of 4". Persist it, derive a firm tier, and show one page
answering *where do I stand and what moves me up*.

**Precedent** — AWS Partner Scorecard, Cisco Partner Value Index. Lovable's is sharpest:
**Registered earns 0%, Select earns 10%, and the only requirement is certification.**
**Partner view** — people finish courses that unlock something and abandon ones that
don't. **Derya** — certifications were on her list of what partners need. **Beam edge** —
tie the gate to something Beam can actually give: sandbox environments, platform credits,
engineering hours. We can't pay channel bonuses; we can give access.

*Effort: medium.*

---

### E6 · Compliance library

GDPR, ISO 27001, SOC 2 Type II, HIPAA, EU/GCC hosting, on-prem — as documents, not FAQ
entries.

**Precedent** — trust centres are standard for enterprise sales. **Partner view** — asked
for in the first meeting in banking, insurance and healthcare; today they email us.
**Derya** — *"where do conversations get stuck"* and the KSA/Kuwait deployment question.
**Beam edge** — each document carries its audience and revalidation date, so a partner
knows what's current and forwardable.

*Effort: small in code, real in content.*

---

## Innovations

New capability. Ranked by how far ahead of the field it puts us.

### I1 · Demo builder ⭐ *highest value*

One click from a use case to a **partner-branded, clickable demo** they can send a client
or run on a call. Three levels, as the industry does it: clickthrough (instant), guided
(scripted with sample data), sandbox (real environment, approval-gated).

**Precedent** — Guideflow and Demostack exist precisely because *"partners can't run live
demos because they don't have access to a demo environment."* Adobe and Dynamics 365 both
ship partner sandboxes. **Partner view** — Derya's words: *"demos are also a very, very
big factor. Being able to create customized demos very fast themselves."* Nothing else on
this list was described that emphatically. **Derya** — her single strongest ask.
**Beam edge** — everyone else bolts on a third-party demo tool. **Beam is an agent
platform: our demo can be a real agent running on sample data.** That is a category
difference, not a feature difference.

*Effort: large. Start at level one — clickthrough per use case — which is cheap and covers
most calls. Jonas's Agent Mission Control is the foundation for level three.*

---

### I2 · Deal registration, with a visible protection window

Register in under five minutes; approve or reject within 24 hours; status visible without
emailing anyone; expiry with reminders and one-click renewal.

**Precedent** — universal, and the mechanics are settled: 90-day window, ≥75% of the sales
cycle. Dell now auto-triages registrations with AI. **Partner view** — it's what makes a
partner willing to invest in a deal. Without it they hedge. **Derya** — adjacent to "how
do partners make money"; the FAQ already promises protection we don't implement.
**Beam edge** — gate it on certification, per E5. Registering a deal is the moment a
partner most wants something, so it's the best place to require they've earned it.

*Effort: medium. The `requests` table is the foundation.*

> **Policy before code.** The window, the 24-hour SLA and consistent enforcement have to be
> agreed first. *The moment partners see an exception made for someone else, the mechanism
> loses credibility permanently.*

---

### I3 · Partner CLI and MCP — meet them where they work

Let a partner's own Claude or Codex query the catalog, pull a battlecard, or draft a
scoping doc without opening a browser.

**Precedent** — none. The 2026 trend is PRM splitting into *portals partners must log into*
versus *platforms that meet partners where they already work*, and everyone is still
talking about it. **Partner view** — "fewer clicks, fewer logins" is literally the top
finding on what partners want. Beam's partners are AI-literate by definition.
**Derya** — supports the self-serve guide she asked for. **Beam edge** — this inverts the
problem: instead of competing for logins, we become an API. The Partner CLI already exists
as one card of thirteen.

*Effort: medium. Highest differentiation per hour on this list.*

---

### I4 · Ask Beam — answers from approved content only

Natural-language question, answered **only** from staff-published content, carrying each
source's audience label, routing to Beam when the honest answer is `pending` or
`restricted`.

**Precedent** — AWS shipped onboarding agents in June 2026; Cisco has an assistant in PXP;
Dell's portal triages deal registration. **Within a year this is table stakes.**
**Partner view** — the alternative is emailing us and waiting. **Derya** — directly
answers her "questions we can't answer well" list. **Beam edge** — an agent company whose
partner portal has no agent in it is an awkward demo. And strict grounding means it
inherits the claim-review model rather than inventing a new one.

*Effort: medium. Every unanswered question logged becomes the content roadmap.*

---

### I5 · Scope-to-spec generator

Partner pastes discovery notes; gets back a structured process specification — trigger,
systems, exceptions, the human-approval step, success criteria — in the shape Beam's
delivery team needs.

**Precedent** — none found. PRMs stop at content. **Partner view** — turns a messy client
conversation into something they can act on, which is the hardest part of their job.
**Derya** — *"if we are specific on what we can do, they know when to think about us."*
This makes specificity operational. **Beam edge** — the output feeds our own build
process. Every partner scoping call produces a Beam-ready spec instead of a meeting.

*Effort: medium. The use case schema is already this shape.*

---

### I6 · Engagement pricing calculator

Not a licence markup — a model for pricing a delivery engagement: discovery, integration,
evaluation design, run-support.

**Precedent** — PRMs ship CPQ and commission dashboards, but for resale. **Partner view** —
the question behind "how do we make money" is really "what do I charge my client".
**Derya** — general agent pricing now exists and should be published; how a partner makes
money stays a 1:1 conversation. This respects that line: it prices *their* work, not our
margin. **Beam edge** — industry margin has moved from resale to services, and nobody is
helping partners price the services half.

*Effort: small-medium. Mostly a model, not code.*

---

## Scored

Rated against your four perspectives. **H**igh / **M**edium / **L**ow.

| | Precedent gap | Partner pull | Derya | Beam edge | Effort |
| --- | --- | --- | --- | --- | --- |
| **I1** Demo builder | M | **H** | **H** | **H** | L |
| **E1** Use case catalog | M | **H** | **H** | **H** | done |
| **I3** CLI / MCP | **H** | **H** | M | **H** | M |
| **I4** Ask Beam | L | **H** | **H** | M | M |
| **E4** Send to client | M | **H** | M | **H** | M |
| **E2** Next action | L | **H** | M | M | S |
| **I2** Deal registration | L | **H** | M | M | M |
| **E5** Certification tier | L | M | M | M | M |
| **I5** Scope-to-spec | **H** | M | **H** | **H** | M |
| **E3** Search | L | **H** | M | L | S |
| **E6** Compliance library | L | M | M | L | S |
| **I6** Pricing calculator | M | M | M | M | S |

---

## What not to build

| | Why |
| --- | --- |
| MDF, rebates, claims | Needs finance ops and audit we don't have. Past twenty partners. |
| CPQ / quoting | We're not resale-led, and it competes with the 1:1 commercial conversation. |
| Full LMS | The enablement spec rules it out: *practical challenges and starter cases over long courses.* |
| A second CRM | The spec's boundary. Partners keep HubSpot. |
| Five-tier ladder | Every mature program is simplifying. Three tiers maximum. |

---

## Recommended cut

**Now** — E1, E2, E3, E6. Small, and together they fix "partners don't have the answers",
the most-cited reason deals stall.

**Next** — I1 level one, I4, E4. The demo builder is Derya's strongest ask; Ask Beam is
becoming table stakes; Send to client is the habit-former.

**Then** — I3, I2, E5, I5. CLI/MCP is the most defensible position available. Deal
registration needs policy first.

**Later** — I6, and I1 levels two and three, once Agent Mission Control is understood.

---

## Sources

- [5 Things Every Partner Portal Must Prioritize in 2026 — Impartner](https://impartner.com/resources/blog/partner-portal-priorities)
- [Partner Onboarding Guide: 10 Strategies for 2026 — Introw](https://www.introw.io/blog/partner-onboarding) · [AI in Partnerships: 14 Use Cases](https://www.introw.io/blog/ai-in-partnerships)
- [Partner Portal Software Features to Look For: 2026 Buyer's Guide](https://computermarketresearch.com/partner-portal-software-features-to-look-for-the-2026-buyers-guide/)
- [What are Partner Portal Features? — ZINFI](https://www.zinfi.com/glossary/what-are-partner-portal-features/) · [Partner Onboarding & Certification: Best PRM Vendors 2026](https://www.zinfi.com/blog/partner-onboarding-certification-prm-vendors-2026/)
- [Interactive demo tools for partner enablement — Guideflow](https://www.guideflow.com/blog/interactive-demo-tools-partner-enablement) · [Sandbox demos guide](https://www.guideflow.com/blog/sandbox-demos-guide)
- [Demostack for partnerships](https://demostack.com/use-cases/partnerships) · [Adobe partner sandboxes](https://partners.adobe.com/digitalexperience/resources/sandboxes)
- [How do you provide demo environments to partners? — Pedowitz Group](https://www.pedowitzgroup.com/provide-demo-environments-to-partners)
- [Partner Documentation Portal Guide 2026 — Docsie](https://www.docsie.io/blog/articles/partner-documentation-portal-2026/)
- Earlier research in this repo: [programs benchmark](../research/partner-programs-benchmark.md) · [Lovable](../research/lovable-partner-program.md) · [Derya's requirements](../reference/derya-meeting-notes.md)
