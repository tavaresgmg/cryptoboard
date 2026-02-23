import { expect, test } from "@playwright/test";

test("deve abrir login e navegar para cadastro", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.locator('a[href="/register"]').click();

  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
