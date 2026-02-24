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

test.describe("Auth pages — navigation", () => {
  test("should allow changing language on login screen", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Iniciar sesión");

    await page.getByRole("button", { name: "ES" }).click();
    await page.getByRole("menuitem", { name: /English/i }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Sign in");
  });

  test("should open login and navigate to register", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.locator('a[href="/register"]').click();

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("should navigate from register back to login", async ({ page }) => {
    await page.goto("/register");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.locator('a[href="/login"]').click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("should navigate from login to forgot-password", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.locator('a[href="/forgot-password"]').click();

    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("should navigate from forgot-password back to login", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.locator('a[href="/login"]').click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("should load reset-password page with token query param", async ({ page }) => {
    await page.goto("/reset-password?token=abc123");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/\/reset-password$/);
  });

  test("should load reset-password page without token", async ({ page }) => {
    await page.goto("/reset-password");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Auth pages — form structure", () => {
  test("login should render required email and password fields", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator("#email");
    const passwordInput = page.locator("#password");
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("required", "");

    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveAttribute("required", "");

    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test("register should render required name, email, password, and confirm password fields", async ({
    page
  }) => {
    await page.goto("/register");

    const nameInput = page.locator("#name");
    const emailInput = page.locator("#email");
    const passwordInput = page.locator("#password");
    const confirmPasswordInput = page.locator("#confirmPassword");
    const submitButton = page.locator('button[type="submit"]');

    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveAttribute("type", "text");
    await expect(nameInput).toHaveAttribute("required", "");
    await expect(nameInput).toHaveAttribute("minlength", "2");

    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");

    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("minlength", "8");

    await expect(confirmPasswordInput).toBeVisible();
    await expect(confirmPasswordInput).toHaveAttribute("type", "password");
    await expect(confirmPasswordInput).toHaveAttribute("minlength", "8");

    await expect(submitButton).toBeVisible();
  });

  test("forgot-password should render required email field", async ({ page }) => {
    await page.goto("/forgot-password");

    const emailInput = page.locator("#email");
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("required", "");

    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test("reset-password should keep submit disabled without token in URL", async ({ page }) => {
    await page.goto("/reset-password");

    const passwordInput = page.locator("#password");
    const confirmPasswordInput = page.locator("#confirmPassword");
    const submitButton = page.locator('button[type="submit"]');

    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveAttribute("minlength", "8");

    await expect(confirmPasswordInput).toBeVisible();
    await confirmPasswordInput.fill("12345678");
    await passwordInput.fill("12345678");

    await expect(submitButton).toBeDisabled();
  });

  test("reset-password should enable submit when token exists in URL and passwords match", async ({
    page
  }) => {
    await page.goto("/reset-password?token=some-valid-token");

    const passwordInput = page.locator("#password");
    const confirmPasswordInput = page.locator("#confirmPassword");
    const submitButton = page.locator('button[type="submit"]');

    await passwordInput.fill("12345678");
    await confirmPasswordInput.fill("12345678");

    await expect(submitButton).toBeEnabled();
  });
});
