import assert from "node:assert/strict"
import test from "node:test"

import {
  contrastRatio,
  hexToRgb,
  logoPalette,
  pickAccent,
  rgbToHex,
  textSafe,
  toOklch,
} from "../lib/brand/palette"

function hueGap(a: number, b: number) {
  const gap = Math.abs(a - b) % 360
  return gap > 180 ? 360 - gap : gap
}

/** An RGBA image from runs of [colour, alpha, pixel count]. */
function image(runs: Array<[string, number, number]>) {
  const pixels = runs.flatMap(([hex, alpha, count]) => {
    const rgb = hexToRgb(hex)
    assert.ok(rgb)
    return Array.from({ length: count }, () => [rgb.r, rgb.g, rgb.b, alpha])
  })
  return { data: new Uint8ClampedArray(pixels.flat()), width: pixels.length, height: 1 }
}

test("hex colours parse in short and long form, any case, and print lower-case", () => {
  assert.deepEqual(hexToRgb("#fff"), { r: 255, g: 255, b: 255 })
  assert.deepEqual(hexToRgb("#14B8A6"), { r: 20, g: 184, b: 166 })
  assert.deepEqual(hexToRgb("#0aF"), { r: 0, g: 170, b: 255 })
  assert.equal(hexToRgb("teal"), null)
  assert.equal(hexToRgb("#12345"), null)
  assert.equal(rgbToHex({ r: 20, g: 184, b: 166 }), "#14b8a6")
  assert.equal(rgbToHex({ r: 300, g: -4, b: 15.6 }), "#ff0010")
  assert.equal(rgbToHex(hexToRgb("#ABCDEF") ?? { r: 0, g: 0, b: 0 }), "#abcdef")
})

test("contrast follows WCAG 2.x on known pairs", () => {
  assert.equal(contrastRatio("#000000", "#ffffff"), 21)
  assert.equal(contrastRatio("#ffffff", "#000000"), 21)
  assert.equal(contrastRatio("#777777", "#777777"), 1)
  assert.ok(Math.abs(contrastRatio("#0061ff", "#ffffff") - 5.06) < 0.05)
  assert.ok(contrastRatio("#ca8a04", "#ffffff") < 4.5)
})

test("a light brand colour is deepened until it reads on white, keeping its hue", () => {
  const original = toOklch("#14b8a6")
  const safe = textSafe("#14b8a6")
  const deepened = toOklch(safe.hex)
  assert.ok(original && deepened)
  assert.equal(safe.adjusted, true)
  assert.ok(safe.ratio >= 4.5)
  assert.ok(contrastRatio(safe.hex, "#ffffff") >= 4.5)
  assert.ok(deepened.l < original.l)
  assert.ok(hueGap(deepened.h, original.h) < 10)
  assert.ok(deepened.c > 0.04, "still a teal, not a grey")
  assert.match(safe.hex, /^#[0-9a-f]{6}$/)
})

test("a colour that already reads on white is left alone", () => {
  const safe = textSafe("#0F766E")
  assert.deepEqual(safe, {
    hex: "#0f766e",
    ratio: contrastRatio("#0f766e", "#ffffff"),
    adjusted: false,
  })
  assert.ok(safe.ratio >= 4.5)
})

test("text on a dark background is lightened, and unreadable input falls back to a pole", () => {
  const onNavy = textSafe("#0f766e", "#1f2a37")
  assert.equal(onNavy.adjusted, true)
  assert.ok(contrastRatio(onNavy.hex, "#1f2a37") >= 4.5)
  assert.ok((toOklch(onNavy.hex)?.l ?? 0) > (toOklch("#0f766e")?.l ?? 1))

  assert.deepEqual(textSafe("not a colour"), { hex: "#000000", ratio: 21, adjusted: true })
  assert.equal(textSafe("#14b8a6", "#ffffff", 7).ratio >= 7, true)
})

test("a logo's palette skips transparent and white pixels and orders by use", () => {
  const logo = image([
    ["#ffffff", 255, 50],
    ["#14b8a6", 0, 40],
    ["#0f766e", 255, 10],
    ["#14b8a6", 255, 30],
    ["#f59e0b", 255, 5],
    ["#fafafa", 255, 20],
  ])
  assert.deepEqual(logoPalette(logo), ["#14b8a6", "#0f766e", "#f59e0b"])
  assert.deepEqual(logoPalette(logo, 1), ["#14b8a6"])
})

test("near-identical shades from anti-aliasing merge into the stronger colour", () => {
  // #14c0a6 lands in a different 4-bit bucket from #14b8a6 but looks the same.
  const logo = image([
    ["#14b8a6", 255, 30],
    ["#14c0a6", 255, 25],
    ["#0f766e", 255, 40],
  ])
  // Merged, the teals (55 pixels) outrank the deeper teal (40) they each lose to alone.
  assert.deepEqual(logoPalette(logo), ["#14b8a6", "#0f766e"])
})

test("an all-white or fully transparent logo has no palette", () => {
  assert.deepEqual(logoPalette(image([["#ffffff", 255, 10]])), [])
  assert.deepEqual(logoPalette(image([["#14b8a6", 64, 10]])), [])
})

test("the accent is the strongest colour that is not grey", () => {
  assert.equal(pickAccent(["#ffffff", "#777777", "#1f2a37", "#6366F1"]), "#6366f1")
  assert.equal(pickAccent(["#0f766e", "#14b8a6", "#64748b"]), "#14b8a6")
  assert.equal(pickAccent(["#ffffff", "#808080", "#111111", "#f3f4f6"]), undefined)
  assert.equal(pickAccent(["nope"]), undefined)
  assert.equal(pickAccent([]), undefined)
})
