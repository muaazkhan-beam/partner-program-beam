# Beam Partner

Sibling application to Beam Core. Consulting and channel partners use it;
`@beam.ai` staff keep Core. Do not add partner domains to Core
`STAFF_EMAIL_DOMAIN`.

Canonical product contract: [`../../specs/apps/partner-portal.md`](../../specs/apps/partner-portal.md).

## Topology

Keep **one GitHub repo**. Create **two new cloud projects**. Do not fork
Partner into its own repository, and do not reuse Core's Vercel or Convex.

| Layer | Use | Do not use |
| --- | --- | --- |
| GitHub | `beam-ai-team/beam-library`, app at `apps/partner/` | A new `beam-partner` repo, or a fork per firm |
| Vercel | New project, root directory `apps/partner`, later `partners.beam.ai` | Existing `beam-core` project (`apps/web` → `core.beam.ai`) |
| Convex | New project whose functions live in `apps/partner/convex/` | Core's root `convex/` deployment |

The GitHub Vercel check on Partner PRs currently reports the existing
**beam-core** project. That preview does not exercise this app. Partner
previews start only after the **beam-partner** Vercel project exists.

## Local development

Use a **separate** Convex deployment from Core. From this directory:

```bash
pnpm install
pnpm catalog:compile
CONVEX_AGENT_MODE=anonymous pnpm convex:dev
```

In another terminal:

```bash
pnpm dev
```

The app listens on `http://127.0.0.1:3001`. Open a workspace at
`/w/partner-demo/home`.

Optional local bypass (named membership only, never every tenant):

```bash
NEXT_PUBLIC_LOCAL_AUTH_BYPASS=true
NEXT_PUBLIC_PARTNER_BYPASS_WORKSPACE=partner-demo
NEXT_PUBLIC_PARTNER_BYPASS_EMAIL=demo@partner.example
```

## Production setup

This environment cannot create Beam's Vercel or Convex team projects. A Beam
admin with dashboard access should do the following once, after this branch
is ready to merge.

### 1. Convex project (create this first)

1. In [Convex](https://dashboard.convex.dev), team **Beam**, create a project
   named **beam-partner** (not beam-core).
2. From `apps/partner` on a trusted machine:

   ```bash
   npx convex login
   npx convex dev --configure=new
   ```

   Point the CLI at the new project. Do not select Core's deployment.
3. Generate `BETTER_AUTH_SECRET` (`openssl rand -base64 32`) and set **project
   default** Convex env so previews inherit it:

   ```bash
   pnpm exec convex env set SITE_URL https://partners.beam.ai
   pnpm exec convex env set BETTER_AUTH_SECRET '<secret>'
   pnpm exec convex env set STAFF_EMAIL_DOMAIN beam.ai
   pnpm exec convex env set GOOGLE_CLIENT_ID '<id>'
   pnpm exec convex env set GOOGLE_CLIENT_SECRET '<secret>'
   pnpm exec convex env set RESEND_API_KEY '<key>'
   pnpm exec convex env set PARTNER_MAGIC_LINK_FROM 'Beam Partner <partners@beam.ai>'
   ```

   `SITE_URL` is the Better Auth **fallback** only. Allowed request hosts are
   `partners.beam.ai`, `*.partners.beam.ai`, localhost, and `*.vercel.app`.
4. Generate two deploy keys:

   | Key | Vercel environment |
   | --- | --- |
   | Production deploy key | Production only |
   | Preview deploy key | Preview only |

   Both Vercel variables are named `CONVEX_DEPLOY_KEY`. Use two values. Do
   **not** put the production key on Preview.

### 2. Vercel project

1. In Vercel team **beam-ai-team**, **Add New → Project** from
   `beam-ai-team/beam-library`.
2. Name it **beam-partner**. Do not import into the existing **beam-core**
   project.
3. Settings:

   | Setting | Value |
   | --- | --- |
   | Root Directory | `apps/partner` |
   | Include files outside Root Directory | On |
   | Framework | Next.js (from `vercel.json`) |
   | Install / Build / Ignore | From `apps/partner/vercel.json` |
   | Production domain | `partners.beam.ai` |
   | Wildcard | `*.partners.beam.ai` |

   The build command deploys Convex, then builds Next, and on **new preview
   backends only** runs `internal.seed.seedPreview`.
4. Environment variables:

   | Name | Environment | Notes |
   | --- | --- | --- |
   | `CONVEX_DEPLOY_KEY` | Production | Partner production deploy key |
   | `CONVEX_DEPLOY_KEY` | Preview | Partner **preview** deploy key |

   Do **not** set `NEXT_PUBLIC_CONVEX_URL` or `NEXT_PUBLIC_CONVEX_SITE_URL` in
   Vercel. `npx convex deploy` injects the matching deployment URLs into the
   frontend build. A static production Convex URL on Preview would point PRs
   at production data.

   Leave `NEXT_PUBLIC_LOCAL_AUTH_BYPASS` unset on Production.

5. On the existing **beam-core** Vercel project, set an ignored build step so
   Partner-only commits do not rebuild Core, for example:

   ```bash
   git diff --quiet HEAD^ HEAD -- apps/web convex packages pnpm-lock.yaml pnpm-workspace.yaml package.json
   ```

### 3. Google OAuth and DNS

Reuse Beam's existing Google OAuth client if it is staff-only with `hd=beam.ai`.
Add exact redirect URIs (Google does not allow wildcards):

- `https://partners.beam.ai/api/auth/callback/google`
- `https://pwc-me.partners.beam.ai/api/auth/callback/google`
- `https://roboyo.partners.beam.ai/api/auth/callback/google`
- `http://127.0.0.1:3001/api/auth/callback/google`

Vercel preview Google sign-in will not work until each preview URL is added.
Use membership-scoped preview bypass for PR QA. Magic links follow the
request host.

Point DNS at the new Vercel project:

- `partners.beam.ai`
- `*.partners.beam.ai`

### 4. After the first production deploy

Sign in with `@beam.ai` Google, open `/admin`, and run **Seed reviewed
catalog** if production was not empty-seeded. Preview backends seed
automatically via `--preview-run`. Then invite a named PwC user; domain
membership is not enough.

## Environment

Set these on the Partner Convex deployment (not Core):

- `SITE_URL` — fallback origin (`https://partners.beam.ai` in production)
- `BETTER_AUTH_SECRET`
- `STAFF_EMAIL_DOMAIN=beam.ai`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — staff Google, `hd=beam.ai`
- `RESEND_API_KEY` — production magic links; without it, links are stored in
  `magicLinkOutbox` and may be logged only when `ALLOW_MAGIC_LINK_LOG=true` or
  `SITE_URL` is localhost
- `PARTNER_MAGIC_LINK_FROM` — optional From address
- `PARTNER_AUTH_EXTRA_HOSTS` — optional comma-separated extra Better Auth
  hosts; never tenancy

Vercel:

- `CONVEX_DEPLOY_KEY` — Production key on Production, preview key on Preview
- Do not set `NEXT_PUBLIC_CONVEX_URL` / `NEXT_PUBLIC_CONVEX_SITE_URL`

## URLs

| Use | Example |
| --- | --- |
| Canonical | `https://partners.beam.ai/w/pwc-me` |
| Partner host | `https://pwc-me.partners.beam.ai` |
| Vercel preview | `https://<preview>.vercel.app/w/pwc-me` |

Custom partner-owned domains are not v1. Unknown hosts fail closed. A slug in
the browser is never authorization.

## Seed

Staff admin can load the reviewed catalog (PwC ME + Roboyo) with **Seed
reviewed catalog**. Preview Convex backends call `internal.seed.seedPreview`
once when created. Tests call `seedFromCatalog` / `seedPreview`.

## Tests

```bash
pnpm test
pnpm test:e2e
```
