import { expect, test } from "@playwright/test";

test.describe("calculadora com predict mockado", () => {
  test("fluxo tema → pergunta → dados → resultado", async ({ page }) => {
    await page.route("**/api/calculator/questions**", async (route) => {
      const url = new URL(route.request().url());
      const kind = url.searchParams.get("kind");
      if (kind === "prompt") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                id: 1,
                category: "amor",
                label: "Vou encontrar um amor este ano?",
                fieldName: "prompt_1",
                type: "text",
                options: [],
                order: 1,
                isRequired: true,
              },
            ],
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [] }),
      });
    });

    await page.route("**/nominatim.openstreetmap.org/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            display_name: "São Paulo, SP, Brasil",
            lat: "-23.5505",
            lon: "-46.6333",
            importance: 0.9,
            type: "city",
            addresstype: "city",
            address: {
              city: "São Paulo",
              state: "São Paulo",
              country: "Brasil",
            },
          },
        ]),
      });
    });

    await page.route("**/api.geonames.org/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ timezoneId: "America/Sao_Paulo" }),
      });
    });

    await page.route("**/timeapi.io/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ timeZone: "America/Sao_Paulo" }),
      });
    });

    let predictCalled = false;
    await page.route("**/api/predict", async (route) => {
      predictCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          prediction: "Previsão E2E mockada.\n\nUm novo ciclo se abre em breve.",
          eventDate: "15/09/2026",
          remainingCredits: 42,
          engineCode: "E2E_MOCK",
        }),
      });
    });

    // Guarda contra chamada acidental ao endpoint público
    await page.route("**/api/predict-public", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "predict-public blocked in e2e mock test" }),
      });
    });

    await page.goto("/calculadora");
    await expect(page.getByRole("heading", { name: "Sua pergunta com data" })).toBeVisible();

    await page.getByRole("button", { name: /Amor e Relacionamentos/i }).click();
    await page.getByRole("button", { name: /Escolher tema/i }).click();

    await expect(page.getByText(/Escolha sua pergunta/i)).toBeVisible();
    const question = page.getByRole("button", { name: /Vou encontrar um amor este ano/i });
    await expect(question).toBeVisible({ timeout: 15_000 });
    await question.click();
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText(/Seus dados de nascimento/i)).toBeVisible();
    await page.getByRole("button", { name: "Homem" }).click();
    await page.locator("#birth-date").fill("1990-05-15");

    const birthTime = page.locator("#birth-time");
    if (await birthTime.count()) {
      await birthTime.fill("14:30");
    }

    await page.locator("#birth-place").fill("São Paulo");
    const placeOption = page.getByRole("button", { name: /São Paulo, São Paulo, Brasil/i });
    await expect(placeOption).toBeVisible({ timeout: 10_000 });
    await placeOption.click();

    await page.getByRole("button", { name: /Gerar minha previsão/i }).click();

    await expect(page.getByText("Sua previsão")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Previsão E2E mockada/i)).toBeVisible();
    await expect(page.getByText(/Créditos restantes: 42/i)).toBeVisible();
    expect(predictCalled).toBe(true);
  });
});
