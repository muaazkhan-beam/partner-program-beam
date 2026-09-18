import type { CatalogContent } from "../convex/catalogTypes"

export type IntroPackItem = Pick<
  CatalogContent,
  | "kind"
  | "slug"
  | "title"
  | "summary"
  | "format"
  | "shareUrl"
  | "status"
  | "claimState"
  | "audience"
  | "forwardable"
> & { allowedBrandModes?: readonly string[] }

export type PackReason = "brand mode" | "pending" | "no share link"

/** Only a published Beam Share is a link a partner may hand to a client. */
export const PUBLISHED_SHARE_PREFIX = "https://shares.beam.ai/s/"

/**
 * Why an item cannot go to a client today, or null when it can. Brand mode is
 * checked first because it is the one reason a partner cannot fix by waiting.
 */
export function packReason(
  item: IntroPackItem,
  brandMode: string
): PackReason | null {
  if (item.allowedBrandModes && !item.allowedBrandModes.includes(brandMode)) {
    return "brand mode"
  }
  if (item.status === "pending" || item.claimState !== "approved") {
    return "pending"
  }
  if (!item.shareUrl?.startsWith(PUBLISHED_SHARE_PREFIX)) {
    return "no share link"
  }
  return null
}

/**
 * The intro pack is the set a partner may forward to a client today: approved,
 * client-forwardable, published, and cleared for this workspace's brand mode.
 * Everything else that was meant for a client is listed with the reason, so
 * the request path is one click away. Input order is kept: the catalog and the
 * workspace grants already list the reading order.
 */
export function introPack<T extends IntroPackItem>(
  items: readonly T[],
  brandMode: string
) {
  const pack: T[] = []
  const notYet: Array<{ item: T; reason: PackReason }> = []
  for (const item of items) {
    const clientFacing = item.audience === "client-forwardable" || item.forwardable
    if (!clientFacing) continue
    const reason = packReason(item, brandMode)
    if (reason === null && item.audience === "client-forwardable" && item.forwardable) {
      pack.push(item)
    } else {
      notYet.push({ item, reason: reason ?? "pending" })
    }
  }
  return { pack, notYet }
}

/**
 * The email a partner sends after an intro call. Client voice, titles and
 * links only: the catalog's summaries describe the decks to us, not to the
 * client, and nothing here may claim more than the linked decks do.
 */
export function introEmail({
  workspaceDisplayName,
  items,
}: {
  workspaceDisplayName: string
  items: readonly IntroPackItem[]
}) {
  return [
    "Subject: Beam: introduction, as discussed",
    "",
    "Hi [client name],",
    "",
    "As discussed, here are short overviews of Beam and of how we would approach a first workflow together:",
    "",
    ...items.map((item) => `- ${item.title}: ${item.shareUrl}`),
    "",
    "Happy to walk through any of them.",
    "",
    "[your name]",
    workspaceDisplayName,
  ].join("\n")
}
