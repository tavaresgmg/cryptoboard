import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/auth/refresh", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unauthorized" }),
    }),
  );
});

test.describe("Router guards — protected routes redirect to login", () => {
  test("deve redirecionar / para /login com redirect query param", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login\?redirect=\//);
    await expect(page.locator("#email")).toBeVisible();
  });

  test("deve redirecionar /favorites para /login com redirect param", async ({ page }) => {
    await page.goto("/favorites");

    await expect(page).toHaveURL(/\/login\?redirect=\/favorites/);
    await expect(page.locator("#email")).toBeVisible();
  });

  test("deve redirecionar /profile para /login com redirect param", async ({ page }) => {
    await page.goto("/profile");

    await expect(page).toHaveURL(/\/login\?redirect=\/profile/);
    await expect(page.locator("#email")).toBeVisible();
  });
});

test.describe("404 — pagina nao encontrada", () => {
  test("deve exibir pagina 404 para rota inexistente", async ({ page }) => {
    await page.goto("/rota-que-nao-existe");

    await expect(page.locator("text=404")).toBeVisible();
  });

  test("deve ter link para voltar ao inicio na pagina 404", async ({ page }) => {
    await page.goto("/pagina-invalida");

    await expect(page.locator("text=404")).toBeVisible();
    const homeLink = page.locator('a[href="/"]');
    await expect(homeLink).toBeVisible();
  });
});
