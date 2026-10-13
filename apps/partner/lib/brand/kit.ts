import type { BrandMode } from "../../convex/catalogTypes"
import { parseStore } from "../browser-store"
import { BEAM_STYLE, type StyleTokens } from "../render/page-tokens"
import { textSafe } from "./palette"

/**
 * The partner's own style, read from their template or logo in the browser
 * and kept there. It changes the accent, the logo and the lockup of what
 * leaves the portal; the words, the stamps and "Beam" stay Beam's. Offered
 * only where Beam cleared the style for the workspace.
 */
export type BrandKit = {
  mode: BrandMode
  accent?: string
  headingFont?: string
  bodyFont?: string
  logoDataUrl?: string
  source?: "pptx" | "logo"
  sourceName?: string
  updatedAt: number
}

export const brandKey = (workspaceSlug: string) => `beam-partner-style:${workspaceSlug}`

/** A logo is kept only when it is small enough to live beside the pack. */
export const MAX_LOGO_BYTES = 200_000

export function parseBrandKit(raw: string): BrandKit {
  const parsed = parseStore<Partial<BrandKit>>(raw, {})
  const mode: BrandMode =
    parsed.mode === "co-branded" || parsed.mode === "partner-fronted" ? parsed.mode : "beam-standard"
  return {
    mode,
    ...(typeof parsed.accent === "string" && /^#[0-9a-f]{6}$/i.test(parsed.accent) ? { accent: parsed.accent } : {}),
    ...(typeof parsed.headingFont === "string" ? { headingFont: parsed.headingFont } : {}),
    ...(typeof parsed.bodyFont === "string" ? { bodyFont: parsed.bodyFont } : {}),
    ...(typeof parsed.logoDataUrl === "string" && parsed.logoDataUrl.startsWith("data:image/") && parsed.logoDataUrl.length <= MAX_LOGO_BYTES * 1.4
      ? { logoDataUrl: parsed.logoDataUrl }
      : {}),
    ...(parsed.source === "pptx" || parsed.source === "logo" ? { source: parsed.source } : {}),
    ...(typeof parsed.sourceName === "string" ? { sourceName: parsed.sourceName } : {}),
    updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
  }
}

/** The mode this workspace may use: anything else falls back to its brand mode. */
export function clampMode(mode: BrandMode, allowed: readonly BrandMode[], fallback: BrandMode): BrandMode {
  return allowed.includes(mode) ? mode : fallback
}

/**
 * The tokens a renderer draws with. Beam style is Beam's blue and no logo;
 * the partner's accent is used only once it reads on white, and only in
 * co-branded or partner-fronted output.
 */
export function styleTokens(mode: BrandMode, kit: BrandKit): StyleTokens {
  if (mode === "beam-standard" || !kit.accent) return BEAM_STYLE
  const safe = textSafe(kit.accent)
  return {
    accent: kit.accent,
    accentText: safe.hex,
    ...(kit.logoDataUrl ? { logoDataUrl: kit.logoDataUrl } : {}),
    ...(kit.headingFont ? { headingFont: kit.headingFont } : {}),
  }
}
