import type { ComponentType } from "react"

import { ComplianceLibrary } from "@/components/compliance/library"
import { ComplianceQuestionnaire } from "@/components/compliance/questionnaire"
import { FitCheckChecklist, FitCheckStepper } from "@/components/fit-check"

export type PrototypeEntry = {
  title: string
  description: string
  variants: Array<{ key: string; label: string; Component: ComponentType }>
}

/**
 * Throwaway prototypes, rendered by /w/<workspace>/prototype/<name>?variant=<key>.
 * Each variant answers one layout question; the winner is rebuilt as a real
 * surface and the entry is deleted.
 */
export const prototypes: Record<string, PrototypeEntry> = {
  compliance: {
    title: "Security & compliance",
    description:
      "Two ways to build a client pack: scan the library, or start from the questions the client's security reviewer asked.",
    variants: [
      { key: "a", label: "Document library", Component: ComplianceLibrary },
      { key: "b", label: "Reviewer questions", Component: ComplianceQuestionnaire },
    ],
  },
  fit: {
    title: "Is this process a fit?",
    description:
      "Two ways to run the eight-question fit check: all questions at once with a live verdict, or one at a time.",
    variants: [
      { key: "a", label: "Checklist with live verdict", Component: FitCheckChecklist },
      { key: "b", label: "One question at a time", Component: FitCheckStepper },
    ],
  },
}
