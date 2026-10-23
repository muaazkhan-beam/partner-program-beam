import type { CatalogUseCase, UseCaseDetail } from "../convex/catalogTypes"

/**
 * Scope answers the question GTM named as the one partners cannot answer:
 * "when does Beam get in?" A client describes a process; the partner matches it
 * against what Beam already runs, then records only what is different at this
 * client. The catalog supplies the standard shape, so the partner types four
 * things instead of filling a form, and Beam receives the deltas its delivery
 * team actually needs.
 */

/** Where a process stands, in the same three states Beam uses internally. */
export type ProcessStatus = "hypothesis" | "discovery" | "validated"

export const statusLabel: Record<ProcessStatus, string> = {
  hypothesis: "Mentioned once",
  discovery: "In discovery",
  validated: "Confirmed with the client",
}

export const processStatuses = Object.keys(statusLabel) as ProcessStatus[]

/** Dimensions where the catalog states a standard and the partner notes a difference. */
export type DeltaId = "trigger" | "systems" | "today" | "approval"
/** Dimensions only the client can answer; Beam publishes no standard for them. */
export type ClientFactId = "volume" | "measure"

export const deltaDimensions: ReadonlyArray<{
  id: DeltaId
  label: string
  ask: string
  standardOf: (detail: UseCaseDetail) => string
}> = [
  {
    id: "trigger",
    label: "What starts a case",
    ask: "Does something else start it at this client?",
    standardOf: (detail) => detail.trigger,
  },
  {
    id: "systems",
    label: "Systems",
    ask: "Which systems does this client run instead?",
    standardOf: (detail) => detail.systems.join(" · "),
  },
  {
    id: "today",
    label: "How it is handled today",
    ask: "How does this client handle it today?",
    standardOf: (detail) => detail.before,
  },
  {
    id: "approval",
    label: "Human approval",
    ask: "Who approves it at this client?",
    standardOf: (detail) => detail.humanInLoop,
  },
]

export const clientFacts: ReadonlyArray<{
  id: ClientFactId
  label: string
  ask: string
}> = [
  {
    id: "volume",
    label: "Volume",
    ask: "How often does it happen, in the client's words?",
  },
  {
    id: "measure",
    label: "What they measure",
    ask: "Which number does the client report on this today?",
  },
]

export type ScopedProcess = {
  id: string
  /** The live use case this was matched to. */
  useCaseSlug: string
  client: string
  status: ProcessStatus
  differences: Partial<Record<DeltaId, string>>
  facts: Partial<Record<ClientFactId, string>>
  updatedAt: number
}

export function newScopedProcess(
  useCaseSlug: string,
  input: Partial<ScopedProcess> = {}
): ScopedProcess {
  return {
    id:
      input.id ??
      `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    useCaseSlug,
    client: input.client ?? "",
    status: input.status ?? "hypothesis",
    differences: input.differences ?? {},
    facts: input.facts ?? {},
    updatedAt: input.updatedAt ?? Date.now(),
  }
}

const trimmed = (value: string | undefined) => (value ?? "").trim()

export type Delta = {
  id: DeltaId
  label: string
  standard: string
  atClient: string
}

export type ProcessReading = {
  differs: Delta[]
  same: Delta[]
  facts: Array<{ id: ClientFactId; label: string; value: string }>
  missingFacts: string[]
  /** Count of dimensions the partner has recorded a difference on. */
  differenceCount: number
  totalDimensions: number
}

/** Compare what the client described against the shape Beam already runs. */
export function readProcess(
  process: ScopedProcess,
  useCase: CatalogUseCase
): ProcessReading {
  const differs: Delta[] = []
  const same: Delta[] = []
  for (const dimension of deltaDimensions) {
    const standard = dimension.standardOf(useCase)
    const atClient = trimmed(process.differences[dimension.id])
    const delta: Delta = { id: dimension.id, label: dimension.label, standard, atClient }
    if (atClient) differs.push(delta)
    else same.push(delta)
  }
  const facts = clientFacts
    .filter((fact) => trimmed(process.facts[fact.id]))
    .map((fact) => ({
      id: fact.id,
      label: fact.label,
      value: trimmed(process.facts[fact.id]),
    }))
  const missingFacts = clientFacts
    .filter((fact) => !trimmed(process.facts[fact.id]))
    .map((fact) => fact.ask)
  return {
    differs,
    same,
    facts,
    missingFacts,
    differenceCount: differs.length,
    totalDimensions: deltaDimensions.length,
  }
}

/**
 * The note that goes to Beam: the standard it starts from, what is different at
 * this client, what matches, and what is still unknown. No score, no number the
 * partner did not hear from the client.
 */
export function briefText(process: ScopedProcess, useCase: CatalogUseCase) {
  const reading = readProcess(process, useCase)
  const client = trimmed(process.client) || "(client not named)"
  const lines = [
    `${useCase.title} at ${client}`,
    `Status: ${statusLabel[process.status]}`,
    `Beam's standard shape: ${useCase.summary}`,
    "",
  ]
  if (reading.differs.length) {
    lines.push("Different at this client:")
    for (const delta of reading.differs) {
      lines.push(`- ${delta.label}: ${delta.atClient}`)
      lines.push(`  (standard: ${delta.standard})`)
    }
    lines.push("")
  } else {
    lines.push("Nothing recorded as different from the standard shape yet.", "")
  }
  if (reading.same.length) {
    lines.push(
      `Same as standard: ${reading.same.map((delta) => delta.label.toLowerCase()).join(", ")}.`,
      ""
    )
  }
  if (reading.facts.length) {
    lines.push("From the client:")
    for (const fact of reading.facts) lines.push(`- ${fact.label}: ${fact.value}`)
    lines.push("")
  }
  if (reading.missingFacts.length) {
    lines.push("Still to ask:")
    for (const ask of reading.missingFacts) lines.push(`- ${ask}`)
    lines.push("")
  }
  return lines.join("\n").trimEnd() + "\n\n"
}

/** Request text when a partner heard a process Beam has no live use case for. */
export function noMatchText(heard: string) {
  return [
    "A client described a process I could not match to a live use case.",
    "",
    `What they described: ${trimmed(heard) || "(describe the process)"}`,
    "",
    "Is this something Beam runs today, and is there a record I can use?",
  ].join("\n")
}

/** Departments the catalog covers, in catalog order, for the match step. */
export function departmentsOf(useCases: readonly CatalogUseCase[]) {
  const seen: string[] = []
  for (const useCase of useCases) {
    const department = useCase.group ?? "Other"
    if (!seen.includes(department)) seen.push(department)
  }
  return seen
}
