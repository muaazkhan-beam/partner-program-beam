# Lovable's Partner Program

Sent by Jonas as inspiration, flagged by Asad. Reviewed 11 September 2026.

- Program page: <https://lovable.dev/partners/solution>
- Rules and policies: <https://partner-program-rules.lovable.app/>

**Why this one matters more than the enterprise benchmarks.** AWS, Cisco, Oracle and
ServiceNow show what a program looks like at scale, with a channel org behind it. Lovable
is a startup running a program at roughly Beam's stage — and it has made every decision
the [programs benchmark](partner-programs-benchmark.md) recommends, at a size Beam can
copy. It is the most directly usable model in the research.

---

## 1. The structure

### Two tracks, split by firm size

| Track | Who | Entry requirement |
| --- | --- | --- |
| **Expert** | Individual builders and agencies under 5 people, serving SMB and mid-market | Pro subscription, 3+ months account history, 1000+ credits spent |
| **Solutions Partner** | Agencies of 5+, pursuing mid-market and enterprise | Business subscription |

Two tracks, not five. The split is by **how the firm goes to market**, which is the same
logic as Oracle's Build/Sell/Service and the same conclusion as our proposed
Sell/Build/Operate split.

### Four tiers inside the Solutions track

| Tier | Commission | Credits on tier-up | Credits per deal won | Requirement |
| --- | --- | --- | --- | --- |
| **Registered** | 0% | 50 (on joining) | 50 | Agreement only |
| **Select** | 10% enterprise | 500 | 100 | **Certification** |
| **Premier** | 15% | 3,000 | 300 | $120k Enterprise Sold ARR *or* $240k Managed ARR |
| **Elite** | 20% | 8,000 | 500 | $300k Enterprise Sold ARR *or* $600k Managed ARR |

All tiers above Registered also earn 10% on Business subscriptions for the first 12 months,
while the client keeps paying.

### The six-step path

> apply → sign agreements → **build internal solutions using Lovable** → complete
> certification through a project → get listed in the partner directory → deliver client work

---

## 2. The five decisions worth copying

### 2.1 Certification is the gate from tier 1 to tier 2

Registered earns **0%**. Select earns **10%** — and the only requirement is certification.
No revenue threshold, no headcount, no application review.

This is the single sharpest mechanic in the whole program. It converts certification from
training into the key that unlocks earning anything at all, and it is the same lever
Microsoft pulled in FY26 by making a certified designation mandatory for revenue
eligibility. Lovable proves it works at startup scale.

**It is also exactly what our [Phase 1 scope](../scope/phase-1-scope.md) §3.3 proposes** —
deal registration and co-sell require at least one certified person. Lovable's version is
blunter and better: *no certification, no commission.*

### 2.2 Credits are the currency at every tier

Credits appear twice in the model: a lump on tier-up (50 → 500 → 3,000 → 8,000) and a
recurring award per deal won (50 → 100 → 300 → 500).

This is what the benchmark recommended as "platform credits as the incentive currency" —
and Lovable shows it working as the *primary* reward, not a consolation for not paying
cash. It costs Lovable marginal compute rather than margin, and it pushes partners back
into the product, which makes them better at selling it.

**Beam's equivalent:** agent runs, sandbox environments, Platform seats, Beam engineering
hours. Beam is in a better position than Lovable here — an engineering hour is worth more
to a partner than credits, and Beam already offers white-glove onboarding.

### 2.3 Dogfooding is a required step, before certification

Step 3 is *build internal solutions using Lovable* — **before** step 4, certifying through
a project. The partner must modernize their own business with the product before they may
sell it.

This is the best idea in the program and nobody else in the benchmark does it. It solves
credibility, competence and conviction at once: a partner who has automated their own
invoice exceptions with Beam can sell Beam.

It also maps almost exactly onto `partner-enablement-mvp.md`'s journey — choose a path,
pick a starter case, build, connect data, add evaluations, run, submit, receive a
credential. **The missing step in Beam's version is that the first agent should be for the
partner's own business, not a sample.**

### 2.4 Anti-gaming rules, stated plainly

> *"Certifications must be completed by a human member of your team, in their own voice,
> without automated assistance."* Using AI voice tools triggers program review or removal.

A certification program run by an AI company has to say this out loud, or the credential
means nothing. Beam has exactly the same problem and will need exactly the same rule — the
demo's stated outcome is *"activation, not a badge,"* which only holds if the badge is hard
to fake.

### 2.5 The rules live on their own page

The policies are a separate site — not a PDF, not buried in the portal. Five sections: one
program two tracks · which track is right for you · program-wide rules · code of conduct
(dated) · FAQ.

Two details worth stealing: the **side-by-side track comparison** that lets a partner
self-select in one screen, and the **dated code of conduct**, which signals the rules are
maintained rather than written once.

Beam's program rules currently do not exist as a document at all.

---

## 3. Program-wide rules — directly relevant to Beam

Lovable's operating rules are security rules, and every one has a Beam analogue:

| Lovable rule | Beam analogue |
| --- | --- |
| Separate workspace per client | Already the tenancy model — `contentGrants` and `workspaceId` enforcement |
| MFA across all accounts | Not required today; partner auth is magic link |
| **Written client approval before workspace access** | Directly relevant. Beam partners handle client process data — this should be a stated rule |
| Prompt off-boarding of team members and clients | No membership revocation exists — see [spec delta](../analysis/spec-delta.md) §7 |
| No poaching within the ecosystem | Relates to the unimplemented deal registration |

"Written client approval before workspace access" and "prompt off-boarding" are both
things Beam's partners will be asked about by their own clients' security teams. Cheap to
write, and they make the program look operated rather than announced.

---

## 4. Where Beam should differ

Lovable's model is not copyable wholesale.

**Commission on subscriptions does not fit Beam.** Lovable pays 10–20% on subscription
revenue the partner sources. Beam's partner value is delivery — discovery, process design,
integration, evaluation design, run-support — and the
[benchmark](partner-programs-benchmark.md) found industry margin has moved decisively from
resale to services. A revenue-share percentage would reward the wrong behaviour and is
very hard to withdraw once published.

**ARR thresholds are premature.** $120k and $300k gates assume a self-serve funnel with
enough partners for thresholds to sort them. Beam has a handful of named partners.
Certification and delivered outcomes are the right gates for now — which is what the Phase
1 tier model already proposes.

**Beam's certification is heavier, and should stay so.** Lovable certifies through one
project. Beam's four levels culminate in a live design review with two deployed agents.
That is appropriate: a Lovable partner ships an app, a Beam partner puts an autonomous
agent into someone's finance function. Do not lighten it to match.

---

## 5. What to take into Phase 1

1. **Make certification the gate on earning anything.** Registered = access only; the first
   real benefit requires one certified person. Strengthens §3.3 as already scoped.
2. **Add a dogfooding step before certification** — the partner's first agent automates
   their own process, not a sample. New, and the strongest idea here.
3. **Confirm credits/hours as the incentive currency.** Both a tier-up grant and a
   per-outcome award, as Lovable does.
4. **Write the program rules as their own document** — tracks, comparison, program-wide
   rules, dated code of conduct, FAQ. Beam has none today.
5. **Add the anti-gaming rule to certification** — completed by a named human, in their own
   voice, no automated assistance. Non-negotiable for an AI company issuing credentials.
6. **Add the client-data operating rules** — written client approval before workspace
   access, prompt off-boarding. Off-boarding needs membership revocation, which does not
   exist yet.

Items 1, 2 and 5 are program design and cost nothing to decide. Item 4 is a writing task.
Item 6 needs the membership work already flagged in the
[spec delta](../analysis/spec-delta.md).
