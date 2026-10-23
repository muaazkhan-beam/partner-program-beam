import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import contract from "./fixtures/beam-ui-tokens.json"

// The app mirrors Beam UI's tokens (see app/globals.css). The fixture is
// beam-ui's reviewed storybook-theme-contract.json; when Beam UI changes,
// update both together.
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")

function block(selector: string) {
  const start = css.indexOf(`${selector} {`)
  assert.ok(start >= 0, `${selector} block exists`)
  return css.slice(start, css.indexOf("\n}", start))
}

function tokens(selector: string) {
  const values = new Map<string, string>()
  for (const match of block(selector).matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    values.set(match[1]!, match[2]!.trim())
  }
  return values
}

test("light tokens match Beam UI", () => {
  const light = tokens(":root")
  for (const [name, value] of Object.entries(contract.light)) {
    assert.equal(light.get(name), value, name)
  }
})

test("dark tokens match Beam UI", () => {
  const dark = tokens(".dark")
  for (const [name, value] of Object.entries(contract.dark)) {
    assert.equal(dark.get(name), value, name)
  }
})

test("no corner is larger than Beam UI's 12px", () => {
  const theme = block("@theme inline")
  for (const match of theme.matchAll(/--radius-[a-z0-9]+:\s*calc\(var\(--radius\) \* ([0-9.]+)\)/g)) {
    assert.ok(Number(match[1]) <= 1.5, `radius multiplier ${match[1]}`)
  }
})

test("the font stack is Beam UI's, with no Google font", () => {
  assert.match(block("@theme inline"), /--font-sans: "Satoshi", Arial, Helvetica, sans-serif;/)
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8")
  assert.doesNotMatch(layout, /next\/font\/google/)
})
