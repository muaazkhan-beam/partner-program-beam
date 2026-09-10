export {
  CANONICAL_PARTNER_HOST,
  CANONICAL_PARTNER_ORIGIN,
  PARTNER_AUTH_ALLOWED_HOSTS,
  PARTNER_HOST_SUFFIX,
  VERCEL_PREVIEW_SUFFIX,
  canonicalSiteUrl,
  classifyPartnerHost,
  extraAuthHostsFromEnv,
  hostnameOf,
  isLocalSiteUrl,
  partnerAuthAllowedHosts,
  type PartnerHostClassification,
} from "../convex/lib/partnerHosts"
