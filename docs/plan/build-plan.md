# Build Plan — Phase 1

Concrete steps against the real codebase. Companion to
[`../scope/phase-1-scope.md`](../scope/phase-1-scope.md).

All paths relative to `apps/partner/` unless stated. Written 11 September 2026.

---

## How this codebase works

Understanding the pipeline makes every step below predictable. Content flows:

```
catalog/*.yaml
   → scripts/compile-catalog.mjs
      → convex/generated/catalog.json
         → convex/seed.ts        (seeds contentItems + contentGrants)
            → convex/partner.ts  (listContent / getContent, membership-checked)
               → app/(partner)/w/[workspaceSlug]/<surface>/page.tsx
```

Three properties matter:

1. **`listContent(workspaceId, kind)` is generic.** A new content kind inherits the
   queries, workspace grants and isolation guarantees with no new query code.
2. **`contentItems` is one polymorphic table** discriminated by `kind`. New kinds add a
   validator literal, not a table.
3. **Nav is driven by `workspace.enabledSurfaces`**, read in `components/app-sidebar.tsx`.
   A surface can ship dark and be switched on per workspace when its content is ready.

**Golden rule from the spec:** every read and write verifies membership and `workspaceId`
server-side. A `workspaceSlug` in the URL is never authorization. Do not add a query that
takes only a slug.

---

## Stage 0 — Foundations (Fri 11 – Sun 14 Sep)

**Goal: one use case renders in the portal, isolated per workspace, with a passing test.**
Getting the full chain working for *one* record de-risks everything after it.

### 0.1 Define the use case shape

New file `catalog/use-cases.yaml`. Fields beyond the shared `CatalogContent` set:

| Field | Type | Notes |
| --- | --- | --- |
| `vertical` | string | finance, healthcare, insurance, bpo, … |
| `department` | string | finance, hr, customer-service, ops |
| `systems` | string[] | SAP, DATEV, Outlook, Salesforce |
| `trigger` | string | what starts the process |
| `before` | string | today, with volume and headcount |
| `after` | string | with the agent in place |
| `humanInLoop` | string | **required** — which step keeps an approver |
| `outcome` | object? | `{ metric, value, source }` — absent until citable |
| `timeToProduction` | string | "4 weeks" |
| `complexity` | enum | `starter` \| `standard` \| `complex` |

`humanInLoop` required and `outcome.source` required-when-present are the two rules that
keep the catalog honest. Enforce them in the compile script so a bad record fails the
build rather than reaching a partner.

### 0.2 The change chain

In order — each step is small, and the build breaks loudly if one is skipped:

| # | File | Change |
| --- | --- | --- |
| 1 | `catalog/use-cases.yaml` | New file, 3 records to start |
| 2 | `scripts/compile-catalog.mjs` | `useCases: loadItems("use-cases.yaml")`; add to the summary log; add the two validation rules |
| 3 | `convex/catalogTypes.ts` | `ContentKind` += `"use-case"`; add `CatalogUseCase`; add `useCases` to `PartnerCatalog`; add `useCaseSlugs` to `CatalogWorkspace` |
| 4 | `convex/lib/validators.ts` | `contentKindValidator` += `v.literal("use-case")`; add `complexityValidator` |
| 5 | `convex/schema.ts` | Optional use-case fields on `contentItems` — keep them optional so existing rows stay valid |
| 6 | `convex/seed.ts` | Include `catalog.useCases` in the seeded set and `useCaseSlugs` in workspace grants |
| 7 | `catalog/workspaces/*.yaml` | `useCaseSlugs:` per workspace; `use-cases` in `enabledSurfaces` |
| 8 | `app/(partner)/w/[workspaceSlug]/use-cases/page.tsx` | Index, filterable |
| 9 | `app/(partner)/w/[workspaceSlug]/use-cases/[slug]/page.tsx` | Detail |
| 10 | `components/app-sidebar.tsx` | Nav entry, gated on `enabledSurfaces` |
| 11 | `tests/isolation.test.ts` | One workspace cannot read another's use cases |

Mirror `tools/page.tsx` and `tools/[slug]/page.tsx` for the two new pages — same data
access shape, same card patterns, no new conventions.

### 0.3 Verify

```bash
pnpm catalog:compile && pnpm typecheck && pnpm test
```

**Exit:** three use cases visible at `/w/partner-demo/use-cases`, absent from a workspace
they are not granted to, isolation test green.

---

## Stage 1 — Content and tracks (Mon 15 – Fri 19 Sep)

### 1.1 Use case catalog to 12–15 entries — *critical path*

The bulk of Phase 1's effort, and it is writing, not coding. Depth in **finance** and
**BPO / customer service**.

Source material already in the repo, which is better than anything researched externally:

- `docs/reference/partner-pain.md` — real PwC ME, BID and Roland Berger call synthesis.
  Named examples: Fraisa-style order processing from a unified inbox with evals, exception
  branches, CRM write-back and SharePoint audit log; Mizan with 37 SAP variants on
  source-to-pay and invoice exceptions; Americana on 30-year on-prem Oracle.
- `docs/reference/faq-seed.md`, `docs/reference/tool-map.md`
- `catalog/faq.yaml` — 22 answers already carrying approved claims

**Start each record from an approved claim, not from a blank page.** Anything without
provenance ships with `outcome` absent and `status: pending` rather than an invented number.

### 1.2 Tracks by business model

| # | File | Change |
| --- | --- | --- |
| 1 | `convex/lib/validators.ts` | `trackValidator` — `sell` \| `build` \| `operate` |
| 2 | `convex/schema.ts` | `track` on `memberships` (optional), `defaultTrack` on `workspaces` |
| 3 | `convex/partner.ts` | Return track from `getWorkspaceSession`; a mutation to set it |
| 4 | `components/workspace-context.tsx` | Carry track through context |
| 5 | `app/(partner)/w/[workspaceSlug]/home/page.tsx` | Order the three home tracks by the partner's track |
| 6 | `app/(partner)/w/[workspaceSlug]/tools/page.tsx` | Surface track-relevant tools first |

**Track is presentation, never permission.** Authorization stays with membership and
`workspaceId`. Add a test asserting a track change does not alter what content is
readable.

### 1.3 Compliance library

Either a `compliance` kind or a `group` on materials — prefer `group`, since the content
model already supports grouping and it avoids a schema change. Assemble GDPR, ISO 27001,
SOC 2 Type II, HIPAA, EU/GCC hosting and the on-premises option, each with audience and
claim-review metadata.

**Exit for Stage 1:** catalog complete; a BPO and an SI see different home screens;
compliance documents are findable in one place.

---

## Stage 2 — The program (Mon 22 – Fri 26 Sep)

### 2.1 Certification progress

**Blocked on open decision #4** — two specs disagree on the ladder. Settle it before
building progress tracking against the wrong one.

| # | File | Change |
| --- | --- | --- |
| 1 | `convex/schema.ts` | `certifications` table: `userId`, `workspaceId`, `certificationSlug`, `state` (`not-started`/`in-progress`/`passed`), `passedAt`, `evidenceUrl` |
| 2 | `convex/partner.ts` | `listMyCertifications`, `recordCertificationProgress` — membership-checked |
| 3 | `lib/certifications.ts` | Keep as the static definition; state lives in Convex |
| 4 | `app/(partner)/w/[workspaceSlug]/certifications/page.tsx` | Real progress instead of hardcoded "0 of 4" |

### 2.2 Firm tier

Derived, never stored — recompute from certifications held plus deployed agents, so it
cannot drift out of sync.

Then the gate that matters: **deal registration and co-sell require at least one certified
person.** In Phase 1 that is the tier rendering the requirement and the request form
stating it; the enforcement lands with deal registration in Phase 1.5.

### 2.3 Scorecard

New surface `app/(partner)/w/[workspaceSlug]/scorecard/page.tsx`, gated on
`enabledSurfaces`. Shows tier, certified people, agents in production, and **the specific
next action that moves the firm up**. That last line is the point of the page — without
it, tiers are decorative.

**Exit for Stage 2:** a partner sees their tier and what moves them up.

---

## Stage 3 — Land it (Mon 29 – Wed 30 Sep)

1. Full check: `pnpm catalog:compile && pnpm typecheck && pnpm test && pnpm test:e2e`
2. Review with Derya and Fred — claim review on every new use case before publish
3. Anything without provenance ships `pending`, not invented
4. Decide deployment (open decision #8) — this repo has no Vercel or Convex project
5. Write up what is worth contributing back to `beam-library`

---

## Working rules

- **Upstream is read-only.** Never edit, commit or push to `beam-ai-team/beam-library`.
- **Keep the diff clean.** Follow existing patterns; upstream compatibility is worth more
  than personal preference.
- **`workspaceId` on every read and write.** No exceptions.
- **`pnpm test` before every commit.** The isolation tests are the spec's acceptance
  criteria — if they break, the tenancy model is broken.
- **Ship surfaces dark.** Build behind `enabledSurfaces`, switch on when content is ready.
- **Never invent a number.** Absent `outcome` beats a fabricated one; provenance is what
  makes a partner trust the catalog twice.

---

## Sequencing note

Stage 0 is deliberately three days for one use case. That is not slow — it is the whole
pipeline, from YAML through Convex to a rendered page with an isolation test. Once it
works, entries 4 through 15 are content, and the two surfaces in Stage 2 follow patterns
that already exist.

The plan's real risk is not engineering. **It is whether 12–15 use cases get written with
real provenance, by someone other than Muaaz, inside two weeks.**
