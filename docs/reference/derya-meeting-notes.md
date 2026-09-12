# Derya Firat — partner program requirements

Meeting: **Beam Partner Prog**, 11 September 2026, 12:03–12:23 UTC (19 min).
Present: Derya Firat, Muaaz Khan, Asad Raza.
Recording: <https://fathom.video/share/V-gR1oW6zbPkbEFLvT7ZyuzYzmpKwwvP>

> **Note on the transcript.** Fathom's speaker attribution is scrambled in this recording —
> many of Derya's answers are labelled as Muaaz. The notes below assign statements by
> content and context, not by the transcript's labels.

> **Context:** Derya saw the dashboard for the first time in this call. Her input is on the
> *program* — what partners need and ask for — not on the build.

---

## 1. Live use cases — *the answer we needed*

This is the seed list for the use case catalog. Derya's words: these are **up and running**,
not pitched.

| Department | Use cases |
| --- | --- |
| **Finance** | Invoice processing · expense management · debt collection · reporting |
| **Procurement** | Sales order processing · supplier communication · supplier FAQs |
| **HR** | CV screening · voice interviews |
| **Customer support** | Support tickets (hospitality) |

> *"I think these are up and running. We definitely have more that we pitch within Finance
> and HR. Laurin and Kalina know that more."*

**Action:** contact **Laurin** and **Kalina** for additional finance and HR use cases.

## 2. Winning industries

**Financial services · BPO/RPO · automotive manufacturing.**

Automotive manufacturing is new — it was not in any prior research, and our
[Phase 1 scope](../scope/phase-1-scope.md) assumed finance and BPO/customer service. Finance
and BPO/RPO are confirmed; **automotive should be considered for the third slot or replace
an assumption.**

## 3. What partners actually need

Derya's own four-part answer, unprompted:

1. **What is Beam good at?** USP, what we offer as services.
2. **The platform.** How to build agents, how they work, **what the limitations are**,
   features.
3. **Build agents and demos themselves.** *"Demos are also a very, very big factor. Being
   able to create customized demos very fast themselves."*
4. **Sales enablement.** Who do we target, who is the ICP, how do we pitch, what are the
   sales decks — **one general deck on the technology plus vertical-specific ones.**

## 4. What we cannot answer well today

Straight from the call, when asked where partners get stuck:

- **How are we different?**
- **When does Beam get in?** — when should a partner think of Beam for a challenge
- **How do you build agents?** — needs a self-serve guide
- **How do they access the platform?**
- **What do they do if they have problems?**
- **How to pitch, and who to sell to**

The underlying diagnosis, and the sharpest line in the call:

> *"The problem is, if we don't know, they don't know. Consultancies have multiple projects
> which are all different… But if we are specific on what we can do, they know what the three
> things that Beam stands for are, and they think about us when they have a certain
> challenge. So far that has been all relationship-based."*

**This is the whole case for the use case catalog**, stated by the business rather than
inferred from research. Partner conversations are relationship-based because Beam has never
given partners a specific, repeatable list of what it does.

## 5. Access policy — **decision made**

> *"It depends who we approve as partners. If they just sign up and access the platform of
> this partner portal, I would not do that. We could probably just have an access for
> everyone if people are curious. But all the partners who are approved by our business that
> we want to work with them, they should get access to everything."*

So:

- **No open signup.** Approval-gated, which matches the existing invite-only implementation.
- **Approved partners see everything.** No tier-gating of content within the portal.
- **Possibly a small open/curious tier later** — floated, not decided.

**This resolves open decision #6.** Content tiering by partner tier is *not* wanted. Tiers
should gate *program benefits* — deal registration, co-sell, support — not content.

## 6. Pricing — **materially changed**

> *"We haven't had a pricing until a few days ago. We should definitely communicate the
> general pricing… If they want to resell us, of course they get a discount for it. But when
> it comes to how they make money with us, that's a one-on-one discussion."*

Three parts, and the split matters:

| Item | Status | Goes in the portal? |
| --- | --- | --- |
| **General agent pricing** | **Now exists** (as of ~8 Sep) | **Yes** — should be communicated |
| **Reseller discount** | Exists in principle | Yes, as guidance |
| **Partner revenue model / how partners make money** | Per-partner | **No** — explicitly a 1:1 conversation |

**This substantially unblocks the pricing question.** The FAQ's `pricing-and-packaging`
entry can move off `pending` for general agent pricing. The `how-we-make-money` entry stays
routed to Beam, which is what the portal already does — and that is now confirmed as
deliberate policy rather than a gap.

## 7. Partner list

A Google Sheet exists, shared with Muaaz: columns are **partner · GTM status · region ·
industry · type of partnership**. That is the authoritative list — not the spec, catalog or
skill, which all disagree with each other.

## 8. Not answered: a citable customer outcome

**The top ask going into this meeting was a named customer with a real number. It did not
come up.** No customer names, no metrics, no approval path for using them.

This remains the highest open risk on the use case catalog. Without it, entries carry
process descriptions but no measured result, and partners discount unevidenced claims.

**Next:** Laurin and Kalina, who own the finance and HR use cases, are the likely source.

---

## Action items from the call

All assigned to Muaaz:

1. Email **Laurin and Kalina** for additional finance and HR use cases
2. Draft the **partner portal access policy** — approval-gated vs. public — then implement
3. Add **general agent pricing** to the portal, then reseller discount guidance
4. Draft **partner FAQ / pitch guide** — differentiation, engagement, ICP, pitch decks
5. Draft **self-serve agent-building guide**
6. Draft **portal access / onboarding guide**
7. Draft **support / troubleshooting guide**

Derya's standing offer: *"If you have these kinds of questions, just send me a message and
I'll answer, because then I can answer more specific."* Slack is faster than another meeting.

---

## What this changes

**Confirmed.** Finance and BPO/RPO as lead verticals. Invite-only access. Content not tiered.
The use case catalog as the central Phase 1 deliverable.

**New.**

- **Automotive manufacturing** as a third winning industry.
- **Custom demo creation** is a *"very, very big factor"* for partners and appears nowhere in
  our Phase 1 scope. Related to the Phase 2 agent-builder, but Derya is describing something
  partners need now.
- **Platform limitations** must be documented — partners ask what Beam *cannot* do, and
  saying so builds more trust than another feature list.
- **ICP and pitch decks** — one general, plus vertical-specific — are a content gap we had
  not identified.
- **General agent pricing now exists** and should be published.

**Still open.** A citable customer outcome. Who writes the content. The certification ladder.
