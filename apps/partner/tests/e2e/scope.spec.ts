import { expect, test } from "@playwright/test"

test("a client process is matched to a live use case and only the differences travel to Beam", async ({
  page,
}) => {
  await page.goto("/w/partner-demo/scope")
  await expect(
    page.getByRole("heading", { name: "What did the client describe?" }),
  ).toBeVisible()

  // Every live use case is on the page, grouped by the department it serves.
  for (const department of ["Finance", "Procurement", "HR"]) {
    await expect(page.getByRole("heading", { name: department, exact: true })).toBeVisible()
  }
  await expect(page.getByText("Supplier communication and FAQs")).toBeVisible()
  await page.getByRole("button", { name: /Invoice exception handling/ }).click()

  // The standard shape is on screen before anything is typed.
  await expect(page.getByRole("heading", { name: "Invoice exception handling" })).toBeVisible()
  await expect(page.getByText("SAP · DATEV · Outlook")).toBeVisible()
  await expect(page.getByText("0 of 4 differ")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Matches the standard shape" })).toBeVisible()

  await page.locator("#scope-client").fill("Nordbank")
  await page.getByText("In discovery", { exact: true }).click()
  await page.locator("#scope-delta-systems").fill("Oracle and Outlook, no DATEV")
  await expect(page.getByText("1 of 4 differ")).toBeVisible()
  await expect(page.getByRole("heading", { name: "1 difference recorded" })).toBeVisible()
  await page.locator("#scope-fact-volume").fill("about four hundred a week")

  const brief = page.locator("aside pre")
  await expect(brief).toContainText("Invoice exception handling at Nordbank")
  await expect(brief).toContainText("- Systems: Oracle and Outlook, no DATEV")
  await expect(brief).toContainText("(standard: SAP · DATEV · Outlook)")
  await expect(brief).toContainText("- Volume: about four hundred a week")

  await page.getByRole("link", { name: "Send this to Beam" }).click()
  await expect(page).toHaveURL(/\/requests\?about=scope%3A[a-z0-9]+&support=shadow-demo$/)
  await expect(page.getByLabel("Named account (optional)")).toHaveValue("Nordbank")
  await expect(page.getByLabel("Candidate process")).toHaveValue("Invoice exception handling")
  await expect(page.getByLabel("Problem statement")).toHaveValue(/Different at this client:/)

  // The process is remembered and reopens from the list.
  await page.goto("/w/partner-demo/scope")
  await page.getByRole("button", { name: /Invoice exception handling at Nordbank/ }).click()
  await expect(page.getByText("1 of 4 differ")).toBeVisible()
})

test("an unmatched process asks Beam whether it is covered", async ({ page }) => {
  await page.goto("/w/partner-demo/scope")
  await page
    .getByLabel("What the client described")
    .fill("Reconciling statements across two ledgers")
  await page.getByRole("link", { name: "Ask the Beam team if it is covered" }).click()
  await expect(page.getByText("About:")).toBeVisible()
  await expect(page.getByLabel("Candidate process")).toHaveValue(
    "Reconciling statements across two ledgers",
  )
  await expect(page.getByLabel("Problem statement")).toHaveValue(
    /could not match to a live use case/,
  )
})

test("the journey opens Scope and a use case starts a process there", async ({ page }) => {
  await page.goto("/w/partner-demo/journey?phase=scope")
  await expect(page.getByRole("link", { name: "Open Scope" })).toHaveAttribute(
    "href",
    "/w/partner-demo/scope",
  )
  await page.goto("/w/partner-demo/use-cases/invoice-exception-handling")
  await page.getByRole("link", { name: "Scope this for a client" }).click()
  await expect(page).toHaveURL(/\/scope\?seed=invoice-exception-handling$/)
  await expect(page.getByRole("heading", { name: "What did the client describe?" })).toBeVisible()
  await page.getByRole("button", { name: /Invoice exception handling/ }).first().click()
  await expect(page.getByText("0 of 4 differ")).toBeVisible()
})
