import assert from "node:assert/strict"
import test from "node:test"

import { NextRequest } from "next/server"

import { proxy } from "../proxy.ts"


function signedInRequest(url: string) {
  const parsed = new URL(url)
  return new NextRequest(parsed, {
    headers: {
      cookie: "better-auth.session_token=test-session",
      host: parsed.host,
    },
  })
}

function redirectedTo(url: string) {
  const response = proxy(signedInRequest(url))
  assert.equal(response.status, 307)
  return response.headers.get("location")
}

test("signed-in apex login screens fall back to staff admin", () => {
  assert.equal(
    redirectedTo("https://partner.beam.ai/"),
    "https://partner.beam.ai/admin",
  )
  assert.equal(
    redirectedTo("https://partner.beam.ai/login"),
    "https://partner.beam.ai/admin",
  )
})

test("signed-in tenant login screens fall back to their workspace", () => {
  assert.equal(
    redirectedTo("https://pwc-me.partner.beam.ai/"),
    "https://pwc-me.partner.beam.ai/w/pwc-me/home",
  )
  assert.equal(
    redirectedTo("https://pwc-me.partner.beam.ai/login"),
    "https://pwc-me.partner.beam.ai/w/pwc-me/home",
  )
  assert.equal(
    redirectedTo("https://pwc-me.partner.beam.ai/login?from=//evil.example"),
    "https://pwc-me.partner.beam.ai/w/pwc-me/home",
  )
})

test("signed-in named partner entries open their workspace", () => {
  assert.equal(
    redirectedTo("https://partner.beam.ai/pwc"),
    "https://partner.beam.ai/w/pwc-me/home",
  )
  assert.equal(
    redirectedTo(
      "https://partner.beam.ai/pwc?from=%2Fw%2Fpwc-me%2Ftools",
    ),
    "https://partner.beam.ai/w/pwc-me/tools",
  )
})
