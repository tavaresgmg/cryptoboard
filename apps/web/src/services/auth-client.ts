import {
  accessTokenResponseSchema,
  authSuccessResponseSchema,
  cryptoDetailSchema,
  cryptoListResponseSchema,
  favoriteListResponseSchema,
  favoritesResponseSchema,
  listCryptoQuerySchema,
  loginInputSchema,
  logoutResponseSchema,
  registerInputSchema,
  userProfileSchema
} from "@crypto/shared";
import type {
  CryptoDetail,
  CryptoListResponse,
  AuthSuccessResponse,
  FavoriteListResponse,
  FavoritesResponse,
  ListCryptoQuery,
  LoginInput,
  RegisterInput,
  UserProfile
} from "@crypto/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

let accessToken: string | null = null;
let currentUser: UserProfile | null = null;
let refreshInFlight: Promise<boolean> | null = null;

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json();
  return payload as T;
}

async function requestWithAuth(
  path: string,
  init: RequestInit = {},
  retryOnUnauthorized = true
): Promise<Response> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {})
    },
    credentials: "include"
  });

  if (response.status !== 401 || !retryOnUnauthorized) {
    return response;
  }

  const refreshed = await ensureSession();
  if (!refreshed) {
    return response;
  }

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {})
    },
    credentials: "include"
  });
}

function assertOk(response: Response, fallbackMessage: string): void {
  if (response.ok) {
    return;
  }

  throw new Error(`${fallbackMessage} (HTTP ${response.status})`);
}

function applyAuthResponse(payload: AuthSuccessResponse): void {
  accessToken = payload.accessToken;
}

export function isAuthenticated(): boolean {
  return Boolean(accessToken);
}

export function getCurrentUser(): UserProfile | null {
  return currentUser;
}

export async function login(input: LoginInput): Promise<UserProfile> {
  const body = loginInputSchema.parse(input);
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(body)
  });
  assertOk(response, "Falha no login");

  const payload = authSuccessResponseSchema.parse(await parseJson(response));
  applyAuthResponse(payload);
  return fetchMe();
}

export async function register(input: RegisterInput): Promise<UserProfile> {
  const body = registerInputSchema.parse(input);
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(body)
  });
  assertOk(response, "Falha no cadastro");

  const payload = authSuccessResponseSchema.parse(await parseJson(response));
  applyAuthResponse(payload);
  return fetchMe();
}

export async function ensureSession(): Promise<boolean> {
  if (accessToken) {
    return true;
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });

    if (!response.ok) {
      accessToken = null;
      currentUser = null;
      return false;
    }

    const payload = accessTokenResponseSchema.parse(await parseJson(response));
    accessToken = payload.accessToken;

    try {
      await fetchMe();
      return true;
    } catch {
      accessToken = null;
      currentUser = null;
      return false;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function fetchMe(): Promise<UserProfile> {
  const response = await requestWithAuth("/users/me");
  assertOk(response, "Falha ao carregar perfil");

  const payload = userProfileSchema.parse(await parseJson(response));
  currentUser = payload;
  return payload;
}

export async function logout(): Promise<void> {
  const response = await requestWithAuth(
    "/auth/logout",
    {
      method: "DELETE"
    },
    false
  );

  if (response.ok) {
    logoutResponseSchema.parse(await parseJson(response));
  }

  accessToken = null;
  currentUser = null;
}

export async function listCryptos(
  query: Partial<ListCryptoQuery> = {}
): Promise<CryptoListResponse> {
  const parsed = listCryptoQuerySchema.partial().parse(query);
  const params = new URLSearchParams();

  if (parsed.search) params.set("search", parsed.search);
  if (parsed.type) params.set("type", parsed.type);
  if (parsed.page) params.set("page", String(parsed.page));
  if (parsed.limit) params.set("limit", String(parsed.limit));

  const suffix = params.toString();
  const path = suffix.length > 0 ? `/crypto?${suffix}` : "/crypto";
  const response = await requestWithAuth(path);
  assertOk(response, "Falha ao carregar criptomoedas");

  return cryptoListResponseSchema.parse(await parseJson(response));
}

export async function getCryptoDetail(coinId: string): Promise<CryptoDetail> {
  const normalizedCoinId = coinId.trim();
  if (!normalizedCoinId) {
    throw new Error("CoinId invalido");
  }

  const response = await requestWithAuth(`/crypto/${encodeURIComponent(normalizedCoinId)}`);
  assertOk(response, "Falha ao carregar detalhes da criptomoeda");
  return cryptoDetailSchema.parse(await parseJson(response));
}

export async function addFavorite(coinId: string): Promise<FavoritesResponse> {
  const normalizedCoinId = coinId.trim();
  if (!normalizedCoinId) {
    throw new Error("CoinId invalido");
  }

  const response = await requestWithAuth(`/users/me/favorites/${encodeURIComponent(normalizedCoinId)}`, {
    method: "POST"
  });
  assertOk(response, "Falha ao adicionar favorito");

  return favoritesResponseSchema.parse(await parseJson(response));
}

export async function removeFavorite(coinId: string): Promise<FavoritesResponse> {
  const normalizedCoinId = coinId.trim();
  if (!normalizedCoinId) {
    throw new Error("CoinId invalido");
  }

  const response = await requestWithAuth(`/users/me/favorites/${encodeURIComponent(normalizedCoinId)}`, {
    method: "DELETE"
  });
  assertOk(response, "Falha ao remover favorito");

  return favoritesResponseSchema.parse(await parseJson(response));
}

export async function listFavorites(): Promise<FavoriteListResponse> {
  const response = await requestWithAuth("/users/me/favorites");
  assertOk(response, "Falha ao listar favoritos");
  return favoriteListResponseSchema.parse(await parseJson(response));
}
