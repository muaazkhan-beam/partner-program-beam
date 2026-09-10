export const DEFAULT_AUTH_RETURN_PATH = "/home"

const INTERNAL_ORIGIN = "https://beam-partner-auth.invalid"
const ENCODED_PATH_SEPARATOR = /%(?:2f|5c)/i
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/

export function getSafeAuthReturnPath(
  value: unknown,
  fallback = DEFAULT_AUTH_RETURN_PATH
) {
  if (typeof value !== "string") return fallback

  const candidate = value.trim()
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    ENCODED_PATH_SEPARATOR.test(candidate) ||
    CONTROL_CHARACTER.test(candidate)
  ) {
    return fallback
  }

  try {
    const url = new URL(candidate, INTERNAL_ORIGIN)
    if (url.origin !== INTERNAL_ORIGIN) return fallback
    if (url.pathname === "/login" || url.pathname.startsWith("/api/auth")) {
      return fallback
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}

export function getLoginPath(returnPath: unknown) {
  const safeReturnPath = getSafeAuthReturnPath(returnPath)
  const query = new URLSearchParams({ from: safeReturnPath })
  return `/login?${query.toString()}`
}
