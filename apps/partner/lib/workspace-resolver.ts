import {
  classifyPartnerHost,
  hostnameOf as hostnameFromHeader,
} from "./partner-hosts"

export const hostnameOf = hostnameFromHeader

export function slugFromHost(hostHeader: string) {
  const classified = classifyPartnerHost(hostHeader)
  if (!classified.ok) return undefined
  return classified.kind === "partner" ? classified.slug : null
}

export function slugFromPath(pathname: string) {
  const match = pathname.match(/^\/w\/([a-z0-9-]+)(?:\/|$)/)
  return match?.[1] ?? null
}

export type WorkspaceResolution =
  | { ok: true; slug: string | null; source: "host" | "path" | "apex" }
  | { ok: false; reason: "unknown-host" | "host-path-mismatch" }

export function resolveWorkspaceSlug(input: {
  host: string
  pathname: string
}): WorkspaceResolution {
  const fromHost = slugFromHost(input.host)
  if (fromHost === undefined) {
    return { ok: false, reason: "unknown-host" }
  }
  const fromPath = slugFromPath(input.pathname)
  if (fromHost && fromPath && fromHost !== fromPath) {
    return { ok: false, reason: "host-path-mismatch" }
  }
  if (fromHost) {
    return { ok: true, slug: fromHost, source: "host" }
  }
  if (fromPath) {
    return { ok: true, slug: fromPath, source: "path" }
  }
  return { ok: true, slug: null, source: "apex" }
}

export function workspacePath(slug: string, surface: string) {
  const path = surface.startsWith("/") ? surface : `/${surface}`
  return `/w/${slug}${path}`
}

export function rewriteSubdomainPath(pathname: string, slug: string) {
  if (pathname === "/login" || pathname === "/invite") return pathname
  if (pathname.startsWith("/api/")) return pathname
  if (pathname.startsWith(`/w/${slug}`)) return pathname
  if (pathname === "/" || pathname === "") return `/w/${slug}/home`
  return `/w/${slug}${pathname}`
}

export const PUBLIC_PATHS = new Set(["/login", "/invite"])

export function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/invite")
  )
}
