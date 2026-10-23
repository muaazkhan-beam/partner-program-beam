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

/**
 * Openers for a client in each phase: the questions partners usually face
 * there, so the box follows the client rather than offering the same four
 * everywhere. Checked against the catalog like the others.
 */
export const PHASE_OPENERS: Readonly<Record<"win" | "scope" | "build" | "deploy" | "monitor" | "deliver", readonly Opener[]>> = {
  win: [
    { text: "Why would a client pick Beam over SAP?", expect: "answer:why-not-sap" },
    { text: "What makes a strong first workflow?", expect: "answer:first-process-fit" },
    { text: "When should I walk away?", expect: "answer:when-to-walk-away" },
  ],
  scope: [
    { text: "Which use case fits a finance client?", expect: "use-case" },
    { text: "What does the first engagement look like?", expect: "answer:first-engagement" },
    { text: "How do we define and measure success?", expect: "answer:measuring-success" },
  ],
  build: [
    { text: "Where does human approval sit?", expect: "answer:human-approval" },
    { text: "Can we see a working agent, not a slide?", expect: "answer:working-agent" },
    { text: "How does Beam work with client data?", expect: "answer:data-integration" },
  ],
  deploy: [
    { text: "A client sent us security questions", expect: "security" },
    { text: "Can we deploy in Saudi Arabia?", expect: "beam:deployment-ksa-kuwait" },
    { text: "Who supports the client after go-live?", expect: "beam:support-and-escalation" },
  ],
  monitor: [
    { text: "How do you keep accuracy from decaying?", expect: "answer:accuracy" },
    { text: "How do we define and measure success?", expect: "answer:measuring-success" },
    { text: "Where does human approval sit?", expect: "answer:human-approval" },
  ],
  deliver: [
    { text: "What should I send my leadership tomorrow?", expect: "answer:leadership-pack" },
    { text: "What does the first engagement look like?", expect: "answer:first-engagement" },
    { text: "Can we see a working agent, not a slide?", expect: "answer:working-agent" },
  ],
}
