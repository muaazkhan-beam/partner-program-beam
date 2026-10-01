import { expect, test } from "@playwright/test"

test("the compliance library filters, builds a pack, and requests the documents from Beam", async ({
  page,
}) => {
  await page.goto("/w/partner-demo/compliance")
  await expect(
    page.getByRole("heading", { name: "Security & compliance", level: 2 }),
  ).toBeVisible()
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
  await expect(page.getByText("1–12 of 59")).toBeVisible()

  // Rows are labels: clicking the title toggles the document, as a partner would.
  // The list is paginated, so each document is found through the search box.
  await page.getByLabel("Search documents").fill("access control")
  await page.getByText("Access Control Policy", { exact: true }).click()
  await page.getByLabel("Search documents").fill("gdpr")
  await page.getByText("GDPR Manual", { exact: true }).click()
  await page.getByLabel("Search documents").fill("")
  await expect(page.getByText("Documents · 2")).toBeVisible()
  const tray = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Send a pack to a client" }) })
  await expect(tray.getByText("Version 2.0, 01-Dec-2024")).toBeVisible()
  await expect(tray.getByText("Version 02, 01-01-2025")).toBeVisible()
  await tray.locator("#pack-client").fill("Nordbank")

  const download = page.waitForEvent("download")
  await tray.getByRole("button", { name: "Download cover page" }).click()
  expect((await download).suggestedFilename()).toBe("beam-materials-for-nordbank.html")

  await tray.getByRole("link", { name: "Request the documents from Beam" }).click()
  await expect(page).toHaveURL(
    /\/requests\?about=compliance%3Apack&support=deployment-review&items=access-control-policy%2Cgdpr-manual$/,
  )
  await expect(page.getByText("About:")).toBeVisible()
  await expect(page.getByLabel("Named account (optional)")).toHaveValue("Nordbank")
  await expect(page.getByLabel("Candidate process")).toHaveValue(
    "Security and compliance pack",
  )
  await expect(page.getByLabel("Problem statement")).toHaveValue(
    /Access Control Policy, version 2\.0, 01-Dec-2024/,
  )
  await expect(page.locator("select").nth(1)).toHaveValue("deployment-review")

  // The library remembers the pack in this browser.
  await page.goto("/w/partner-demo/compliance")
  await expect(page.getByText("Documents · 2")).toBeVisible()
  await page.getByLabel("Remove GDPR Manual from the pack").click()
  await expect(page.getByText("Documents · 1")).toBeVisible()
})
