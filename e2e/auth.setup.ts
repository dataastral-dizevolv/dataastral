import { expect, test as setup } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const authFile = path.join(__dirname, ".auth", "admin.json");

setup("authenticate as admin", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (see .env.e2e.example)");
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Boas vindas de volta!" })).toBeVisible();

  await page.locator("#email").fill(email);
  await page.locator("#senha").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Boa (tarde|dia|noite)/, {
    timeout: 20_000,
  });
  await expect(page.getByText("Créditos disponíveis").or(page.getByText("01 · Saldo e atividade"))).toBeVisible();

  await page.context().storageState({ path: authFile });
});
