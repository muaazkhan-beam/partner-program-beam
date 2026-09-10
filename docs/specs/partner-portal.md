# Beam Partner: Product Plan

Status: implemented (v1 shell)

The v1 application lives in [`apps/partner/`](../../apps/partner/). It is a sibling
Next.js app with its own Convex backend. Do not point it at Core's Convex
deployment or widen Core's staff gate.

Primary repository: `beam-ai-team/beam-library`. Keep Partner in this monorepo.
Provision a **new Vercel project** (root `apps/partner`) and a **new Convex
project**; do not create a second GitHub repo and do not reuse the `beam-core`
Vercel project.

Vercel must use a production Convex deploy key on Production and a preview
deploy key on Preview. Do not set a static production `NEXT_PUBLIC_CONVEX_URL`
for both. Preview backends run `internal.seed.seedPreview` once. The target
Better Auth allowlist is `partner.beam.ai`, `*.partner.beam.ai`, and
`*.vercel.app`. The current implementation still carries the provisional
plural hostname; migrate the resolver, catalog hostnames, OAuth redirects,
documentation, and tests together during the DNS cutover. Setup steps:
[`apps/partner/README.md`](../../apps/partner/README.md).

Related: [`skills/general/partner-portal/SKILL.md`](../../skills/general/partner-portal/SKILL.md)

Enablement MVP: [`partner-enablement-mvp.md`](partner-enablement-mvp.md)

Current rollout target: one multi-tenant app at `partner.beam.ai`, beginning
with Roboyo and Alloyed workspaces. Both use the same application and shared
catalog, with workspace-specific access, branding, and content grants.

Do not reuse `https://core.beam.ai` for partner users.

## 1. Summary

Beam Partner is the consulting-and-channel equivalent of Beam Core. It is one
managed product with separately branded, access-controlled partner workspaces
rather than an app fork for each firm.

Beam Core answers, for staff: which app, repo, skill, or agent should I use.

Beam Partner answers, for an invited partner seller or delivery lead:

1. Which partner workspace am I in, and what am I allowed to use?
2. How do I take Beam to a client without losing the SAP / Oracle / Anaplan
   argument?
3. Which materials may I forward, and which are internal-only?
4. What is the first deal shape: one client, one workflow?
5. How do I request Beam support with a clear owner and status?

It is an index, enablement surface, and later a request path into live Beam
products. It does not replace Platform, Iris, Discovery, or Shares, and it
does not open Core's staff catalogs.

## 2. Why now

Partner conversations are stalling on **market activation**, not on missing
screenshots of the graph editor. Partners need a clear market story, an
approved first-workflow motion, deployment and ownership answers, and a
practical enablement path without relying on one-off decks or staff support.

Internally we already have the ingredients: Core's app shell and auth
patterns, Library partner skills, GTM partner kits, Iris, Discovery, Platform,
Interfaces, Shares. They are not packaged as something a non-`@beam.ai` human
can use safely.

## 3. Product name and boundary

Use **Beam Partner** as the shared product name. A workspace can present
itself as “Partner × Beam” or “Powered by Beam” without forking the
application.

Keep Beam Core staff-only:

- Google sign-in
- Exact `@beam.ai` domain
- `hd` restriction
- StaffGate on every authenticated page

Beam Partner is a sibling application in `apps/partner/`, with a separate
deployment, partner authentication boundary, and partner data model. Core
staff queries must not be reused as a partner API.

## 4. Tenant workspaces, branding, and URLs

The unit of tenancy is a **partner workspace**: one partner organisation, its
memberships, approved content collections, enabled tools, support route, and
brand presentation. One person may be a Beam staff member in many workspaces;
a partner user normally belongs to one.

### URL model

Use a canonical path URL for reliable operations and a friendly partner URL
for the partner-facing experience:

| Use | URL shape | Example |
| --- | --- | --- |
| Canonical workspace route | `https://partner.beam.ai/w/{workspaceSlug}` | `https://partner.beam.ai/w/roboyo` |
| Partner primary URL | `https://{partnerSlug}.partner.beam.ai` | `https://roboyo.partner.beam.ai` |
| Later custom domain | verified partner-owned domain | `https://beam.partner-example.com` |

Both canonical and primary URLs resolve to the same `workspaceId`; the host is
presentation and routing, never an authorization shortcut. Primary subdomains
are supported in v1. Custom partner-owned domains are a later, approval-gated
capability: verified DNS ownership, managed certificate, security/legal review,
and an explicit redirect/canonical-domain policy. Do not accept arbitrary host
headers or create one deployment per partner.

### Brand modes

Every workspace selects one approved mode. Beam remains visible in the trust
and legal context; the mode changes presentation, not product ownership.

| Mode | Example header | Appropriate use |
| --- | --- | --- |
| Beam standard | Beam Partner | Early or Beam-led motion |
| Co-branded | Partner × Beam | Joint discovery and co-sell |
| Partner-fronted | Partner, powered by Beam | Managed-services / white-label motion after approval |

The default title is **“Future of AI-Native Companies.”** Each workspace can
use the same shell with its own approved copy, tool collection, and materials.
No workspace may upload an unreviewed logo, use a Beam-invisible white-label
mode, or imply exclusivity without commercial approval.

### Workspace configuration and content isolation

An internal staff admin can manage each workspace without engineering a new
site. The workspace record and reviewed content manifest must include:

- `slug`, display name, primary hostname, canonical path, and approved brand
  mode/logo/theme;
- home title, supporting copy, and enabled navigation surfaces;
- member invitations, roles, allowed email domains, and support owner;
- tools and material collections allowed for that workspace;
- per-material audience, forwardability, claim-review state, reviewer, and
  revalidation date; and
- custom-domain status, if applicable.

Content belongs to one of `shared-partner-safe`, `workspace-only`, or
`staff-draft`. Every query and download checks the workspace membership and
material visibility. The same source item may be used by Roboyo and Alloyed only
when explicitly attached to both workspaces; a simple URL must not expose it
to every tenant.

## 5. Users and authentication

| Role | Identity | Sees |
| --- | --- | --- |
| Beam staff | Google `@beam.ai` | Workspaces they are granted; drafts; workspace/invite/claim admin |
| Partner admin | Reserved for later | No v1 administration surface or permissions |
| Partner seller / delivery | Invited allowlisted email | Home, tools, materials, FAQ, playbooks, requests |
| Anonymous | None | Login and an invite-recovery explanation only |

No open registration. An email domain is eligibility, not access: every
partner user needs a named invite or an approved membership row.

### Authentication contract

1. Staff creates a workspace and a named invitation.
2. Beam staff signs in with Google under the same exact `@beam.ai` check as
   Core. Partner users sign in with an invite-only email magic link; partner
   Google is optional only after that organisation approves it.
3. The session resolves to `userId`, `workspaceId`, and `role`. Every server
   function verifies membership server-side before reading or writing.
4. Unknown host, workspace, invite, domain, or membership fails closed. Never
   reuse a Core staff token to impersonate a partner, and never add any partner
   domain to Core's `STAFF_EMAIL_DOMAIN`.

Partner SSO, password accounts, and external-partner user administration are
not v1 requirements.

## 6. Information architecture

```text
/login
/home                         workspace-specific motion
/tools                        partner-safe catalog
/tools/[slug]
/materials                    approved workspace materials
/materials/[slug]
/faq                          reviewed objections and answers
/playbooks                    one-workflow motion
/requests                     start an opportunity / request Beam support
/admin                        Beam staff: workspaces, invites, content, claims
```

Host-based URLs resolve internally to the same workspace routes. Navigation is
shared but workspaces can hide a surface until its content is ready.

## 7. v1 scope

### Home: three motions, not a product wallpaper

The shared layout has three clear tracks. They make the strategic model usable
without forcing partner users to learn the internal labels.

| User-facing track | Internal framing | Default action |
| --- | --- | --- |
| Future of AI-Native Companies | Layer | Explain why Beam complements the stack and shape the account hypothesis |
| First workflow | Beachhead | Name one process, run a diagnostic, agree success criteria, request a shadow demo |
| Risk & delivery readiness | Clearance | Use approved deployment/independence proof and escalate restricted questions |

The default home headline is **“Future of AI-Native Companies.”** The first
workflow path uses four steps: qualify the client, run a 60-minute diagnostic,
show a shadow workflow, and agree success criteria. A workspace may change the
supporting copy, examples, and ordering, but not the security or request
workflow.

### Tools, materials, and FAQ

See `skills/general/partner-portal/references/tool-map.md` for the allowed
tool catalog. Each tool card states what it is, when to use it, what the
partner can do alone, and how to request Beam.

Materials are reviewed records, not loose links. Each declares title, format,
workspace collection, audience (`partner-internal`, `client-forwardable`, or
`technical`), forwardability, brand mode allowed, claim-review state,
reviewer, review date, and revalidation date. Seed only from outputs a human
has marked partner-safe. Customer stories and regional/security claims remain
hidden until approved.

FAQ answers are staff-published and carry the same claim-review state.
Partners may suggest questions but cannot publish or turn a draft answer into
a client-facing statement.

### Opportunity request

“Start a client opportunity” is a small v1 request, not a CRM replacement.
It captures workspace, named account (when permitted), candidate process,
stage, requested Beam support, and a concise problem statement. It returns a
request ID, owner, and status, then can hand off to Linear/Slack initially.
Do not ask partners to upload client data or use it as a deal room.

### Staff administration

v1 has one global admin restricted to Beam staff. It supports workspace
creation/configuration, domain and access-policy settings, invitations,
membership grants, reviewed material attachment, claim approval, request
assignment, and a minimal audit trail. It intentionally excludes a rich CMS,
arbitrary partner theming, and all partner-facing administration.

## 8. v1.1 and later

Only after one live partner slice:

- Partner SSO and verified custom domains
- Partner-safe artifact studio with review gate
- Provisioned demo workspace and FDE request
- Deal room for one named account
- Sell certification
- Joint pipeline (read-only from HubSpot, never a second CRM)
- External partner-admin workflows after permissions and audit requirements
  are proven

## 9. Implementation handoff

Build `apps/partner/` as a sibling Next.js application using the existing
Beam design system and patterns, but make the following choices explicit:

1. Deploy separately at `partner.beam.ai`; resolve canonical paths and
   approved partner subdomains through a single workspace resolver.
2. Use a separate partner auth/data boundary (partner users, workspaces,
   memberships, content grants, invitations, and requests). Do not choose the
   ambiguous “shared table or separate component” option during implementation.
3. Store non-secret workspace and content configuration in a reviewed,
   versioned catalog or staff admin records; files and Shares links remain
   references, not copied GTM deal rooms.
4. Enforce `workspaceId` in every data access and material delivery path.
   A `workspaceSlug` in the browser is never sufficient authorization.
5. Preserve Core's staff gate and catalog unchanged. No GitHub App, repository
   sync, cost dashboard, Prism cards, price books, or staff systems appear in
   Partner.

The first implementation sequence is: workspace resolver and access tests;
shared shell and three-track home; tools/materials/FAQ with claim metadata;
then requests and staff administration. A staff-only Core prototype is
acceptable only as a meeting aid; it is not a substitute for the partner app.

Required acceptance tests include:

- Roboyo and Alloyed resolve to different workspace context at both canonical and
  approved primary URLs;
- neither organisation can enumerate, fetch, or link to the other's materials,
  requests, or memberships;
- an invited magic-link user can access only their workspace, and an unknown
  email/host fails closed;
- staff can manage two workspace configurations and attach a reviewed material
  without creating a code fork; and
- a restricted deployment, sovereignty, pricing, or independence question
  routes to Beam rather than claiming an unreviewed answer.

## 10. Success criteria

The app is working when invited users from Roboyo and Alloyed can,
without a Beam person on the call:

1. Sign in at their own partner URL.
2. See only their own approved brand, tools, and materials.
3. Answer “why not SAP” from the reviewed FAQ.
4. Download one approved intro pack.
5. Name a candidate process and create a traceable request for a shadow demo.

It is not working if it is a prettier Core with the staff gate removed, or if
each new partner needs a forked codebase and deployment.

## 11. Open questions (do not block the v1 shell)

- Final primary hostname wording and trademark approval for partner-facing
  subdomains.
- Whether an initial partner requires Google or enterprise SSO before pilot.
- Which brand mode and approved logo assets each partner may use.
- Whether the first demo workspace is Beam-hosted or a white-labeled Platform
  tenant.
- Regional exclusive language and any country-specific deployment statement; both
  require commercial/security approval before publishing.

## 12. Out of scope

- Joint-venture legal workflows and exclusivity commitments.
- Replacing HubSpot or a partner CRM.
- Training a partner to operate the full SE CLI.
- Opening Iris authoring, Shares publishing, Platform admin, GTM Core, or Core
  staff catalogs to partners.
- Partner-owned custom domains, arbitrary white-labeling, or external content
  publishing in v1.
- Changing Core's `@beam.ai` staff gate.
