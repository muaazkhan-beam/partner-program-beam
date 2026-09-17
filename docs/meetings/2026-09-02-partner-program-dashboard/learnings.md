# Kickoff Call — Learnings

Taken from the [2 September call transcript](./transcript.md). Written 2026-09-10, after the
[portal research](../../research/partner-portal-research.md), the
[ideas and recommendations](../../research/ideas-and-recommendations.md), the
[deep dive](../../research/deep-dive.md) and the [Phase 1 scope](../../scope/phase-1-scope.md).
So as well as what the call asked for, this records where those documents differ from it.

Timestamps mark where a speaker's turn starts. Zhichao's opening turn runs from 0:26 to 5:56.
Action items carry their exact Fathom timestamps.

---

## 1. Who's who

| Person | Role on this project | In the call |
| --- | --- | --- |
| **Zhichao Li** | Sets direction. Wants a quick sync once the research is done. Building the interactive agent-selection prototype. | 0:26, 9:27, 10:24 |
| **Muaaz Khan** | Does most of the work. | 0:26 |
| **Asad Raza** | Supports Muaaz. Owns collecting the compliance, legal and pricing documents, the Linear project and the channel. | 0:26, 12:04, 14:10 |
| **Sven Djokic** | Offered to talk to Derya. | 9:22 |
| **Jonas Diezun** | Built and deployed the baseline demo, and holds its code. The transcript mishears the name as "Yunus". | 8:43, 14:10, 14:49 |
| **Derya Firat** | GTM lead. Has worked with partners and clients, and knows what partners ask. The transcript spells the name "Daria". | 8:43, 9:16, 12:43 |
| **Fred** | Knows what partners ask. | 12:43 |
| **Aloya** | Asked for a training session on how to build with Beam. Appears to be a partner. | 12:43 |

> "Asad, I would suggest you let Muaaz do most of the work and you're just supporting from
> there" — Zhichao, 0:26

### "Jack" in the research documents is very likely Zhichao

The research and scope documents credit the call's requests to "Jack". Zhichao makes every one
of those requests in the transcript, and nobody called Jack appears in it:

| The documents say | The transcript |
| --- | --- |
| "Jack asked for a progress checklist" (scope §3.6, ideas §7) | "checklists here for them to go through one by one, like a progress bar" (6:53) |
| "Jack's split was Phase 1 static / Phase 2 dynamic" (ideas, "Suggested reframe of the phases") | "phase one, which is pretty static" (0:26); "Second phase will be making more engagement" (9:27) |
| "Jack scoped an NL compliance agent for Phase 2" (ideas §6) | "We also provide the Natural Language Agent here" (0:26) |
| "Jack's Phase 2 ATS mockups" (ideas §8) | "MOCAP, HubSpot, Workday, Workable" (0:26); "MoCup Salesforce" (10:24) |
| Certification listed by Jack "as a Phase 2 'gamification' item" (research §3) | "Then the next one will be the certification … We can also do some gamification here" (0:26) |
| "Phase 1 requirement (Jack, 2026-09-02)" (research §6) | 0:26 and 6:53 |

**Not confirmed.** The documents stay unchanged until it is.

---

## 2. What the call asked for

### The goal

> "the very, very high level goal, like a North Star Matrix, will be like they can sell with us
> together or they can sell for us" — 0:26

> "So the goal is always to sell us easily." — 0:26

> "Make sure it's a super easy and interesting to engage them to start use" — 6:53

### Phase 1: static content, "make it super clear"

> "So the goal of phase one is make it clear. Whatever you have here, make it super clear." — 9:27

| # | Ask | In the call |
| --- | --- | --- |
| 1 | Everything a partner needs to co-sell, so they never have to ask Beam | "provide everything there. They don't need to bother us." (0:26) |
| 2 | Partners can build agents | "enable our partner can build agents like us" (0:26); "components which they can build agent as solution team" (6:53) |
| 3 | A one-click package | "We should be one click button, a package delivered to them" (0:26) |
| 4 | Use case catalog | "that's included the use case catalog, which we are working" (0:26) |
| 5 | A link to the "graphize demo" | "It's also should connect to the graphize demo there" (0:26) |
| 6 | Vertical demos that open a workspace | "they can directly click in the check-in to go to the workspace" (0:26) |
| 7 | Product explanation | "some product explanation, like how they really use" (0:26) |
| 8 | Compliance, legal and pricing documents | Action item (12:19) |
| 9 | A "who are we" page | "Our registered company, our full name … Should be one page in the slides" (12:43) |
| 10 | A checklist with a progress bar | 6:53 |
| 11 | Intake, possibly as an agent | "They also need to put some intake, maybe. could be an agent." (6:53) |
| 12 | Interactive training | "Aloya also asks for the training session … an interactive training session" (12:43) |
| 13 | Rework the existing demo's pieces rather than start over | "you've already provided quite a lot of components here. Try to think about how to reorganize them" (6:53) |

### Phase 2: "more engagement"

| # | Ask | In the call |
| --- | --- | --- |
| 1 | **Branded slide generation.** The partner enters their company name. Colours and logos are pulled from their website and the dashboard takes on their look. They tick what they need (use case, cost, agent description, Beam introduction) and generate slides in their own style, carrying Beam's name. | 0:26 |
| 2 | **Agent builder ("McDonald's menu").** The partner picks an agent, such as a screening agent, and its parts: intake, standard process, engagement, qualification. Then they generate the agent and the sales slides. The same page is also for walking through a client's process in the client's own words. | 0:26, 10:24 |
| 3 | **An agent partners can ask questions in plain English**, for compliance and information requests | 0:26 |
| 4 | **Partner markup:** "Click some button, I did my own markup … like two times" | 0:26 |
| 5 | **Certification**, like AWS and OpenAI | 0:26 |
| 6 | **Gamification** | 0:26 |
| 7 | **Mock HubSpot, Workday, Workable and Salesforce screens**, so partners see Beam inside tools they recognise | 0:26, 10:24 |

The call doesn't put these in a firm order ("several phases", "the next one", "the next
phases"). The Phase 1 / Phase 2 grouping here and in the research documents is an
interpretation.

### Constraints

- **Partners only.** Asked whether partners' clients would see the dashboard: "No, I don't
  think so. No, not that they're selling to. So only to our partner." (6:53)
- **Timeline.** "before the end of September, try to make sure you can finish something in the
  next two to three weeks" (15:22). This is soft: "If I remember right", and "I need to check"
  at 14:49.
- **Don't over-complicate.** Asad at 5:56 and 12:00; Zhichao at 9:27.
- **Structure first, then contents.** "set up a structure that you experience first. Then you
  put the components inside. You don't need to list the components, but make a structure." (12:43)
- **Research before asking.** "Before you ask anything, just do some more research first." (15:22)
- **Direction, not a detailed spec.** "I don't want to limit you" (6:53, 9:27 and 12:43).

### A hint on pricing

> "The pricing will be the same. And I also want to give us some button … Click some button, I
> did my own markup." — 0:26

One reading: partners see Beam's standard price and make their money by adding their own markup
on top, not through a partner discount. The transcript is garbled here, so this is **not
confirmed**. If it holds, it partly answers the margin question the scope lists as a top risk
(§7, §8). The content model already stores pricing as a base price plus markup.

---

## 3. Action items

Fathom doesn't assign owners, so the owners below are inferred from the conversation.

| # | Action item, as Fathom recorded it | Owner | Timestamp |
| --- | --- | --- | --- |
| 1 | Send partner portal materials to Asad/Muaaz | Zhichao | 4:25 |
| 2 | Schedule sync w/ Daria re: partner portal | Asad (Sven offered at 9:22) | 9:12 |
| 3 | Rewatch meeting recording | Muaaz | 10:12 |
| 4 | Compile compliance/legal/pricing docs for partners | Asad | 12:19 |
| 5 | Create Linear project for partner portal; add Zhichao; link repos/materials | Asad | 14:00 |
| 6 | Add Zhichao to relevant channel | Asad | 14:37 |
| 7 | Sync w/ Muaaz; review thread/links; prep Yunus questions; book QuickSync w/ Zhichao | Asad | 15:27 |

In item 2, "Daria" means Derya Firat, and in item 7, "Yunus" means Jonas; the transcript misheard both names.

Item 4 is what turns the prototype's compliance library into real content. Every document and
review date in [`src/content/compliance.ts`](../../../src/content/compliance.ts) is currently a
placeholder.

---

## 4. How the scope and the prototype compare

As of 2026-09-10, comparing against the [Phase 1 scope](../../scope/phase-1-scope.md) of
7 September and the prototype in `src/`.

### Matches

| Asked for in the call | Where it is |
| --- | --- |
| Checklist with a progress bar | Scope §3.6, as Tasks · Home page |
| Use case catalog | Scope §3.1 · Use cases page |
| Compliance documents | Scope §3.5 · Compliance page (placeholder documents) |
| Intake | Requests form, with no backend · "could be an agent" became the Phase 1.5 knowledge agent |
| Research AWS, OpenAI and Tropic | [docs/research/](../../research/) |
| Rework the existing demo | Scope §2, "extend the demo, do not rebuild it" |
| Easy and interesting enough that partners use it | Scope §1: the whole design rests on getting partners to actually use it |
| Branded slides, agent builder and markup (Phase 2) | The "three cheap decisions" in scope §4: branding saved on the workspace, use cases stored as structured records, pricing as base plus markup |

### Changes the scope made that need Zhichao's approval

1. **Organizing the portal around each live deal** (scope §3.2). This wasn't discussed on the
   call.
2. **Links partners send to clients, with tracking of what clients open** (scope §3.3). The call
   said the dashboard is for partners only. A page Beam hosts that the partner's client opens,
   with those opens tracked, puts something in front of clients. You can argue it fits, since
   the Phase 2 slides are meant to reach clients too. But the scope calls this its
   highest-leverage item, so it needs an explicit decision rather than an assumption.
3. **Certification in Phase 1** (research §7.6, scope §3.7). The call put it after Phase 1.
4. **The knowledge agent and the CLI/MCP in Phase 1.5** (scope §5). The call put the
   plain-English agent in the later, "more interesting" phase.

### Asked for on the call but missing from both the scope and the prototype

1. **The "who are we" page.** Cheap to add, and it belongs with the compliance and legal
   documents Asad is already collecting.
2. **Interactive training.** Aloya's request. Certification tests people; it doesn't teach them.
3. **Partners building agents in Phase 1.** Scope §2 limits v1 to "documentation plus a request
   path into Beam, not live write access". Check whether "components which they can build agent"
   means a building tool or guidance.
4. **The one-click package.** The scope mentions bundles, but the prototype only sends one item
   at a time.
5. **Vertical demos that open a workspace.** The prototype has two placeholders and no workspace
   behind them.
6. **The "graphize demo".** Not yet identified.

---

## 5. Open questions for Zhichao

1. Is "Jack" in the research documents you?
2. Can Phase 1 include links partners send to clients, with tracking of what clients open, given
   the portal is for partners only?
3. For Phase 1, does "enable partners to build agents" mean a building tool or guidance?
4. What is the "graphize demo"?
5. Does "the pricing will be the same" mean partners see the standard price and their margin
   comes from their own markup?
6. Who is Aloya, and what did they want from a training session?
7. Are law firms a partner type, or is "lawyer" at 0:26 a transcription error?
8. Does certification belong in Phase 1 or later?

---

## 6. Transcription notes

### Mixed-up speaker labels

Fathom sometimes attributes one person's words to another. These are the cases that change who
said what:

| Labelled as | Passage | Likely speaker |
| --- | --- | --- |
| 6:53, Zhichao | "one quick question. This dashboard would only be exposed to our partners…" | Asad asks, Zhichao answers |
| 12:04, Zhichao | "I never interacted with any partner programs lately, so I might need a little hand-holding" | Asad |
| 12:37, Asad | "Your clients also ask you some information. Who are we? The very basic one." | Zhichao |
| 14:49, Zhichao | "And what's the time constraint here? … how soon do we need the fully-fledged set dashboard" | Asad asks, Zhichao answers "I need to check" |
| 15:22, Zhichao | "Okay. I'll sync with Muaaz separately then" | Asad |

### Likely transcription errors

| Transcript | Probably means |
| --- | --- |
| core sell | co-sell |
| PPO | BPO |
| BIM | Beam |
| MOCAP, MoCup | mockup |
| ATS MOCAP | mock screens of an applicant tracking system |
| North Star Matrix | North Star metric |
| screen agent | screening agent |
| panel portal | partner portal |
| Yunus | Jonas (confirmed) |
| Daria | Derya Firat (confirmed) |

### Unresolved

- **"lawyer"** (0:26, twice, next to "BPO"). Either law firms are a partner type, or it's a
  mistranscription of "Aloya" (12:43). The answer changes who the portal is designed for.
- **"Reward"** (0:26). Used as an example partner; not identified.
- **"Hudson"** (0:26). Used as an example company for branded slides; probably hypothetical.
- **"graphize demo"** (0:26). Not identified.
- **"Swinna"** (9:10). Named alongside Derya as having worked with partners; possibly Sven.
- **"a unit built"** (0:26), **"Fathom will always make it super clear"** (12:04) and
  **"mutable quick chat"** (12:43). Meaning unclear.
