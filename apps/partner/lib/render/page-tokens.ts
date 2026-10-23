/**
 * The page both renderers draw: A4 in points, the margins, the type scale and
 * the colours. The on-screen preview and the PDF read the same numbers, so
 * the partner approves what the client gets. The partner's own style changes
 * the accent, the logo and the lockup; the ink, the stamps and "Beam" do not
 * change, because the words are Beam's.
 */
export const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: { top: 48, right: 51, bottom: 60, left: 51 },
} as const

export const INK = "#020817"
export const MUTED = "#64748b"
export const RULE = "#e2e8f0"
export const BEAM_BLUE = "#0061ff"

export const TYPE = {
  title: 28,
  heading: 14,
  body: 10.5,
  small: 8.5,
  lineHeight: 1.35,
} as const

export type StyleTokens = {
  accent: string
  /** The accent darkened until it reads on white, for headings. */
  accentText: string
  logoDataUrl?: string
  headingFont?: string
}

export const BEAM_STYLE: StyleTokens = { accent: BEAM_BLUE, accentText: BEAM_BLUE }
