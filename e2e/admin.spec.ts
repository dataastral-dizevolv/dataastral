import { expect, test } from "@playwright/test";

test.describe("admin (admin logado)", () => {
  test("admin root não cai no dashboard de usuário", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/admin\/dashboard/);
    expect(new URL(page.url()).pathname).toBe("/admin/dashboard");
    await expect(page.getByRole("heading", { name: "Inteligência de Operação" })).toBeVisible({
      timeout: 20_000,
    });
  });

  test("dashboard admin", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page.getByRole("heading", { name: "Inteligência de Operação" })).toBeVisible();
  });

  test("usuários", async ({ page }) => {
    await page.goto("/admin/usuarios");
    await expect(page.getByRole("heading", { name: "Usuários", exact: true })).toBeVisible();
  });

  test("logs", async ({ page }) => {
    await page.goto("/admin/logs");
    await expect(page.getByRole("heading", { name: "Logs de Atendimento" })).toBeVisible();
  });

  test("deep links precos e perguntas", async ({ page }) => {
    await page.goto("/admin/precos");
    await expect(page.getByRole("heading", { name: "Preços e Pacotes" })).toBeVisible();

    await page.goto("/admin/perguntas");
    await expect(page.getByRole("heading", { name: "Perguntas por Pilar" })).toBeVisible();
  });
});
