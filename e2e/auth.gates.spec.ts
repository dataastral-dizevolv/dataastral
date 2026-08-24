import { expect, test } from "@playwright/test";

test.describe("auth gates (sem sessão)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("dashboard redireciona para login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/);
    expect(new URL(page.url()).pathname).toBe("/login");
  });

  test("admin redireciona para login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/login/);
    expect(new URL(page.url()).pathname).toBe("/login");
  });
});
