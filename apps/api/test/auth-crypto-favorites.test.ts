import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, afterEach, before, beforeEach, describe, test } from "node:test";

import type { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import type { AppEnv } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { buildServer } from "../src/server.js";

interface RegisterResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface CryptoListResponse {
  data: Array<{
    id: string;
    name: string;
    symbol: string;
    type: "coin" | "token";
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface CryptoDetailResponse {
  id: string;
  symbol: string;
}

interface FavoritesResponse {
  favorites: string[];
}

interface FavoriteListResponse {
  data: Array<{
    id: string;
  }>;
}

interface CoinPaprikaCoin {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  type: "coin" | "token";
}

interface CoinPaprikaTicker {
  id: string;
  rank: number;
  quotes: {
    USD: {
      price: number;
      market_cap: number;
      volume_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
    };
  };
}

const coinCatalog: CoinPaprikaCoin[] = [
  {
    id: "btc-bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    rank: 1,
    type: "coin"
  },
  {
    id: "eth-ethereum",
    name: "Ethereum",
    symbol: "ETH",
    rank: 2,
    type: "coin"
  },
  {
    id: "usdt-tether",
    name: "Tether",
    symbol: "USDT",
    rank: 3,
    type: "token"
  }
];

const tickerCatalog: CoinPaprikaTicker[] = [
  {
    id: "btc-bitcoin",
    rank: 1,
    quotes: {
      USD: {
        price: 65000,
        market_cap: 1200000000000,
        volume_24h: 30000000000,
        percent_change_1h: -0.4,
        percent_change_24h: -1.8,
        percent_change_7d: 2.1
      }
    }
  },
  {
    id: "eth-ethereum",
    rank: 2,
    quotes: {
      USD: {
        price: 3200,
        market_cap: 390000000000,
        volume_24h: 17000000000,
        percent_change_1h: 0.1,
        percent_change_24h: -0.6,
        percent_change_7d: 1.7
      }
    }
  },
  {
    id: "usdt-tether",
    rank: 3,
    quotes: {
      USD: {
        price: 1,
        market_cap: 90000000000,
        volume_24h: 70000000000,
        percent_change_1h: 0,
        percent_change_24h: 0,
        percent_change_7d: 0
      }
    }
  }
];

const coinDetailsById = new Map(
  coinCatalog.map((coin) => [
    coin.id,
    {
      ...coin,
      description: `${coin.name} description for tests`,
      circulating_supply: 1_000_000,
      max_supply: 2_000_000
    }
  ])
);

const tickerById = new Map(tickerCatalog.map((ticker) => [ticker.id, ticker]));

const originalFetch = globalThis.fetch;
let mongoServer: MongoMemoryServer;
let app: FastifyInstance;
let env: AppEnv;

function toJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

function parseJson<T>(payload: string): T {
  return JSON.parse(payload) as T;
}

function authHeaders(accessToken: string): { authorization: string } {
  return {
    authorization: `Bearer ${accessToken}`
  };
}

function extractPathForService(url: string, serviceBaseUrl: string): string {
  if (!url.startsWith(serviceBaseUrl)) {
    throw new Error(`URL inesperada no fetch stub: ${url}`);
  }

  const fullUrl = new URL(url);
  const basePath = new URL(serviceBaseUrl).pathname.replace(/\/$/, "");
  const normalizedPath = fullUrl.pathname.replace(basePath, "");
  return normalizedPath.length > 0 ? normalizedPath : "/";
}

function createCoinPaprikaFetchStub(serviceBaseUrl: string): typeof globalThis.fetch {
  return async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const path = extractPathForService(url, serviceBaseUrl);

    if (path === "/coins") {
      return toJsonResponse(coinCatalog);
    }

    if (path === "/tickers") {
      return toJsonResponse(tickerCatalog);
    }

    if (path.startsWith("/coins/")) {
      const coinId = path.slice("/coins/".length);
      const coin = coinDetailsById.get(coinId);
      return coin ? toJsonResponse(coin) : toJsonResponse({ error: "not-found" }, 404);
    }

    if (path.startsWith("/tickers/")) {
      const coinId = path.slice("/tickers/".length);
      const ticker = tickerById.get(coinId);
      return ticker ? toJsonResponse(ticker) : toJsonResponse({ error: "not-found" }, 404);
    }

    throw new Error(`Path inesperado no fetch stub: ${path}`);
  };
}

function createTestEnv(mongoUri: string): AppEnv {
  return {
    NODE_ENV: "test",
    HOST: "127.0.0.1",
    PORT: 3000,
    WEB_ORIGIN: "http://localhost:5173",
    MONGODB_URI: mongoUri,
    COINPAPRIKA_BASE_URL: `https://coinpaprika.test/${randomUUID()}`,
    JWT_SECRET: "test-secret-change-me-please",
    JWT_ACCESS_EXPIRATION: "15m",
    JWT_REFRESH_EXPIRATION: "7d"
  };
}

describe("Auth + Crypto + Favorites integration", () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDatabase(mongoServer.getUri());
  });

  beforeEach(async () => {
    await mongoose.connection.db?.dropDatabase();
    env = createTestEnv(mongoServer.getUri());
    globalThis.fetch = createCoinPaprikaFetchStub(env.COINPAPRIKA_BASE_URL);
    app = await buildServer(env);
  });

  afterEach(async () => {
    await app.close();
    globalThis.fetch = originalFetch;
  });

  after(async () => {
    await disconnectDatabase();
    await mongoServer.stop();
    globalThis.fetch = originalFetch;
  });

  test("deve executar fluxo completo de favoritos autenticado", async () => {
    const email = `user-${randomUUID()}@example.com`;
    const registerResponse = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "User Test",
        email,
        password: "12345678"
      }
    });

    assert.equal(registerResponse.statusCode, 201);
    const authPayload = parseJson<RegisterResponse>(registerResponse.body);
    assert.ok(authPayload.accessToken.length > 0);
    assert.equal(authPayload.user.email, email);

    const listResponse = await app.inject({
      method: "GET",
      url: "/crypto?type=coin&search=bit&page=1&limit=10",
      headers: authHeaders(authPayload.accessToken)
    });
    assert.equal(listResponse.statusCode, 200);

    const cryptoList = parseJson<CryptoListResponse>(listResponse.body);
    assert.equal(cryptoList.pagination.total, 1);
    assert.equal(cryptoList.data[0]?.id, "btc-bitcoin");

    const addFavoriteResponse = await app.inject({
      method: "POST",
      url: "/users/me/favorites/btc-bitcoin",
      headers: authHeaders(authPayload.accessToken)
    });
    assert.equal(addFavoriteResponse.statusCode, 201);
    assert.deepEqual(parseJson<FavoritesResponse>(addFavoriteResponse.body), {
      favorites: ["btc-bitcoin"]
    });

    const duplicateFavoriteResponse = await app.inject({
      method: "POST",
      url: "/users/me/favorites/btc-bitcoin",
      headers: authHeaders(authPayload.accessToken)
    });
    assert.equal(duplicateFavoriteResponse.statusCode, 409);

    const listFavoritesResponse = await app.inject({
      method: "GET",
      url: "/users/me/favorites",
      headers: authHeaders(authPayload.accessToken)
    });
    assert.equal(listFavoritesResponse.statusCode, 200);
    const favoritesPayload = parseJson<FavoriteListResponse>(listFavoritesResponse.body);
    assert.equal(favoritesPayload.data.length, 1);
    assert.equal(favoritesPayload.data[0]?.id, "btc-bitcoin");

    const detailResponse = await app.inject({
      method: "GET",
      url: "/crypto/btc-bitcoin",
      headers: authHeaders(authPayload.accessToken)
    });
    assert.equal(detailResponse.statusCode, 200);
    const detailPayload = parseJson<CryptoDetailResponse>(detailResponse.body);
    assert.equal(detailPayload.id, "btc-bitcoin");
    assert.equal(detailPayload.symbol, "BTC");

    const removeFavoriteResponse = await app.inject({
      method: "DELETE",
      url: "/users/me/favorites/btc-bitcoin",
      headers: authHeaders(authPayload.accessToken)
    });
    assert.equal(removeFavoriteResponse.statusCode, 200);
    assert.deepEqual(parseJson<FavoritesResponse>(removeFavoriteResponse.body), {
      favorites: []
    });
  });

  test("deve retornar 404 para coin inexistente", async () => {
    const registerResponse = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "User Not Found Coin",
        email: `user-${randomUUID()}@example.com`,
        password: "12345678"
      }
    });

    assert.equal(registerResponse.statusCode, 201);
    const authPayload = parseJson<RegisterResponse>(registerResponse.body);

    const detailResponse = await app.inject({
      method: "GET",
      url: "/crypto/not-existing-coin",
      headers: authHeaders(authPayload.accessToken)
    });
    assert.equal(detailResponse.statusCode, 404);

    const addFavoriteResponse = await app.inject({
      method: "POST",
      url: "/users/me/favorites/not-existing-coin",
      headers: authHeaders(authPayload.accessToken)
    });
    assert.equal(addFavoriteResponse.statusCode, 404);
  });
});
