export const CANONICAL_PARTNER_HOST = "partners.beam.ai"
export const CANONICAL_PARTNER_ORIGIN = `https://${CANONICAL_PARTNER_HOST}`
export const PARTNER_HOST_SUFFIX = ".partners.beam.ai"
export const VERCEL_PREVIEW_SUFFIX = ".vercel.app"

const APEX_HOSTS = new Set([CANONICAL_PARTNER_HOST, "localhost", "127.0.0.1"])

export const PARTNER_AUTH_ALLOWED_HOSTS = [
  CANONICAL_PARTNER_HOST,
  `*${PARTNER_HOST_SUFFIX}`,
  "localhost:*",
  "127.0.0.1:*",
  `*${VERCEL_PREVIEW_SUFFIX}`,
] as const

export type PartnerHostClassification =
  | { ok: true; kind: "apex" }
  | { ok: true; kind: "partner"; slug: string }
  | { ok: false }

export function hostnameOf(hostHeader: string) {
  return hostHeader.trim().toLowerCase().split(":")[0] ?? ""
}

function isVercelPreviewHost(hostname: string) {
  return hostname.endsWith(VERCEL_PREVIEW_SUFFIX) && hostname !== "vercel.app"
}

export function classifyPartnerHost(
  hostHeader: string
): PartnerHostClassification {
  const hostname = hostnameOf(hostHeader)
  if (!hostname) return { ok: false }
  if (APEX_HOSTS.has(hostname) || isVercelPreviewHost(hostname)) {
    return { ok: true, kind: "apex" }
  }
  if (hostname.endsWith(PARTNER_HOST_SUFFIX)) {
    const slug = hostname.slice(0, -PARTNER_HOST_SUFFIX.length)
    return slug && !slug.includes(".")
      ? { ok: true, kind: "partner", slug }
      : { ok: false }
  }
  if (hostname.endsWith(".localhost")) {
    const slug = hostname.slice(0, -".localhost".length)
    return slug && !slug.includes(".")
      ? { ok: true, kind: "partner", slug }
      : { ok: false }
  }
  return { ok: false }
}

export function extraAuthHostsFromEnv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
}

export function partnerAuthAllowedHosts(extraHosts?: string) {
  return [...PARTNER_AUTH_ALLOWED_HOSTS, ...extraAuthHostsFromEnv(extraHosts)]
}

export function canonicalSiteUrl(siteUrl?: string) {
  const configured = siteUrl?.trim()
  return configured || CANONICAL_PARTNER_ORIGIN
}

export function isLocalSiteUrl(siteUrl?: string) {
  const value = siteUrl?.trim() ?? ""
  return value.includes("localhost") || value.includes("127.0.0.1")
}
