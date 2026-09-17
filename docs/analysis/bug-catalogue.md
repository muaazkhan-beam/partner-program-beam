# Bug Catalogue — Beam Partner app

First pass over Jonas's app as of upstream `cf3841d`, on branch `work/muaaz`.
Compiled 17 September 2026.

Every entry was verified by reading the code or exercising the running app — none are
inferred. Paths are relative to `apps/partner/`.

**Severity**

- **High** — data loss, access that cannot be revoked, or a security/governance hole
- **Medium** — a feature that does not work as specified, or a gap that will bite in use
- **Low** — correctness and polish; no user is blocked

Some of these may be deliberate decisions of Jonas's rather than oversights. Flagged where
that seems likely — worth asking before changing.

---

## Summary

| # | Severity | Issue | Area |
| --- | --- | --- | --- |
| 1 | **High** | Re-seeding silently reverts every admin edit | Admin / seed |
| 2 | **High** | Access cannot be revoked — no way to remove a member or cancel an invite | Access |
| 3 | **High** | No audit trail, though the spec requires one | Governance |
| 4 | Medium | Admin-created workspaces are missing the Agents surface | Admin |
| 5 | Medium | `enabledSurfaces` cannot be changed after creation | Admin |
| 6 | Medium | Content can be attached to a workspace but never detached | Admin |
| 7 | Medium | `allowedBrandModes` is stored but never enforced | Governance |
| 8 | Medium | Review and revalidation dates cannot be set from the catalog | Governance |
| 9 | Medium | Requests notify nobody | Requests |
| 10 | Medium | Restricted claims redact only the body | Governance |
| 11 | Low | An unknown workspace renders a shell instead of 404 | Routing |
| 12 | Low | Validation failures are thrown as access errors | Requests |
| 13 | Low | Invitation expiry is client-supplied, and duplicates are allowed | Access |

---

## High

### 1. Re-seeding silently reverts every admin edit

`convex/seed.ts:seedCatalogData` · `convex/partner.ts:updateWorkspaceConfiguration`,
`approveClaim`

The seed **replaces** rather than merges:

```ts
const workspaceId = existing
  ? (await ctx.db.replace(existing._id, fields), existing._id)
  : await ctx.db.insert("workspaces", fields)
```

`fields` is built entirely from the YAML catalog. `upsertContent` does the same for content
items. So for any workspace or content item that exists in `catalog/`, a re-seed overwrites
whatever is in the database.

Both admin mutations write to exactly those documents. `updateWorkspaceConfiguration`
patches display name, brand mode, headline, description, support owner and allowed domains.
`approveClaim` patches `claimState`, `reviewer`, `reviewedAt` and `revalidateAt`.

**All of it is reverted by the next re-seed.** The admin panel exposes *Seed reviewed
catalog* as a button, so the loss is one click away and silent — no warning, no diff, no
record that anything changed.

**Reproduce:** edit PwC ME's display name in `/admin`, then run *Seed reviewed catalog*. The
edit is gone.

**Worst case:** staff approves a restricted claim, a re-seed reverts it to `restricted`, and
a partner who saw the approved answer now cannot. Or the reverse — a claim deliberately
restricted after review silently returns to `approved`.

**Fix direction:** the catalog should seed only what does not exist, or the two should be
reconciled explicitly — a merge that preserves reviewed state, or a clear "catalog is the
source of truth, admin edits are temporary" rule surfaced in the UI. This is a design
decision, not just a patch, and is worth putting to Jonas.

---

### 2. Access cannot be revoked

`convex/partner.ts`

There is no mutation to remove a membership, revoke an invitation, or deactivate a user.
`createInvitation` exists; nothing undoes it. `ensureSession` creates memberships; nothing
removes them.

So when someone leaves a partner firm, their access persists. The only remedies are editing
the database directly or removing the domain from the workspace — which does not help,
because `ensureSession` only checks domains when creating a *new* membership. An existing
membership is never re-validated.

This is also the one operating rule Lovable states explicitly and we do not implement:
prompt off-boarding of team members when an engagement ends. A partner's own client security
team will ask about it.

**Fix direction:** `removeMembership` and `revokeInvitation`, staff-only, with the audit
entry from #3.

---

### 3. No audit trail

`convex/schema.ts`

The spec requires staff administration to include "a minimal audit trail". There is no audit
table and no logging anywhere. Nothing records who created a workspace, invited whom,
attached which content, approved which claim, or assigned which request.

For a product whose whole governance model is about which claims are approved and who may
see what, this is the missing half. It also makes #1 undetectable — there is no way to see
that a re-seed reverted a reviewed decision.

**Fix direction:** one `auditEvents` table — actor, action, target, timestamp, and a small
payload — written by every staff mutation. Cheap now; much harder to backfill later.

---

## Medium

### 4. Admin-created workspaces are missing the Agents surface

`convex/partner.ts:createWorkspace`

`enabledSurfaces` is hardcoded on creation:

```ts
enabledSurfaces: ["home", "tools", "materials", "faq", "certifications", "requests"]
```

All four seeded workspaces enable `agents` in their YAML. A workspace created through the
admin panel does not. So onboarding a new partner via the admin route — the intended path —
produces a portal missing a surface every existing partner has.

Likely just drift from when Agents was added. Small fix, easy to miss.

---

### 5. `enabledSurfaces` cannot be changed after creation

`convex/partner.ts:workspaceConfigurationValidator` · `app/admin/partners/[workspaceSlug]/`

The field is absent from the configuration validator and from the admin UI. Combined with
#4, a surface can never be turned on or off for any workspace except by editing YAML and
re-seeding.

The spec says navigation "is shared but workspaces can hide a surface until its content is
ready." That is currently not achievable through administration — which is the promise the
admin panel exists to keep.

---

### 6. Content can be attached but never detached

`convex/partner.ts:attachContent`

`attachContent` creates a `contentGrants` row. Nothing removes one. Content granted to a
workspace by mistake — or content later deemed unsuitable for that partner — cannot be taken
back through the product.

Note the seed only ever *adds* missing grants, so a re-seed will not clean this up either.

---

### 7. `allowedBrandModes` is stored but never enforced

`convex/schema.ts:97` · `convex/seed.ts:59` · `convex/catalogTypes.ts:26`

Three references exist. All three are storage. **Nothing reads the field to make a
decision.**

Every content item declares which brand modes it may appear under — for example, the
executive overview is approved for `beam-standard` and `co-branded` only. A
`partner-fronted` workspace will still surface it, because no query or component filters on
it.

This is a governance control that silently does nothing, which is worse than not having it:
content is authored on the assumption that the restriction is enforced.

**Fix direction:** filter in `listGrantedContent` against the workspace's `brandMode`, and
add a test. Small change, real exposure.

---

### 8. Review and revalidation dates cannot be set from the catalog

`convex/catalogTypes.ts:30` · `convex/seed.ts:70-71`

`contentItems` has `reviewedAt` and `revalidateAt`. `CatalogContent` has only `reviewer`. So
the catalog cannot express either date, and the seed synthesises them instead:

```ts
reviewedAt: item.reviewer ? now : undefined,
revalidateAt: item.reviewer ? now + 90 * 24 * 60 * 60 * 1000 : undefined,
```

Every re-seed therefore resets the review clock to now. Content can never actually fall due
for revalidation, because the date moves forward every time anyone seeds. The workspace
record is specified to carry a "revalidation date" per material; in practice it is a rolling
90 days from the last seed.

---

### 9. Requests notify nobody

`convex/partner.ts:createRequest`

A request is written with `owner` set to the workspace's `supportOwner`, and that is the end
of it. No email, no Slack, no Linear. No reference to any of them exists in the app.

The spec says a request "returns a request ID, owner, and status, then can hand off to
Linear/Slack initially." The hand-off was never built, so whoever owns
`partner-success@beam.ai` has no idea a request arrived unless they open the admin panel.

For the one feature that exists to unblock a partner, silent delivery is close to no
delivery.

---

### 10. Restricted claims redact only the body

`convex/lib/access.ts:partnerFacingContent`

When `claimState === "restricted"`, the body is replaced with a request-Beam message. The
`summary`, `title` and `group` pass through untouched.

Today this is safe — both restricted items have summaries written to avoid the claim
("Restricted. Do not state residency or on-prem as a generic promise."). But that safety
comes from authoring discipline, not from the code. The next author who writes a summary
containing the claim will bypass redaction without knowing.

**Fix direction:** redact the summary too, or validate at compile time that a restricted
item's summary is safe — the same shape as the use case guard.

---

## Low

### 11. An unknown workspace renders a shell instead of 404

`/w/does-not-exist/home` returns **HTTP 200** and renders the application shell with an
error inside it.

The spec is explicit that an unknown workspace should fail closed. A 200 also means
crawlers, uptime checks and link checkers see success. Should be a 404.

---

### 12. Validation failures are thrown as access errors

`convex/partner.ts:createRequest`

```ts
if (args.candidateProcess.trim().length < 4) {
  throw new PartnerAccessError("Name the candidate process")
}
```

A too-short field is not an access failure. Callers cannot distinguish "you may not do this"
from "you filled the form in wrong", and any client-side handling that treats
`PartnerAccessError` as a session problem will mislead the user.

---

### 13. Invitation expiry is client-supplied, and duplicates are allowed

`convex/partner.ts:createInvitation`

`expiresAt` is passed in by the caller rather than derived server-side, so the expiry window
is whatever the client sends. Staff-only, so the risk is low — but the server should own it.

There is also no duplicate check: the same email can be invited to the same workspace
repeatedly, leaving multiple live invitations. `ensureSession` takes up to five and uses the
first valid one.

---

## What is not broken

Worth recording, since it was checked:

- **Tenant isolation holds.** Every read and write goes through `requireMembership`, and the
  tests cover cross-tenant reads, unknown emails and host/path mismatches. 20 tests pass.
- **Host resolution fails closed.** Unknown hosts, host/path mismatches and unreviewed entry
  paths are all rejected.
- **Invitations enforce the workspace's allowed domains**, and a domain alone never grants
  access — a named invite is always required.
- **Staff-draft content is invisible to partners**, and restricted claims route to Beam
  rather than showing an unreviewed answer.
- **Every surface renders**: home, tools, materials, faq, certifications, requests, agents
  and admin all return 200.

---

## Suggested split

Roughly balanced, and the two halves do not touch the same files.

| Owner | Items |
| --- | --- |
| **Muaaz** | 1 (seed vs admin), 7 (brand modes), 8 (review dates), 10 (redaction) — the governance and data-model half |
| **Asad** | 2 (revocation), 3 (audit trail), 4, 5, 6 (admin gaps) — the administration half |
| **Either** | 9, 11, 12, 13 |

**Raise with Jonas before changing:** #1 is a design decision about whether the catalog or
the admin panel is the source of truth. #3 may already be on his list.
