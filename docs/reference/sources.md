# Sources

Every external link this project depends on, in one place.

**Upstream is read-only.** Never edit, commit or push to `beam-ai-team/beam-library`. It is
reference and mapping only. All work happens in this repo.

---

## Upstream — `beam-ai-team/beam-library` (private)

| What | Link | Copied to this repo as |
| --- | --- | --- |
| The Beam Partner app — v1 shell by Jonas | [`apps/partner`](https://github.com/beam-ai-team/beam-library/tree/main/apps/partner) | [`apps/partner/`](../../apps/partner/) |
| Product contract — **the spec for Phase 1** | [`specs/apps/partner-portal.md`](https://github.com/beam-ai-team/beam-library/blob/main/specs/apps/partner-portal.md) | [`docs/specs/partner-portal.md`](../specs/partner-portal.md) |
| Enablement MVP — separate, status *proposed* | [`specs/apps/partner-enablement-mvp.md`](https://github.com/beam-ai-team/beam-library/blob/main/specs/apps/partner-enablement-mvp.md) | [`docs/specs/partner-enablement-mvp.md`](../specs/partner-enablement-mvp.md) |
| Partner portal skill — operating playbook | [`skills/general/partner-portal/SKILL.md`](https://github.com/beam-ai-team/beam-library/blob/main/skills/general/partner-portal/SKILL.md) | [`partner-portal-skill.md`](partner-portal-skill.md) |
| Partner call synthesis — PwC ME, BID, Roland Berger | `skills/general/partner-portal/references/partner-pain.md` | [`partner-pain.md`](partner-pain.md) |
| Partner-safe tool map | `skills/general/partner-portal/references/tool-map.md` | [`tool-map.md`](tool-map.md) |
| First FAQ seed, drafted from live objections | `skills/general/partner-portal/references/faq-seed.md` | [`faq-seed.md`](faq-seed.md) |
| What already exists in Core, Library and GTM Core | `skills/general/partner-portal/references/current-state.md` | [`current-state.md`](current-state.md) |

Upstream state when copied: `effed19`, 2026-09-04. Partner app last touched by PR #154
(*certifications and richer portal surfaces*) and #156 (*docs: organize and clean up
specifications*).

**Everything above is already in this repo.** The links are for provenance and for checking
upstream drift, not for day-to-day work.

---

## Live

| What | Link |
| --- | --- |
| Deployed demo workspace | <https://partner-portal-beam.vercel.app/w/partner-demo> |
| Phase 1 scope, shared with Asad | <https://claude.ai/code/artifact/fae092cc-6378-43d4-adbf-f9b604467ca6> |
| This repo | <https://github.com/muaazkhan-beam/partner-program-beam> |

---

## Program inspiration

| What | Link | Written up in |
| --- | --- | --- |
| Lovable Solution Partner Program — sent by Jonas | <https://lovable.dev/partners/solution> | [`lovable-partner-program.md`](../research/lovable-partner-program.md) |
| Lovable program rules and policies | <https://partner-program-rules.lovable.app/> | same |

---

## Kickoff call

Capacity Check: Partner Program Dashboard, 2 September 2026, led by Jack.

| What | Link |
| --- | --- |
| Recording | <https://fathom.video/calls/808042865> |
| Share link | <https://fathom.video/share/QYxrL-zf_JezxgmDUVVHjGeRW4QnXhsk> |

Both require a Fathom login and cannot be fetched programmatically. The summary is in
[`../scope/phase-1-scope.md`](../scope/phase-1-scope.md) and the original brief.

---

## People

| Name | Role on this project |
| --- | --- |
| Muaaz Khan | Lead |
| Asad Raza | Support |
| Jonas Diezun | Built the v1 shell |
| Jack Li | Kicked off the project |
| Derya, Fred | Common partner requests; source for a citable deployment outcome |
| Zhichao Li | Interactive agent-building prototype (Phase 2) |
| Yunus | Original dashboard repo |

---

## Research in this repo

| Document | Covers |
| --- | --- |
| [`partner-portal-research.md`](../research/partner-portal-research.md) | Demo teardown, AWS, OpenAI, Tropic, 2026 PRM landscape |
| [`ideas-and-recommendations.md`](../research/ideas-and-recommendations.md) | Ideas ranked by impact per unit of effort |
| [`deep-dive.md`](../research/deep-dive.md) | Beam product grounding, partner archetypes, concrete schemas |
| [`partner-programs-benchmark.md`](../research/partner-programs-benchmark.md) | AWS, Cisco, Oracle, Microsoft, ServiceNow, Salesforce, Dell, HubSpot, OpenAI, UiPath |
| [`lovable-partner-program.md`](../research/lovable-partner-program.md) | Lovable — closest model to Beam's stage |
| [`spec-delta.md`](../analysis/spec-delta.md) | Section-by-section audit of the spec against the code |
| [`build-plan.md`](../plan/build-plan.md) | Ordered file chain for each Phase 1 deliverable |
