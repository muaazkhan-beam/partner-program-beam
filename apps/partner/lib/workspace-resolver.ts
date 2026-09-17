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

// These are intentionally small, reviewed entry routes for the first named
// partners. Every other workspace uses /w/<slug>; do not turn arbitrary
// top-level paths into tenant routing.
export const PARTNER_ENTRY_ROUTES = {
  "/pwc": "pwc-me",
  "/roland-berger": "roland-berger",
} as const

export function slugFromPartnerEntryPath(pathname: string) {
  for (const [entryPath, slug] of Object.entries(PARTNER_ENTRY_ROUTES)) {
    if (pathname === entryPath || pathname.startsWith(`${entryPath}/`)) {
      return slug
    }
  }
  return null
}

export function isPartnerLoginEntryPath(pathname: string) {
  return Object.hasOwn(PARTNER_ENTRY_ROUTES, pathname)
}

export type WorkspaceResolution =
  | {
      ok: true
      slug: string | null
      source: "host" | "path" | "entry" | "apex"
    }
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
  const fromEntry = slugFromPartnerEntryPath(input.pathname)
  if (fromEntry) {
    return { ok: true, slug: fromEntry, source: "entry" }
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

export function rewritePartnerEntryPath(pathname: string, slug: string) {
  const entryPath = Object.entries(PARTNER_ENTRY_ROUTES).find(
    ([path, entrySlug]) =>
      entrySlug === slug &&
      (pathname === path || pathname.startsWith(`${path}/`)),
  )?.[0]
  if (!entryPath) return pathname
  const remainder = pathname.slice(entryPath.length)
  if (!remainder || remainder === "/") return `/w/${slug}/home`
  return `/w/${slug}${remainder}`
}

export const PUBLIC_PATHS = new Set(["/", "/login", "/invite", "/admin"])

export function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.has(pathname) ||
    isPartnerLoginEntryPath(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/invite")
  )
}
