import { expect, test } from "@playwright/test"

test("every phase is open and a link opens the phase it names", async ({ page }) => {
  await page.goto("/w/partner-demo/journey?phase=deliver")
  await expect(page.getByRole("button", { name: /Win the client/ })).toBeVisible()
  await expect(page.locator("ol button")).toHaveCount(6)
  await expect(page.getByText("Locked")).toHaveCount(0)
  await expect(page.getByText(/unlock/i)).toHaveCount(0)
  await expect(page.getByRole("button", { name: /06\s*Deliver/ })).toHaveAttribute("aria-pressed", "true")
  // The last phase can be ticked without finishing the first.
  await page.getByRole("checkbox").first().click()
  await expect(page.getByText("1 of 23 ticked")).toBeVisible()

  await page.goto("/w/partner-demo/journey?phase=deploy")
  await expect(page.getByRole("link", { name: "Open security & compliance" })).toHaveAttribute(
    "href",
    "/w/partner-demo/compliance",
  )
})
