import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import { betterAuth } from "better-auth"
import { magicLink } from "better-auth/plugins"
import { v } from "convex/values"

import {
  canonicalSiteUrl,
  isLocalSiteUrl,
  partnerAuthAllowedHosts,
} from "./lib/partnerHosts"
import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import type { MutationCtx } from "./_generated/server"
import { query } from "./_generated/server"
import authConfig from "./auth.config"
import {
  isStaffEmail,
  normalizeEmail,
  normalizeStaffEmailDomain,
} from "./lib/authPolicy"

function staffEmailDomain() {
  return (
    normalizeStaffEmailDomain(process.env.STAFF_EMAIL_DOMAIN) ??
    "auth-not-configured.invalid"
  )
}

export const authComponent = createClient<DataModel>(components.betterAuth)

function canWrite(ctx: GenericCtx<DataModel>): ctx is MutationCtx {
  return "db" in ctx && "insert" in ctx.db
}

async function hasOpenInvitation(
  ctx: GenericCtx<DataModel>,
  email: string
) {
  if (!("db" in ctx)) return false
  const now = Date.now()
  const invitations = await ctx.db
    .query("invitations")
    .withIndex("by_email", (q) => q.eq("email", email))
    .take(20)
  return invitations.some(
    (invite) => invite.consumedAt === undefined && invite.expiresAt > now
  )
}

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const fallbackSiteUrl = canonicalSiteUrl(process.env.SITE_URL)
  const staffDomain = staffEmailDomain()

  return betterAuth({
    baseURL: {
      allowedHosts: partnerAuthAllowedHosts(
        process.env.PARTNER_AUTH_EXTRA_HOSTS
      ),
      protocol: "auto",
      fallback: fallbackSiteUrl,
    },
    advanced: {
      trustedProxyHeaders: true,
    },
    database: authComponent.adapter(ctx),
    emailAndPassword: { enabled: false },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        hd: staffDomain,
        prompt: "select_account",
      },
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          const normalized = normalizeEmail(email)
          const staff = isStaffEmail(normalized, process.env.STAFF_EMAIL_DOMAIN)
          if (!staff && !(await hasOpenInvitation(ctx, normalized))) {
            throw new Error("No invitation for this email")
          }
          if (canWrite(ctx)) {
            await ctx.db.insert("magicLinkOutbox", {
              email: normalized,
              url,
              createdAt: Date.now(),
            })
          }
          if (process.env.RESEND_API_KEY) {
            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from:
                  process.env.PARTNER_MAGIC_LINK_FROM ??
                  "Beam Partner <partners@beam.ai>",
                to: normalized,
                subject: "Your Beam Partner sign-in link",
                text: `Sign in to Beam Partner:\n${url}\n`,
              }),
            })
            if (!response.ok) {
              throw new Error("Unable to send sign-in email")
            }
            return
          }
          const allowLog =
            process.env.ALLOW_MAGIC_LINK_LOG === "true" ||
            isLocalSiteUrl(process.env.SITE_URL)
          if (allowLog) {
            console.warn(`Beam Partner magic link for ${normalized}: ${url}`)
          }
        },
      }),
      convex({ authConfig }),
    ],
  })
}

export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.string(),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) return null
    return {
      _id: String(user._id),
      email: user.email,
      name: user.name,
    }
  },
})
