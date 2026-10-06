import { expect, test } from "@playwright/test"

test("the cart collects across pages and sends only what may reach a client", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/w/partner-demo/materials")
  await page
    .getByRole("button", { name: "Add to pack: Beam Partner Executive Overview" })
    .click()
  await expect(page.getByRole("link", { name: "Client pack, 1 item" })).toBeVisible()

  await page.goto("/w/partner-demo/faq")
  await page.getByRole("button", { name: /^Add to pack: Why would a client buy Beam instead of SAP/ }).click()
  await page.goto("/w/partner-demo/use-cases")
  await page.getByRole("button", { name: "Add to pack: Invoice exception handling" }).click()
  await expect(page.getByRole("link", { name: "Client pack, 3 items" })).toBeVisible()

  await page.getByRole("link", { name: "Client pack, 3 items" }).click()
  // The SAP answer coaches the partner and the use case has no client-facing
  // version yet: both stay as prep. Only the deck goes out.
  await expect(page.getByText("Goes to the client · 1")).toBeVisible()
  await expect(page.getByText("For your prep, not sent · 2")).toBeVisible()
  await expect(page.getByText("For you only")).toHaveCount(2)

  await page.locator("#pack-client").fill("Nordbank, Acme Logistics")
  await page.locator("#pack-client").press("Enter")
  const clients = page.getByRole("list", { name: "Clients" })
  await expect(clients.getByRole("listitem")).toHaveCount(2)

  // The preview is the PDF: picked, client-safe items only, never prep items.
  const preview = page.locator('iframe[title="Preview of Beam for Nordbank"]')
  await expect(preview).toHaveAttribute("srcdoc", /Beam for Nordbank/)
  await expect(preview).toHaveAttribute("srcdoc", /shares\.beam\.ai\/s\/5MJ21Et5Hgb0jQuW/)
  await expect(preview).not.toHaveAttribute("srcdoc", /Why would a client buy Beam instead of SAP/)
  await expect(preview).not.toHaveAttribute("srcdoc", /Do not pick a fight/)
  await expect(preview).not.toHaveAttribute("srcdoc", /Invoice exception handling/)

  // One email per client, in the client's voice.
  await clients.getByRole("listitem").nth(1).getByRole("button", { name: "Copy email" }).click()
  await expect(clients.getByRole("button", { name: "Copied" })).toBeVisible()
  const email = await page.evaluate(() => navigator.clipboard.readText())
  expect(email).toContain("Subject: Beam for Acme Logistics, as discussed")
  expect(email).not.toContain("Invoice exception handling")

  // Save as PDF prints the same document from a hidden frame.
  await clients.getByRole("listitem").first().getByRole("button", { name: "Save as PDF" }).click()
  await expect(page.locator('iframe[aria-hidden="true"]').first()).toHaveAttribute(
    "srcdoc",
    /Beam for Nordbank/,
  )

  // Clearing can be undone.
  await page.getByRole("button", { name: "Clear pack" }).click()
  await expect(page.getByText("Your pack is empty")).toBeVisible()
  await page.getByRole("button", { name: "Undo" }).click()
  await expect(page.getByText("Goes to the client · 1")).toBeVisible()
})
