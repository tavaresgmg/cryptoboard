import {
  accessTokenResponseSchema,
  authMessageResponseSchema,
  authSuccessResponseSchema,
  avatarUpdateResponseSchema,
  cryptoDetailSchema,
  cryptoListResponseSchema,
  favoriteListResponseSchema,
  favoritesResponseSchema,
  forgotPasswordInputSchema,
  listCryptoQuerySchema,
  loginInputSchema,
  logoutResponseSchema,
  registerInputSchema,
  resetPasswordInputSchema,
  updateUserProfileInputSchema,
  userProfileSchema
} from "@crypto/shared";
import type {
  AuthMessageResponse,
  AvatarUpdateResponse,
  CryptoDetail,
  CryptoListResponse,
  AuthSuccessResponse,
  FavoriteListResponse,
  FavoritesResponse,
  ForgotPasswordInput,
  ListCryptoQuery,
  LoginInput,
  ResetPasswordInput,
  RegisterInput,
  UpdateUserProfileInput,
  UserProfile
} from "@crypto/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

let accessToken: string | null = null;
let currentUser: UserProfile | null = null;
let refreshInFlight: Promise<boolean> | null = null;

function hasContentTypeHeader(headers: RequestInit["headers"]): boolean {
  if (!headers) {
    return false;
  }

  if (headers instanceof Headers) {
    return headers.has("content-type");
  }

  if (Array.isArray(headers)) {
    return headers.some(([key]) => key.toLowerCase() === "content-type");
  }

  return Object.keys(headers).some((key) => key.toLowerCase() === "content-type");
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json();
  return payload as T;
}

async function requestWithAuth(
  path: string,
  init: RequestInit = {},
  retryOnUnauthorized = true
): Promise<Response> {
  const isFormDataBody = init.body instanceof FormData;
  const shouldSetJsonContentType = !isFormDataBody && !hasContentTypeHeader(init.headers);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(shouldSetJsonContentType ? { "Content-Type": "application/json" } : {}),
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
      ...(shouldSetJsonContentType ? { "Content-Type": "application/json" } : {}),
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

export async function forgotPassword(input: ForgotPasswordInput): Promise<AuthMessageResponse> {
  const body = forgotPasswordInputSchema.parse(input);
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  assertOk(response, "Falha ao solicitar redefinicao de senha");
  return authMessageResponseSchema.parse(await parseJson(response));
}

export async function resetPassword(input: ResetPasswordInput): Promise<AuthMessageResponse> {
  const body = resetPasswordInputSchema.parse(input);
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  assertOk(response, "Falha ao redefinir senha");
  return authMessageResponseSchema.parse(await parseJson(response));
}

export async function updateMyProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
  const body = updateUserProfileInputSchema.parse(input);
  const response = await requestWithAuth("/users/me", {
    method: "PUT",
    body: JSON.stringify(body)
  });
  assertOk(response, "Falha ao atualizar perfil");

  const payload = userProfileSchema.parse(await parseJson(response));
  currentUser = payload;
  return payload;
}

export async function uploadAvatar(file: File): Promise<AvatarUpdateResponse> {
  const formData = new FormData();
  formData.set("avatar", file);

  const response = await requestWithAuth("/users/me/avatar", {
    method: "PUT",
    body: formData
  });
  assertOk(response, "Falha ao enviar avatar");
  return avatarUpdateResponseSchema.parse(await parseJson(response));
}
