import { expect, test } from "@playwright/test"

const questions = [
  /cross two or more systems/,
  /exception-heavy/,
  /single ERP or EPM module/,
  /API or an export path/,
  /named, accountable process owner/,
  /representative test data/,
  /measurable operational outcome/,
  /unsupervised action/,
]

async function answer(page: import("@playwright/test").Page, code: string) {
  for (const [index, pattern] of questions.entries()) {
    const label = { y: "Yes", n: "No", u: "Unsure" }[code[index] as "y" | "n" | "u"]
    // The radios sit behind chip labels; clicking the chip is the real interaction.
    await page.getByRole("radiogroup", { name: pattern }).getByText(label, { exact: true }).click()
  }
}

test("Where Beam fits reads as sections and the fit check reaches Fit with a next step", async ({
  page,
}) => {
  await page.goto("/w/partner-demo/materials/where-beam-fits")
  for (const heading of ["What Beam is", "When Beam gets in", "What Beam is not", "And where it doesn't"]) {
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible()
  }
  await expect(page.getByRole("heading", { name: "Not answered yet" })).toBeVisible()
  await answer(page, "yynyyyyn")
  await expect(page.getByRole("heading", { name: "Fit", exact: true })).toBeVisible()
  await expect(page).toHaveURL(/fit=yynyyyyn/)
  await expect(page.getByText("only then expand")).toBeVisible()
  await page.getByRole("link", { name: "Pick a use case" }).click()
  await expect(page).toHaveURL(/\/w\/partner-demo\/use-cases$/)
})

test("a shared Not yet result names what to obtain and prefills a shadow-demo request", async ({
  page,
}) => {
  await page.goto("/w/partner-demo/materials/where-beam-fits?fit=yynnyynn")
  await expect(page.getByRole("heading", { name: "Not yet", exact: true })).toBeVisible()
  await expect(page.getByText("What to obtain")).toBeVisible()
  await expect(
    page.getByText("Is there an API or an export path into those systems?").last(),
  ).toBeVisible()
  await page.getByRole("link", { name: "Request a shadow demo" }).click()
  await expect(page.getByText("About:")).toBeVisible()
  await expect(page.locator("select").nth(1)).toHaveValue("shadow-demo")
  await expect(page.getByLabel("Problem statement")).toHaveValue(/Fit check result: Not yet\./)
})

test("a single-module process walks away and routes the edge case to Beam", async ({ page }) => {
  await page.goto("/w/partner-demo/materials/where-beam-fits?fit=yyyyyyyn")
  await expect(page.getByRole("heading", { name: "Walk away", exact: true })).toBeVisible()
  await page.getByRole("link", { name: "Ask Beam about the edge case" }).click()
  await expect(page.locator("select").nth(1)).toHaveValue("faq-escalation")
})
