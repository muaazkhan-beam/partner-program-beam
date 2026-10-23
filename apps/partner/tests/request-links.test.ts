import assert from "node:assert/strict"
import test from "node:test"

import {
  describeRequestSubject,
  requestHref,
  supportForKind,
} from "../lib/request-links"

test("requestHref carries the partner's context into the request form", () => {
  assert.equal(requestHref("pwc-me"), "/w/pwc-me/requests")
  assert.equal(
    requestHref("pwc-me", {
      about: "faq:pricing-and-packaging",
      support: "faq-escalation",
    }),
    "/w/pwc-me/requests?about=faq%3Apricing-and-packaging&support=faq-escalation"
  )
})

test("describeRequestSubject resolves only content granted to the workspace", () => {
  const faq = describeRequestSubject("partner-demo", "faq:why-not-sap")
  assert.equal(faq?.kind, "faq")
  assert.ok(faq?.label)
  // audit-independence is granted to pwc-me only
  assert.equal(describeRequestSubject("partner-demo", "faq:audit-independence"), null)
  assert.equal(
    describeRequestSubject("partner-demo", "agent:rfp")?.label,
    "RFP & Proposal Agent (planned agent)"
  )
  assert.equal(
    describeRequestSubject("partner-demo", "journey:deploy")?.label,
    "Journey · Deploy phase"
  )
  assert.equal(describeRequestSubject("partner-demo", "nonsense"), null)
  assert.equal(describeRequestSubject("partner-demo", "faq:"), null)
})

test("supportForKind picks the request type a partner would expect", () => {
  assert.equal(supportForKind("faq"), "faq-escalation")
  assert.equal(supportForKind("use-case"), "shadow-demo")
  assert.equal(supportForKind("tool"), "other")
})
