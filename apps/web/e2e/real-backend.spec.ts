import { expect, test } from "@playwright/test";

test.skip(
  process.env.E2E_REAL_BACKEND !== "true",
  "Runs only when E2E_REAL_BACKEND=true against Docker API/DB stack"
);

test.describe("Real backend smoke journey", () => {
  test("should register and persist profile changes with real API/DB", async ({ page }) => {
    const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const email = `e2e-real-${unique}@example.com`;
    const initialName = `E2E User ${unique}`;
    const updatedName = `${initialName} Updated`;

    await page.goto("/register");
    await page.locator("#name").fill(initialName);
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("12345678");
    await page.locator("#confirmPassword").fill("12345678");
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/onboarding$/);

    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.locator("#profileName")).toBeVisible();

    await page.locator("#profileName").fill(updatedName);
    await page.locator("#profileDescription").fill("Profile updated in real backend e2e");
    await page
      .getByRole("button", { name: /Guardar perfil|Save profile|Salvar perfil/i })
      .first()
      .click();

    await expect(page.locator("#profileName")).toHaveValue(updatedName);
    await page.reload();
    await expect(page.locator("#profileName")).toHaveValue(updatedName);
  });

  test("should redirect forgot-password flow back to login", async ({ page }) => {
    const email = `forgot-real-${Date.now()}@example.com`;

    await page.goto("/forgot-password");
    await page.locator("#email").fill(email);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/login$/);
  });
});
