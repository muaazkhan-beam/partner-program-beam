/**
 * The questions offered before a partner types anything.
 *
 * Deliberately not an empty box: most people do not know how to phrase a
 * question to a chat box, so the first click must already be a good one.
 * Each opener names what it must produce, and tests/ask.test.ts checks that
 * against the real catalog. `answer:<slug>` is a published answer;
 * `beam:<slug>` routes to Beam.
 */
export type Opener = {
  text: string
  expect: "security" | "use-case" | `answer:${string}` | `beam:${string}`
}

export const HOME_OPENERS: readonly Opener[] = [
  { text: "A client sent us security questions", expect: "security" },
  { text: "Which use case fits a finance client?", expect: "use-case" },
  { text: "Why would a client pick Beam over SAP?", expect: "answer:why-not-sap" },
  { text: "How should we price the first workflow?", expect: "beam:pricing-and-packaging" },
]

export const FAQ_OPENERS: readonly Opener[] = [
  { text: "Why not SAP?", expect: "answer:why-not-sap" },
  { text: "How does Beam work with client data?", expect: "answer:data-integration" },
  { text: "Can we deploy in Saudi Arabia?", expect: "beam:deployment-ksa-kuwait" },
  { text: "When should I walk away?", expect: "answer:when-to-walk-away" },
]
