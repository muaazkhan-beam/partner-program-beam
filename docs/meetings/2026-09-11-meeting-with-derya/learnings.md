# Derya Firat Call — Learnings

Taken from the [11 September call transcript](./transcript.md) with Derya Firat, Beam's GTM
lead. Written 13 September 2026, after Muaaz's
[write-up](../../reference/derya-meeting-notes.md), his
[spec delta](../../analysis/spec-delta.md) and his [revised scope](../../scope/phase-1-scope.md).
It compares the call against Jonas's app and [spec](../../specs/partner-portal.md), and against the
[2 September kickoff with Jack and Sven](../2026-09-02-partner-program-dashboard/learnings.md).

Timestamps mark where a speaker's turn starts. Fathom scrambled the speaker labels in this
recording, so quotes are attributed by content; §7 lists the affected passages.

---

## 1. The call at a glance

| | |
| --- | --- |
| **When** | Friday 11 September 2026, 19 minutes |
| **Who** | Derya Firat (GTM lead) and Muaaz Khan, who ran it. Asad Raza attended |
| **Why** | Partner program requirements, from the person who manages Beam's partners |
| **How the time went** | About 5 minutes explaining the project and walking through Jonas's dashboard, 12 minutes on eight questions, then a short close |

Three things set the tone:

- **Derya came in with no context.** She said she was "a bit lost" (0:21), asked for "specific
  questions" (2:28), and was seeing the dashboard "today the first time" (8:42).
- **Her first reaction was to question the premise:** *"So why do they need a dedicated space
  for them?"* (1:56). The walkthrough followed, but nobody answered the question directly.
- **She wants detail over Slack:** *"if you have these kind of questions, just send me… a
  message"* (18:23).

---

## 2. What Muaaz asked and what Derya answered

| # | Muaaz asked | Derya answered | Kind |
| --- | --- | --- | --- |
| 1 | Which verticals and use cases are live? (5:36) | **Finance:** invoice processing, expense management, debt collection, reporting. **Procurement:** sales order processing, supplier communication, supplier FAQs. **HR:** CV screening, voice interviews. **Customer support:** tickets, in hospitality. These are "up and running". More are pitched in finance and HR, and Laurin and Kalina know those (7:02–8:31) | Fact |
| 2 | Should someone approve a partner before they see Beam content, or do they get everything once onboarded? (8:42) | No self-signup: "I would not do that." Partners "approved by our business… should get access to everything." Open access "for everyone if people are curious" was floated (9:50) | Decision, plus an idea |
| 3 | What do partners ask for, and where do they get stuck? (10:23) | Four needs: **what Beam is great at**; **the platform**, including "what's the limitations"; **building agents and "customized demos very fast themselves"**, "a very, very big factor"; **sales enablement**: ICP, how to pitch, one general deck plus vertical ones. The revenue model belongs in contracting: "not sure it should be on this platform" (10:52–12:15) | Requirements |
| 4 | Which industries are we winning in? (12:27) | Financial services, BPO/RPO and automotive manufacturing (12:27) | Fact |
| 5 | What do partners want to solve for their clients? (12:27) | Nobody knows: "if we don't know, they don't know." If Beam is specific about "the three things that Beam stands for", partners will think of Beam when a challenge comes up. "So far, that has been all… relationship-based" (12:27–13:39) | Diagnosis |
| 6 | Who decides pricing, when do partners hear it, and how do contracts align? (13:39) | There was no pricing "until like a few days ago". Share the general pricing. Resellers "probably" get a discount. How partners make money: "that's like a one-on-one discussion with us" (14:40) | Decision |
| 7 | What can't we answer well today? (15:16) | How are we different? When does Beam get in? How do you build agents? (needs a self-serve guide) How do partners access the platform? What do they do when they have problems? How to pitch, and who to sell to (15:51–16:09) | Requirements |
| 8 | Who are the current and future partners? (16:09) | A Google Sheet with columns for partner, GTM status, region, industry and type of partnership (16:52–17:06) | Source of truth |

---

## 3. How strong and how useful the feedback is

**Very useful on program facts, silent on the build itself.** In 12 minutes Derya gave facts only
GTM holds and two clear decisions. She didn't review Jonas's dashboard, rank her asks, or name a
customer we can cite.

| Point | Strength | Why |
| --- | --- | --- |
| Live use cases | Strong | Named, specific, and "up and running" rather than pitched |
| Winning industries | Strong | A direct answer, and it adds automotive manufacturing |
| No self-signup; approved partners see everything | Strong | A clear position, and it matches the build |
| Open access for curious visitors | Weak | "We could probably", not a decision |
| Partners build custom demos themselves | Strong | The one thing she stressed: "a very, very big factor" |
| Where partners get stuck | Strong | The same themes come up in two separate answers (Q3 and Q7) |
| "If we don't know, they don't know" | Strong | The business case for the portal, in GTM's own words |
| General pricing exists; resellers get a discount | Medium | Clear direction, but no document, numbers or date |
| Partner earnings stay one-to-one | Medium | Consistent, but hedged: "not sure it should be on this platform" |
| Partner list | Strong, but only a pointer | The sheet is authoritative; its contents aren't in the repo |

**What the call didn't cover:**

- **Jonas's dashboard.** She saw it for the first time and said nothing about its screens,
  content, FAQ answers or certification track. This call tells us what partners need, not
  whether the build meets it.
- **A customer we can cite.** Muaaz's scope says this was "raised with Derya and not
  answered". **The transcript shows it was never asked:** none of the eight questions asks for a
  named customer or a number. So it's an unasked question, not a refusal, and she invited
  specific questions on Slack.
- **Priorities, owners or dates.** Nothing was ranked or assigned on her side.
- **The rest of our open questions:** the certification ladder, who writes the content, the
  phase-gated lifecycle, deal registration, who approves partners, and what the pricing actually is.

**Where Muaaz's write-up goes a step beyond the transcript:**

- "Tiers should gate program benefits, not content" is Muaaz's inference. Derya only said
  approved partners should get everything.
- Her four-part answer is described as "unprompted". It answered his question about what
  partners ask for, although she structured it herself.
- The pricing date ("~8 Sep", "last week") is an estimate based on "a few days ago".
- Fathom's AI summary lists certifications and support requests as requirements. Both came from
  Muaaz's walkthrough, not from Derya.

The rest of his write-up matches the transcript.

---

## 4. How it compares with Jonas's build and the Jack & Sven kickoff

"Jonas's app today" means the app and its content files as they stand, with the review states
recorded in `apps/partner/catalog/`. "Kickoff" means the 2 September call with Jack and Sven.

| Derya's point | Jonas's app today | Kickoff (2 Sep) | Verdict |
| --- | --- | --- | --- |
| Live use cases | No use case catalog | Jack asked for one | **Aligned:** Muaaz's deliverable 3.1 |
| Winning industries | Content leans to the Gulf (GCC); workspaces for PwC ME and Roboyo | Not discussed | **New:** automotive has no content |
| What Beam is great at | FAQ answers framed against competitors; "Where Beam fits" pending | "Who are we" page, product explanation | **Partly built, wrong angle** |
| Platform and limitations | Tool cards route to a guided tour; nothing on limitations | Partners build agents; training | **Gap, raised twice** |
| Custom demos, built fast | FAQ says request a demo, don't promise a custom one | Demos that open a workspace | **Gap, and conflicts with the build** |
| ICP, pitch, decks | Two general decks; ICP only for the GCC | A one-click package of everything to sell | **Partly built** |
| When Beam gets in | Approved FAQ answers, the "beachhead" track, a playbook | Use case catalog | **Built; needs the catalog** |
| Platform access | FAQ answer pending | — | **Gap** |
| Problems and support | Requests page; FAQ answer pending; no notification | Intake | **Gap** |
| Approved partners see everything | Invite-only; content granted per workspace | Partners only | **Aligned** (see §5, items 3–4) |
| General pricing exists | Pricing answer pending | "The pricing will be the same" | **Unblocked; needs the document** |
| Partner earnings one-to-one | FAQ lists partner models, no numbers | A partner markup button (later) | **Conflict** (§5, item 2) |
| Partner list is Derya's sheet | Three workspaces that disagree with the spec and skill | Roboyo and Alloyed (heard as "Reward" and "Aloya") | **Reconcile** |

### Already answered by Jonas's build

- **When Beam gets in.** Approved FAQ answers on picking a first workflow (`first-process-fit`)
  and when to walk away (`when-to-walk-away`), the home page's "beachhead" track, and the
  one-workflow playbook. Derya still lists it as a gap because no partner has used the portal
  yet, and the answers are abstract. The use case catalog is what makes them concrete.
- **Access policy.** Invite-only sign-in with content granted per workspace already fits
  "approved partners see everything", provided every approved workspace is granted all the
  content marked safe for all partners.
- **A support channel.** The Requests page exists and returns an owner and a status.

### Gaps that both Derya and the kickoff raised

GTM and Jack raised these independently, which makes them the strongest Phase 1 candidates.

- **The platform and building agents.** Jack wanted partners able to build agents, with
  training. Derya wants a self-serve build guide and documented limitations. The build has tool
  cards that say "Request a guided Platform tour" and nothing on limitations. The
  [enablement MVP spec](../../specs/partner-enablement-mvp.md) covers the build path but is
  still "proposed".
- **Demos.** Jack wanted demos that open a workspace. Derya wants partners making custom demos
  fast themselves. The build's `working-agent` answer says to request a vertical demo and "do not
  promise a same-day custom demo". The spec puts a provisioned demo workspace in v1.1.
- **What Beam is great at.** Jack wanted a "who are we" page and a product explanation. Derya
  wants the USP and "the three things that Beam stands for". The build explains why not SAP, why
  not build it yourself and why this isn't another AI tool — positioning against others rather
  than a plain statement of what Beam does best. The "Where Beam fits" note is still pending.

### Gaps only Derya raised

- **Platform access:** `access-and-sandbox` is pending.
- **What to do with problems:** `support-and-escalation` is pending, and a new request notifies
  nobody (the spec delta found no Linear or Slack handoff).
- **ICP and vertical decks:** two general decks exist, the only ICP content is the GCC account
  qualifier, and there are no vertical decks.
- **Automotive manufacturing:** no content anywhere.
- **General pricing:** `pricing-and-packaging` says pricing is "not yet published". It can
  change once the pricing document exists.

### In Muaaz's scope, but not asked for by Derya or Jack

The partner scorecard, tracks by business model, and firm tiers. They may still be worth doing,
but neither GTM nor the sponsor asked for them, while four of Derya's asks sit outside Muaaz's
five deliverables.

---

## 5. Decisions to settle at the Jack & Sven review

1. **Custom demos: Phase 1 or later?** Derya calls them "a very, very big factor" for partners
   now. Jonas's FAQ tells partners to request a demo instead, and Jack said the module-menu
   builder isn't the right format for partners yet. A Phase 1 version could be one ready-made demo
   per live use case plus a demo workspace, but that depends on partners getting platform access.
2. **Partner earnings in the portal.** Jack's later-phase idea is a button where partners set
   their own markup. Derya says how partners make money is a one-to-one conversation, "not sure
   it should be on this platform". Jonas's FAQ already lists the partner models (co-sell,
   reseller, co-delivery) and keeps the numbers in a staff-only annex.
3. **What the phase gating gates.** The 11 September plan moves partners to the next lifecycle
   phase only after they finish the current one. Derya says approved partners get everything.
   Gate progress and recognition, not access to content.
4. **Open access for curious visitors.** Derya floated it, but the spec says "No open
   registration" and the build is invite-only. Park it unless GTM wants it.
5. **Automotive manufacturing.** Give it depth in Phase 1, or list it and stay focused on
   finance and BPO/RPO?
6. **Which Phase 1 list.** Muaaz's five deliverables, Derya's four new asks, Jack's kickoff
   list and the 11 September lifecycle plan don't match. Pick one before splitting the work.
7. **Staff admin.** "Approved by our business" means Beam staff must approve and set up each
   partner. The spec delta shows that setting up a partner today means editing a YAML file and
   re-seeding the database. Decide whether finishing staff admin is this team's job or Jonas's.
8. **Still open from before:** the certification ladder, and who owns the content.

---

## 6. What to do next

### Ask Derya on Slack

She asked for specific questions. These close the gaps this call left:

1. Which one live deployment can partners name, with one number? If none can be named yet, who
   approves using one?
2. Can you share the general agent pricing document and the reseller discount range?
3. What are the three things Beam stands for, in one line each?
4. Who is the ideal customer (ICP) in financial services, BPO/RPO and automotive manufacturing?
5. Which decks should partners use today, and do vertical ones exist?
6. Who approves a new partner?
7. Is it fine for the portal to list the partner models (co-sell, reseller, co-delivery) without
   numbers?
8. What is live in automotive manufacturing?

### Other follow-ups

- **Laurin and Kalina:** more finance and HR use cases, ideally each with an outcome. This is
  already Muaaz's action item.
- **Partner list:** reconcile the catalog's workspaces (partner-demo, PwC ME, Roboyo) with
  Derya's sheet. Link to the sheet rather than copying GTM status into the repo.
- **Use case schema:** the [build plan](../../plan/build-plan.md) lists finance, HR, customer
  service and operations as departments. Add procurement, and a flag for live versus pitched,
  since Derya drew that line herself.
- **Pending FAQ answers:** `access-and-sandbox` and `support-and-escalation` cover two of
  Derya's gaps. Filling them needs the access and support models decided first, not just new
  wording.
- **Demo guidance:** rewrite `working-agent` once the demo decision is made.

### For Muaaz's deck and repo doc

- **Answer Derya's first question first:** why partners need a dedicated space. Her own line
  answers it: "if we don't know, they don't know… so far, that has been all relationship-based".
- **Organize partner needs around her four:** what Beam is great at, the platform, building and
  demos, and selling. Set Jonas's app against them (§4) so the gaps are obvious.
- **Show GTM evidence, not just research:** the live use cases, the winning industries, and the
  positions on access and pricing.
- **End with the decisions in §5,** not a feature list.
- **Keep the repo doc short** by linking to this file, the spec delta and the kickoff learnings.

---

## 7. Transcription notes

### Mixed-up speaker labels

| Labelled as | Passage | Likely speaker |
| --- | --- | --- |
| 4:54, Derya | "How do we make money? What does engagement look like? Stuff like that, right?" | Muaaz, reading FAQ titles in the walkthrough |
| 5:30, Derya | "So this is the initial platform for the partner program… and I will build upon this." | Muaaz |
| 6:30, Muaaz | "So maybe let me show you my screen." | Derya, offering her own presentation before starting "without the presentation" at 7:02 |
| 8:31, Muaaz | "definitely have more that we pitch within Finance and HR… Laurin and Kalina know that more." | Derya |
| 8:42, Muaaz | "I've seen it today the first time and I know that Jonas wanted to work on it." | Derya |
| 11:00–11:58, Muaaz | USP, the platform, features, sales enablement, sales decks and vertical decks | Derya, continuing her four-part answer |
| 12:27, Muaaz | "It is financial services… automotive manufacturing." and "the problem is, if we don't know, they don't know." | Derya |
| 13:39, Muaaz | "But if we are specific on what we can do… relationship-based." | Derya |
| 15:56, Muaaz | "How do you build agents? We need a guide for them being self-serving themselves." | Derya |
| 16:09, Muaaz | "What do they do if they have problems?… how to pitch, who to sell to" and "I sent you a list." | Derya |
| 18:42, Muaaz | "look at the recording and the transcript, but if you need anything else… ask specific questions, and I'll answer them." | Derya |

### Likely transcription errors

| Transcript | Probably means |
| --- | --- |
| "Fathom gets something concrete from us" (0:27) | the partner gets something concrete from us |
| "we is already in a partnership with IBM" (0:27) | Beam is already in a partnership with IBM |
| Yunus (2:35) | Jonas |
| GDM status (17:06) | GTM status |

### Unresolved

- **"It's crazy. We don't have it anywhere."** (6:30). Unclear who said it, or what "it" is.
- **"I think my soul slow."** (6:56). Meaning unclear.
- **"We're our agents."** (11:58). Meaning unclear.
- **"I send and share your habit."** (16:52). Probably about sharing the partner sheet; wording unclear.
