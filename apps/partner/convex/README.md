# Convex (Partner)

Separate Partner backend. Do not point this app at the Core Convex deployment.

Local: `CONVEX_AGENT_MODE=anonymous pnpm convex:dev`

Create a **new** Convex project named `beam-partner`. Vercel deploys it:

- Production: production `CONVEX_DEPLOY_KEY` only
- Preview: preview `CONVEX_DEPLOY_KEY` only, plus `--preview-run internal.seed.seedPreview`

`npx convex deploy` injects `NEXT_PUBLIC_CONVEX_URL` and
`NEXT_PUBLIC_CONVEX_SITE_URL` for that deployment. Do not set those URLs
statically in Vercel.

Never run `npx convex deploy` from `apps/partner` against Core's deploy key.
