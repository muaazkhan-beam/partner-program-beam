/**
 * A client's security questionnaire as CSV. We read their questions in their
 * order and hand the same file back with Beam's answers in three new columns,
 * so the reviewer never has to map our rows onto theirs. Pure, so it runs in
 * the browser and in Node tests alike.
 */

export type ParsedCsv = {
  /** Trimmed. Every row has exactly as many cells as there are headers. */
  headers: string[]
  rows: string[][]
  delimiter: "," | ";" | "\t"
}

type Delimiter = ParsedCsv["delimiter"]

const BOM = "﻿"

function isDelimiter(char: string): char is Delimiter {
  return char === "," || char === ";" || char === "\t"
}

/**
 * European Excel saves with semicolons and some tools export tabs. Counting
 * only outside quotes keeps a header like "Hosting, region" from voting.
 */
function detectDelimiter(text: string): Delimiter {
  const counts: Record<Delimiter, number> = { ",": 0, ";": 0, "\t": 0 }
  let quoted = false
  for (const char of text) {
    if (char === '"') quoted = !quoted
    else if (quoted) continue
    else if (char === "\n" || char === "\r") break
    else if (isDelimiter(char)) counts[char] += 1
  }
  let best: Delimiter = ","
  for (const candidate of [";", "\t"] as const) {
    if (counts[candidate] > counts[best]) best = candidate
  }
  return best
}

/** RFC 4180 records: quoted fields, doubled quotes, line breaks inside quotes. */
function readRecords(text: string, delimiter: Delimiter) {
  const records: string[][] = []
  let record: string[] = []
  let field = ""
  let quoted = false
  let atFieldStart = true
  // Whether anything has been read since the last line break, so a file that
  // ends without one still yields its last record.
  let pending = false

  for (let index = 0; index < text.length; index++) {
    const char = text.charAt(index)
    if (quoted) {
      if (char !== '"') field += char
      else if (text.charAt(index + 1) === '"') {
        field += '"'
        index++
      } else quoted = false
      continue
    }
    pending = true
    if (char === '"' && atFieldStart) {
      quoted = true
      atFieldStart = false
    } else if (char === delimiter) {
      record.push(field)
      field = ""
      atFieldStart = true
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && text.charAt(index + 1) === "\n") index++
      record.push(field)
      records.push(record)
      record = []
      field = ""
      atFieldStart = true
      pending = false
    } else {
      field += char
      atFieldStart = false
    }
  }
  if (pending) {
    record.push(field)
    records.push(record)
  }
  return records
}

function isBlank(cells: readonly string[]) {
  return cells.every((cell) => cell.trim() === "")
}

/**
 * Pads to the widest row, headers included, so columns appended later line up
 * even when a client's export leaves a trailing delimiter on its data rows.
 */
function squareUp(headers: readonly string[], rows: readonly (readonly string[])[]) {
  const width = rows.reduce((widest, row) => Math.max(widest, row.length), headers.length)
  const pad = (cells: readonly string[]) => [
    ...cells,
    ...Array.from({ length: width - cells.length }, () => ""),
  ]
  return { headers: pad(headers), rows: rows.map(pad) }
}

export function parseCsv(text: string): ParsedCsv {
  const source = text.startsWith(BOM) ? text.slice(1) : text
  const delimiter = detectDelimiter(source.replace(/^[\r\n]+/, ""))
  const records = readRecords(source, delimiter)
  const first = records.findIndex((record) => !isBlank(record))
  if (first === -1) return { headers: [], rows: [], delimiter }
  const last = records.findLastIndex((record) => !isBlank(record))
  const [headerRow = [], ...rows] = records.slice(first, last + 1)
  const headers = headerRow.map((cell) => cell.trim())
  return { ...squareUp(headers, rows), delimiter }
}

function quoteField(cell: string, delimiter: Delimiter) {
  const needsQuotes = cell.includes(delimiter) || /["\r\n]/.test(cell) || /^\s|\s$/.test(cell)
  return needsQuotes ? `"${cell.replaceAll('"', '""')}"` : cell
}

/** The BOM is what makes Excel read the file as UTF-8 rather than mangle accents. */
export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
  { delimiter = ",", bom = true }: { delimiter?: Delimiter; bom?: boolean } = {}
): string {
  const body = [headers, ...rows]
    .map((cells) => cells.map((cell) => quoteField(cell, delimiter)).join(delimiter))
    .join("\r\n")
  return `${bom ? BOM : ""}${body}\r\n`
}

/**
 * Excel and Sheets run a cell that starts with = + - @ as a formula. The cells
 * we write carry generated text, so a leading quote keeps them as text when
 * the client opens the file. The client's own cells are theirs and pass
 * through untouched.
 */
export function safeCell(text: string) {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
}

export type CsvColumns = { question: number; ref?: number }

type Column = { index: number; header: string; values: string[] }

/** Header words in order of preference when several columns carry one. */
const QUESTION_WORDS = ["question", "requirement", "control", "query", "description", "ask"]
const REF_HEADER = /^(ref|reference|id|#|no\.?|number|item ?(no|#|id)|control ?id|q ?#)$/i
/** "Question ID" or "Requirement No." names a reference, not the question. */
const REF_SUFFIX = /(\b(id|ref|reference|no|number)\.?|#)$/i
/** Longer than this, or ending in "?", and the first row is data, not a header. */
const MAX_HEADER_LENGTH = 40
const MIN_ASKED_SHARE = 0.25
const MIN_QUESTION_LENGTH = 15
const MIN_DISTINCT_SHARE = 0.8
const MAX_CODE_LENGTH = 12

function share(values: readonly string[], matches: (value: string) => boolean) {
  return values.length ? values.filter(matches).length / values.length : 0
}

function averageLength(values: readonly string[]) {
  return values.length ? values.reduce((sum, value) => sum + value.length, 0) / values.length : 0
}

const isAsked = (value: string) => /[?？]$/.test(value)
const isWorded = (value: string) => /\p{L}/u.test(value)
const isToken = (value: string) => value.length <= MAX_CODE_LENGTH && !/\s/.test(value)
/** AV-01, Q3, 1.2, 4a. */
const isCode = (value: string) => isToken(value) && /\d/.test(value)

function readsAsText(values: readonly string[]) {
  return share(values, isWorded) >= 0.5 && share(values, isCode) <= 0.5
}

/** Mostly short and mostly distinct, so a Yes/No or score column never passes for one. */
function isKeyColumn(values: readonly string[], matches: (value: string) => boolean) {
  return share(values, matches) > 0.5 && new Set(values).size >= values.length * MIN_DISTINCT_SHARE
}

function questionWordRank(header: string) {
  if (header.length > MAX_HEADER_LENGTH || isAsked(header)) return -1
  if (REF_HEADER.test(header) || REF_SUFFIX.test(header)) return -1
  const lower = header.toLowerCase()
  return QUESTION_WORDS.findIndex((word) => lower.includes(word))
}

function pickQuestion(columns: readonly Column[]) {
  const hasData = columns.some((column) => column.values.length > 0)
  const named = columns
    .map((column) => ({ column, rank: questionWordRank(column.header) }))
    .filter(({ column, rank }) =>
      rank === -1 ? false : column.values.length ? readsAsText(column.values) : !hasData
    )
    .sort(
      (a, b) => a.rank - b.rank || averageLength(b.column.values) - averageLength(a.column.values)
    )
  if (named[0]) return named[0].column.index

  // No header names it: questions end with "?" or are the longest text.
  const read = columns
    .filter((column) => column.values.length && readsAsText(column.values))
    .map((column) => {
      const asked = share(column.values, isAsked)
      return {
        index: column.index,
        asked: asked >= MIN_ASKED_SHARE ? asked : 0,
        length: averageLength(column.values),
      }
    })
    .filter(({ asked, length }) => asked > 0 || length >= MIN_QUESTION_LENGTH)
    .sort((a, b) => b.asked - a.asked || b.length - a.length)
  return read[0]?.index
}

function pickRef(columns: readonly Column[], question: number) {
  const others = columns.filter((column) => column.index !== question)
  const named = others.find(
    (column) =>
      REF_HEADER.test(column.header) &&
      (column.values.length === 0 || isKeyColumn(column.values, isToken))
  )
  if (named) return named.index
  return others.find((column) => column.values.length && isKeyColumn(column.values, isCode))?.index
}

export function detectColumns(headers: string[], rows: string[][]): CsvColumns | null {
  const columns = headers.map((header, index) => ({
    index,
    header: header.trim(),
    values: rows.map((row) => (row[index] ?? "").trim()).filter(Boolean),
  }))
  const question = pickQuestion(columns)
  if (question === undefined) return null
  const ref = pickRef(columns, question)
  return ref === undefined ? { question } : { question, ref }
}

export type CsvQuestion = { ref: string; text: string; row: number }

/** One per row with a question, in the client's order, keyed by their own reference. */
export function questionsFromCsv(parsed: ParsedCsv, columns: CsvColumns): CsvQuestion[] {
  return parsed.rows.flatMap((row, index) => {
    const text = (row[columns.question] ?? "").trim()
    if (!text) return []
    const ref = columns.ref === undefined ? "" : (row[columns.ref] ?? "").trim()
    return [{ ref: ref || String(index + 1), text, row: index }]
  })
}

export type CsvAnswer = { answer: string; source: string; status: string }

const BEAM_COLUMNS = ["From Beam", "Source", "Status"] as const

/**
 * The client's file as they sent it, plus three columns on the right. Their
 * columns and rows stay where they were so the reviewer can diff it against
 * their original.
 */
export function fillCsv(
  parsed: ParsedCsv,
  answers: ReadonlyMap<number, CsvAnswer>,
  columns: readonly [string, string, string] = BEAM_COLUMNS
): { headers: string[]; rows: string[][] } {
  const { headers, rows } = squareUp(parsed.headers, parsed.rows)
  return {
    headers: [...headers, ...columns.map(safeCell)],
    rows: rows.map((row, index) => {
      const answer = answers.get(index)
      const added = answer ? [answer.answer, answer.source, answer.status] : ["", "", ""]
      return [...row, ...added.map(safeCell)]
    }),
  }
}
