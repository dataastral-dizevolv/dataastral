import { expect, test } from "@playwright/test";

test.describe("navegação app (admin logado)", () => {
  test("dashboard mostra resumo", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Bom dia|Boa tarde|Boa noite/);
    await expect(page.getByText("01 · Saldo e atividade")).toBeVisible();
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(page.getByText("Admin")).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("calculadora carrega heading", async ({ page }) => {
    await page.goto("/calculadora");
    await expect(page.getByRole("heading", { name: "Sua pergunta com data" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Escolha o tema" })).toBeVisible();
  });

  test("calendário carrega e alterna visão", async ({ page }) => {
    await page.goto("/calendario");
    await expect(page.getByRole("heading", { name: /Energias do Momento/i })).toBeVisible();

    const semanal = page.getByRole("button", { name: /Semana/i });
    const mensal = page.getByRole("button", { name: /Mês/i });
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
    await expect(page.getByRole("heading", { name: "Créditos", exact: true })).toBeVisible();
    await expect(page.getByText(/Saldo atual:/i)).toBeVisible();
    await expect(page.getByText("Starter")).toBeVisible();
  });

  test("perfil mostra mapa natal e dados pessoais", async ({ page }) => {
    await page.goto("/perfil");
    await expect(page.getByText("Seu céu de nascimento")).toBeVisible();
    await expect(page.getByText(/Dados pessoais/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Explorar mapa astral|Ver mapa completo e sinastrias/i }),
    ).toBeVisible();
  });
});
