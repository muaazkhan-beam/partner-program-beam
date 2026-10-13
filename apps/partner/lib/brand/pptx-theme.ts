import { unzipSync } from "fflate"

/**
 * Reads a partner's PowerPoint template in the browser: theme colours, fonts,
 * the logo on the slide master and the company name. The file never leaves
 * the page, and only the handful of parts named below are ever inflated.
 * XML is read with small string scanners, not DOMParser, so this runs in Node too.
 */

export const themeColorSlots = [
  "dk1",
  "lt1",
  "dk2",
  "lt2",
  "accent1",
  "accent2",
  "accent3",
  "accent4",
  "accent5",
  "accent6",
  "hlink",
  "folHlink",
] as const

export type ThemeColorSlot = (typeof themeColorSlots)[number]

export type PptxTheme = {
  name?: string
  colors: Partial<Record<ThemeColorSlot, string>>
  fonts: { major?: string; minor?: string }
}

export type PptxRelationship = { id: string; type: string; target: string }

export type LogoMime = "image/png" | "image/jpeg" | "image/svg+xml"

export type PptxRead = {
  theme: PptxTheme
  logo?: { name: string; mime: LogoMime; bytes: Uint8Array }
  company?: string
}

export type PptxErrorCode = "not-zip" | "not-pptx" | "too-large"

const errorMessages: Record<PptxErrorCode, string> = {
  "not-zip": "This is not a PowerPoint file we can open. Password-protected files cannot be read.",
  "not-pptx": "This file has no PowerPoint theme to read colours and fonts from.",
  "too-large": "This file is too large to read in the browser.",
}

export class PptxError extends Error {
  readonly code: PptxErrorCode

  constructor(code: PptxErrorCode, message = errorMessages[code]) {
    super(message)
    this.name = "PptxError"
    this.code = code
  }
}

// Declared sizes bound what inflating can produce, which is what stops a zip bomb.
const MAX_ENTRY_BYTES = 5 * 1024 * 1024
const MAX_TOTAL_BYTES = 25 * 1024 * 1024
const MAX_LOGO_BYTES = 2 * 1024 * 1024

const MASTER = "ppt/slidemasters/slidemaster1.xml"
const MASTER_RELS = "ppt/slidemasters/_rels/slidemaster1.xml.rels"
const APP_PROPS = "docprops/app.xml"
const FALLBACK_THEME = "ppt/theme/theme1.xml"

const logoMimes: Record<string, LogoMime> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
}

/** Windows system colours, for the rare theme that leaves out `lastClr`. */
const systemColours: Record<string, string> = {
  windowText: "#000000",
  window: "#ffffff",
}

const PREFIX = "(?:[\\w.-]+:)?"

function stripComments(xml: string) {
  return xml.replace(/<!--[\s\S]*?-->/g, "")
}

function decodeXml(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (whole, entity: string) => {
    const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }
    const lower = entity.toLowerCase()
    if (named[lower]) return named[lower]
    const code = lower.startsWith("#x")
      ? Number.parseInt(lower.slice(2), 16)
      : Number.parseInt(lower.slice(1), 10)
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole
  })
}

function attribute(tag: string, name: string) {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(tag)
  const raw = match?.[1] ?? match?.[2]
  return raw === undefined ? undefined : decodeXml(raw)
}

/** The first element with this local name, whatever its namespace prefix. */
function findElement(xml: string, localName: string) {
  const open = new RegExp(`<(${PREFIX})${localName}(?=[\\s/>])[^>]*>`).exec(xml)
  if (!open) return undefined
  const tag = open[0]
  if (tag.endsWith("/>")) return { tag, body: "" }
  const bodyStart = open.index + tag.length
  const close = xml.indexOf(`</${open[1] ?? ""}${localName}>`, bodyStart)
  return { tag, body: close === -1 ? "" : xml.slice(bodyStart, close) }
}

function hexValue(value: string | undefined) {
  return value && /^[0-9a-f]{6}$/i.test(value) ? `#${value.toLowerCase()}` : undefined
}

function slotColour(body: string) {
  const srgb = findElement(body, "srgbClr")
  if (srgb) return hexValue(attribute(srgb.tag, "val"))
  const system = findElement(body, "sysClr")
  if (!system) return undefined
  return (
    hexValue(attribute(system.tag, "lastClr")) ?? systemColours[attribute(system.tag, "val") ?? ""]
  )
}

function latinTypeface(xml: string, which: "majorFont" | "minorFont") {
  const font = findElement(xml, which)
  const latin = font && findElement(font.body, "latin")
  return latin ? attribute(latin.tag, "typeface")?.trim() || undefined : undefined
}

export function parseThemeXml(xml: string): PptxTheme {
  const source = stripComments(xml)
  const root = findElement(source, "theme")
  const name = root ? attribute(root.tag, "name")?.trim() : undefined

  const scheme = findElement(source, "clrScheme")?.body ?? ""
  const colors: PptxTheme["colors"] = {}
  for (const slot of themeColorSlots) {
    const body = findElement(scheme, slot)?.body
    const colour = body === undefined ? undefined : slotColour(body)
    if (colour) colors[slot] = colour
  }

  const fonts: PptxTheme["fonts"] = {}
  const major = latinTypeface(source, "majorFont")
  const minor = latinTypeface(source, "minorFont")
  if (major) fonts.major = major
  if (minor) fonts.minor = minor

  return name ? { name, colors, fonts } : { colors, fonts }
}

export function parseRels(xml: string): PptxRelationship[] {
  const relationships: PptxRelationship[] = []
  const pattern = new RegExp(`<${PREFIX}Relationship(?=[\\s/>])[^>]*>`, "g")
  for (const [tag] of stripComments(xml).matchAll(pattern)) {
    const id = attribute(tag, "Id")
    const type = attribute(tag, "Type")
    const target = attribute(tag, "Target")
    if (id && type && target) relationships.push({ id, type, target })
  }
  return relationships
}

function safeDecodeUri(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/** A relationship target as a lower-case part name, relative to the part that holds it. */
function resolvePart(fromPart: string, target: string) {
  const path = safeDecodeUri(target).replace(/\\/g, "/")
  const segments = path.startsWith("/") ? [] : fromPart.split("/").slice(0, -1)
  for (const segment of path.split("/")) {
    if (segment === "" || segment === ".") continue
    if (segment === "..") segments.pop()
    else segments.push(segment)
  }
  return segments.join("/").toLowerCase()
}

function extension(path: string) {
  return path.slice(path.lastIndexOf(".") + 1).toLowerCase()
}

function looksLikeZip(bytes: Uint8Array) {
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) return false
  const marker = `${bytes[2]}.${bytes[3]}`
  return marker === "3.4" || marker === "5.6" || marker === "7.8"
}

type Part = { name: string; bytes: Uint8Array }
type Budget = { total: number }

/** Inflates only the entries `wanted` accepts, keyed by lower-case part name. */
function unzipParts(
  bytes: Uint8Array,
  wanted: (name: string, size: number) => boolean,
  budget: Budget
) {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(bytes, {
      filter: (file) => {
        const size = Math.max(file.size, file.originalSize)
        if (!wanted(file.name.toLowerCase(), size)) return false
        budget.total += size
        if (size > MAX_ENTRY_BYTES || budget.total > MAX_TOTAL_BYTES) {
          throw new PptxError("too-large")
        }
        return true
      },
    })
  } catch (error) {
    if (error instanceof PptxError) throw error
    throw new PptxError("not-zip")
  }
  const parts = new Map<string, Part>()
  for (const [name, data] of Object.entries(files)) {
    parts.set(name.toLowerCase(), { name, bytes: data })
  }
  return parts
}

const decoder = new TextDecoder()

function text(part: Part | undefined) {
  return part ? decoder.decode(part.bytes) : ""
}

/** Image ids the master paints as its background: a backdrop photo is not a logo. */
function backgroundImageIds(masterXml: string) {
  const background = findElement(stripComments(masterXml), "bg")?.body ?? ""
  const pattern = new RegExp(`\\s${PREFIX}embed\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "g")
  return new Set([...background.matchAll(pattern)].map((match) => match[1] ?? match[2] ?? ""))
}

function readLogo(
  bytes: Uint8Array,
  masterRels: readonly PptxRelationship[],
  masterXml: string,
  budget: Budget
): PptxRead["logo"] {
  const background = backgroundImageIds(masterXml)
  const candidates = masterRels
    .filter((rel) => rel.type.endsWith("/image") && !background.has(rel.id))
    .map((rel) => resolvePart(MASTER, rel.target))
    .filter((path) => path.startsWith("ppt/media/") && logoMimes[extension(path)])
  if (candidates.length === 0) return undefined

  const media = unzipParts(
    bytes,
    (name, size) => candidates.includes(name) && size <= MAX_LOGO_BYTES,
    budget
  )
  for (const path of candidates) {
    const part = media.get(path)
    const mime = logoMimes[extension(path)]
    if (part && mime) {
      return { name: part.name.slice(part.name.lastIndexOf("/") + 1), mime, bytes: part.bytes }
    }
  }
  return undefined
}

export function readPptx(bytes: Uint8Array): PptxRead {
  if (!looksLikeZip(bytes)) throw new PptxError("not-zip")
  const budget: Budget = { total: 0 }
  const parts = unzipParts(
    bytes,
    (name) =>
      name === MASTER ||
      name === MASTER_RELS ||
      name === APP_PROPS ||
      /^ppt\/theme\/[^/]+\.xml$/.test(name),
    budget
  )

  const masterRels = parseRels(text(parts.get(MASTER_RELS)))
  const themeRel = masterRels.find((rel) => rel.type.endsWith("/theme"))
  const themePart =
    (themeRel && parts.get(resolvePart(MASTER, themeRel.target))) ?? parts.get(FALLBACK_THEME)
  if (!themePart) throw new PptxError("not-pptx")

  const theme = parseThemeXml(text(themePart))
  const logo = readLogo(bytes, masterRels, text(parts.get(MASTER)), budget)
  const companyElement = findElement(stripComments(text(parts.get(APP_PROPS))), "Company")
  const company = companyElement ? decodeXml(companyElement.body).trim() : ""

  return {
    theme,
    ...(logo ? { logo } : {}),
    ...(company ? { company } : {}),
  }
}

const SERIF_FAMILIES = [
  "georgia",
  "times",
  "garamond",
  "cambria",
  "palatino",
  "book antiqua",
  "baskerville",
  "constantia",
]

/**
 * PDFs can only carry Roboto, which we bundle, and the standard PDF families.
 * A serif brand font keeps a serif in print; everything else becomes Roboto,
 * and the caller says so plainly rather than pretending the font came through.
 */
export function describeFont(name: string | undefined): {
  name?: string
  inPdf: "Roboto" | "Times"
} {
  const clean = name?.trim()
  if (!clean) return { inPdf: "Roboto" }
  const lower = clean.toLowerCase()
  const serif =
    SERIF_FAMILIES.some((family) => lower.includes(family)) ||
    (lower.includes("serif") && !lower.includes("sans"))
  return { name: clean, inPdf: serif ? "Times" : "Roboto" }
}
