import type { CatalogComplianceDocument } from "../convex/catalogTypes"
import { reviewerQuestions } from "./compliance"
import { WEAK_WORDS, resolveAsk, words, type AskCandidate, type AskOutcome } from "./faq-answer"

/**
 * One question, answered from everything a partner can use: the published FAQ
 * (with its governance), the security documents, and the use case catalog.
 *
 * The most common case is a client's security questions. The FAQ holds no
 * published security answer, but the library holds every policy as printed, so
 * a security question is answered with the documents that cover it. What the
 * library does not hold (a SOC 2 report, an ISO certificate, a DPA) is said
 * plainly to come from the Beam team, never covered by unrelated policies.
 */

const SECURITY_WORDS = new Set([
  "antivirus", "audit", "authentication", "backup", "backups", "breach", "breaches",
  "byod", "compliance", "continuity", "cryptography", "cyber", "deletion",
  "delete", "disaster", "dpa", "encrypt", "encrypted", "encryption", "endpoint",
  "erase", "failover", "firewall", "gdpr", "hardening", "hipaa", "incident",
  "incidents", "infosec", "logging", "malware", "mfa", "monitoring", "outage",
  "password", "passwords", "patch", "patching", "pentest", "phi", "policies",
  "policy", "privacy", "privileged", "protect", "protection", "questionnaire",
  "rbac", "recovery", "redundancy", "retain", "retention", "risk", "rpo", "rto",
  "secure", "secured", "securing", "security", "siem", "soc", "soc2", "sso",
  "subprocessor", "subprocessors", "transit", "vpn", "vulnerability",
  "vulnerabilities", "ciso", "inventory", "classification", "log", "logs",
  "monitor", "monitored", "confidentiality", "deleted", "dsar", "dpia", "dpias",
  "ropa", "segregation", "hardened", "cis", "threat", "waf", "ddos", "byok",
  "saml", "static",
])

const SECURITY_PHRASES =
  /\b(pen(etration)?[- ]?test\w*|security review|due diligence|data protection|information security|business continuity|disaster recovery|access control|access rights|admin access|who (can|has|have) access|access to (our|the|client) data|data breach|personal data|third[- ]part(y|ies)|vendor risk|background (check|checks|screening)|awareness training|least privilege|code reviews?|change management|changes? to (production|live|our)|production (changes?|systems?|environment)|in transit|at rest|subject (access )?requests?|record of processing|processing activities|asset inventory|threat intelligence|key management)\b/i

export function isSecurityQuestion(question: string) {
  if (SECURITY_PHRASES.test(question)) return true
  return question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .some((word) => SECURITY_WORDS.has(word))
}

/** Evidence the library does not hold. Beam provides it per client, if it exists. */
const BEAM_ONLY =
  /\b(soc ?[123]|soc2|iso ?(27001|27002|27017|27018|27701|9001|42001)|iso certif\w*|pen(etration)?[- ]?test (report|result|summary|letter)s?|audit (report|opinion)s?|hitrust|fedramp|pci[- ]?dss|cyber essentials|dpa|data processing (agreement|addendum)|cyber insurance|insurance certificate|bridge letter|attestation reports?|security certifications?)\b/i

export function isBeamOnlyEvidence(question: string) {
  return BEAM_ONLY.test(question)
}

const USE_CASE_PATTERN =
  /\buse[- ]?cases?\b|\bwhich (process|processes|workflow|workflows)\b|\bwhat (can|could|does|would) (beam|an agent|the agent) (do|automate|handle|run|take on)\b|\bautomate\b/i

const DEPARTMENTS: Array<{ department: string; words: RegExp }> = [
  { department: "finance", words: /\b(finance|financial|accounting|accounts|invoice|invoices|payable|payables|receivable|receivables|close)\b/i },
  { department: "procurement", words: /\b(procurement|purchasing|supplier|suppliers|vendor|vendors|sourcing)\b/i },
  { department: "hr", words: /\b(hr|people|recruiting|recruitment|hiring|cv|cvs|talent)\b/i },
]

export function isUseCaseQuestion(question: string) {
  return USE_CASE_PATTERN.test(question)
}

/** The fields a use case is matched on. */
export type AskUseCase = {
  slug: string
  title: string
  summary: string
  department?: string
  vertical?: string
  trigger?: string
  systems?: readonly string[]
}

export function matchUseCases<T extends AskUseCase>(question: string, useCases: readonly T[]) {
  const department = DEPARTMENTS.find((entry) => entry.words.test(question))?.department
  if (department) {
    const inDepartment = useCases.filter(
      (useCase) => useCase.department?.toLowerCase() === department
    )
    if (inDepartment.length) return inDepartment
  }
  const asked = new Set(words(question).filter((word) => !WEAK_WORDS.has(word)))
  return useCases
    .map((useCase) => {
      const own = new Set(
        words(
          `${useCase.title} ${useCase.summary} ${useCase.department ?? ""} ${useCase.vertical ?? ""} ${useCase.trigger ?? ""} ${(useCase.systems ?? []).join(" ")}`
        )
      )
      return { useCase, hits: [...asked].filter((word) => own.has(word)).length }
    })
    .filter((row) => row.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map((row) => row.useCase)
}

/** A client's word for what a policy title calls something else. */
const DOCUMENT_SYNONYMS: Record<string, string[]> = {
  encryption: ["cryptography"], encrypt: ["cryptography"], encrypted: ["cryptography"],
  tls: ["cryptography"], transit: ["cryptography"], keys: ["cryptography"],
  breach: ["breach", "incident"], breaches: ["breach", "incident"], incidents: ["incident"],
  outage: ["continuity", "recovery", "backup"], bcp: ["continuity"], drp: ["disaster", "recovery"],
  rto: ["continuity", "recovery", "backup"], rpo: ["continuity", "recovery", "backup"],
  failover: ["continuity", "recovery"], redundancy: ["continuity", "backup"],
  backups: ["backup"], resilience: ["continuity"],
  pentest: ["vulnerability", "patch"], penetration: ["vulnerability", "patch"],
  vulnerabilities: ["vulnerability"], patching: ["patch"],
  mfa: ["access", "password"], sso: ["access"], passwords: ["password"],
  authentication: ["access", "password"], permissions: ["access"], privileged: ["access"],
  rbac: ["access"], admin: ["access"],
  delete: ["deletion", "retention"], erase: ["deletion"], retain: ["retention"],
  subprocessor: ["supplier"], subprocessors: ["supplier"], vendor: ["supplier"],
  vendors: ["supplier"], suppliers: ["supplier"],
  personal: ["personal", "privacy"], health: ["hipaa", "phi"],
  antivirus: ["malware"], virus: ["malware"], endpoint: ["malware"],
  logs: ["logging"], siem: ["logging", "monitoring"],
  training: ["human"], awareness: ["human"], staff: ["human"], employees: ["human"],
  background: ["human"], screening: ["human"],
  office: ["physical"], firewall: ["network"], vpn: ["network"],
  sdlc: ["development"], code: ["development"], static: ["development"],
  ciso: ["roles", "responsibilities"], asset: ["asset"], assets: ["asset"], inventory: ["asset"],
  classification: ["classification"], log: ["logging"], monitor: ["monitoring", "logging"],
  confidentiality: ["human", "conduct"], deleted: ["deletion", "retention"],
  dsar: ["subject"], subject: ["subject"], dpia: ["dpia"], dpias: ["dpia"],
  ropa: ["ropa", "processing"], segregation: ["access"], hardened: ["hardening"],
  cis: ["hardening"], threat: ["threat"], intelligence: ["threat"],
  waf: ["network"], ddos: ["network"], byok: ["cryptography"], saml: ["access"],
  devices: ["devices", "byod"], remote: ["teleworking", "mobile"], laptops: ["devices", "mobile"],
  changes: ["change"], releases: ["change"], deployments: ["change"],
}

/** Request verbs and filler that name no topic a policy title could match. */
const DOCUMENT_STOP = new Set([
  "protect", "protection",
  "annual", "annually", "applied", "apply", "approach", "approved", "attach",
  "attached", "complete", "conduct", "conducted", "confirm", "copies", "copy",
  "current", "describe", "documented", "enforce", "enforced", "explain",
  "fill", "framework", "full", "independent", "latest", "list", "maintain",
  "maintained", "needs", "party", "perform", "performed", "practices",
  "program", "programme", "provide", "quarterly", "regular", "regularly",
  "relevant", "require", "required", "requires", "review", "reviewed",
  "share", "shared", "third", "wants",
])

/** Words that ask for security material in general rather than for one topic. */
const GENERIC_SECURITY = new Set([
  "compliance", "controls", "diligence", "document", "documents", "docs", "due",
  "evidence", "infosec", "information", "pack", "policies", "policy", "posture",
  "procedure", "procedures", "questionnaire", "questionnaires", "reviews",
  "security",
])

/**
 * Where a security review usually starts: the security policy itself, access,
 * encryption, incidents, continuity and privacy.
 */
export const CORE_SECURITY_SET = [
  "information-security-policy",
  "access-control-policy",
  "cryptography-policy",
  "information-security-incident-management-policy-and-procedure",
  "business-continuity-and-disaster-recovery-policy-procedure",
  "data-privacy-policy",
]

export type DocumentMatch = {
  documents: CatalogComplianceDocument[]
  /**
   * matched: policies that cover what was asked. related: the question asks
   * about a capability (BYOK, SAML, a WAF); the policies relate to it, and the
   * Beam team confirms the specifics. starter: the core set, a starting point.
   */
  mode: "matched" | "related" | "starter" | "none"
}

/** Asks whether something is supported or provided, which a policy cannot prove. */
const CAPABILITY =
  /\b(supports?|supported|offer|offered|offers|enabled|available|provide (a|the) list|list of|bring your own|byok|customer[- ]managed|via saml|waf|ddos|dedicated)\b/i

/**
 * Documents for a security question, matched on titles only. Words that sit
 * in many titles ("management", "policy", "data") decide nothing, so a
 * vulnerability question gets the vulnerability policy, not every
 * "... Management" document. A security question nothing specific matches gets
 * the core set, labelled as a starting point rather than as covering it.
 */
export function matchDocuments(
  question: string,
  documents: readonly CatalogComplianceDocument[],
  limit = 6
): DocumentMatch {
  const bySlug = new Map(documents.map((document) => [document.slug, document]))
  const titleWords = documents.map((document) => new Set(words(document.title)))
  const frequency = new Map<string, number>()
  for (const set of titleWords) for (const word of set) frequency.set(word, (frequency.get(word) ?? 0) + 1)
  const distinctive = (word: string) => (frequency.get(word) ?? 0) > 0 && (frequency.get(word) ?? 0) < 4

  const asked = words(question).filter(
    (word) => !WEAK_WORDS.has(word) && !DOCUMENT_STOP.has(word) && !GENERIC_SECURITY.has(word)
  )
  const phrased = /data protection/i.test(question) ? ["personal", "privacy"] : []
  const targets = new Set(
    [...asked.flatMap((word) => [word, ...(DOCUMENT_SYNONYMS[word] ?? [])]), ...phrased].filter(distinctive)
  )

  const picked: CatalogComplianceDocument[] = []
  const add = (slug: string) => {
    const document = bySlug.get(slug)
    if (document && !picked.includes(document)) picked.push(document)
  }

  // A reviewer who names a document ("an information security policy") gets
  // that document first, even when its title words are common to the library.
  const lowered = question.toLowerCase()
  for (const document of documents) {
    if (lowered.includes(document.title.toLowerCase())) add(document.slug)
  }

  if (targets.size > 0) {
    documents
      .map((document, index) => ({
        document,
        hits: [...targets].filter((word) => titleWords[index]?.has(word)).length,
      }))
      .filter((row) => row.hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .forEach((row) => add(row.document.slug))

    reviewerQuestions
      .map((entry) => ({
        entry,
        hits: words(entry.question).filter((word) => targets.has(word)).length,
      }))
      .filter((row) => row.hits > 0)
      .sort((a, b) => b.hits - a.hits)
      .forEach((row) => row.entry.documentSlugs.forEach(add))
  }

  if (picked.length > 0) {
    return { documents: picked.slice(0, limit), mode: CAPABILITY.test(question) ? "related" : "matched" }
  }
  CORE_SECURITY_SET.forEach(add)
  return { documents: picked.slice(0, limit), mode: picked.length ? "starter" : "none" }
}

export type AskResult<U extends AskUseCase = AskUseCase> = {
  question: string
  faq: AskOutcome
  security: boolean
  documents: CatalogComplianceDocument[]
  documentMode: DocumentMatch["mode"]
  /** Asks for evidence the library does not hold; the Beam team provides it. */
  beamOnly: boolean
  useCase: boolean
  useCases: U[]
}

/**
 * `context` is the rest of a pasted email; it can only make a question more
 * cautious (a Saudi client named in the email makes "where is the data
 * stored?" a residency question), never answer it.
 */
export function answerQuestion<U extends AskUseCase>(
  question: string,
  {
    faq,
    documents,
    useCases,
  }: {
    faq: AskCandidate[]
    documents: readonly CatalogComplianceDocument[]
    useCases: readonly U[]
  },
  context = ""
): AskResult<U> {
  const beamOnly = isBeamOnlyEvidence(question)
  const security = (isSecurityQuestion(question) || beamOnly) && documents.length > 0
  const match = security && !beamOnly ? matchDocuments(question, documents) : { documents: [], mode: "none" as const }
  const useCase = isUseCaseQuestion(question) && useCases.length > 0
  return {
    question,
    faq: resolveAsk(question, faq, context),
    security,
    documents: match.documents,
    documentMode: match.mode,
    beamOnly,
    useCase,
    useCases: useCase ? matchUseCases(question, useCases).slice(0, 3) : [],
  }
}

const LIST_MARKER = /^\s*(?:q?\d+[.):]|\(?[a-h][.)]|\(?(?:i{1,3}|iv|v|vi{1,3}|ix|x)[.)]|[-*•–])\s+/i
const GREETING = /^(hi|hello|hey|dear|thanks|thank you|many thanks|best|regards|kind regards|cheers|sincerely)\b/i
const REQUEST =
  /\b(please|kindly|confirm|send|share|provide|describe|explain|list|tell|advise|clarify|attach|let us know|we need|we require|we'?d like|we would like|could you|can you|do you|is there|are there)\b/i

/**
 * A pasted client email, split into the questions it asks and the context
 * around them. Numbered, lettered, roman and bulleted items count; so do
 * requests not phrased as questions ("Please confirm where the data is
 * hosted") and follow-ups after a question mark. Greetings and sign-offs are
 * dropped; other statements ("Our client is a Saudi government entity") are
 * kept as context. Linear in the length of the text.
 */
export function splitEmail(text: string) {
  const lines: Array<{ listed: boolean; text: string }> = []
  for (const raw of text.split(/\r?\n/)) {
    const listed = LIST_MARKER.test(raw)
    const line = raw.replace(LIST_MARKER, "").trim()
    if (!line) continue
    const previous = lines[lines.length - 1]
    // A question wrapped onto the next line continues it.
    if (previous && !listed && /^[a-z]/.test(line) && !/[.?!:]$/.test(previous.text)) {
      previous.text = `${previous.text} ${line}`
      continue
    }
    lines.push({ listed, text: line })
  }

  const questions: string[] = []
  const context: string[] = []
  for (const line of lines) {
    const sentences = line.text
      .split(/(?<=[.?!])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
    sentences.forEach((sentence, index) => {
      if (!/[a-z]/i.test(sentence)) return
      if (GREETING.test(sentence) && sentence.length < 40) return
      // A lead-in ("we need a few things:") introduces questions; it is not one.
      if (sentence.endsWith(":")) {
        context.push(sentence)
        return
      }
      const asks =
        sentence.endsWith("?") ||
        REQUEST.test(sentence) ||
        (line.listed && index === 0) ||
        (index > 0 && sentences[index - 1]?.endsWith("?"))
      if (asks) questions.push(sentence.replace(/^(and|also|plus)\s+/i, ""))
      else context.push(sentence)
    })
  }

  if (questions.length === 0) {
    const single = text.replace(/\s+/g, " ").trim()
    return { questions: single ? [single] : [], context: "" }
  }
  return { questions, context: context.join(" ") }
}

/** The questions alone, for callers that do not need the context. */
export function splitQuestions(text: string) {
  return splitEmail(text).questions
}

export type NumberedQuestion = { ref: string; text: string }

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

const MARKER = /^\s*(?:(q?\d+)[.):]|\(?([a-h])[.)]|\(?(i{1,3}|iv|v|vi{1,3}|ix|x)[.)]|([-*•–]))\s+/i
const SIGN_OFF =
  /^(thanks|thank you|many thanks|thanks in advance|best|best regards|kind regards|warm regards|regards|cheers|sincerely|br|all the best)\b[\s,.!]*([a-z]+[\s,.!]*)?$/i
const SIGNATURE_DELIMITER = /^--\s*$/
const FORWARD_HEADER = /^(from|to|cc|bcc|subject|date|sent|reply-to|mime-version|content-[a-z-]+):\s/i
const FORWARD_MARKER = /^(-{3,}\s*forwarded message\s*-{3,}|begin forwarded message:)$/i
const QUOTED_HISTORY = /^(on .+ wrote:|from: .+@.+)$/i
const SEPARATOR = /^(-{2,}\s*original message\s*-{2,}|_{10,})$/i
const DISCLAIMER =
  /\b(confidential|intended (solely )?for the (named )?(addressee|recipient)|if you (have )?received this (e-?mail|message) in error|privileged|disclaimer)\b/i

/**
 * A client's email, split into their questions in their own numbering. When
 * two or more items carry list markers, those items are the questions and
 * everything else is context; otherwise the questions are found as in
 * `splitEmail` and numbered in order. Reading stops at the sign-off or the
 * quoted history below it, and a disclaimer is never a question. One list
 * item asking two things becomes 4a and 4b, so the reply still lines up with
 * the client's list.
 */
export function splitEmailWithRefs(text: string): {
  questions: NumberedQuestion[]
  context: string
} {
  const lines = text.split(/\r?\n/)
  const nextIsHeader = (index: number) =>
    FORWARD_HEADER.test(lines.slice(index + 1).find((line) => line.trim())?.trim() ?? "")
  let kept: string[] = []
  let inHeader = false
  for (const [index, raw] of lines.entries()) {
    const line = raw.trim()
    const asked = kept.filter((entry) => MARKER.test(entry) || entry.trim().endsWith("?")).length
    // A forward starts the client's own email: the forwarder's note above it
    // is theirs, not the client's, and the header block below it is skipped.
    // A separator line counts as a forward only when little has been asked
    // above it; under a list of questions it starts quoted history.
    if (FORWARD_MARKER.test(line) || (SEPARATOR.test(line) && nextIsHeader(index) && asked < 2)) {
      kept = []
      inHeader = true
      continue
    }
    if (inHeader) {
      if (!line || FORWARD_HEADER.test(line)) continue
      inHeader = false
    }
    if (asked === 0 && FORWARD_HEADER.test(line)) continue
    if (SIGNATURE_DELIMITER.test(raw) || SEPARATOR.test(line) || QUOTED_HISTORY.test(line)) break
    if (kept.some((entry) => entry.trim()) && SIGN_OFF.test(line)) break
    if (line.startsWith(">") || DISCLAIMER.test(line)) continue
    kept.push(raw)
  }

  const items: Array<{ ref: string; text: string }> = []
  const loose: string[] = []
  let bullets = 0
  let current: { ref: string; text: string } | null = null
  for (const raw of kept) {
    const marker = raw.match(MARKER)
    const line = raw.replace(MARKER, "").trim()
    if (marker) {
      const ref = marker[1] ?? marker[2] ?? marker[3] ?? String(++bullets)
      current = { ref: ref.replace(/^q/i, "Q"), text: line }
      items.push(current)
    } else if (!line) {
      current = null
    } else if (current && !/[.?!:]$/.test(current.text)) {
      // A list item wrapped onto the next line continues it.
      current.text = `${current.text} ${line}`
    } else {
      current = null
      loose.push(line)
    }
  }

  if (items.length < 2) {
    const { questions, context } = splitEmail(kept.join("\n"))
    return {
      questions: questions.map((question, index) => ({ ref: String(index + 1), text: question })),
      context,
    }
  }

  const questions: NumberedQuestion[] = []
  for (const item of items) {
    const sentences = item.text
      .split(/(?<=[.?!])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
    const asking = sentences.filter((sentence) => sentence.endsWith("?") || REQUEST.test(sentence))
    if (asking.length <= 1) {
      questions.push({ ref: item.ref, text: asking[0] ?? item.text })
    } else {
      asking.forEach((sentence, index) =>
        questions.push({
          ref: `${item.ref}${String.fromCharCode(97 + index)}`,
          text: capitalise(sentence.replace(/^(and|also|plus)\s+/i, "")),
        })
      )
    }
  }
  const context = loose.filter((line) => !(GREETING.test(line) && line.length < 40))
  return { questions, context: context.join(" ") }
}
