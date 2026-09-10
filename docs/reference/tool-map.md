# Partner tool map

What to put on the Tools page, what to explain only, and what to keep off the
partner surface. v1 is **guided documentation + request paths**. Live write
access comes later, per tool, with a named owner. A workspace can expose a
different approved subset, but never bypass the shared safety rules.

## v1 Tools page (show these)

Group by the partner's job, not by Beam's org chart.

### 1. Before the first client meeting

| Tool | Partner sees | How they use it | Access in v1 |
| --- | --- | --- | --- |
| Partner FAQ | Answers to SAP/Oracle/Anaplan, deployment, brand | Read, search, copy into internal email | In-app page |
| Competitive battlecards | Incumbent vs Beam, when to walk away | Prep for the internal "why this crew" meeting | In-app + PDF |
| GCC account qualifier | ICP rules, hard exclusions, lanes | Paste a target list; get pursue/bench/exclude | Documented workflow; Beam staff or approved partner user runs `gcc-account-qualifier` |
| Call prep (partner mode) | Joint RACI, complementary capabilities | Prep the next Beam<>partner or partner<>client call | Skill instructions + optional Beam-run |
| Materials library | Intro deck, one-pager, proof pack | Download / Shares link, audience-tagged | Read + request new |

### 2. In the room with the client

| Tool | Partner sees | How they use it | Access in v1 |
| --- | --- | --- | --- |
| Iris | Outside-in company view, interviewable report | Show a prepared report; do not promise same-day custom without Beam | Staff-prepared share link, explained in-app |
| Operating diagnostic | Process bank, value-vs-effort graph | Workshop with department heads | Method + templates; Beam FDE joins the first two |
| Discovery | Faster process capture / ranking | "This is how we stop six-month as-is work" | Demo by Beam; partner does not get admin |
| Proof pack | Live architecture-depth cases | Technical / bake-off buyer | Approved pack per sector |
| Platform demo path | Graph, evals, exceptions, audit log | Request a vertical demo (order-to-cash, AP, screening) | Request form → Beam SE |

### 3. After they say "show us one process"

| Tool | Partner sees | How they use it | Access in v1 |
| --- | --- | --- | --- |
| One-workflow playbook | Shadow environment, success criteria, who does what | Run the PwC shared-services slice | In-app playbook |
| Beam Platform | Where the agent will live | Understand nodes, evals, HITL, integrations | Guided tour + provisioned demo workspace later |
| Beam Interfaces | Custom UI in front of an agent | When the leave-behind should look like an ATS/dashboard, not a chat | Explainer + request |
| Self-learning explainer | Why accuracy holds in production | Answer "what happens after go-live" | FAQ + short visual |
| Success-criteria kit | How fees-at-risk is set | `generate-success-criteria` method, partner-safe | Template; Beam writes the first one |

## v1.1 (after the first live partner deal)

- Partner-safe artifact studio: run `prospect-brief`, `operating-diagnostic`,
  `proof-pack`, `partner-deck-builder` into a review queue. Nothing is
  client-forwardable until a Beam reviewer marks it approved.
- Provisioned Platform demo workspace per partner org (not production
  customer workspaces).
- FDE-on-assignment request.
- Enablement track: sell certification, then a sandbox build.
- Deal room for one named account (evidence, next meeting, open questions).

## Stay staff-only

| Surface | Why partners do not get it |
| --- | --- |
| Beam Core `/repositories`, `/systems`, `/agents` | Internal map, GitHub snapshots, staff systems |
| Cost Dashboard | Token spend, internal financials |
| Prism | Staff operating system |
| GTM Intelligence paid research | Credit-gated, staff research |
| GTM Core account folders, invoices, HubSpot writes | Working context, not a partner CRM |
| `account-planning` full v4 package | Internal finance + conflict register |
| `proposal-creation` / live price books | Commercial authorization stays on Beam |
| Internal OS / SE CLI at full power | Leverage tool for Beam SEs; leak of delivery IP until a partner is certified |

## Decision rule for adding a tool to the portal

Add it only if all of these are true:

1. A partner would use it **this week** on a real client conversation.
2. The artifact or demo is **claim-safe** for that partner's audience.
3. Access is **invite-scoped** (org, not the internet).
4. There is a **human owner** when the tool can change customer data.
5. Failure mode is "request Beam", not "partner clicks around production".

If a tool is cool but only Beam SEs can operate it (graph slicer, APE
optimizer, cost traces), put it in a "How Beam builds" explainer, not on the
Tools grid.

## Suggested Tools taxonomy in the UI

```text
Sell
  FAQ · Battlecards · Qualifier · Call prep · Materials

Prove
  Iris share · Proof pack · Platform demo request · Interfaces explainer

Scope
  Operating diagnostic · Discovery method · Success criteria · One-workflow playbook

Deliver (later)
  Demo workspace · FDE request · Sandbox · Deal room
```

The home page should lead with three motions rather than product categories:

```text
Future of shared services  → Sell + the account hypothesis
First workflow             → Prove + Scope + request a shadow demo
Risk & delivery readiness  → Approved deployment / independence proof + Beam escalation
```

The user's original three pages map cleanly:

- Login → auth
- Tools → this file
- Marketing materials + FAQ → Sell group, first-class nav items

## Workspace overlay and content policy

Each card and linked artifact is attached to one or more partner workspaces.
Use `shared-partner-safe` for reviewed common assets, `workspace-only` for
partner-specific material, and `staff-draft` for anything under review. A
card may have different title copy or ordering in PwC and Roboyo, but its
access policy, claim review, and Beam support route remain shared.

Never label a regional deployment, pricing, independence, or exclusivity
claim as self-service unless its current approved proof is attached. The safe
fallback is a traceable “Request Beam” path, not a confident generic answer.
