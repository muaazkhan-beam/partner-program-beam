import type { BrandMode } from "../../convex/catalogTypes"
import type { Engagement } from "../pack"

/**
 * The desk's records, kept in the partner's browser and shaped as Convex rows
 * (string id, workspaceSlug, timestamps, no nested blobs) so each table can
 * move server-side once Jonas and the partners agree that client names may
 * leave the browser. Raw email and questionnaire bodies are never stored.
 */

export type Phase = "win" | "scope" | "build" | "deploy" | "monitor" | "deliver"

export type Client = {
  id: string
  workspaceSlug: string
  /** The client's name, or a code name ("Client A"). */
  label: string
  /** Matches forwarded email to the client by the original sender's domain. */
  domain?: string
  phase: Phase
  engagement: Engagement
  createdAt: number
  updatedAt: number
}

export type ThreadQuestion = {
  id: string
  /** The client's own numbering: "4", "4a", "CM-14". */
  ref: string
  text: string
  /**
   * Whether this question went to Beam when it arrived. Answers are found
   * again on every view, and the more cautious of the two outcomes wins, so a
   * later catalog change can never make a stored question less careful.
   */
  routedAtIntake: boolean
}

export type Thread = {
  id: string
  workspaceSlug: string
  clientId?: string
  source: "paste" | "email" | "questionnaire"
  subject: string
  /** Domain of the client who wrote, never their address. */
  senderDomain?: string
  questions: ThreadQuestion[]
  /** Place names from the email around the questions; nothing else of it. */
  contextCues: string[]
  /** The client's questionnaire, kept only until the filled file is downloaded. */
  questionnaire?: {
    fileName: string
    /** The client's own separator, so their file comes back as they sent it. */
    delimiter?: "," | ";" | "\t"
    headers: string[]
    rows?: string[][]
    questionColumn: number
    refColumn?: number
    /** Row index in the client's file for each question, by question id. */
    rowOf: Record<string, number>
  }
  receivedAt: number
  /** When a reply sheet covering this thread was prepared. */
  sentAt?: number
  createdAt: number
  updatedAt: number
}

/**
 * A question for the Beam partner team. `sent` only once the request form
 * returned a key; in the demo nothing leaves the browser and says so.
 */
export type AskStatus = "draft" | "sent" | "demo-not-sent"

export type Ask = {
  id: string
  workspaceSlug: string
  clientId?: string
  threadId?: string
  kind: "question" | "issue-documents"
  questions: Array<{ id?: string; ref?: string; text: string }>
  documentSlugs?: string[]
  status: AskStatus
  requestKey?: string
  createdAt: number
  updatedAt: number
}

export type SentItem = {
  kind: string
  slug: string
  claimState: string
  /** Of title, summary and body at send time: shows when Beam changed it since. */
  hash: string
}

export type Send = {
  id: string
  workspaceSlug: string
  clientId: string
  batchId?: string
  style: BrandMode
  phaseAtSend: Phase
  items: SentItem[]
  documentSlugs: string[]
  threadIds: string[]
  fileName: string
  preparedAt: number
}
