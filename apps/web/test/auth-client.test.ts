import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const API_URL = "/api";
const originalFetch = globalThis.fetch;

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function readHeader(headers: HeadersInit | undefined, headerName: string): string | null {
  if (!headers) {
    return null;
  }

  if (headers instanceof Headers) {
    return headers.get(headerName);
  }

  if (Array.isArray(headers)) {
    const found = headers.find(([key]) => key.toLowerCase() === headerName.toLowerCase());
    return found?.[1] ?? null;
  }

  const found = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === headerName.toLowerCase()
  );
  if (!found) {
    return null;
  }

  const value = found[1];
  return typeof value === "string" ? value : null;
}

function profilePayload() {
  return {
    id: "user-1",
    name: "User One",
    email: "user@example.com",
    hasAvatar: false,
    preferredCurrency: "USD",
    favorites: [],
    createdAt: "2026-02-23T00:00:00.000Z",
    updatedAt: "2026-02-23T00:00:00.000Z"
  };
}

async function loadClient() {
  return import("../src/services/auth-client");
}

describe("auth-client", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  test("login should authenticate and fetch profile", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = resolveUrl(input);

      if (url === `${API_URL}/auth/login`) {
        return jsonResponse({
          accessToken: "access-token-login",
          user: {
            id: "user-1",
            name: "User One",
            email: "user@example.com"
          }
        });
      }

      if (url === `${API_URL}/users/me`) {
        expect(readHeader(init?.headers, "Authorization")).toBe("Bearer access-token-login");
        return jsonResponse(profilePayload());
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    const profile = await client.login({
      email: "user@example.com",
      password: "12345678"
    });

    expect(profile.email).toBe("user@example.com");
    expect(client.isAuthenticated()).toBe(true);
    expect(client.getCurrentUser()?.id).toBe("user-1");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("ensureSession should share refresh call across concurrent requests", async () => {
    let refreshCalls = 0;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = resolveUrl(input);

      if (url === `${API_URL}/auth/refresh`) {
        refreshCalls += 1;
        return jsonResponse({
          accessToken: "access-token-refresh"
        });
      }

      if (url === `${API_URL}/users/me`) {
        expect(readHeader(init?.headers, "Authorization")).toBe("Bearer access-token-refresh");
        return jsonResponse(profilePayload());
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    const [firstResult, secondResult] = await Promise.all([
      client.ensureSession(),
      client.ensureSession()
    ]);

    expect(firstResult).toBe(true);
    expect(secondResult).toBe(true);
    expect(refreshCalls).toBe(1);
    expect(client.isAuthenticated()).toBe(true);
    expect(client.getCurrentUser()?.email).toBe("user@example.com");
  });

  test("listCryptos should retry after refresh when first request returns 401", async () => {
    let cryptoCalls = 0;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = resolveUrl(input);

      if (url.startsWith(`${API_URL}/crypto`)) {
        cryptoCalls += 1;
        const parsed = new URL(url, "http://localhost");
        expect(parsed.searchParams.get("search")).toBe("bit");
        expect(parsed.searchParams.get("type")).toBe("coin");
        expect(parsed.searchParams.get("sort")).toBe("price_desc");
        expect(parsed.searchParams.get("page")).toBe("1");
        expect(parsed.searchParams.get("limit")).toBe("2");

        if (cryptoCalls === 1) {
          expect(readHeader(init?.headers, "Authorization")).toBeNull();
          return new Response(null, { status: 401 });
        }

        expect(readHeader(init?.headers, "Authorization")).toBe("Bearer access-token-refresh");
        return jsonResponse({
          data: [
            {
              id: "btc-bitcoin",
              name: "Bitcoin",
              symbol: "BTC",
              rank: 1,
              type: "coin",
              price: 65000
            }
          ],
          pagination: {
            page: 1,
            limit: 2,
            total: 1
          }
        });
      }

      if (url === `${API_URL}/auth/refresh`) {
        return jsonResponse({
          accessToken: "access-token-refresh"
        });
      }

      if (url === `${API_URL}/users/me`) {
        return jsonResponse(profilePayload());
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    const result = await client.listCryptos({
      search: "bit",
      type: "coin",
      sort: "price_desc",
      page: 1,
      limit: 2
    });

    expect(result.pagination.total).toBe(1);
    expect(result.data[0]?.id).toBe("btc-bitcoin");
    expect(cryptoCalls).toBe(2);
  });

  test("addFavorite/removeFavorite should not send content-type when there is no body", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = resolveUrl(input);

      if (url === `${API_URL}/auth/login`) {
        return jsonResponse({
          accessToken: "access-token-login",
          user: {
            id: "user-1",
            name: "User One",
            email: "user@example.com"
          }
        });
      }

      if (url === `${API_URL}/users/me` && init?.method !== "POST" && init?.method !== "DELETE") {
        return jsonResponse(profilePayload());
      }

      if (url === `${API_URL}/users/me/favorites/btc-bitcoin` && init?.method === "POST") {
        expect(readHeader(init.headers, "Authorization")).toBe("Bearer access-token-login");
        expect(readHeader(init.headers, "Content-Type")).toBeNull();
        expect(init.body).toBeUndefined();
        return jsonResponse({ favorites: ["btc-bitcoin"] }, 201);
      }

      if (url === `${API_URL}/users/me/favorites/btc-bitcoin` && init?.method === "DELETE") {
        expect(readHeader(init.headers, "Authorization")).toBe("Bearer access-token-login");
        expect(readHeader(init.headers, "Content-Type")).toBeNull();
        expect(init.body).toBeUndefined();
        return jsonResponse({ favorites: [] });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    await client.login({
      email: "user@example.com",
      password: "12345678"
    });

    const addResult = await client.addFavorite("btc-bitcoin");
    const removeResult = await client.removeFavorite("btc-bitcoin");

    expect(addResult.favorites).toEqual(["btc-bitcoin"]);
    expect(removeResult.favorites).toEqual([]);
  });

  test("logout should clear local state even when API fails", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = resolveUrl(input);

      if (url === `${API_URL}/auth/login`) {
        return jsonResponse({
          accessToken: "access-token-login",
          user: {
            id: "user-1",
            name: "User One",
            email: "user@example.com"
          }
        });
      }

      if (url === `${API_URL}/users/me`) {
        return jsonResponse(profilePayload());
      }

      if (url === `${API_URL}/auth/logout`) {
        expect(readHeader(init?.headers, "Authorization")).toBe("Bearer access-token-login");
        return new Response(null, { status: 500 });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    await client.login({
      email: "user@example.com",
      password: "12345678"
    });
    expect(client.isAuthenticated()).toBe(true);

    await client.logout();

    expect(client.isAuthenticated()).toBe(false);
    expect(client.getCurrentUser()).toBeNull();
  });

  test("forgotPassword and resetPassword should send expected payloads", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = resolveUrl(input);

      if (url === `${API_URL}/auth/forgot-password`) {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBe(JSON.stringify({ email: "user@example.com" }));
        return jsonResponse({ message: "ok" });
      }

      if (url === `${API_URL}/auth/reset-password`) {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBe(JSON.stringify({ token: "token-123", password: "12345678" }));
        return jsonResponse({ message: "ok" });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    const forgotResult = await client.forgotPassword({ email: "user@example.com" });
    const resetResult = await client.resetPassword({ token: "token-123", password: "12345678" });

    expect(forgotResult.message).toBe("ok");
    expect(resetResult.message).toBe("ok");
  });

  test("updateMyProfile should update local user state", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = resolveUrl(input);

      if (url === `${API_URL}/auth/login`) {
        return jsonResponse({
          accessToken: "access-token-login",
          user: {
            id: "user-1",
            name: "User One",
            email: "user@example.com"
          }
        });
      }

      if (url === `${API_URL}/users/me` && init?.method !== "PUT") {
        return jsonResponse(profilePayload());
      }

      if (url === `${API_URL}/users/me` && init?.method === "PUT") {
        expect(readHeader(init.headers, "Authorization")).toBe("Bearer access-token-login");
        expect(init.body).toBe(
          JSON.stringify({
            name: "Updated Name",
            preferredCurrency: "BRL"
          })
        );
        return jsonResponse({
          ...profilePayload(),
          name: "Updated Name",
          preferredCurrency: "BRL"
        });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    await client.login({ email: "user@example.com", password: "12345678" });
    const updated = await client.updateMyProfile({
      name: "Updated Name",
      preferredCurrency: "BRL"
    });

    expect(updated.name).toBe("Updated Name");
    expect(updated.preferredCurrency).toBe("BRL");
    expect(client.getCurrentUser()?.name).toBe("Updated Name");
  });

  test("uploadAvatar should reject files above size limit before calling API", async () => {
    const fetchMock = vi.fn();

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    const oversizedFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "avatar.png", {
      type: "image/png"
    });

    await expect(client.uploadAvatar(oversizedFile)).rejects.toThrow("Avatar must be at most 5 MB");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("uploadAvatar should return friendly message when API responds 413", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = resolveUrl(input);

      if (url === `${API_URL}/auth/login`) {
        return jsonResponse({
          accessToken: "access-token-login",
          user: {
            id: "user-1",
            name: "User One",
            email: "user@example.com"
          }
        });
      }

      if (url === `${API_URL}/users/me` && init?.method !== "PUT") {
        return jsonResponse(profilePayload());
      }

      if (url === `${API_URL}/users/me/avatar` && init?.method === "PUT") {
        expect(readHeader(init.headers, "Authorization")).toBe("Bearer access-token-login");
        return new Response("payload too large", { status: 413 });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    await client.login({
      email: "user@example.com",
      password: "12345678"
    });

    const validSmallFile = new File([new Uint8Array(32)], "avatar.png", { type: "image/png" });
    await expect(client.uploadAvatar(validSmallFile)).rejects.toThrow(
      "Avatar must be at most 5 MB"
    );
  });

  test("getMyAvatarSignedUrl should return null when avatar does not exist", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);

      if (url === `${API_URL}/auth/refresh`) {
        return jsonResponse({ accessToken: "access-token-refresh" });
      }

      if (url === `${API_URL}/users/me`) {
        return jsonResponse(profilePayload());
      }

      if (url === `${API_URL}/users/me/avatar-url`) {
        return jsonResponse({ message: "User has no avatar" }, 404);
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    const avatarUrl = await client.getMyAvatarSignedUrl();
    expect(avatarUrl).toBeNull();
  });

  test("uploadAvatar should succeed for valid file and response payload", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = resolveUrl(input);

      if (url === `${API_URL}/auth/login`) {
        return jsonResponse({
          accessToken: "access-token-login",
          user: {
            id: "user-1",
            name: "User One",
            email: "user@example.com"
          }
        });
      }

      if (url === `${API_URL}/users/me` && init?.method !== "PUT") {
        return jsonResponse(profilePayload());
      }

      if (url === `${API_URL}/users/me/avatar` && init?.method === "PUT") {
        expect(readHeader(init.headers, "Authorization")).toBe("Bearer access-token-login");
        return jsonResponse({ message: "Avatar updated successfully" });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    await client.login({ email: "user@example.com", password: "12345678" });

    const validSmallFile = new File([new Uint8Array(64)], "avatar.png", { type: "image/png" });
    const result = await client.uploadAvatar(validSmallFile);

    expect(result.message).toBe("Avatar updated successfully");
  });

  test("getMyAvatarSignedUrl should return URL and reject invalid payload", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);

      if (url === `${API_URL}/auth/refresh`) {
        return jsonResponse({ accessToken: "access-token-refresh" });
      }

      if (url === `${API_URL}/users/me`) {
        return jsonResponse(profilePayload());
      }

      if (url === `${API_URL}/users/me/avatar-url`) {
        return jsonResponse({ url: "https://cdn.example.com/avatar.png" });
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    const avatarUrl = await client.getMyAvatarSignedUrl();
    expect(avatarUrl).toBe("https://cdn.example.com/avatar.png");

    fetchMock.mockImplementationOnce(async (input: RequestInfo | URL) => {
      const url = resolveUrl(input);
      if (url === `${API_URL}/users/me/avatar-url`) {
        return jsonResponse({ url: "" });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    await expect(client.getMyAvatarSignedUrl()).rejects.toThrow("Invalid avatar URL response");
  });
});
