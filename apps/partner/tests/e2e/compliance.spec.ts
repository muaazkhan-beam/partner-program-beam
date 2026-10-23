import { expect, test } from "@playwright/test"

test("compliance starts from the client's questions and fills the pack", async ({ page }) => {
  await page.goto("/w/partner-demo/compliance")
  await expect(
    page.getByRole("heading", { name: "Security & compliance", level: 2 }),
  ).toBeVisible()
  await expect(
    page.getByRole("navigation", { name: "Ways in" }).getByRole("link", { name: "From the client's questions" }),
  ).toHaveAttribute("aria-current", "page")
  await page
    .getByRole("checkbox", { name: "How do you keep the service running and recover from an outage?" })
    .click()
  await expect(page.getByRole("heading", { name: /^\d+ documents?$/ }).first()).toBeVisible()
  await expect(page.getByRole("link", { name: "Review and send" })).toHaveAttribute(
    "href",
    "/w/partner-demo/pack",
  )
})

test("the library filters and pages, and its documents are sent from the pack", async ({
  page,
}) => {
  await page.goto("/w/partner-demo/compliance?view=library")
  await expect(page.getByText("59 of 59 documents")).toBeVisible()

  await page.getByLabel("Search documents").fill("gdpr")
  await expect(page.getByText("1 of 59 documents")).toBeVisible()
  await page.getByLabel("Search documents").fill("")
  await page.getByRole("button", { name: "Health data (HIPAA)" }).click()
  await expect(page.getByText("6 of 59 documents")).toBeVisible()
  await page.getByRole("button", { name: "All", exact: true }).click()
  await expect(page.getByText("59 of 59 documents")).toBeVisible()

  // Paginated: twelve rows a page, and page five holds the tail.
  await expect(page.getByText("1–12 of 59")).toBeVisible()
  await expect(page.getByRole("navigation", { name: "Document pages" })).toBeVisible()
  await page.getByRole("button", { name: "Page 5" }).click()
  await expect(page.getByText("49–59 of 59")).toBeVisible()
  await expect(page.getByText("Whistle Blower Policy", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Page 1" }).click()

  // Rows are labels: clicking the title toggles the document.
  await page.getByLabel("Search documents").fill("access control")
  await page.getByText("Access Control Policy", { exact: true }).click()
  await page.getByLabel("Search documents").fill("gdpr")
  await page.getByText("GDPR Manual", { exact: true }).click()
  await page.getByLabel("Search documents").fill("")
  await expect(page.getByRole("heading", { name: "2 documents" })).toBeVisible()
  // A document printed "Internal" goes out only once an NDA is in place.
  await expect(page.getByText("Version 02, 01-01-2025 · once an NDA is in place")).toBeVisible()

  await page.getByRole("link", { name: "Review and send" }).click()
  await expect(page).toHaveURL(/\/w\/partner-demo\/pack$/)
  await expect(page.getByText("Security documents · 2")).toBeVisible()
  await page.locator("#pack-client").fill("Nordbank")
  await page.locator("#pack-client").press("Enter")
  await page.getByRole("link", { name: "Ask Beam to issue the documents" }).click()
  await expect(page).toHaveURL(
    /\/requests\?about=compliance%3Apack&support=deployment-review&items=access-control-policy%2Cgdpr-manual$/,
  )
  await expect(page.getByText("About:")).toBeVisible()
  await expect(page.getByLabel("Named account (optional)")).toHaveValue("Nordbank")
  await expect(page.getByLabel("Candidate process")).toHaveValue("Security and compliance pack")
  await expect(page.getByLabel("Problem statement")).toHaveValue(
    /Access Control Policy, version 2\.0, 01-Dec-2024/,
  )
  await expect(page.getByLabel("Problem statement")).toHaveValue(
    /GDPR Manual \(under NDA; NDA to be arranged\)/,
  )
  await expect(page.locator("select").nth(1)).toHaveValue("deployment-review")

  // The pack is remembered in this browser.
  await page.goto("/w/partner-demo/compliance?view=library")
  await expect(page.getByRole("heading", { name: "2 documents" })).toBeVisible()
  await page.getByRole("button", { name: "Remove GDPR Manual" }).click()
  await expect(page.getByRole("heading", { name: "1 document" })).toBeVisible()
})
