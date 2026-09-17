import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import { isStaffEmail, normalizeEmail } from "./authPolicy"

type DbCtx = QueryCtx | MutationCtx

export class PartnerAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PartnerAccessError"
  }
}

/**
 * Bug 12: validation failures were thrown as PartnerAccessError, so callers
 * could not tell "you may not do this" from "you filled the form in wrong".
 */
export class PartnerInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PartnerInputError"
  }
}

export async function getIdentityEmail(ctx: DbCtx) {
  const identity = await ctx.auth.getUserIdentity()
  const email = normalizeEmail(identity?.email)
  return email || null
}

export async function requireActor(ctx: DbCtx) {
  const email = await getIdentityEmail(ctx)
  if (!email) {
    throw new PartnerAccessError("Not authenticated")
  }

  const user = await ctx.db
    .query("partnerUsers")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique()

  if (!user) {
    throw new PartnerAccessError("Not authorized")
  }

  return user
}

export async function requireStaffActor(ctx: DbCtx) {
  const email = await getIdentityEmail(ctx)
  if (
    !isStaffEmail(
      email,
      process.env.STAFF_EMAIL_DOMAINS ?? process.env.STAFF_EMAIL_DOMAIN,
    )
  ) {
    throw new PartnerAccessError("Unauthorized: staff only")
  }
  const user = await ctx.db
    .query("partnerUsers")
    .withIndex("by_email", (q) => q.eq("email", email!))
    .unique()
  if (!user?.isStaff) {
    throw new PartnerAccessError("Unauthorized: staff session not initialized")
  }
  return user
}

export async function requireMembership(
  ctx: DbCtx,
  workspaceId: Id<"workspaces">,
) {
  const actor = await requireActor(ctx)
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_workspace_and_user", (q) =>
      q.eq("workspaceId", workspaceId).eq("userId", actor._id),
    )
    .unique()

  if (!membership) {
    throw new PartnerAccessError("Not a member of this workspace")
  }

  return { actor, membership }
}

/**
 * Bug 7: every content item declares which brand modes it may appear under, but
 * nothing read the field, so a partner-fronted workspace could surface material
 * approved only for Beam-standard. Staff still see everything, so review is
 * possible from any workspace.
 */
export function isAllowedInBrandMode(
  item: Doc<"contentItems">,
  brandMode: Doc<"workspaces">["brandMode"],
  actorIsStaff: boolean,
) {
  if (actorIsStaff) return true
  if (item.allowedBrandModes.length === 0) return true
  return item.allowedBrandModes.includes(brandMode)
}

export function isVisibleToPartner(
  item: Doc<"contentItems">,
  actorIsStaff: boolean,
) {
  if (
    item.claimState === "staff-draft" ||
    item.contentClass === "staff-draft"
  ) {
    return actorIsStaff
  }
  return true
}

export function partnerFacingContent(item: Doc<"contentItems">) {
  if (item.claimState === "restricted") {
    // Bug 10: the body was redacted but the summary was not, so a restricted
    // claim written into a summary reached partners unredacted. Safe today only
    // because of how the two restricted answers happen to be worded.
    const notice =
      item.requestBeamLabel ??
      "Request Beam for a reviewed answer. This claim is not published for partners."
    return {
      ...item,
      summary: notice,
      body: notice,
    }
  }
  return item
}
