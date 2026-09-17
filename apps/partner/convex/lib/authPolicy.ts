const DOMAIN_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

export function normalizeStaffEmailDomain(value: string | undefined | null) {
  const domain = value?.trim().toLowerCase().replace(/^@/, "") ?? ""
  return DOMAIN_PATTERN.test(domain) ? domain : null
}

export function normalizeStaffEmailDomains(
  value: string | undefined | null,
) {
  return [
    ...new Set(
      (value ?? "")
        .split(",")
        .map((domain) => normalizeStaffEmailDomain(domain))
        .filter((domain): domain is string => Boolean(domain)),
    ),
  ]
}

export function isStaffEmail(
  email: string | undefined | null,
  configuredDomains: string | undefined | null,
) {
  const domains = normalizeStaffEmailDomains(configuredDomains)
  const normalizedEmail = email?.trim().toLowerCase()

  if (domains.length === 0 || !normalizedEmail) return false

  const [localPart, emailDomain, extraPart] = normalizedEmail.split("@")
  return Boolean(
    localPart &&
      emailDomain &&
      domains.includes(emailDomain) &&
      extraPart === undefined,
  )
}

export function normalizeEmail(email: string | undefined | null) {
  return email?.trim().toLowerCase() ?? ""
}

export function emailDomain(email: string) {
  const normalized = normalizeEmail(email)
  const parts = normalized.split("@")
  return parts.length === 2 && parts[1] ? parts[1] : null
}

export function isAllowedPartnerDomain(
  email: string,
  allowedDomains: readonly string[]
) {
  const domain = emailDomain(email)
  if (!domain) return false
  return allowedDomains.some((allowed) => allowed.toLowerCase() === domain)
}
