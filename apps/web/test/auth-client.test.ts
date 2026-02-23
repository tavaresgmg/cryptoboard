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

  const found = Object.entries(headers).find(([key]) => key.toLowerCase() === headerName.toLowerCase());
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

  test("login deve autenticar e carregar perfil", async () => {
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

      throw new Error(`URL inesperada: ${url}`);
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

  test("ensureSession deve compartilhar refresh em chamadas concorrentes", async () => {
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

      throw new Error(`URL inesperada: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    const [firstResult, secondResult] = await Promise.all([client.ensureSession(), client.ensureSession()]);

    expect(firstResult).toBe(true);
    expect(secondResult).toBe(true);
    expect(refreshCalls).toBe(1);
    expect(client.isAuthenticated()).toBe(true);
    expect(client.getCurrentUser()?.email).toBe("user@example.com");
  });

  test("listCryptos deve tentar refresh em 401 e repetir requisicao", async () => {
    let cryptoCalls = 0;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = resolveUrl(input);

      if (url.startsWith(`${API_URL}/crypto`)) {
        cryptoCalls += 1;
        const parsed = new URL(url, "http://localhost");
        expect(parsed.searchParams.get("search")).toBe("bit");
        expect(parsed.searchParams.get("type")).toBe("coin");
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

      throw new Error(`URL inesperada: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    const result = await client.listCryptos({
      search: "bit",
      type: "coin",
      page: 1,
      limit: 2
    });

    expect(result.pagination.total).toBe(1);
    expect(result.data[0]?.id).toBe("btc-bitcoin");
    expect(cryptoCalls).toBe(2);
  });

  test("logout deve limpar estado local mesmo com erro da API", async () => {
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

      throw new Error(`URL inesperada: ${url}`);
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

  test("forgotPassword e resetPassword devem enviar payloads esperados", async () => {
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

      throw new Error(`URL inesperada: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const client = await loadClient();

    const forgotResult = await client.forgotPassword({ email: "user@example.com" });
    const resetResult = await client.resetPassword({ token: "token-123", password: "12345678" });

    expect(forgotResult.message).toBe("ok");
    expect(resetResult.message).toBe("ok");
  });

  test("updateMyProfile deve atualizar estado local do usuario", async () => {
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

      throw new Error(`URL inesperada: ${url}`);
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
});
