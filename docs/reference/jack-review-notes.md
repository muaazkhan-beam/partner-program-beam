# Jack review — direction for the partner dashboard

Meeting: **Beam Partner Dashboard (Follow-Up)**, 18 September 2026, 37 min.
Present: Jack Li (Zhichao Li), Asad Raza, Muaaz Khan.
Recording: <https://fathom.video/calls/826477795>

Asad demoed the branch; Jack gave direction throughout. This is his direction, not a
summary of the demo.

> **Naming note.** The transcript alternates between "Jonas" and "Yunus" for what appears to
> be the same person, and renders Derya as "Daria". Treat both as transcription noise —
> but confirm who owns the dynamic-page alignment before booking it.

---

## 1. Three milestones, in this order

Jack set the sequence explicitly:

1. **Static pages** — materials, compliance, FAQ, certification
2. **Dynamic pages** — scope, agents, use cases
3. **Journey** — last, because it is the end goal and needs alignment with Jonas

> *"Let's focus on static page, it's the most easy one. And come back, plus my interaction,
> come to this dynamic page, then we align… static page, align with Jonas, dynamic page."*

**Static first is deliberate, and it is a test.**

> *"My goal here is to see how you really think, how you make the display better, how you
> refine the experience as a partner."*

**Checkpoint: Wednesday**, on the left navigation and the static pages. If nothing conflicts
with Jonas's work, merge to production after that.

---

## 2. Left navigation — regroup into two

The single clearest instruction. The sidebar currently lists everything at one level; Jack
wants two groups, split by whether a page is something you *do* or something you *read*.

| Group | Pages | Nature |
| --- | --- | --- |
| **Build** | Scope, with Agents and Use cases beneath it | Dynamic — a journey you go through |
| **Info** | Tools, Materials, Compliance, FAQ | Static — a catalog you look things up in |

Plus:

- **Journey merges into Home.** *"The journey could be the same as a home, right? So this
  could be merged."*
- **Requests moves down**, or becomes a button rather than a nav item.
- Agents and Use cases become sub-items under Scope.

> *"They should not be in the same on the left side as one level. It should be two groups."*

---

## 3. Materials — the McDonald's menu

Jack spent the most time here. The current page fails a basic test: every card looks the
same, the colours mean nothing, and you have to open each one to find out what it is.

> *"I don't understand what's the difference between all these different colours… You see
> the one pager, there's some one pager purple, some one pager green. So what's the
> difference?"*

Three changes:

**Pre-selected packages.** Group by partner intent, not by document type:

- **Know us** — who Beam is, the basics
- **Sell with us** — the co-sell package
- **Marketing** — branding and campaign material

> *"Sell with us, know us, right? So marketing us or something like that. Just have the
> pre-selected one."*

**Group and label the rest.** Tags, labels, categories — so a partner looking for marketing
material knows which section to go to without clicking.

**One highlight per group, the rest small.** The most comprehensive item gets the picture
and the introduction; everything else is a title and one sentence saying how it differs.

> *"Like you order food from McDonald's. The first one is always promoted by the menu. The
> other will be just ketchup, mayo and fries… They don't need to think what it is. Just
> click the button."*

**Action:** confirm the package definitions with Derya / GTM.

---

## 4. Compliance — regional packages

Compliance is already the better page: search and filter work, and the titles explain
themselves, because a security reader recognises "GDPR" on sight.

One addition — **pre-filled packages by region.** A US client and an EU client need
different document sets.

> *"If they need to send to a US client, what kind of document do they need to attach? For
> the EU one, maybe they need a different one. So you just provide a package."*

**Action:** ask GTM which documents go to which region.

**Note the distinction Jack drew:** compliance packages are obligatory — *"something you
have to give"* — while materials packages are selective. Same mechanism, different logic.

---

## 5. FAQ — put an agent in it

> *"Nobody really clicks right now. We need to put the agent here. Like a live chat."*

Connect it to Beam agent chat. Ask a question rather than browsing 22 answers.

The line worth repeating internally:

> *"We build FAQ agents for others. We should also have an agent for ourselves."*

---

## 6. Tools — screenshots and highlights

Currently a list with no visual anchor and no point of view.

- Add **screenshots**
- Add **highlights** — *"where we make the difference, not just list everything"*
- Clarify with Jonas whether `discovery.beam.ai` is live; Asad had not seen it before

---

## 7. Certifications — lower priority

Interesting, but parked.

> *"The Beam badge is not really attractive yet… let's put it lower priority. It can be
> there, but I think it can be more interesting."*

**This overrides our spec**, which had certification with a firm-tier consequence as a
Phase 1 deliverable. The credential has to be worth something before the mechanism matters.

---

## 8. Journey — not linear ⭐

The most important point in the meeting, and a direct contradiction of how the journey is
currently built.

> *"My feeling about partner here is it should not be a linear journey… I want to start
> with some purpose."*

**Different partners arrive with different purposes**, and Jack used two real ones:

| Partner | Situation | What they need |
| --- | --- | --- |
| **Hudson** | Already has the clients; wants to implement Beam into them. Already paying. | Business logic, compliance steps, references, names — proof it works |
| **Alloyed** | Wants to win *new* clients selling Beam together. Has a technical team. | Marketing, branding, big names, confidence, "who are we" |

So a five-step checklist fits neither. Some partners never build an agent themselves; some
want discovery with us; some do not.

> *"Maybe they don't need to build the agent by themselves. For Hudson, they don't care at
> all — they just want to know whether it's working. But Alloyed have a tech team, they can
> build something themselves."*

**Start from purpose**, not from step one: *sell with us* · *know us* · *market with us*.
Jack floated a **map** rather than a numbered sequence, without committing to it.

He is also sceptical of onboarding checklists generally:

> *"I never finish all this onboarding."*

**One open question he could not answer**, and it decides the design: **is the journey the
partner filling it in for Beam, or for their prospective client?** His answer was that it
must eventually be both — the partner understands it themselves, gets the documents they
need, and can send it onward.

> *"As a partner, I come here, I should understand what happened. I should get all the
> documents I need. And then this could be for myself, and I should also send this to
> anyone else. That's what we call a partner."*

---

## 9. Scope form — right idea, wrong weight

> *"The structure is good, just a little bit exhausting… with all the text here, it's
> exhausting."* And directly: *"there is some sort of AI slop as well."*

Keep the concept, cut the text. **Jack is working on the interaction design himself** and
will share it next week, to be merged into the scope / agents / use cases pages.

---

## 10. Smaller items

- **Requests** — add voice input, later
- **Agents page** — still static; overlaps the Interfaces page and needs styling
- Post updates in the partner channel

---

## What this changes in our plan

**Confirmed.** Static content first. Compliance is in good shape. An FAQ agent is wanted —
our I4. Grouping and highlighting content matters more than adding more of it.

**Reprioritised.**

| Item | Was | Now |
| --- | --- | --- |
| Certifications with firm tier | Phase 1 deliverable | Parked — badge isn't compelling yet |
| FAQ agent (I4) | Wave 2 | Wanted now, in the static pass |
| Journey / next-action (E2) | Wave 1, linear | Rebuilt around purpose, and last |

**New, and not in either spec.**

- Left-nav regrouping into Build vs Info
- Materials packages — know us / sell with us / marketing
- Compliance packages by region
- Highlight-plus-supporting-items layout, rather than uniform cards
- Screenshots and differentiators on Tools

**Still unresolved.** Whether the journey serves the partner or their client. Who owns
partner content. Which certification ladder is correct — now less urgent, since
certification is parked.

---

## Actions

| Who | What | When |
| --- | --- | --- |
| Muaaz / Asad | Left nav regrouping and the static pages | **Wednesday check-in** |
| Muaaz / Asad | Confirm material and compliance package definitions with Derya / GTM | Before building them |
| Muaaz / Asad | Align with Jonas on the dynamic pages, and whether to open a PR | Next week |
| Jack | Share his interaction design for scope / agents / use cases | Next week |
| Asad | Post updates in the partner channel | — |
