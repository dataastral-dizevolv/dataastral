import { expect, test } from "@playwright/test";

test.describe("smoke público", () => {
  test("landing carrega header, menu e calculadora", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("button", { name: "Data Iris" })).toBeVisible();

    await page.getByRole("button", { name: "Abrir menu" }).click();
    await expect(page.getByRole("button", { name: "Fechar menu" })).toBeVisible();
    await page.getByRole("button", { name: "Fechar menu" }).click();

    const calculadoraHeading = page.getByRole("heading", { name: /Descubra o que os astros dizem/i });
    await calculadoraHeading.scrollIntoViewIfNeeded();
    await expect(calculadoraHeading).toBeVisible({ timeout: 20_000 });
  });

  test("páginas públicas renderizam heading e footer", async ({ page }) => {
    const pages: Array<{ path: string; heading: RegExp }> = [
      { path: "/precos", heading: /Planos e Créditos/i },
      { path: "/faq", heading: /Dúvidas frequentes/i },
      { path: "/termos-de-uso", heading: /Termos de Uso/i },
      { path: "/politica-de-privacidade", heading: /Política de Privacidade|Privacidade/i },
      { path: "/reembolso", heading: /Reembolso/i },
    ];

    for (const item of pages) {
      await page.goto(item.path);
      await expect(page.getByRole("heading", { name: item.heading }).first()).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
      await expect(page.getByText("Data Iris").first()).toBeVisible();
    }
  });
});
