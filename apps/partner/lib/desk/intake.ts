import type { CatalogComplianceDocument } from "../../convex/catalogTypes"
import { NOT_ANSWERED_LINE, clientCell, countCells, type ClientCell, type SheetCounts } from "../answer-sheet"
import { answerQuestion, splitEmailWithRefs, type AskResult, type AskUseCase } from "../ask"
import { placeCues, type AskCandidate } from "../faq-answer"
import { detectColumns, fillCsv, parseCsv, questionsFromCsv, toCsv } from "../intake/csv"
import { EmailParseError, parseEml } from "../intake/eml"
import { isDemoContent, type HoldOptions, type PackContent } from "../pack"
import type { Thread, ThreadQuestion } from "./types"

/**
 * Whatever a client sent, as the partner received it: a forwarded email, a
 * pasted text, or their questionnaire as CSV. Read into numbered questions,
 * answered by the same engine and the same send rule as everything else, and
 * never kept whole: a thread stores the questions and place names only.
 */
export type IntakeSource =
  | { kind: "paste"; text: string }
  | { kind: "email"; raw: string; fileName?: string }
  | { kind: "questionnaire"; csv: string; fileName: string }

export type IntakeErrorCode = "msg-file" | "spreadsheet" | "unsupported" | "not-email" | "no-questions" | "no-question-column"

const INTAKE_MESSAGE: Record<IntakeErrorCode, string> = {
  "msg-file": "Outlook .msg files can't be read here. Save the email as .eml, or paste its text.",
  spreadsheet: "Save the sheet as CSV (File, Save As, CSV) and drop it again.",
  unsupported: "Drop an email (.eml), a questionnaire (.csv) or a text file, or paste the text.",
  "not-email": "This doesn't read as an email. Paste its text instead.",
  "no-questions": "No questions found. Paste the questions, one per line or numbered.",
  "no-question-column": "No question column found. Name the column Question and drop it again.",
}

export class IntakeError extends Error {
  readonly code: IntakeErrorCode
  constructor(code: IntakeErrorCode) {
    super(INTAKE_MESSAGE[code])
    this.code = code
  }
}

/** Decides what a dropped file is from its name; the browser reads its text. */
export function sourceKind(fileName: string): "email" | "questionnaire" | "paste" {
  const name = fileName.toLowerCase()
  if (name.endsWith(".msg")) throw new IntakeError("msg-file")
  if (/\.(xlsx|xls|numbers|ods)$/.test(name)) throw new IntakeError("spreadsheet")
  if (name.endsWith(".eml")) return "email"
  if (name.endsWith(".csv")) return "questionnaire"
  if (name.endsWith(".txt") || !name.includes(".")) return "paste"
  throw new IntakeError("unsupported")
}

export type IntakeQuestion = { id: string; ref: string; text: string }

export type Intake = {
  source: Thread["source"]
  subject: string
  senderDomain?: string
  questions: IntakeQuestion[]
  context: string
  questionnaire?: Thread["questionnaire"]
}

const HEADER_BLOCK = /^(from|subject|to|date):\s/im

function emailIntake(raw: string, fallbackSubject: string): Intake {
  let parsed
  try {
    parsed = parseEml(raw)
  } catch (error) {
    if (error instanceof EmailParseError) throw new IntakeError("not-email")
    throw error
  }
  const { questions, context } = splitEmailWithRefs(parsed.body)
  return {
    source: "email",
    subject: parsed.subject || fallbackSubject,
    senderDomain: parsed.senderDomain,
    questions: questions.map((question, index) => ({ id: `q${index + 1}`, ...question })),
    context,
  }
}

export function readIntake(source: IntakeSource): Intake {
  let intake: Intake
  if (source.kind === "email") {
    intake = emailIntake(source.raw, source.fileName ?? "Forwarded email")
  } else if (source.kind === "questionnaire") {
    const parsed = parseCsv(source.csv)
    const columns = detectColumns(parsed.headers, parsed.rows)
    if (!columns) throw new IntakeError("no-question-column")
    const found = questionsFromCsv(parsed, columns)
    const questions = found.map((question, index) => ({ id: `q${index + 1}`, ref: question.ref, text: question.text }))
    intake = {
      source: "questionnaire",
      subject: source.fileName,
      questions,
      context: "",
      questionnaire: {
        fileName: source.fileName,
        delimiter: parsed.delimiter,
        headers: parsed.headers,
        rows: parsed.rows,
        questionColumn: columns.question,
        ...(columns.ref !== undefined ? { refColumn: columns.ref } : {}),
        rowOf: Object.fromEntries(found.map((question, index) => [`q${index + 1}`, question.row])),
      },
    }
  } else if (HEADER_BLOCK.test(source.text.split(/\r?\n/).slice(0, 12).join("\n"))) {
    // A pasted email with its headers reads like a dropped one.
    try {
      intake = { ...emailIntake(source.text, "Pasted email"), source: "paste" }
    } catch {
      intake = pasteIntake(source.text)
    }
  } else {
    intake = pasteIntake(source.text)
  }
  if (intake.questions.length === 0) throw new IntakeError("no-questions")
  return intake
}

function pasteIntake(text: string): Intake {
  const { questions, context } = splitEmailWithRefs(text)
  return {
    source: "paste",
    subject: questions.length > 1 ? "Pasted questions" : (questions[0]?.text ?? "Pasted question"),
    questions: questions.map((question, index) => ({ id: `q${index + 1}`, ...question })),
    context,
  }
}

export type AskSources = {
  faq: AskCandidate[]
  documents: CatalogComplianceDocument[]
  useCases: AskUseCase[]
}

export type SheetRowResult = {
  question: IntakeQuestion
  result: AskResult
  cell: ClientCell
}

export function answerQuestions(
  questions: readonly IntakeQuestion[],
  context: string,
  {
    sources,
    find,
    brandMode,
    hold,
  }: { sources: AskSources; find: (slug: string) => PackContent | undefined; brandMode: string; hold: HoldOptions }
): SheetRowResult[] {
  return questions.map((question) => {
    const result = answerQuestion(question.text, sources, context)
    return { question, result, cell: clientCell(result, { brandMode, find, ...hold }) }
  })
}

/**
 * A stored thread, answered again from today's catalog. A question that went
 * to Beam when it arrived stays with Beam: the more cautious outcome always
 * wins, so a later change can never loosen an answer already given.
 */
export function answerThread(
  thread: Thread,
  options: Parameters<typeof answerQuestions>[2]
): SheetRowResult[] {
  const rows = answerQuestions(thread.questions, thread.contextCues.join(" "), options)
  return rows.map((row, index) =>
    thread.questions[index]?.routedAtIntake && row.cell.kind !== "beam"
      ? { ...row, cell: { kind: "beam", text: NOT_ANSWERED_LINE } }
      : row
  )
}

export function newThread(
  intake: Intake,
  rows: readonly SheetRowResult[],
  { id, workspaceSlug, clientId, now }: { id: string; workspaceSlug: string; clientId?: string; now: number }
): Thread {
  const questions: ThreadQuestion[] = rows.map((row) => ({
    id: row.question.id,
    ref: row.question.ref,
    text: row.question.text,
    routedAtIntake: row.cell.kind === "beam",
  }))
  return {
    id,
    workspaceSlug,
    ...(clientId ? { clientId } : {}),
    source: intake.source,
    subject: intake.subject,
    ...(intake.senderDomain ? { senderDomain: intake.senderDomain } : {}),
    questions,
    contextCues: placeCues(intake.context),
    ...(intake.questionnaire ? { questionnaire: intake.questionnaire } : {}),
    receivedAt: now,
    createdAt: now,
    updatedAt: now,
  }
}

export function sheetCounts(rows: readonly SheetRowResult[]): SheetCounts {
  return countCells(rows.map((row) => row.cell))
}

const STATUS: Record<ClientCell["kind"], string> = {
  quote: "Quoted",
  policy: "Policy reference",
  beam: "For Beam",
}

function sourceOf(cell: ClientCell) {
  if (cell.kind === "quote") {
    return isDemoContent(cell.item)
      ? `Beam answer: ${cell.item.title} (demo content, not reviewed by Beam)`
      : `Beam answer: ${cell.item.title}`
  }
  if (cell.kind === "policy") return "Beam policies, as printed"
  return "Beam partner team"
}

/**
 * The client's own file back, in their column and row order, with three
 * columns added. Every added cell is a quote, a printed reference or the
 * fixed line, through the same cells as the reply sheet.
 */
export function filledQuestionnaire(thread: Thread, rows: readonly SheetRowResult[]) {
  const sheet = thread.questionnaire
  if (!sheet?.rows) return null
  const answers = new Map(
    rows.flatMap((row) => {
      const at = sheet.rowOf[row.question.id]
      return at === undefined ? [] : [[at, { answer: row.cell.text, source: sourceOf(row.cell), status: STATUS[row.cell.kind] }] as const]
    })
  )
  const delimiter = sheet.delimiter ?? ","
  const filled = fillCsv({ headers: sheet.headers, rows: sheet.rows, delimiter }, answers)
  return toCsv(filled.headers, filled.rows, { delimiter })
}
