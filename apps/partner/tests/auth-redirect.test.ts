import assert from "node:assert/strict"
import test from "node:test"

import {
  getLoginPath,
  getSafeAuthReturnPath,
  shouldRedirectPartnerLogin,
} from "../lib/auth-redirect.ts"

test("login redirects retain reviewed partner entry paths and reject external targets", () => {
  assert.equal(getLoginPath("/pwc"), "/login?from=%2Fpwc")
  assert.equal(
    getSafeAuthReturnPath("/roland-berger?campaign=launch"),
    "/roland-berger?campaign=launch",
  )
  assert.equal(getSafeAuthReturnPath("//evil.example"), "/home")
  assert.equal(getSafeAuthReturnPath("/api/auth/callback/google"), "/home")
})

test("partner routes do not redirect during auth hydration or token refresh", () => {
  const base = {
    convexLoading: false,
    convexRefreshing: false,
    convexAuthenticated: false,
    sessionPending: false,
    hasSession: false,
  }
  assert.equal(
    shouldRedirectPartnerLogin({ ...base, sessionPending: true }),
    false,
  )
  assert.equal(
    shouldRedirectPartnerLogin({ ...base, convexRefreshing: true }),
    false,
  )
  assert.equal(shouldRedirectPartnerLogin({ ...base, hasSession: true }), false)
  assert.equal(
    shouldRedirectPartnerLogin({ ...base, convexAuthenticated: true }),
    false,
  )
  assert.equal(shouldRedirectPartnerLogin(base), true)
})
