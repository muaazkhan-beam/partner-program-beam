import { expect, test } from "@playwright/test"

test("a security question gets the documents that cover it, never a dead end", async ({ page }) => {
  await page.goto("/w/partner-demo/home")
  await page.getByRole("button", { name: "A client sent us security questions" }).click()
  await expect(page.getByText("Where a security review usually starts")).toBeVisible()
  // The documents answer it; no unpublished-answer warning beside them.
  await expect(page.getByText("Not published yet")).toHaveCount(0)
  await expect(page.getByText("Nothing published covers that")).toHaveCount(0)
  await page.getByRole("button", { name: "Add these to the pack" }).click()
  await expect(page.getByRole("button", { name: "In your pack" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Start from the client's questions" })).toHaveAttribute(
    "href",
    "/w/partner-demo/compliance?view=questions",
  )
})

test("a pasted client email becomes an answer sheet", async ({ page }) => {
  await page.goto("/w/partner-demo/home")
  await page
    .getByLabel("What does your client need?")
    .fill(
      "Hi team,\n1. Why would we pick Beam over SAP?\n2. Do you have a business continuity plan?\n3. Can we deploy in Saudi Arabia?\nThanks",
    )
  const sheet = page.getByRole("region", { name: "Answer sheet · 3 questions" })
  await expect(sheet).toBeVisible()
  await expect(sheet.getByText("For you only")).toBeVisible()
  await expect(sheet.getByText(/^\d+ security documents?$/)).toBeVisible()
  await expect(sheet.getByText("Only Beam can answer this")).toBeVisible()
  await expect(sheet.getByRole("link", { name: "Ask the Beam team about the other one" })).toHaveAttribute(
    "href",
    /q=Can\+we\+deploy\+in\+Saudi\+Arabia/,
  )
})

test("a restricted answer goes to the Beam team with the client's question", async ({ page }) => {
  await page.goto("/w/partner-demo/faq")
  await page.getByRole("button", { name: "Can we deploy in Saudi Arabia?" }).click()
  await expect(page.getByText("Only Beam can answer this").first()).toBeVisible()
  // No approved answer is shown in place of the restricted one.
  await expect(page.getByRole("link", { name: "Open the full answer" })).toHaveCount(0)
  // The card's own link carries the question; the sidebar's does not.
  await page
    .locator("article")
    .filter({ hasText: "Only Beam can answer this" })
    .getByRole("link", { name: "Ask the Beam team" })
    .click()
  await expect(page.getByLabel("Problem statement")).toHaveValue(
    /The question:\n- Can we deploy in Saudi Arabia\?/,
  )
  await expect(page.locator("select").nth(1)).toHaveValue("faq-escalation")
})

test("certification requests go to the Beam team, not to unrelated policies", async ({ page }) => {
  await page.goto("/w/partner-demo/home")
  await page.getByLabel("What does your client need?").fill("Do you have SOC 2?")
  await expect(page.getByText("Comes from the Beam team")).toBeVisible()
  await expect(page.getByText("Security documents that cover this")).toHaveCount(0)
})
