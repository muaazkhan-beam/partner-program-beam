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
  const user = await requireActor(ctx)
  if (
    !user.isStaff ||
    !isStaffEmail(user.email, process.env.STAFF_EMAIL_DOMAIN)
  ) {
    throw new PartnerAccessError("Unauthorized: staff only")
  }
  return user
}

export async function requireMembership(
  ctx: DbCtx,
  workspaceId: Id<"workspaces">
) {
  const actor = await requireActor(ctx)
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_workspace_and_user", (q) =>
      q.eq("workspaceId", workspaceId).eq("userId", actor._id)
    )
    .unique()

  if (!membership) {
    throw new PartnerAccessError("Not a member of this workspace")
  }

  return { actor, membership }
}

export function isVisibleToPartner(
  item: Doc<"contentItems">,
  actorIsStaff: boolean
) {
  if (item.claimState === "staff-draft" || item.contentClass === "staff-draft") {
    return actorIsStaff
  }
  return true
}

export function partnerFacingContent(item: Doc<"contentItems">) {
  if (item.claimState === "restricted") {
    return {
      ...item,
      body:
        item.requestBeamLabel ??
        "Request Beam for a reviewed answer. This claim is not published for partners.",
    }
  }
  return item
}
