# Beam Partner Program Dashboard

Working repository for the Beam partner program dashboard. Spec, plan, research and
build all live here.

## What this repo is

`apps/partner/` is a **copy of the Beam Partner v1 shell** built by Jonas, taken from
`beam-ai-team/beam-library` at `apps/partner/`. We build on top of it here so upstream
stays untouched — nothing in this repo deploys to Beam's Vercel or Convex projects.

The directory layout mirrors upstream (`apps/partner` inside a pnpm workspace) so our
work stays diffable against it, and so anything worth contributing back can move over
cleanly.

### Changes from upstream

- `better-auth` pinned to `~1.6.25`. Upstream's caret range resolves to 1.7.x here and
  breaks the `@convex-dev/better-auth` peer requirement (`>=1.6.11 <1.7.0`); the
  monorepo lockfile hid this.

## Layout

| Path | What |
| --- | --- |
| `apps/partner/` | The Beam Partner app — Next.js 16, Convex, Better Auth |
| `docs/specs/` | Product contracts copied from upstream. `partner-portal.md` is the spec for Phase 1 |
| `docs/reference/` | Partner-portal skill and its references — real partner-call synthesis, tool map, FAQ seed |
| `docs/research/` | Competitive research on partner portals and programs |
| `docs/scope/` | Phase 1 scope |

## Getting started

```bash
pnpm install
pnpm catalog:compile
pnpm test
```

To run the app you need a Convex deployment. From `apps/partner/`:

```bash
CONVEX_AGENT_MODE=anonymous pnpm convex:dev
```

Then in another terminal, from the repo root:

```bash
pnpm dev
```

The app listens on `http://127.0.0.1:3001`. Open a workspace at `/w/partner-demo/home`.

For local work without auth, set in `apps/partner/.env.local`:

```bash
NEXT_PUBLIC_LOCAL_AUTH_BYPASS=true
NEXT_PUBLIC_PARTNER_BYPASS_WORKSPACE=partner-demo
NEXT_PUBLIC_PARTNER_BYPASS_EMAIL=demo@partner.example
```

Never set the bypass on a deployed environment. See `apps/partner/README.md` for the
full upstream setup, including production Convex and Vercel configuration.

## Scripts

| Command | Does |
| --- | --- |
| `pnpm dev` | Run the partner app on port 3001 |
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` across the workspace |
| `pnpm test` | Compile the catalog, then run unit and isolation tests |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm catalog:compile` | Compile `apps/partner/catalog/*.yaml` into the generated catalog |

## Content

Portal content is YAML in `apps/partner/catalog/`, compiled at build time — tools,
materials, FAQ answers, playbooks, and one file per workspace under
`catalog/workspaces/`. Every item carries an audience (`partner-internal`,
`client-forwardable`, `technical`), a content class (`shared-partner-safe`,
`workspace-only`, `staff-draft`), and a claim-review state with reviewer and
revalidation date. Content is granted to a workspace explicitly; a workspace slug in
the URL is never authorization.
