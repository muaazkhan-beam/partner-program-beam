import type { ContentKind } from "../convex/catalogTypes"
import { decodeAnswers, evaluate, verdictLabel } from "./fit-check"
import { getWorkspaceItem } from "./catalog/static"
import { partnerAgents } from "./partner-agents"
import { journeyPhases } from "./partner-journey"
import { workspacePath } from "./workspace-resolver"

export const requestSupportTypes = [
  "shadow-demo",
  "deployment-review",
  "faq-escalation",
  "other",
] as const

export type RequestSupportType = (typeof requestSupportTypes)[number]

export type RequestContext = {
  /** What the partner was looking at when they asked, as `<kind>:<slug>`. */
  about?: string
  support?: RequestSupportType
  /** Catalog slugs the request is about, e.g. the documents in a client pack. */
  items?: readonly string[]
  /** The client's own question(s), so the Beam team sees what was asked. */
  question?: string
}

/** Longest question text carried in a link; the rest is cut, not dropped silently. */
export const MAX_QUESTION_LENGTH = 1500

/** Link into the request form with the partner's context carried along. */
export function requestHref(
  workspaceSlug: string,
  context: RequestContext = {}
) {
  const params = new URLSearchParams()
  if (context.about) params.set("about", context.about)
  if (context.support) params.set("support", context.support)
  if (context.items?.length) params.set("items", context.items.join(","))
  if (context.question?.trim()) {
    const question = context.question.trim()
    if (question.length > MAX_QUESTION_LENGTH) {
      // Cut at a line break so no question is split, and say so.
      const head = question.slice(0, MAX_QUESTION_LENGTH)
      const cut = head.lastIndexOf("\n") > 0 ? head.slice(0, head.lastIndexOf("\n")) : head
      params.set("q", `${cut}\n[Cut to fit the link; paste the rest below.]`)
    } else {
      params.set("q", question)
    }
  }
  const query = params.toString()
  return workspacePath(workspaceSlug, query ? `/requests?${query}` : "/requests")
}

export function isRequestSupportType(
  value: string | null | undefined
): value is RequestSupportType {
  return requestSupportTypes.includes(value as RequestSupportType)
}

const contentKinds: ContentKind[] = [
  "tool",
  "material",
  "faq",
  "playbook",
  "use-case",
]

/** The support type a request from a piece of content defaults to. */
export function supportForKind(kind: string): RequestSupportType {
  if (kind === "faq") return "faq-escalation"
  if (kind === "use-case") return "shadow-demo"
  return "other"
}

export type RequestSubject = { kind: string; label: string; id?: string }

/**
 * Turn an `about` value back into something a person can read. Content is
 * resolved only against what the workspace has been granted, so a slug in the
 * URL never reveals a title the member could not otherwise see.
 */
export function describeRequestSubject(
  workspaceSlug: string,
  about: string | null | undefined
): RequestSubject | null {
  if (!about) return null
  const separator = about.indexOf(":")
  if (separator < 1) return null
  const kind = about.slice(0, separator)
  const slug = about.slice(separator + 1)
  if (!slug) return null
  if (kind === "agent") {
    const agent = partnerAgents.find((entry) => entry.id === slug)
    return agent ? { kind, label: `${agent.name} (planned agent)` } : null
  }
  if (kind === "journey") {
    const phase = journeyPhases.find((entry) => entry.slug === slug)
    return phase ? { kind, label: `Journey · ${phase.name} phase` } : null
  }
  if (kind === "compliance") {
    return slug === "pack" ? { kind, label: "Security and compliance pack" } : null
  }
  if (kind === "scope") {
    if (!slug) return null
    return slug === "no-match"
      ? { kind, id: slug, label: "A process with no live use case" }
      : { kind, id: slug, label: "Process brief" }
  }
  if (kind === "fit") {
    const verdict = evaluate(decodeAnswers(slug))
    if (verdict.kind === "incomplete") return null
    return { kind, id: slug, label: `Fit check · ${verdictLabel[verdict.kind]}` }
  }
  if (!contentKinds.includes(kind as ContentKind)) return null
  const item = getWorkspaceItem(workspaceSlug, kind as ContentKind, slug)
  return item ? { kind, label: item.title } : null
}
