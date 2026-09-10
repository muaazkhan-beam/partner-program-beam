# Partner-call synthesis

Source: user-supplied transcripts for a PwC Middle East working session, a BID
internal prep, and a Roland Berger / partner-docs prep. These are operating
notes, not client-forwardable copy.

## PwC Middle East — what the room actually needed

Beam side: Mo Bekdache, Jonas Diezun, Jack Li, Aqib Ansari. PwC side: Paul
(managed services leader, the antagonist on purpose), Alexander, Eamon in
the background, plus additional generators on the call.

### What Beam showed

- Delivery model: process bank → scored value → first wave of agents → test
  data → production → more of the value chain. Phased, sometimes fees tied to
  pre-agreed success criteria, then license.
- Why partners fit: consultancy front-end to find the bottleneck, Beam to
  build.
- Tooling that made SEs 6–7 clients deep: Platform + Discovery + internal OS +
  Interfaces.
- Live agent: Fraisa-style order processing from a unified inbox, evals,
  exception branches, CRM write-back, SharePoint audit log, ~98% extraction
  accuracy, 50–60% happy path, expanding regions.
- Self-learning: implicit + explicit feedback → cluster → train one cluster →
  regression-test the rest.
- Iris outside-in reports (Zurich North America construction, Aramco, Al
  Jomaih process inventory + graph).
- Multi-ERP examples: Mizan (37 SAP variants, source-to-pay / invoice
  exceptions), Americana (30-year on-prem Oracle).

That demo was necessary for the new people in the room. It was not sufficient
for Paul.

### Paul's three business problems

Quoted in spirit, not as a transcript dump:

1. **Decision paralysis.** Every COO/CFO/CEO in the region has "do AI" in
   FY26/FY27 KPIs. Hundreds of vendors. Clients already have SAP, Oracle,
   ServiceNow, Workday "AI". Why buy Beam?
2. **Deployment.** Saudi Arabia and Kuwait: cloud availability, on-prem, how
   it plugs in.
3. **Local automation theatre.** Digital government / HR: every GM bought a
   tiny agent, zero upside, expected headcount cuts that did not happen,
   because nobody thought transformationally.

He then asked the partnership questions that will recur with every Big Four
firm:

- Do you need us, or are you just renting our brand?
- If you are also talking to Deloitte / McKinsey / EY, that is brand-damaging
  for us.
- What is your role vs ours, who introduces whom, how do we activate the
  market together?
- PwC is an audit firm: independence and conflicts will be painful.
- We are bad at productizing technology; we are good at clients, delivery
  centers, and humans. Start with shared services, not a firm-wide platform
  launch.

### Alexander / Speaker 5 — the ERP/EPM trap

- Back-office data already lives in the ERP. Why another platform if S/4HANA
  or Oracle Fusion "has agents"?
- If there is no modern ERP, why not Anaplan / OneStream-style EPM (data
  model + planning + then agents)?
- Beam does not store the data lake. Custom integration builder + 800
  integrations + pull/act/discard. That is the honest answer; the portal must
  say it before a partner has to improvise.
- Regional issue is often the **data integration layer**, not the application
  layer. Process mining will not save a mess of sources.

### What already worked as a reply (keep these)

- **Intelligence layer across systems**, not a replacement ERP. Recruiter
  stays in one screen; Beam stitches HubSpot + SMS + ATS. Jack's US hiring
  example.
- **Conglomerates with 12–37 entities and incompatible ERPs** are the wedge
  (Mizan, Americana). Low-hanging fruit inside one clean S/4 may not be.
- **De-risk to one process** with success criteria and fees at risk. Mo's
  Al Jomaih graph.
- **White-label option:** "PwC platform powered by Beam", FDEs on assignment
  to PwC, PwC owns the client relationship and can own the outcome. Mo
  offered this; Paul called it interesting.
- **Start microscopic:** one client, one workflow, shadow environment,
  then a playbook. Both sides agreed this is the next conversation.

### What the portal must therefore contain for PwC

Not "here are 40 skills". These pages:

1. Why Beam vs the incumbent stack (ERP AI, EPM, ServiceNow).
2. How we deploy in GCC (hosting, data handling, what we do not store).
3. How a PwC seller runs the first 30 days (qualify, diagnostic, shadow
   workflow, success criteria).
4. Brand options (PwC-fronted / powered-by-Beam / joint).
5. Independence notes and a "talk to risk" checklist, not legal advice.
6. Approved proof they can forward without asking Slack.

## BID — commercial ambiguity, not a product gap

Internal prep (Jonas, Derya) after a different partner motion:

- Last attempt stalled on **joint-venture complexity** (cannot put Beam's
  finance core into a JV and still sell in Germany).
- Lightweight commission / "we build, you sell" was discussed and did not
  get a Fahrplan or training resources.
- Best near-term outcome: win Noah (delivery, Andrew-at-Hudson analogue) and
  Andreas (Steph analogue), then maybe Obermark for anything larger.
- Hudson is the proof that partner-attached selling can work; do not lead
  with a revenue number in the first meeting.
- Open delivery/invoice tension on the existing project is a relationship
  risk. A portal does not fix unpaid buckets. Do not pretend it does.

Portal implication: BIT needs a **clear commercial shape picker** (reseller /
rev-share / co-delivery) and an enablement track for a small sales pod. It
does not need a JV workspace.

## Roland Berger prep — finish the partner kit, keep momentum

- Inbound Marvin Maywald (digital practice, transformation / EA / SAP-heavy).
  Do not slip the 28th. Expect Vattenfall-like SAP questions.
- Existing decks are a start, not a kit. PwC/Strategy& deep-dives are the
  wrong intro. Deloitte Figma has phases + suites + VW (approval-sensitive).
- Jonas: define chapters as templates, then assemble. That is the Materials
  information architecture for the portal.
- Stefan: inbound + momentum. Partner portal should make "send the intro pack
  today" a two-minute action, not a Figma archaeology project.

## Recurring partner failure modes (use as design constraints)

1. **Demo without a motion.** Cool graph, no answer to "why not SAP".
2. **Unclear who owns the client.** Rent-a-brand fear.
3. **No first deal shape.** Partners stall until there is a JV or a global
   MSA. Counter: one workflow, shadow, playbook.
4. **No training capacity.** BIT already showed this. The portal has to carry
   the training, because Beam will not staff a partner academy by default.
5. **Unsafe proof.** VW on a partner intro deck, unapproved logos, ISO claims.
   Materials in the portal must be claim-gated.
6. **Staff tools leaked.** Cost dashboard, raw account folders, unpublished
   pricing. The auth model exists to prevent this.
