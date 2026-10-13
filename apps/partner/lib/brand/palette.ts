/**
 * Colour helpers for a partner's own brand. Everything here is pure so the same
 * checks run in the browser, where the partner's files are read, and in tests.
 */

export type Rgb = { r: number; g: number; b: number }

/** OKLCH: lightness 0 to 1, chroma from 0 upwards, hue in degrees. */
export type Oklch = { l: number; c: number; h: number }

export type TextSafe = { hex: string; ratio: number; adjusted: boolean }

export type RgbaImage = {
  data: Uint8ClampedArray | Uint8Array
  width: number
  height: number
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 }
const BLACK: Rgb = { r: 0, g: 0, b: 0 }

/** Below this a colour reads as grey, not as a brand colour. */
const GREY_CHROMA = 0.04
const LIGHTNESS_STEP = 0.01
/** Colours closer than this in OKLab look the same to a reader. */
const MERGE_DISTANCE = 0.05
/** Enough pixels to find a logo's colours without stalling the page. */
const MAX_SAMPLES = 250_000

export function hexToRgb(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!match?.[1]) return null
  const digits =
    match[1].length === 3 ? [...match[1]].map((digit) => digit + digit).join("") : match[1]
  const value = Number.parseInt(digits, 16)
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }
}

function channelHex(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)))
    .toString(16)
    .padStart(2, "0")
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${channelHex(r)}${channelHex(g)}${channelHex(b)}`
}

function toLinear(channel: number) {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function fromLinear(value: number) {
  const encoded = value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055
  return encoded * 255
}

function luminance({ r, g, b }: Rgb) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function ratioOf(a: Rgb, b: Rgb) {
  const first = luminance(a)
  const second = luminance(b)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

/** WCAG 2.x contrast. An unreadable colour has no contrast we can vouch for. */
export function contrastRatio(a: string, b: string): number {
  const first = hexToRgb(a)
  const second = hexToRgb(b)
  if (!first || !second) return 1
  return round2(ratioOf(first, second))
}

type Lab = { l: number; a: number; b: number }

// Björn Ottosson's OKLab matrices, from linear sRGB.
function rgbToOklab(rgb: Rgb): Lab {
  const r = toLinear(rgb.r)
  const g = toLinear(rgb.g)
  const b = toLinear(rgb.b)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

function oklabToLinear({ l, a, b }: Lab): [number, number, number] {
  const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const sc = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  ]
}

function labToLch({ l, a, b }: Lab): Oklch {
  const hue = (Math.atan2(b, a) * 180) / Math.PI
  return { l, c: Math.hypot(a, b), h: hue < 0 ? hue + 360 : hue }
}

export function toOklch(hex: string): Oklch | null {
  const rgb = hexToRgb(hex)
  return rgb ? labToLch(rgbToOklab(rgb)) : null
}

function lchToLinear(l: number, c: number, h: number) {
  const radians = (h * Math.PI) / 180
  return oklabToLinear({ l, a: c * Math.cos(radians), b: c * Math.sin(radians) })
}

function inGamut(channels: readonly number[]) {
  return channels.every((value) => value >= -1e-4 && value <= 1 + 1e-4)
}

/** The colour at this lightness and hue, with as much of the chroma as sRGB can show. */
function fitToGamut(l: number, c: number, h: number): Rgb {
  let chroma = c
  if (!inGamut(lchToLinear(l, c, h))) {
    let low = 0
    let high = c
    for (let step = 0; step < 20; step++) {
      const middle = (low + high) / 2
      if (inGamut(lchToLinear(l, middle, h))) low = middle
      else high = middle
    }
    chroma = low
  }
  const [r, g, b] = lchToLinear(l, chroma, h).map((value) =>
    fromLinear(Math.min(1, Math.max(0, value)))
  ) as [number, number, number]
  return { r, g, b }
}

/**
 * A text colour that stays readable on `on`. Only lightness moves, so the
 * partner's teal stays teal, just deeper; hue and as much chroma as fits stay.
 */
export function textSafe(hex: string, on = "#ffffff", min = 4.5): TextSafe {
  const background = hexToRgb(on) ?? WHITE
  // Darken on light backgrounds, lighten on dark ones: whichever pole reads better.
  const darken = ratioOf(BLACK, background) >= ratioOf(WHITE, background)
  const pole = darken ? BLACK : WHITE
  const poleResult: TextSafe = {
    hex: rgbToHex(pole),
    ratio: round2(ratioOf(pole, background)),
    adjusted: true,
  }
  const rgb = hexToRgb(hex)
  if (!rgb) return poleResult

  const start = rgbToHex(rgb)
  const ratio = ratioOf(rgb, background)
  if (ratio >= min) return { hex: start, ratio: round2(ratio), adjusted: false }

  const { l, c, h } = labToLch(rgbToOklab(rgb))
  const step = darken ? -LIGHTNESS_STEP : LIGHTNESS_STEP
  for (let lightness = l + step; lightness > 0 && lightness < 1; lightness += step) {
    // Rounded to 8-bit first, so the ratio is the one the printed hex will have.
    const candidate = hexToRgb(rgbToHex(fitToGamut(lightness, c, h))) ?? pole
    const candidateRatio = ratioOf(candidate, background)
    if (candidateRatio >= min) {
      return { hex: rgbToHex(candidate), ratio: round2(candidateRatio), adjusted: true }
    }
  }
  return poleResult
}

function distance(a: Lab, b: Lab) {
  return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b)
}

/**
 * The colours a logo is drawn in, most used first. Transparent and near-white
 * pixels are the page behind the logo, not the brand, so they are skipped.
 */
export function logoPalette(image: RgbaImage, count = 6): string[] {
  const { data } = image
  const counts = new Uint32Array(4096)
  const sums = new Float64Array(4096 * 3)
  const pixels = Math.min(image.width * image.height, Math.floor(data.length / 4))
  const stride = Math.max(1, Math.floor(pixels / MAX_SAMPLES))

  for (let pixel = 0; pixel < pixels; pixel += stride) {
    const at = pixel * 4
    const r = data[at] ?? 0
    const g = data[at + 1] ?? 0
    const b = data[at + 2] ?? 0
    if ((data[at + 3] ?? 0) < 128) continue
    if (r > 240 && g > 240 && b > 240) continue
    // Four bits a channel: anti-aliasing and compression noise land in one bucket.
    const bucket = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    const slot = bucket * 3
    counts[bucket] = (counts[bucket] ?? 0) + 1
    sums[slot] = (sums[slot] ?? 0) + r
    sums[slot + 1] = (sums[slot + 1] ?? 0) + g
    sums[slot + 2] = (sums[slot + 2] ?? 0) + b
  }

  const buckets: Array<{ rgb: Rgb; lab: Lab; count: number }> = []
  counts.forEach((total, bucket) => {
    if (!total) return
    const slot = bucket * 3
    const rgb = {
      r: (sums[slot] ?? 0) / total,
      g: (sums[slot + 1] ?? 0) / total,
      b: (sums[slot + 2] ?? 0) / total,
    }
    buckets.push({ rgb, lab: rgbToOklab(rgb), count: total })
  })
  buckets.sort((a, b) => b.count - a.count)

  const kept: typeof buckets = []
  for (const bucket of buckets) {
    const twin = kept.find((colour) => distance(colour.lab, bucket.lab) < MERGE_DISTANCE)
    if (twin) twin.count += bucket.count
    else kept.push({ ...bucket })
  }
  return kept
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(0, count))
    .map((colour) => rgbToHex(colour.rgb))
}

/**
 * The colour to lead with: the most saturated one that is not grey, with a
 * mid-lightness colour beating a near-black or pastel version of a hue.
 */
export function pickAccent(colours: readonly string[]): string | undefined {
  let best: { hex: string; score: number } | undefined
  for (const colour of colours) {
    const rgb = hexToRgb(colour)
    if (!rgb) continue
    const { l, c } = labToLch(rgbToOklab(rgb))
    if (c <= GREY_CHROMA) continue
    const score = c * (1 - Math.abs(l - 0.6))
    if (!best || score > best.score) best = { hex: rgbToHex(rgb), score }
  }
  return best?.hex
}
