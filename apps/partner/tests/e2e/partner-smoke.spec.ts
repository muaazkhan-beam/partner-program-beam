import { expect, test } from "@playwright/test"

test("login page explains invite-only partner access", async ({ page }) => {
  await page.goto("/login")
  await expect(
    page.getByRole("heading", { name: "Beam Partner" })
  ).toBeVisible()
  await expect(page.getByText("named invitation")).toBeVisible()
  await expect(
    page.getByRole("button", { name: /Beam staff · Continue with Google/ })
  ).toBeVisible()
})

test("scoped preview bypass opens only the neutral demo workspace home", async ({
  page,
}) => {
  await page.goto("/w/partner-demo/home")
  await expect(
    page.getByRole("heading", {
      name: "Take one client process from discovery to production",
    })
  ).toBeVisible()
  await expect(page.getByText("Beam Partner").first()).toBeVisible()
  await expect(page.getByText("Future of AI-Native Companies")).toBeVisible()
  await expect(page.getByText("First four steps")).toHaveCount(0)
  await expect(
    page.getByRole("link", { name: "Start a client opportunity" })
  ).toBeVisible()
})

test("scoped preview bypass opens every demo partner surface and interaction", async ({
  page,
}) => {
  const surfaces = [
    ["tools", "Tools"],
    ["materials", "Materials"],
    ["faq", "Partner FAQ"],
    ["certifications", "Certifications"],
  ] as const

  for (const [surface, heading] of surfaces) {
    await page.goto(`/w/partner-demo/${surface}`)
    await expect(
      page.getByRole("heading", { name: heading, level: 2 })
    ).toBeVisible()
  }

  await page.goto("/w/partner-demo/tools")
  const diagnosticLink = page.locator(
    'a[href="https://core.beam.ai/skills/operating-diagnostic"]'
  )
  await expect(diagnosticLink).toHaveText(/Open tool/)
  await expect(diagnosticLink).toHaveAttribute(
    "href",
    "https://core.beam.ai/skills/operating-diagnostic"
  )
  await page.getByRole("link", { name: "View details" }).first().click()
  await expect(
    page.getByRole("heading", { name: "Start with Beam Partner." })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Copy start prompt" })
  ).toHaveCount(3)

  await page.goto("/w/partner-demo/materials")
  await expect(page.getByRole("link", { name: "Playbooks" })).toHaveCount(0)
  const playbook = page
    .getByRole("article")
    .filter({ hasText: "One-workflow shadow engagement" })
  await expect(playbook.getByText("Playbook", { exact: true })).toBeVisible()
  await expect(playbook.getByRole("link", { name: "Preview" })).toHaveAttribute(
    "href",
    "/w/partner-demo/materials/one-workflow-shadow"
  )
  await playbook.getByRole("link", { name: "Preview" }).click()
  await expect(page.getByText("Beam Share preview")).toBeVisible()

  await page.goto("/w/partner-demo/playbooks/one-workflow-shadow")
  await expect(page).toHaveURL(
    /\/w\/partner-demo\/materials\/one-workflow-shadow$/
  )

  await page.goto("/w/partner-demo/materials")
  await expect(page.getByText("Client-forwardable").first()).toBeVisible()
  await expect(page.getByText("Forwardable").first()).toBeVisible()
  await expect(page.getByText("Pending")).toHaveCount(3)
  const executiveDeck = page
    .getByRole("article")
    .filter({ hasText: "Beam Partner Executive Overview" })
  await expect(executiveDeck).toBeVisible()
  await executiveDeck.getByRole("link", { name: "Preview" }).click()
  await expect(
    page.locator('iframe[title="Beam Partner Executive Overview Beam Share"]')
  ).toHaveAttribute("src", "/api/share-preview/beam-partner-executive-overview")
  await expect(
    page
      .frameLocator(
        'iframe[title="Beam Partner Executive Overview Beam Share"]'
      )
      .locator(".slide.active")
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Open in Beam Shares" })
  ).toHaveAttribute("href", "https://shares.beam.ai/s/5MJ21Et5Hgb0jQuW")

  await page.goto("/w/partner-demo/faq")
  const faqSearch = page.getByPlaceholder("Search questions and answers…")
  await expect(
    page.getByText("Are you also talking to Deloitte / EY / McKinsey")
  ).toHaveCount(0)
  await expect(
    page.getByText("What makes a strong first workflow?")
  ).toBeVisible()
  await page.getByRole("button", { name: "Pending", exact: true }).click()
  await expect(page.getByText("5 answers")).toBeVisible()
  await page
    .getByText("How do we register and protect a partner-sourced opportunity?")
    .click()
  await expect(
    page.getByText(
      "Request Beam to confirm ownership before making a commitment."
    )
  ).toBeVisible()
  await page.getByRole("button", { name: "All", exact: true }).click()
  await faqSearch.fill("accuracy")
  await expect(page.getByText("1 answer")).toBeVisible()
  await page.getByText("How do you keep accuracy from decaying?").click()
  await expect(
    page.getByText("Production feedback (thumbs, failed code nodes")
  ).toBeVisible()

  await page.goto("/w/partner-demo/requests")
  await expect(
    page.getByRole("heading", { name: "Start a client opportunity" })
  ).toBeVisible()
  await page.getByLabel("Candidate process").fill("Invoice exceptions")
  await page.getByLabel("Problem statement").fill("Preview-only test")
  await page.getByRole("button", { name: "Create request" }).click()
  await expect(
    page.getByText("Preview bypass does not create requests.")
  ).toBeVisible()
})

test("certification pathway uses dedicated detail pages", async ({ page }) => {
  test.setTimeout(60_000)

  await page.goto("/w/partner-demo/certifications")
  await expect(page.getByText("Associate", { exact: true })).toHaveCount(0)
  await expect(page.getByText("Certification syllabus")).toHaveCount(0)
  await expect(page.getByText("What Beam is")).toHaveCount(0)
  await expect(
    page.getByRole("link", { name: "View certification" })
  ).toHaveCount(4)
  for (const slug of [
    "beam-foundations",
    "discovery-lead",
    "builder",
    "solution-architect",
  ]) {
    await expect(
      page.locator(
        `a[href="/w/partner-demo/certifications/${slug}"]`
      )
    ).toBeVisible()
  }

  await page
    .locator(
      'a[href="/w/partner-demo/certifications/beam-foundations"]'
    )
    .click()
  await expect(
    page.getByRole("heading", { name: "Beam Foundations", level: 1 })
  ).toBeVisible()
  await expect(page.getByText("Certification syllabus")).toBeVisible()
  await expect(page.getByText("What Beam is")).toBeVisible()
  await page.getByRole("link", { name: "Request cohort access" }).click()
  await expect(page.getByLabel("Candidate process")).toHaveValue(
    "Partner certification — Beam Foundations"
  )
  await expect(page.getByLabel("Problem statement")).toHaveValue(
    "Please add me to the next Beam Foundations certification cohort."
  )
})

test("demo bypass membership does not open a real partner tenant", async ({
  page,
}) => {
  await page.goto("/w/pwc-me/home")
  await expect(
    page.getByRole("heading", {
      name: "Bypass membership is not scoped to this workspace",
    })
  ).toBeVisible()
})

test("published Discovery deck renders visible slides", async ({ page }) => {
  await page.goto("/w/partner-demo/materials/beam-discovery-sales-deck")
  await expect(
    page.getByRole("heading", {
      name: "Beam Discovery | Process Discovery Sales Deck",
    })
  ).toBeVisible()

  const frame = page.locator(
    'iframe[title="Beam Discovery | Process Discovery Sales Deck Beam Share"]'
  )
  await expect(frame).toHaveAttribute(
    "src",
    "/api/share-preview/beam-discovery-sales-deck"
  )
  await expect(frame.contentFrame().locator(".slide.active")).toBeVisible()
})
