import { expect, test } from "@playwright/test";

test.describe("Authenticated journey — login, favorites, and profile", () => {
  test("should complete a realistic authenticated flow with stateful API contracts", async ({
    page
  }) => {
    let favorites: string[] = [];
    let hasRefreshSession = false;
    const now = new Date().toISOString();

    const user = {
      id: "user-journey",
      name: "Journey User",
      email: "journey.user@example.com",
      description: "",
      hasAvatar: false,
      preferredCurrency: "USD",
      favorites,
      createdAt: now,
      updatedAt: now
    };

    const cryptoList = [
      {
        id: "btc-bitcoin",
        name: "Bitcoin",
        symbol: "BTC",
        rank: 1,
        type: "coin",
        price: 62000,
        percentChange24h: 1.4
      },
      {
        id: "eth-ethereum",
        name: "Ethereum",
        symbol: "ETH",
        rank: 2,
        type: "coin",
        price: 3100,
        percentChange24h: -0.6
      }
    ];

    await page.route("**/api/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname.replace(/^\/api/, "");

      if (request.method() === "POST" && path === "/auth/refresh") {
        if (hasRefreshSession) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ accessToken: "test-access-token" })
          });
          return;
        }

        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ message: "Unauthorized" })
        });
        return;
      }

      if (request.method() === "POST" && path === "/auth/login") {
        const body = JSON.parse(request.postData() ?? "{}") as {
          email?: string;
          password?: string;
        };
        if (body.email === user.email && body.password === "12345678") {
          hasRefreshSession = true;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              accessToken: "test-access-token",
              user: {
                id: user.id,
                name: user.name,
                email: user.email
              }
            })
          });
          return;
        }

        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ message: "Invalid credentials" })
        });
        return;
      }

      if (request.method() === "GET" && path === "/users/me") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...user,
            favorites
          })
        });
        return;
      }

      if (request.method() === "GET" && path === "/crypto") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: cryptoList,
            pagination: {
              page: 1,
              limit: 24,
              total: cryptoList.length
            }
          })
        });
        return;
      }

      if (request.method() === "POST" && path.startsWith("/users/me/favorites/")) {
        const coinId = path.slice("/users/me/favorites/".length);
        if (!favorites.includes(coinId)) {
          favorites = [...favorites, coinId];
        }

        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ favorites })
        });
        return;
      }

      if (request.method() === "GET" && path === "/users/me/favorites") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: cryptoList.filter((coin) => favorites.includes(coin.id))
          })
        });
        return;
      }

      if (request.method() === "PUT" && path === "/users/me") {
        const body = JSON.parse(request.postData() ?? "{}") as {
          name?: string;
          description?: string;
          preferredCurrency?: string;
        };

        if (body.name) {
          user.name = body.name;
        }
        if (body.description !== undefined) {
          user.description = body.description;
        }
        if (body.preferredCurrency) {
          user.preferredCurrency = body.preferredCurrency;
        }
        user.updatedAt = new Date().toISOString();

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...user,
            favorites
          })
        });
        return;
      }

      if (request.method() === "DELETE" && path === "/auth/logout") {
        hasRefreshSession = false;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Logged out" })
        });
        return;
      }

      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: `Unhandled mock route: ${request.method()} ${path}` })
      });
    });

    await page.goto("/login");
    await page.locator("#email").fill(user.email);
    await page.locator("#password").fill("12345678");
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("Bitcoin")).toBeVisible();

    const addFavoriteButton = page.getByRole("button", {
      name: /Agregar a favoritos|Add to favorites|Adicionar aos favoritos/i
    });
    await addFavoriteButton.first().click();

    await expect(
      page
        .getByRole("button", {
          name: /Eliminar de favoritos|Remove from favorites|Remover dos favoritos/i
        })
        .first()
    ).toBeVisible();

    await page.locator('a[href="/favorites"]').first().click();
    await expect(page).toHaveURL(/\/favorites$/);
    await expect(page.getByText("Bitcoin")).toBeVisible();

    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile$/);

    await page.locator("#profileName").fill("Journey User Updated");
    await page.locator("#profileDescription").fill("Updated by e2e journey");
    await page
      .getByRole("button", { name: /Guardar perfil|Save profile|Salvar perfil/i })
      .first()
      .click();

    await expect(page.locator("#profileName")).toHaveValue("Journey User Updated");
  });
});
