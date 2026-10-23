import { holdReason, isDemoContent, type HoldOptions, type PackContent } from "./pack"

/**
 * One name per state, everywhere: the badge on a card, the verb on its
 * button, the row in an answer sheet, the cell in a client's file. Derived
 * only from the send rule, so a badge can never say more than the rule
 * allows. Demo content never shows the "Can go to a client" seal.
 */
export type ClaimStateKey =
  | "can-go"
  | "demo"
  | "not-published"
  | "only-beam"
  | "for-you"
  | "not-cleared"
  | "advisory-held"
  | "no-link"

export const CLAIM_LABEL: Record<ClaimStateKey, string> = {
  "can-go": "Can go to a client",
  demo: "Demo content · not reviewed by Beam",
  "not-published": "Not published yet",
  "only-beam": "Only Beam can answer this",
  "for-you": "For you only",
  "not-cleared": "Not cleared for your brand",
  "advisory-held": "Left out for an advisory client",
  "no-link": "No client link yet",
}

/** An ask the partner has sent; distinct from content Beam has not published. */
export const WITH_BEAM_LABEL = "With Beam"

export function claimStateOf(item: PackContent, brandMode: string, options: HoldOptions = {}): ClaimStateKey {
  const reason = holdReason(item, brandMode, options)
  if (reason === null) return isDemoContent(item) ? "demo" : "can-go"
  switch (reason) {
    case "demo":
    case "pending":
      return "not-published"
    case "restricted":
      return "only-beam"
    case "internal":
      return "for-you"
    case "brand mode":
      return "not-cleared"
    case "engagement":
      return "advisory-held"
    case "no published link":
      return "no-link"
  }
}

/** True when the item may go in a client's PDF. */
export function sendable(state: ClaimStateKey) {
  return state === "can-go" || state === "demo"
}

/**
 * The verb on an item's one button says what will happen: it goes to the
 * client, it stays with the partner as prep, or the question goes to Beam.
 */
export function addVerb(state: ClaimStateKey) {
  if (sendable(state)) return "Add to pack"
  if (state === "only-beam") return "Ask Beam"
  return "Save for prep"
}
