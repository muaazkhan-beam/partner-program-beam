# Spec Delta — `partner-portal.md` vs. the implementation

Section-by-section audit of [`../specs/partner-portal.md`](../specs/partner-portal.md)
against the code in [`../../apps/partner/`](../../apps/partner/).

Verified 11 September 2026 by reading the code, not the commit messages. Every claim below
points at a file. Paths are relative to `apps/partner/`.

**Legend:** ✅ done · 🟡 partly done · ❌ not done · ➕ built beyond spec

---

## Summary

| Status | Count |
| --- | --- |
| ✅ Done | 31 |
| 🟡 Partly done | 8 |
| ❌ Not done | 7 |
| ➕ Beyond spec | 2 |

**The shell is real.** Tenancy, auth, content governance, the three-track home, tools,
materials, FAQ, playbooks and requests are all implemented and tested.

**The gap is concentrated in one place: staff administration.** The spec's central promise
is that *"an internal staff admin can manage each workspace without engineering a new
site."* Today a workspace is a YAML file that must be edited and re-seeded. That is the
single largest delta, and it is what stands between v1 and onboarding a partner without a
developer.

**Three quieter gaps worth knowing:** `allowedBrandModes` is stored but never enforced;
`reviewedAt` / `revalidateAt` exist in the schema but cannot be expressed in the catalog;
and there is no audit trail at all.

---

## §3 — Product name and boundary

| Spec requirement | Status | Where |
| --- | --- | --- |
| Sibling app in `apps/partner/`, separate deployment | ✅ | Whole app; `vercel.json`, `convex.json` |
| Separate partner auth/data boundary | ✅ | `convex/schema.ts` — `partnerUsers`, `memberships`, own Convex project |
| Core staff gate unchanged, Google + exact `@beam.ai` + `hd` | ✅ | `convex/auth.ts:69-72` — `hd: staffDomain` |
| Core staff queries not reused as a partner API | ✅ | `convex/partner.ts` is self-contained |

---

## §4 — Tenant workspaces, branding, and URLs

### URL model

| Spec requirement | Status | Where |
| --- | --- | --- |
| Canonical route `/w/{workspaceSlug}` | ✅ | `app/(partner)/w/[workspaceSlug]/` |
| Partner primary URL `{slug}.partners.beam.ai` | ✅ | `lib/workspace-resolver.ts:8-12`, `convex/lib/partnerHosts.ts` |
| Both resolve to the same workspace; host is never authorization | ✅ | `resolveWorkspaceSlug()`; `requireMembership()` on every query |
| Host/path mismatch fails closed | ✅ | `workspace-resolver.ts:33-35`; test: *"unknown hosts and host/path mismatches fail closed"* |
| Subdomain paths rewrite onto canonical route | ✅ | `rewriteSubdomainPath()`, `proxy.ts` |
| Custom partner-owned domains — later, approval-gated | ✅ | Correctly deferred: `customDomainStatusValidator = v.literal("none")` |
| Do not accept arbitrary host headers | ✅ | `classifyPartnerHost()` allowlist |

**Note:** the spec says `partner.beam.ai` (singular); the code, catalog and README all say
`partners.beam.ai` (plural). The spec acknowledges this and requires resolver, catalog
hostnames, OAuth redirects, docs and tests migrate together at DNS cutover. Not a defect —
an open decision.

### Brand modes

| Spec requirement | Status | Where |
| --- | --- | --- |
| Three modes: beam-standard, co-branded, partner-fronted | ✅ | `convex/lib/validators.ts:3-7` |
| Workspace selects one approved mode | ✅ | `workspaces.brandMode`; `catalog/workspaces/*.yaml` |
| Mode changes presentation | 🟡 | Rendered only as a header badge — `home/page.tsx:29` |
| Per-material "brand mode allowed" | ❌ | **`allowedBrandModes` is stored and seeded but never read.** Only three references exist — `schema.ts:97`, `seed.ts:59`, `catalogTypes.ts:26` — and none is a filter. A material restricted to `beam-standard` still renders in a `partner-fronted` workspace. |
| Default title "Future of AI-Native Companies" | 🟡 | Per-workspace `homeTitle`; `partner-demo` uses it, `roboyo` overrides. Spec permits the override — but there is no fallback default in code |

### Workspace configuration and content isolation

The spec's required workspace record, item by item:

| Required field | Status | Where |
| --- | --- | --- |
| `slug`, display name, primary hostname, canonical path | ✅ | `schema.ts:21-25` |
| Approved brand mode / logo / theme | 🟡 | `brandMode` + `brandHeader` only. **No logo or theme fields anywhere** |
| Home title, supporting copy, enabled surfaces | ✅ | `homeTitle`, `homeHeadline`, `homeDescription`, `enabledSurfaces` |
| Member invitations, roles, allowed email domains, support owner | ✅ | `invitations`, `membershipRoleValidator`, `allowedEmailDomains`, `supportOwner` |
| Tools and material collections allowed | ✅ | `contentGrants` + `toolSlugs`/`materialSlugs`/`faqSlugs`/`playbookSlugs` |
| Per-material audience, forwardability, claim-review state, reviewer | ✅ | `contentItems` — `audience`, `forwardable`, `claimState`, `reviewer` |
| Per-material **revalidation date** | 🟡 | `reviewedAt` and `revalidateAt` exist in `schema.ts:107-108` but **are not in `CatalogContent`** (`catalogTypes.ts`), so the catalog cannot express them and nothing populates them |
| Custom-domain status | ✅ | `customDomainStatus` |

| Isolation requirement | Status | Where |
| --- | --- | --- |
| Content class: shared-partner-safe / workspace-only / staff-draft | ✅ | `validators.ts:34-38` |
| Every query and download checks membership and visibility | ✅ | `requireMembership()`, `isVisibleToPartner()` — `partner.ts:271,310` |
| Same item usable by two workspaces only when attached to both | ✅ | `contentGrants` join table |
| A URL must not expose an item to every tenant | ✅ | Test: *"neither tenant can read the other's materials, requests, or memberships"* |

---

## §5 — Users and authentication

| Role | Status | Where |
| --- | --- | --- |
| Beam staff — Google `@beam.ai` | ✅ | `auth.ts:69-72`, `isStaffEmail()` |
| Partner admin — reserved, no v1 surface or permissions | ✅ | `partner_admin` exists in `membershipRoleValidator` with no surface. **Correct as specified** |
| Partner seller / delivery — invited allowlisted email | ✅ | `ensureSession` — `partner.ts:466-477` |
| Anonymous — login and invite recovery only | ✅ | `app/login/`, `app/invite/`, `isPublicPath()` |

### Authentication contract

| Spec requirement | Status | Where |
| --- | --- | --- |
| 1. Staff creates workspace and named invitation | 🟡 | Invitation ✅ (`createInvitation`, `partner.ts:513`). **Workspace creation ❌** — see §7 |
| 2. Staff Google under the same exact `@beam.ai` check | ✅ | `auth.ts:69-72` |
| 2. Partner users sign in by invite-only magic link | ✅ | `auth.ts:77` — `magicLink()` plugin |
| 3. Session resolves to `userId`, `workspaceId`, `role` | ✅ | `sessionValidator`, `ensureSession` |
| 3. Every server function verifies membership server-side | ✅ | `requireMembership()` on every query and mutation |
| 4. Unknown host, workspace, invite, domain, membership fails closed | ✅ | `partner.ts:472-474`; tests cover all four |
| 4. Email domain is eligibility, not access | ✅ | `allowedEmailDomains` is stored but deliberately **not** consulted in `ensureSession` — a named invite is always required |

---

## §6 — Information architecture

| Route | Status | Where |
| --- | --- | --- |
| `/login` | ✅ | `app/login/page.tsx` |
| `/home` | ✅ | `app/(partner)/w/[workspaceSlug]/home/page.tsx` |
| `/tools`, `/tools/[slug]` | ✅ | `tools/page.tsx`, `tools/[slug]/page.tsx` |
| `/materials`, `/materials/[slug]` | ✅ | `materials/` |
| `/faq` | ✅ | `faq/page.tsx`, `faq/[slug]/page.tsx` |
| `/playbooks` | ✅ | `playbooks/` |
| `/requests` | ✅ | `requests/page.tsx` |
| `/admin` | 🟡 | Exists (`app/admin/`) but incomplete — see §7 |
| Navigation shared; workspaces can hide a surface | ✅ | `components/app-sidebar.tsx:33` reads `enabledSurfaces` |
| ➕ `/certifications`, `/certifications/[slug]` | ➕ | **Not in the spec's IA.** Four levels in `lib/certifications.ts`, shipped in PR #154 |
| ➕ `/api/share-preview/[slug]` | ➕ | Proxies Beam Shares content for in-portal preview |

---

## §7 — v1 scope

### Home: three motions

| Spec requirement | Status | Where |
| --- | --- | --- |
| Three tracks — Layer, Beachhead, Clearance | ✅ | `trackFramingValidator`; `catalog/workspaces/*.yaml` `tracks:` |
| User-facing titles distinct from internal framing | ✅ | e.g. Roboyo: "Operating layer" / framing `layer` |
| First-workflow path uses four steps | ✅ | `workspaces.steps` — four per workspace |
| Workspace may change copy, examples, ordering | ✅ | All per-workspace YAML |
| But not the security or request workflow | ✅ | Not configurable — hardcoded |

### Tools, materials, FAQ

| Spec requirement | Status | Where |
| --- | --- | --- |
| Tool cards state what/when/alone/how to request Beam | ✅ | `requestBeamLabel` on `contentItems`; `catalog/tools.yaml` |
| Materials declare title, format, collection, audience, forwardability | ✅ | `contentItems` |
| Materials declare brand mode allowed | ❌ | Stored, never enforced — see §4 |
| Materials declare claim-review state, reviewer | ✅ | `claimState`, `reviewer` |
| Materials declare review date and revalidation date | ❌ | Not expressible in the catalog — see §4 |
| Seed only from human-marked partner-safe outputs | ✅ | `catalog/*.yaml` is hand-authored and reviewed |
| Customer stories and regional/security claims hidden until approved | ✅ | `claimState: restricted` + `restrictedReason`; test: *"restricted deployment FAQ returns request-Beam instead of an unreviewed claim"* |
| FAQ staff-published with the same claim-review state | ✅ | `catalog/faq.yaml` — 22 answers |
| Partners may suggest but not publish | ✅ | No partner-facing write path to `contentItems` |

### Opportunity request

| Spec requirement | Status | Where |
| --- | --- | --- |
| Captures workspace, account, process, stage, support type, statement | ✅ | `createRequest` — `partner.ts:366` |
| Returns request ID, owner, status | ✅ | `partner.ts:378-383` — returns `requestKey`, `owner`, `status` |
| Can hand off to Linear/Slack initially | ❌ | **No integration exists.** No reference to Linear, Slack or a webhook anywhere in the app |
| Not a CRM; no client data upload | ✅ | No upload path; warning copy on `requests/page.tsx` |

### Staff administration — *the main gap*

| Spec requirement | Status | Where |
| --- | --- | --- |
| Restricted to Beam staff | ✅ | `app/admin/layout.tsx`, `isStaff` checks |
| **Workspace creation** | ❌ | No `createWorkspace` mutation. Workspaces come only from `catalog/workspaces/*.yaml` via `seed.ts` |
| **Workspace configuration** | ❌ | No update mutation. Changing brand mode, copy or enabled surfaces means editing YAML, recompiling and re-seeding |
| **Domain and access-policy settings** | ❌ | `allowedEmailDomains` is catalog-only; no admin control |
| Invitations | ✅ | `createInvitation` + admin UI — `app/admin/page.tsx:101` |
| Membership grants | 🟡 | Only indirectly, by consuming an invitation in `ensureSession`. No direct grant or revoke |
| Reviewed material attachment | ✅ | `attachContent` — `partner.ts:562`; admin UI at `page.tsx:139` |
| Claim approval | ✅ | `approveClaim` — `partner.ts:590` |
| Request assignment | ✅ | `assignRequest` — `partner.ts:540`; admin UI at `page.tsx:197` |
| **Minimal audit trail** | ❌ | **No audit table and no logging.** Nothing records who invited, attached, approved or assigned |
| Excludes rich CMS, arbitrary theming, partner-facing admin | ✅ | Correctly absent |

> **This is the delta that matters.** The spec's §4 promise — *"An internal staff admin can
> manage each workspace without engineering a new site"* — is not met. Everything about a
> workspace is a YAML file plus a re-seed. Adding a partner today is a code change, which
> is precisely what §10 says the app fails if it requires.

---

## §9 — Implementation handoff

| Spec requirement | Status | Where |
| --- | --- | --- |
| 1. Deploy separately; single workspace resolver | ✅ | `lib/workspace-resolver.ts`, `proxy.ts` |
| 2. Separate partner auth/data boundary, not "shared table or separate component" | ✅ | Own schema, own Convex project |
| 3. Config in a reviewed, versioned catalog **or** staff admin records | ✅ | Versioned YAML catalog. Spec allows either — but see the §7 gap |
| 4. Enforce `workspaceId` in every data access and material delivery path | ✅ | `requireMembership()` throughout |
| 5. Preserve Core's staff gate; no Core systems in Partner | ✅ | No GitHub App, repo sync, cost dashboard, Prism cards or price books present |

### Required acceptance tests

All five are implemented in `tests/`. One is partial:

| Spec test | Status | Test name |
| --- | --- | --- |
| Two workspaces resolve separately at canonical and primary URLs | ✅ | *"PwC and Roboyo resolve separately on canonical path and primary host"* |
| Neither can enumerate, fetch or link to the other's materials, requests, memberships | ✅ | *"neither tenant can read the other's materials, requests, or memberships"* |
| Invited magic-link user accesses only their workspace; unknown fails closed | ✅ | *"an invited user only sees their workspace and unknown email fails closed"* |
| Staff can **manage two workspace configurations** and attach reviewed material without a code fork | 🟡 | *"staff can attach a reviewed material without a code fork"* — **attachment is tested; managing configurations is not, because it is not implemented** |
| Restricted question routes to Beam rather than claiming an unreviewed answer | ✅ | *"restricted deployment FAQ returns request-Beam instead of an unreviewed claim"* |

The spec names Roboyo and Alloyed; the tests and catalog use PwC ME and Roboyo. Alloyed
does not exist anywhere in the code.

---

## §10 — Success criteria

> *"Invited users from two partners can, without a Beam person on the call:"*

| Criterion | Status | Note |
| --- | --- | --- |
| 1. Sign in at their own partner URL | ✅ | Magic link + host resolution |
| 2. See only their own approved brand, tools, materials | ✅ | Content grants + isolation tests |
| 3. Answer "why not SAP" from the reviewed FAQ | ✅ | `catalog/faq.yaml` — `why-not-sap` |
| 4. Download one approved intro pack | 🟡 | Materials carry `shareUrl`/`embedUrl` and render via share-preview. **There is no download action** — the partner gets a preview or an external Shares link |
| 5. Name a candidate process and create a traceable request | ✅ | `createRequest` returns a request key and owner |

> *"It is not working if each new partner needs a forked codebase and deployment."*

No fork is needed — but **each new partner does need a code change** (a YAML file, a
recompile and a re-seed). Better than a fork, short of the promise.

---

## §12 — Out of scope: correctly absent

Verified as *not* present, which is the right outcome: joint-venture legal workflows,
HubSpot/CRM replacement, SE CLI training, Iris authoring, Shares publishing, Platform
admin, GTM Core, Core staff catalogs, partner-owned custom domains, arbitrary
white-labeling, changes to Core's staff gate.

---

## What this means for Phase 1

Ranked by how much they block onboarding a real partner.

1. **Staff workspace administration** — ❌ creation, configuration, access policy, audit
   trail. The spec's own acceptance test for it is only half-covered. **This is arguably a
   v1 completion item, not a Phase 1 enhancement**, and it is the difference between
   onboarding a partner and filing a pull request.
2. **`allowedBrandModes` enforcement** — a governance field that silently does nothing. A
   partner-fronted workspace can currently surface material approved only for Beam-standard.
   Small fix, real exposure.
3. **Review dates** — `reviewedAt` / `revalidateAt` cannot be set from the catalog, so
   content revalidation cannot happen. Two lines in `catalogTypes.ts` and the compile script.
4. **Request handoff to Linear/Slack** — requests currently sit in Convex with an owner
   field and no notification. Whoever owns `partner-success@beam.ai` has no idea a request
   arrived.
5. **Download for approved materials** — success criterion 4 is not literally met.
6. **Logo and theme on workspaces** — required by §4, absent from the schema. Also blocks
   Phase 2 co-branded generation.

Items 2, 3 and 4 are each under a day and close real gaps. **Item 1 is the significant
piece of work**, and it deserves a decision from Asad and Jonas: is finishing staff admin
our job in Phase 1, or Jonas's to complete in the baseline?
