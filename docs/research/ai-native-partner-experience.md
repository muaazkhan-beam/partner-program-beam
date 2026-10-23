# AI-Native Partner Experience

Research for the direction Jack set on 29 September. Written 1 October 2026.

He asked for research before implementation, twice, and explicitly not for a round of
colour changes. This is that research, and what it says to build.

> **Correction, 6 October.** Two quotes below (in §3, "I want to configure something…",
> and in §6, "Nobody cares about BeamShare") are not in the 29 September transcript we hold;
> treat them as paraphrase until checked against the recording. §4 is corrected: Jack asked
> for a polished PDF, in Beam's style or the partner's own, with the partner's style taken
> from an uploaded branding asset or PPTX. PPTX output is an editable extra, not his ask.

---

## 1. His instinct is the documented pattern

Jack's argument was that a partner should not have to walk the path we define:

> *"This is a typical SaaS product building structure… you have to learn how to use it. But
> if you think about it, we are building an AI native product. You don't have to go through
> the way we told you. They will come here, raise questions with something they need, and
> just pick it up."*

That is **intent-first design**, and it is the defining 2026 shift. Traditional software is
organised around destinations: the user learns the structure and navigates it. An intent-first
product reorganises itself around the user's goal — surfacing what is relevant, suppressing
the rest, and assembling a working state.

So the pathway model he is rejecting — the Linear/Notion onboarding checklist — is exactly
what the research says not to build for this.

## 2. But a chat box is not the answer either

Jack said the quiet part himself:

> *"I don't like the chat feature, because most of the time I don't know how to ask."*

The research agrees, bluntly: **adding a chatbot is not the same as being AI-native.** A chat
window bolted onto a rigid interface leaves the interface rigid and the AI blind to context.
The chatbot era is described as ending, replaced by conversational behaviour embedded across
the interface rather than confined to a bubble.

**What this means for us.** The chat on Home should almost never be an empty box. It should
arrive **pre-loaded with intent** — the partner's live workspace, their open requests, the
questions other partners asked this week — so the blank-page problem never appears. An empty
box asks the partner to do the hard part.

## 3. The email scenario is a mature product category

Jack's scenario — a client sends twenty security questions, the partner forwards the email,
everything comes back — is not speculative. It is a funded category.

**Conveyor, Drata, Responsive, Tribble** all do security-questionnaire automation. The shape
is consistent:

- **Intake from where the work already arrives** — email, Slack, Jira, Salesforce — with
  incomplete requests rejected automatically
- **Draft generated from approved sources** — a trust centre or knowledge base, never free
  generation
- **Every answer carries its citation and a confidence score**
- **A human reviews, edits and approves** before anything is sent
- Reported effect: **20–40 hours of manual work completed in under 2 hours**, an 80–90%
  reduction

Two things follow.

**Jack's "you don't need a dashboard at all" is half right.** Intake is email; the dashboard
is the *review and configure* surface. That is precisely what he described next — *"I want to
configure something, I don't want this part, I don't understand this part. In this case I
should go to the dashboard."* The category agrees with him.

**And Beam is better positioned than any of them.** They ground answers in a knowledge base
and attach a confidence score. We have something stronger: **claim-review state.** Every
answer is approved, restricted or staff-draft, with a reviewer and a revalidation date, and
Asad's compliance library adds 59 documents recorded only as printed, with build-time
validation that rejects a posture claim in a summary.

> A confidence score says the model thinks it is right. A claim-review state says a human at
> Beam approved it. For a partner answering a client's security team, those are not close.

## 4. Branded output is solved, so we should not invent it

Jack asked for a polished PDF in Beam's style or the partner's own, with the partner's style
taken from an uploaded branding asset or PPTX. All standard:

- **SlideSpeak** — upload a PPTX or POTX once; every generated deck inherits master slides,
  theme colours, fonts and logo placement
- **Presentations.AI** — "Brand Sync" pulls logo, fonts and colours from a website URL
- **Pitch** — enter a domain, get a branded template
- **Deal Room builders** — a branded deck, executive summary and business case assembled from
  approved content in under 30 seconds

Offering an editable PPTX as well is worth it for the reason these tools support it: the
partner will want to change a line before sending. But the ask was the PDF.

**Implication:** the workspace needs branding fields — logo, colours, and an uploaded
template. Worth noting the Phase 1 scope flagged this in September as a cheap decision to
take early, and it was never built.

## 5. The cart is the manual path to the same output

Jack described a shopping cart: browse FAQ, materials, use cases, tools, add to cart, then
generate a deck or send an email.

Asad has already built most of it — the **pack tray** merged on 1 October is a cart in all
but name.

The important insight is that **the cart and the email flow are the same machine.** One is
intent-driven, the other is browse-driven, and both end at: *assemble approved content →
render in partner branding → review → send.*

```
  forward an email ─┐
  paste questions  ─┤→  assemble from approved content  →  review & configure  →  branded
  ask in chat      ─┤       (claim-reviewed only)           (the dashboard)        PPTX / PDF
  browse + add     ─┘                                                              or email
```

Build the assembly and rendering once. The four intakes are thin surfaces onto it.

---

## 6. What to build, in order

### Now — the UI feedback, which is small and concrete

1. **White theme.** His first note, and his reason was trust. The research on AI-native
   interfaces says nothing about colour, but his reason is sound for a portal a partner shows
   a client.
2. **"Open in BeamShare" → Open + Download.** *"Nobody cares about BeamShare."* Two actions:
   open in a tab, download the PDF.
3. **Shorter copy, clearer icons.** He called the current writing long. He is right.
4. **The lifecycle organises everything.** He singled out the Home lifecycle as the thing he
   liked — tools, materials and FAQ should all group by the same phases.

### Next — the shape that matters

5. **Chat on Home, pre-loaded with intent.** Not an empty box. Suggested openers drawn from
   the partner's own context.
6. **One pack, many intakes.** Asad's pack tray becomes the single assembly surface, reachable
   from a cart icon, filled by browsing *or* by a question.
7. **Branded output.** Workspace branding fields, then render the pack as PPTX and PDF.
8. **Email intake.** The highest-leverage item and the one Jack is most excited by. A forwarded
   client questionnaire comes back as a drafted response grounded in the compliance library,
   with every answer carrying its source and anything restricted routed to Beam.

### Later

9. **Agent configuration** — his second research ask: how a partner changes an agent's output.
   Needs its own pass.

---

## 7. What not to do

| | Why |
| --- | --- |
| A linear onboarding pathway | The thing Jack explicitly rejected, and the pattern the research says intent-first design replaces |
| An empty chat box | "Adding a chatbot is not the same as designing an AI-native product" — and Jack himself does not know what to ask |
| Confidence scores on answers | We have something better. Claim-review state is a human decision, not a model's estimate |
| Building deck rendering from scratch | Template-inheritance is a solved problem; use it |
| Free generation over content | Everything renders from approved content only. That is the one rule the whole governance model rests on |

---

## Sources

- [AI-Native UX: Adding AI Is Not the Same as Designing an AI-Native Product](https://medium.com/the-thinking-interface/ai-native-ux-part-1-adding-ai-is-not-the-same-as-designing-an-ai-native-product-e54135e72c29)
- [AI-Native UX in 2026: a builder's guide](https://knubisoft.medium.com/ai-native-ux-in-2026-a-builders-guide-97cdb2ef1a7b) · [AI-Native User Experience Design](https://www.productleadership.com/blog/ai-native-user-experience-design/)
- [How to Create AI-Native Websites in 2026](https://wpriders.com/ai-native-websites-in-2026/) · [AI UX Design Trends Reshaping Products in 2026](https://www.yujdesigns.com/blog/ai-ux-design-trends-2026/)
- [AI Agents for Security Questionnaires — Conveyor](https://www.conveyor.com/blog/ai-agents-for-security-questionnaires) · [Security Questionnaire Automation — Drata](https://drata.com/products/assurance/security-questionnaire-automation) · [AI Agents for Security Questionnaire Automation 2026 — Inventive](https://www.inventive.ai/blog-posts/ai-agents-security-questionnaire-automation) · [How Security Questionnaire Automation Works — Tribble](https://tribble.ai/blog/security-questionnaire-automation/)
- [Branded templates — SlideSpeak](https://slidespeak.co/features/branded-template) · [Make AI follow your brand guidelines](https://slidespeak.co/blog/ai-follow-brand-guidelines-slides) · [Presentations.AI](https://www.presentations.ai/) · [Pitch AI presentation maker](https://pitch.com/use-cases/ai-presentation-maker)
- [Platforms that personalize content for B2B buyers in 2026 — Spekit](https://www.spekit.com/blog/platforms-personalize-content-b2b-buyers)
