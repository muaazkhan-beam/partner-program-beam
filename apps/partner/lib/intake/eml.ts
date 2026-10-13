/**
 * Reads an email a partner forwarded to Beam: an .eml file or its pasted
 * source. We want the client who wrote it and what they asked, as plain text.
 * Nothing here renders HTML; an HTML-only email is reduced to text with regexes.
 */

export type EmailAddress = { name?: string; address: string; domain: string }

export type ParsedEmail = {
  /** Whoever sent this message, usually the partner forwarding it. */
  from?: EmailAddress
  subject: string
  date?: string
  /** The client's text when forwarded, otherwise the whole message. */
  body: string
  /** The original sender inside the forwarded block: the client. */
  forwardedFrom?: EmailAddress
  /** What the partner wrote above the forwarded block. */
  forwarderNote?: string
  senderDomain?: string
  forwarderDomain?: string
  fromHtml: boolean
}

export type EmailParseErrorCode = "empty" | "not-email" | "no-text"

const ERROR_MESSAGES: Record<EmailParseErrorCode, string> = {
  empty: "The email is empty.",
  "not-email": "This does not look like an email: there is no From or Subject header.",
  "no-text": "No readable text was found in this email.",
}

export class EmailParseError extends Error {
  readonly code: EmailParseErrorCode

  constructor(code: EmailParseErrorCode, message = ERROR_MESSAGES[code]) {
    super(message)
    this.name = "EmailParseError"
    this.code = code
  }
}

type HeaderMap = Map<string, string>
type Entity = { headers: HeaderMap; body: string }
type Part = Entity & { type: string; charset: string; attachment: boolean }
type BodyText = { text: string; fromHtml: boolean }

// Deep enough for mixed > related > alternative, shallow enough to stop a hostile file.
const MAX_MIME_DEPTH = 8
const MAX_ADDRESS_LENGTH = 2000
const HEADER_LINE = /^([!-9;-~]+)[ \t]*:[ \t]*(.*)$/
const ENCODED_WORD = /=\?([^?\s]+)\?([QqBb])\?([^?\s]*)\?=/g

function normalizeNewlines(text: string) {
  return text.replace(/\r\n?/g, "\n")
}

function isBlank(text: string) {
  return text.trim() === ""
}

function bytesToText(bytes: Uint8Array, charset: string) {
  const label = charset.trim().replace(/^"|"$/g, "") || "utf-8"
  try {
    return new TextDecoder(label).decode(bytes)
  } catch {
    // An unknown label is far more often mislabelled UTF-8 than anything exotic.
    return new TextDecoder("utf-8").decode(bytes)
  }
}

function base64ToBytes(text: string) {
  let clean = text.replace(/[^A-Za-z0-9+/]/g, "")
  if (clean.length % 4 === 1) clean = clean.slice(0, -1)
  const binary = globalThis.atob(clean.padEnd(Math.ceil(clean.length / 4) * 4, "="))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function hexRunToBytes(run: string) {
  const bytes = new Uint8Array(run.length / 3)
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = parseInt(run.slice(index * 3 + 1, index * 3 + 3), 16)
  }
  return bytes
}

/**
 * Each run of =XX escapes is one byte sequence, so a character split across a
 * soft line break still decodes once the break is gone.
 */
function decodeQuotedPrintable(text: string, charset: string) {
  return text
    .replace(/=[ \t]*\n/g, "")
    .replace(/(?:=[0-9A-Fa-f]{2})+/g, (run) => bytesToText(hexRunToBytes(run), charset))
}

const utf8 = new TextEncoder()

function encodedWordBytes(encoding: string, text: string): number[] {
  if (encoding.toUpperCase() === "B") return Array.from(base64ToBytes(text))
  const bytes: number[] = []
  for (let index = 0; index < text.length; index++) {
    const char = text.charAt(index)
    const hex = text.slice(index + 1, index + 3)
    if (char === "=" && /^[0-9A-Fa-f]{2}$/.test(hex)) {
      bytes.push(parseInt(hex, 16))
      index += 2
    } else if (char === "_") {
      bytes.push(0x20)
    } else {
      bytes.push(...utf8.encode(char))
    }
  }
  return bytes
}

/**
 * RFC 2047 encoded words. Adjacent words in one charset are joined as bytes
 * before decoding, because senders split multi-byte characters across them.
 */
function decodeHeaderWords(value: string) {
  let result = ""
  let cursor = 0
  let pending: { charset: string; bytes: number[] } | undefined
  const flush = () => {
    if (pending) result += bytesToText(Uint8Array.from(pending.bytes), pending.charset)
    pending = undefined
  }
  for (const match of value.matchAll(ENCODED_WORD)) {
    const [word, rawCharset = "", encoding = "", text = ""] = match
    const start = match.index ?? 0
    const charset = rawCharset.split("*")[0]?.toLowerCase() ?? ""
    const gap = value.slice(cursor, start)
    const bytes = encodedWordBytes(encoding, text)
    if (pending && pending.charset === charset && isBlank(gap)) {
      pending.bytes.push(...bytes)
    } else {
      flush()
      result += gap
      pending = { charset, bytes }
    }
    cursor = start + word.length
  }
  flush()
  return result + value.slice(cursor)
}

/** Headers until the first blank line, folded lines joined, names lower-cased. */
function parseEntity(text: string): Entity {
  const lines = text.split("\n")
  const headers: HeaderMap = new Map()
  let current: string | undefined
  let index = 0
  for (; index < lines.length; index++) {
    const line = lines[index] ?? ""
    if (isBlank(line)) {
      index++
      break
    }
    // Every line before this one was a header, so indentation means a fold.
    if (index > 0 && /^[ \t]/.test(line)) {
      if (current) {
        headers.set(current, `${headers.get(current) ?? ""}${line.replace(/^[ \t]+/, " ")}`)
      }
      continue
    }
    const match = HEADER_LINE.exec(line)
    if (!match) break
    const name = (match[1] ?? "").toLowerCase()
    // Only the first of a repeated header (Received, say) is kept, folds included.
    current = headers.has(name) ? undefined : name
    if (current) headers.set(current, match[2] ?? "")
  }
  return { headers, body: lines.slice(index).join("\n") }
}

function parseContentType(value: string | undefined) {
  const [type = "", ...rest] = (value ?? "").split(";")
  const params = new Map<string, string>()
  const paramText = `;${rest.join(";")}`
  for (const match of paramText.matchAll(
    /;\s*([^\s=;]+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|([^;\s]*))/g
  )) {
    const key = (match[1] ?? "").toLowerCase()
    if (!params.has(key)) params.set(key, match[2] ?? match[3] ?? "")
  }
  return { type: type.trim().toLowerCase() || "text/plain", params }
}

function splitMultipart(body: string, boundary: string) {
  const delimiter = `--${boundary}`
  const parts: string[] = []
  let current: string[] | undefined
  for (const line of body.split("\n")) {
    if (line.startsWith(delimiter)) {
      const rest = line.slice(delimiter.length)
      if (rest.startsWith("--")) {
        if (current) parts.push(current.join("\n"))
        return parts
      }
      if (isBlank(rest)) {
        if (current) parts.push(current.join("\n"))
        current = []
        continue
      }
    }
    current?.push(line)
  }
  // A truncated file has no closing delimiter; keep what arrived.
  if (current) parts.push(current.join("\n"))
  return parts
}

function collectParts(entity: Entity, depth: number, parts: Part[]) {
  const { type, params } = parseContentType(entity.headers.get("content-type"))
  const boundary = params.get("boundary")
  if (type.startsWith("multipart/") && boundary && depth < MAX_MIME_DEPTH) {
    for (const section of splitMultipart(entity.body, boundary)) {
      collectParts(parseEntity(section), depth + 1, parts)
    }
    return parts
  }
  const disposition = entity.headers.get("content-disposition") ?? ""
  parts.push({
    ...entity,
    type,
    charset: params.get("charset") ?? "",
    attachment:
      /^\s*attachment\b/i.test(disposition) || /filename/i.test(disposition) || params.has("name"),
  })
  return parts
}

function decodePart(part: Part) {
  const encoding = (part.headers.get("content-transfer-encoding") ?? "").trim().toLowerCase()
  const decoded =
    encoding === "quoted-printable"
      ? decodeQuotedPrintable(part.body, part.charset)
      : encoding === "base64"
        ? bytesToText(base64ToBytes(part.body), part.charset)
        : part.body
  return normalizeNewlines(decoded)
}

// A Map, so "&constructor;" finds nothing rather than Object.prototype.
const NAMED_ENTITIES = new Map([
  ["amp", "&"],
  ["lt", "<"],
  ["gt", ">"],
  ["quot", '"'],
  ["apos", "'"],
  ["nbsp", " "],
  ["ndash", "\u2013"],
  ["mdash", "\u2014"],
  ["lsquo", "\u2018"],
  ["rsquo", "\u2019"],
  ["ldquo", "\u201c"],
  ["rdquo", "\u201d"],
  ["hellip", "\u2026"],
])

function decodeEntities(text: string) {
  return text.replace(/&(#\d+|#[xX][0-9A-Fa-f]+|[A-Za-z]+);/g, (entity, name: string) => {
    if (!name.startsWith("#")) return NAMED_ENTITIES.get(name.toLowerCase()) ?? entity
    const code = /^#[xX]/.test(name) ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10)
    const valid = code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff)
    return valid ? String.fromCodePoint(code) : entity
  })
}

/**
 * Drops style, script, head and comments with a forward-only scan. One lazy
 * regex would rescan to the end for every unclosed "<style>", which a hostile
 * file can turn into a frozen tab.
 */
function dropHiddenBlocks(html: string) {
  const open = /<(style|script|head)\b|<!--/gi
  const unclosed = new Set<string>()
  let result = ""
  let cursor = 0
  for (let match = open.exec(html); match; match = open.exec(html)) {
    const name = (match[1] ?? "!--").toLowerCase()
    const close = name === "!--" ? /-->/g : new RegExp(`</${name}\\s*>`, "gi")
    close.lastIndex = open.lastIndex
    const end = unclosed.has(name) ? null : close.exec(html)
    if (!end) {
      unclosed.add(name)
      // An unclosed style, script or comment hides the rest, as in a browser.
      // A stray <head> is only a tag.
      if (name !== "head") return result + html.slice(cursor, match.index)
      continue
    }
    result += html.slice(cursor, match.index)
    cursor = open.lastIndex = end.index + end[0].length
  }
  return result + html.slice(cursor)
}

/**
 * Conservative on purpose: the result is shown as text, so all that matters is
 * that no markup survives and the line breaks a reader saw are kept. Entities
 * are decoded after tags are gone, so an escaped "&lt;b&gt;" stays visible text.
 * Tag patterns stop at the next "<" for the same reason as above.
 */
function htmlToText(html: string) {
  const stripped = dropHiddenBlocks(html)
    .replace(/\s+/g, " ")
    .replace(/<br\b[^<>]*>/gi, "\n")
    // Outlook on the web separates a forward with <hr>; keep it as Outlook's plain-text rule.
    .replace(/<hr\b[^<>]*>/gi, "\n__________\n")
    .replace(/<\/(?:p|div|li|tr|h[1-6]|blockquote|table)\s*>/gi, "\n")
    .replace(/<\/t[dh]\s*>/gi, " ")
    .replace(/<[^<>]*>/g, "")
  return decodeEntities(stripped)
    .split("\n")
    .map((line) => line.replace(/[ \t\u00a0]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function firstText(parts: Part[], type: string) {
  for (const part of parts) {
    if (part.type !== type || part.attachment) continue
    const decoded = decodePart(part)
    const text = type === "text/html" ? htmlToText(decoded) : decoded
    if (!isBlank(text)) return text
  }
  return undefined
}

function readText(parts: Part[]): BodyText | undefined {
  const plain = firstText(parts, "text/plain")
  if (plain !== undefined) return { text: plain, fromHtml: false }
  const html = firstText(parts, "text/html")
  if (html !== undefined) return { text: html, fromHtml: true }
  return undefined
}

function cleanName(raw: string, address: string) {
  const name = decodeHeaderWords(raw)
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^"([\s\S]*)"$|^'([\s\S]*)'$|^\(([\s\S]*)\)$/, "$1$2$3")
    .replace(/\\(.)/g, "$1")
    .trim()
  return name && name.toLowerCase() !== address.toLowerCase() ? name : undefined
}

function toAddress(candidate: string) {
  const value = candidate
    .replace(/^mailto:/i, "")
    .replace(/^['"]+|['".]+$/g, "")
    .trim()
  const at = value.lastIndexOf("@")
  const local = value.slice(0, at)
  const domain = value.slice(at + 1).toLowerCase()
  if (at <= 0 || /[\s<>]/.test(local)) return undefined
  if (!/^[^\s.@<>()[\]\\,;:"']+(?:\.[^\s.@<>()[\]\\,;:"']+)+$/.test(domain)) return undefined
  return { address: `${local}@${domain}`, domain }
}

function withName(address: { address: string; domain: string }, rawName: string): EmailAddress {
  const name = cleanName(rawName, address.address)
  return name ? { name, ...address } : address
}

/**
 * One mailbox from a From-style value: 'Name <a@b>', '"Last, First" <a@b>',
 * a bare 'a@b', or Outlook's 'Name [mailto:a@b]'. The first one wins.
 */
export function parseAddress(value: string): EmailAddress | undefined {
  // A real mailbox fits in one header line; the cap keeps the scans below cheap on junk.
  const text = value.slice(0, MAX_ADDRESS_LENGTH).replace(/\s+/g, " ").trim()
  const bracketed =
    /<\s*(?:mailto:)?([^<>\s]+)\s*>/i.exec(text) ?? /\[\s*mailto:([^\]\s]+)\s*\]/i.exec(text)
  if (bracketed) {
    const address = toAddress(bracketed[1] ?? "")
    if (!address) return undefined
    // Outlook's plain text can give 'Name <a@b<mailto:a@b>>'; the name stops at the first '<'.
    const before = text.slice(0, bracketed.index).replace(/<[\s\S]*$/, "")
    const after = text.slice(bracketed.index + bracketed[0].length)
    return withName(address, isBlank(before) ? trailingComment(after) : before)
  }
  const bare = /[^\s<>()[\]",;:]+@[^\s<>()[\]",;:]+/.exec(text)
  const address = bare && toAddress(bare[0])
  if (!bare || !address) return undefined
  return withName(address, trailingComment(text.slice(bare.index + bare[0].length)))
}

/** The old 'a@b (Name)' form; anything else after an address is another address. */
function trailingComment(text: string) {
  return /^\s*\(([^)]*)\)/.exec(text)?.[1] ?? ""
}

type ForwardMarker = { pattern: RegExp; usedForReplies: boolean }

const FORWARD_MARKERS: ForwardMarker[] = [
  // Gmail, and Thunderbird's "-------- Forwarded Message --------".
  { pattern: /^-{3,}\s*Forwarded message\s*-{3,}$/i, usedForReplies: false },
  { pattern: /^Begin forwarded message:$/i, usedForReplies: false },
  { pattern: /^-{3,}\s*Original Message\s*-{3,}$/i, usedForReplies: true },
  { pattern: /^_{10,}$/, usedForReplies: true },
]

// Gmail's plain text of a rich forward bolds labels as "*From:*".
const BLOCK_HEADER = /^\s*\*?(from|sent|date|to|cc|bcc|subject|reply-to|importance)\s*:\*?\s*(.*)$/i
const OUTLOOK_FROM = /^\*?From\s*:/i
const OUTLOOK_SENT = /^\s*\*?Sent\s*:/i
const REPLY_SUBJECT = /^\s*(?:re|aw|sv|antw)\s*:/i

type ForwardBlock = { note: string; from?: EmailAddress; body: string }

function trimBody(lines: string[]) {
  const start = lines.findIndex((line) => !isBlank(line))
  return start === -1 ? "" : lines.slice(start).join("\n").trimEnd()
}

/** The header lines that open a forwarded block; it only counts with a From. */
function readBlock(
  lines: string[],
  noteEnd: number,
  headerStart: number
): ForwardBlock | undefined {
  let index = headerStart
  while (index < lines.length && isBlank(lines[index] ?? "")) index++
  // Apple Mail can quote the whole forward with "> "; read it without the prefix.
  const quoted = (lines[index] ?? "").startsWith(">")
  const read = (line: string) => (quoted ? line.replace(/^> ?/, "") : line)
  const headers: HeaderMap = new Map()
  let current: string | undefined
  for (; index < lines.length; index++) {
    const line = read(lines[index] ?? "")
    const match = BLOCK_HEADER.exec(line)
    if (match) {
      const name = (match[1] ?? "").toLowerCase()
      current = headers.has(name) ? undefined : name
      if (current) headers.set(current, (match[2] ?? "").trim())
    } else if (current && /^[ \t]+\S/.test(line)) {
      headers.set(current, `${headers.get(current) ?? ""} ${line.trim()}`)
    } else {
      break
    }
  }
  const fromLine = headers.get("from")
  if (fromLine === undefined) return undefined
  return {
    note: lines.slice(0, noteEnd).join("\n").trim(),
    from: parseAddress(fromLine),
    body: trimBody(lines.slice(index).map(read)),
  }
}

/**
 * The first forwarded block in the text. Outlook writes the same block for
 * replies and forwards, so under a "Re:" subject it means a quoted reply and
 * the message is the sender's own.
 */
function findForward(text: string, subject: string): ForwardBlock | undefined {
  const lines = text.split("\n")
  for (let index = 0; index < lines.length; index++) {
    const line = (lines[index] ?? "").trim()
    const marker = FORWARD_MARKERS.find(({ pattern }) => pattern.test(line))
    // Outlook's plain text of an HTML forward often has no separator, only "From:" then "Sent:".
    const unmarked = !marker && OUTLOOK_FROM.test(line) && OUTLOOK_SENT.test(lines[index + 1] ?? "")
    if (!marker && !unmarked) continue
    const block = readBlock(lines, index, marker ? index + 1 : index)
    if (!block) continue
    if ((marker?.usedForReplies ?? true) && REPLY_SUBJECT.test(subject)) return undefined
    return block
  }
  return undefined
}

type Message = { headers: HeaderMap; text?: BodyText; attachedMessage?: string }

function readMessage(source: string): Message {
  const entity = parseEntity(source)
  const parts = collectParts(entity, 0, [])
  const attached = parts.find((part) => part.type === "message/rfc822")
  return {
    headers: entity.headers,
    text: readText(parts),
    attachedMessage: attached && decodePart(attached),
  }
}

function hasMessageHeaders(headers: HeaderMap) {
  return headers.has("from") || headers.has("subject")
}

/** The text to keep, and who wrote it when the partner forwarded it. */
type Reading = {
  body: string
  fromHtml: boolean
  forward?: { note: string; from?: EmailAddress }
}

function parseFrom(headers: HeaderMap) {
  const value = headers.get("from")
  return value === undefined ? undefined : parseAddress(value)
}

/** "Forward as attachment" carries the client's whole email as a message/rfc822 part. */
function readAttachedForward(message: Message): Reading | undefined {
  if (!message.attachedMessage) return undefined
  const inner = readMessage(message.attachedMessage)
  if (!hasMessageHeaders(inner.headers) || !inner.text) return undefined
  return {
    body: trimBody(inner.text.text.split("\n")),
    fromHtml: inner.text.fromHtml,
    forward: { note: message.text?.text.trim() ?? "", from: parseFrom(inner.headers) },
  }
}

function readBody(message: Message, subject: string): Reading | undefined {
  const { text } = message
  const inline = text && findForward(text.text, subject)
  if (text && inline) return { body: inline.body, fromHtml: text.fromHtml, forward: inline }
  const attached = readAttachedForward(message)
  if (attached) return attached
  return text && { body: trimBody(text.text.split("\n")), fromHtml: text.fromHtml }
}

function stripLeadIn(text: string) {
  // Mailbox exports start with an mbox "From sender date" line before the headers.
  return text
    .replace(/^\ufeff/, "")
    .replace(/^\n+/, "")
    .replace(/^From [^\n]*\n/, "")
}

export function parseEml(raw: string): ParsedEmail {
  const source = stripLeadIn(normalizeNewlines(raw))
  if (isBlank(source)) throw new EmailParseError("empty")

  const message = readMessage(source)
  if (!hasMessageHeaders(message.headers)) throw new EmailParseError("not-email")

  const from = parseFrom(message.headers)
  const subject = decodeHeaderWords(message.headers.get("subject") ?? "")
    .replace(/\s+/g, " ")
    .trim()
  const date = message.headers.get("date")?.trim()

  const reading = readBody(message, subject)
  if (!reading) throw new EmailParseError("no-text")

  // Optional fields are left off, not set to undefined, so results compare and serialise cleanly.
  const email: ParsedEmail = { subject, body: reading.body, fromHtml: reading.fromHtml }
  if (from) email.from = from
  if (date) email.date = date
  const { forward } = reading
  if (forward) {
    if (forward.from) email.forwardedFrom = forward.from
    email.forwarderNote = forward.note
    if (from) email.forwarderDomain = from.domain
  }
  const senderDomain = email.forwardedFrom?.domain ?? from?.domain
  if (senderDomain) email.senderDomain = senderDomain
  return email
}
