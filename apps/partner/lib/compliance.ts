import type {
  CatalogComplianceDocument,
  ComplianceAvailability,
  ComplianceDomain,
} from "../convex/catalogTypes"

/** Domain names in the words a client's security reviewer uses. */
export const complianceDomains: ReadonlyArray<{
  id: ComplianceDomain
  label: string
}> = [
  { id: "information-security", label: "Information security" },
  { id: "access-and-identity", label: "Access and devices" },
  { id: "data-privacy", label: "Data privacy" },
  { id: "hipaa-and-phi", label: "Health data (HIPAA)" },
  { id: "continuity-and-backup", label: "Continuity, backup and incidents" },
  { id: "secure-development", label: "Secure development" },
  { id: "operations-and-suppliers", label: "Operations and suppliers" },
  { id: "people-and-conduct", label: "People and conduct" },
]

export function domainLabel(id: ComplianceDomain) {
  return complianceDomains.find((domain) => domain.id === id)?.label ?? id
}

export const availabilityLabel: Record<ComplianceAvailability, string> = {
  "on-request": "On request",
  "under-nda": "Under NDA",
  "confirm-version": "Version to confirm",
}

/** Printed metadata as one line, never a claim. */
export function printedLine(document: CatalogComplianceDocument) {
  if (document.availability === "confirm-version") {
    return "Version and date to be confirmed by Beam"
  }
  return `Version ${document.version}, ${document.printedDate}`
}

export function filterDocuments(
  documents: readonly CatalogComplianceDocument[],
  { query, domain }: { query: string; domain: ComplianceDomain | "all" }
) {
  const needle = query.trim().toLowerCase()
  return documents.filter(
    (document) =>
      (domain === "all" || document.domain === domain) &&
      (!needle ||
        `${document.title} ${document.summary} ${domainLabel(document.domain)}`
          .toLowerCase()
          .includes(needle))
  )
}

/**
 * The questions a client's security reviewer actually asks, each answered by
 * documents from the library. Used by the questionnaire-first prototype.
 */
export const reviewerQuestions: ReadonlyArray<{
  id: string
  question: string
  documentSlugs: string[]
}> = [
  {
    id: "access",
    question: "How do you control who can access systems and data?",
    documentSlugs: [
      "access-control-policy",
      "password-policy",
      "logging-and-monitoring-policy",
    ],
  },
  {
    id: "privacy",
    question: "How do you protect personal data and handle GDPR obligations?",
    documentSlugs: [
      "data-privacy-policy",
      "personal-data-protection-policy",
      "gdpr-manual",
      "data-subject-requests-manual",
      "ropa-record-of-processing-activities-guidance-note",
    ],
  },
  {
    id: "retention",
    question: "How long do you keep our data, and how is it deleted?",
    documentSlugs: [
      "data-and-record-retention-policy",
      "data-and-record-retention-and-deletion-policy",
      "media-handling-and-disposal-procedure",
    ],
  },
  {
    id: "incidents",
    question: "What happens if there is a security incident or a data breach?",
    documentSlugs: [
      "information-security-incident-management-policy-and-procedure",
      "data-breach-management-procedure",
    ],
  },
  {
    id: "continuity",
    question: "How do you keep the service running and recover from an outage?",
    documentSlugs: [
      "business-continuity-and-disaster-recovery-policy-procedure",
      "backup-policy-procedure",
    ],
  },
  {
    id: "development",
    question: "How is your software developed, changed and patched securely?",
    documentSlugs: [
      "secure-development-and-maintenance-policy",
      "software-development-lifecycle-procedure",
      "change-management-procedure",
      "patch-vulnerability-management-policy",
    ],
  },
  {
    id: "encryption",
    question: "How do you encrypt data and secure networks and servers?",
    documentSlugs: [
      "cryptography-policy",
      "network-security-policy",
      "system-os-database-hardening-policy-procedure",
    ],
  },
  {
    id: "suppliers",
    question: "How do you manage suppliers and transfers of information?",
    documentSlugs: [
      "supplier-management-policy",
      "information-transfer-policies-and-procedure",
    ],
  },
  {
    id: "health",
    question: "How do you handle protected health information?",
    documentSlugs: [
      "hipaa-plan",
      "hipaa-internal-privacy-policy",
      "hipaa-breach-notification-policy",
      "guidelines-on-uses-and-disclosure-of-protected-health-information-phi",
      "phi-de-identification-policy-and-procedure",
      "limited-data-set-policy-data-minimization-policy",
    ],
  },
  {
    id: "people",
    question: "How do you manage staff security, devices and remote work?",
    documentSlugs: [
      "human-resource-security-policy",
      "acceptable-usage-policy",
      "byod-bring-your-own-device-policy",
      "mobile-devices-and-teleworking-policy",
      "clear-desk-screen-policy",
    ],
  },
  {
    id: "risk",
    question: "How do you assess and manage information security risk?",
    documentSlugs: [
      "information-security-policy",
      "information-security-is-policy",
      "risk-management-procedure",
      "information-classification-policy",
    ],
  },
  {
    id: "threats",
    question: "How do you monitor threats and protect against malware?",
    documentSlugs: [
      "threat-intelligence-policy",
      "anti-malware-policy",
      "logging-and-monitoring-policy",
    ],
  },
]
