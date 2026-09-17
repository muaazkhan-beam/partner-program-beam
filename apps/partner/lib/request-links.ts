import type { ContentKind } from "../convex/catalogTypes"
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
}

/** Link into the request form with the partner's context carried along. */
export function requestHref(
  workspaceSlug: string,
  context: RequestContext = {}
) {
  const params = new URLSearchParams()
  if (context.about) params.set("about", context.about)
  if (context.support) params.set("support", context.support)
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

export type RequestSubject = { kind: string; label: string }

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
  if (!contentKinds.includes(kind as ContentKind)) return null
  const item = getWorkspaceItem(workspaceSlug, kind as ContentKind, slug)
  return item ? { kind, label: item.title } : null
}
