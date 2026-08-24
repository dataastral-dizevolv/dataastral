import { expect, test } from "@playwright/test";

test.describe("navegação app (admin logado)", () => {
  test("dashboard mostra resumo", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Créditos disponíveis")).toBeVisible();
    await expect(page.getByRole("link", { name: "Início" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
  });

  test("calculadora carrega heading", async ({ page }) => {
    await page.goto("/calculadora");
    await expect(page.getByRole("heading", { name: "Sua pergunta com data" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Escolha um tema" })).toBeVisible();
  });

  test("calendário carrega e alterna visão", async ({ page }) => {
    await page.goto("/calendario");
    await expect(page.getByRole("heading", { name: /Calendário de efemérides/i })).toBeVisible();

    const semanal = page.getByRole("button", { name: /Semanal/i });
    const mensal = page.getByRole("button", { name: /Mensal/i });
    if (await semanal.isVisible().catch(() => false)) {
      await semanal.click();
    }
    if (await mensal.isVisible().catch(() => false)) {
      await mensal.click();
    }
  });

  test("financeiro mostra saldo e intercepta compra Stripe", async ({ page }) => {
    await page.route("**/api/credits/buy", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: "https://checkout.stripe.com/e2e-mock" }),
      });
    });

    await page.goto("/financeiro");
    await expect(page.getByRole("heading", { name: "Financeiro" })).toBeVisible();
    await expect(page.getByText(/Saldo atual:/i)).toBeVisible();
  });

  test("perfil mostra campos principais", async ({ page }) => {
    await page.goto("/perfil");
    await expect(page.getByRole("heading", { name: "Perfil" })).toBeVisible();
    await expect(page.locator("#full-name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
  });
});
