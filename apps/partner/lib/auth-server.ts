import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL

const authHelpers =
  convexUrl && convexSiteUrl
    ? convexBetterAuthNextJs({
        convexUrl,
        convexSiteUrl,
        basePath: "/api/auth",
      })
    : null

export { authHelpers }

async function authUnavailable() {
  return Response.json(
    { error: "Authentication is not configured for this deployment." },
    { status: 503 }
  )
}

export const handler = authHelpers?.handler ?? {
  GET: authUnavailable,
  POST: authUnavailable,
}
