import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/auth/refresh", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unauthorized" })
    })
  );
});

test.describe("Router guards — protected routes redirect to login", () => {
  test("should redirect / to /login with redirect query param", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login\?redirect=\//);
    await expect(page.locator("#email")).toBeVisible();
  });

  test("should redirect /favorites to /login with redirect query param", async ({ page }) => {
    await page.goto("/favorites");

    await expect(page).toHaveURL(/\/login\?redirect=\/favorites/);
    await expect(page.locator("#email")).toBeVisible();
  });

  test("should redirect /profile to /login with redirect query param", async ({ page }) => {
    await page.goto("/profile");

    await expect(page).toHaveURL(/\/login\?redirect=\/profile/);
    await expect(page.locator("#email")).toBeVisible();
  });
  test("should redirect /onboarding to /login with redirect query param", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(page).toHaveURL(/\/login\?redirect=\/onboarding/);
    await expect(page.locator("#email")).toBeVisible();
  });
});

test.describe("404 — page not found", () => {
  test("should render 404 page for unknown routes", async ({ page }) => {
    await page.goto("/route-that-does-not-exist");

    await expect(page.locator("text=404")).toBeVisible();
  });

  test("should render link to go back home on 404 page", async ({ page }) => {
    await page.goto("/invalid-page");

    await expect(page.locator("text=404")).toBeVisible();
    const homeLink = page.locator('a[href="/"]');
    await expect(homeLink).toBeVisible();
  });
});
