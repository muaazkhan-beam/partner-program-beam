# Coverage Analysis

Phase C. Checks the proposed work in [`enhancements.md`](enhancements.md) against the three
sources of evidence — and finds what none of it covers.

Written 17 September 2026.

Read the other direction from the spec: that document starts from ideas and asks whether
they are justified. This one starts from the evidence and asks whether anything is
unanswered.

**Four gaps came out of it. All four are content, not code.**

---

## 1. Derya's feedback, line by line

### What she said partners need

| Her ask | Covered by | Status |
| --- | --- | --- |
| What is Beam good at — USP and services | Materials, FAQ (exist) | ⚠️ Thin — no single answer |
| The platform: how agents are built, how they work | Tools, Agent Mission Control | ✅ |
| **What the limitations are** | — | ❌ **Nothing** |
| Build demos themselves, fast | I1 demo builder | ✅ Strongest item |
| ICP — who do we target | — | ❌ **Nothing** |
| How to pitch | Battlecards, call prep (exist) | ⚠️ Partial |
| **Sales decks — one general, plus vertical** | — | ❌ **Nothing** |

### What she said we cannot answer well

| Question | Covered by | Status |
| --- | --- | --- |
| How are we different? | E3 search, I4 Ask Beam, battlecards | ✅ |
| **When does Beam get in?** | — | ❌ Needs an ICP |
| **How do you build agents?** — self-serve guide | — | ❌ **Nothing** |
| How do they access the platform? | E2 next action | ⚠️ Partial |
| What do they do if they have problems? | Requests, I4 | ✅ |
| How to pitch, who to sell to | — | ❌ Needs ICP and decks |

### The four gaps

Nothing in the twelve proposed items produces any of these:

1. **An ICP** — who to target, and when Beam is the right answer. Derya named this twice,
   and it is the root of three unanswered questions.
2. **Pitch decks** — one general on the technology, plus vertical versions.
3. **A platform limitations document** — what Beam cannot do. Partners ask; saying it
   plainly builds more trust than another feature list.
4. **A self-serve agent-building guide** — the path from access to a working agent.

All four are writing, not engineering. All four are already Fathom action items assigned to
Muaaz from the 11 September call. **They are the cheapest high-value work available and
nobody is doing them.**

> An ICP is the highest-leverage of the four: it answers *when does Beam get in*, *who do I
> sell to* and *how do I pitch* at once, and it is the missing half of the use case catalog.
> The catalog says what Beam does; an ICP says who to say it to.

---

## 2. Against other companies' portals

What they ship, what we have.

| Feature | Who has it | Beam today | Plan |
| --- | --- | --- | --- |
| Content library, governed | All | ✅ Best in class — claim review, audience, brand mode | — |
| Multi-tenant workspaces | Rare at this maturity | ✅ Strong | — |
| Certification programme | OpenAI, UiPath, HubSpot, Lovable | ⚠️ Defined, no progress | E5 |
| Tier with real benefits | All | ❌ | E5 |
| Scorecard — where do I stand | AWS, Cisco | ❌ | E5 |
| Next best action | AWS, Salesforce | ❌ | E2 |
| Search | All | ❌ | E3 |
| Deal registration | All | ❌ Promised in FAQ, not built | I2 |
| Co-branded assets | HubSpot, Microsoft, ZINFI | ⚠️ Brand modes exist, no generation | E4 |
| **Demo environments** | Adobe, Dynamics, Demostack, Guideflow | ❌ | I1 |
| Partner directory | Salesforce, OpenAI, Oracle, Lovable | ❌ | Later |
| AI assistant in portal | AWS, Cisco, Dell | ❌ | I4 |
| Trust / compliance centre | Enterprise vendors | ⚠️ Scattered in FAQ | E6 |
| **Partner advisory council, pulse survey** | HubSpot | ❌ | ❌ **Not planned** |
| Marketplace listing | AWS, Oracle | n/a — Beam is on AWS Marketplace already | — |
| MDF, rebates, CPQ | HubSpot, Cisco, Microsoft, ZINFI | ❌ | Deliberately excluded |
| **CLI / API access** | **Nobody** | ⚠️ CLI exists, buried | I3 |

### Reading it

**Where we are already better.** Content governance is genuinely ahead — claim-review state,
audience, forwardability, brand mode and revalidation on every item. No portal we reviewed
governs content that carefully. Multi-tenancy is unusually solid for a v1.

**Where we are behind, and it is routine.** Search, next action, deal registration,
scorecard. None are hard. All are in the plan. This is the "table stakes" column and it is
mostly small work.

**Where we can lead.** Two: the **CLI/MCP**, which nobody has, and the **demo builder**,
where everyone else bolts on a tool that fakes the product and Beam can run a real agent.

**One gap with no plan: a partner feedback channel.** HubSpot runs a Partner Advisory
Council and a Partner Pulse Survey. Beam has four partners — small enough to simply ask
them, and currently nobody does. It is the cheapest item in this entire document.

---

## 3. Against what partners say they want

| What partners want | Evidence | Beam's answer |
| --- | --- | --- |
| Ease of doing business over margin | Ranks above short-term profitability in vendor choice | E2, E3, I3 — all reduce friction |
| Fewer clicks, fewer logins | Top-cited friction | I3 removes the login entirely |
| Answers during a live call | "Deals stall because partners don't have the answers" | E3, I4 |
| Consistent messaging | "Inconsistent messaging confuses buyers" | Claim review already does this well |
| Fast ramp | 6–12 months unstructured vs 60–90 days structured | E2, E5, and the gaps in §1 |
| Run their own demos | The reason demo-tool vendors exist | I1 |
| Know where they stand | Scorecards are standard | E5 |
| Protected deals | Universal | I2 |
| Personalised, not generic | Generic enablement is the top cause of low pipeline | E2, and tracks |

**Nothing partners are documented as wanting is unaddressed** — provided the four content
gaps in §1 get written.

---

## 4. What this changes

The twelve items in the spec stand. Three additions:

**Add to the "Now" wave** — the four content pieces from §1: ICP, pitch decks, platform
limitations, self-serve build guide. They need an owner who is not Muaaz, which is the
standing ask.

**Add a partner feedback channel.** Four partners and no structured way to ask them what is
missing. A quarterly call and a short survey. Costs nothing.

**Reorder slightly.** The ICP should come before the rest of the "Now" wave. It answers
three of Derya's six unanswered questions by itself, and the pitch decks and the use case
catalog both depend on it.

---

## Sources

[Derya's requirements](../reference/derya-meeting-notes.md) ·
[programs benchmark](../research/partner-programs-benchmark.md) ·
[Lovable](../research/lovable-partner-program.md) ·
[portal research](../research/partner-portal-research.md) ·
[enhancement spec](enhancements.md)
