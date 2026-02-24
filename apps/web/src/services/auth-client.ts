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

export const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const DEFAULT_AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const parsedAvatarMaxBytes = Number(
  import.meta.env.VITE_AVATAR_MAX_BYTES ?? DEFAULT_AVATAR_MAX_BYTES
);
export const AVATAR_MAX_BYTES =
  Number.isFinite(parsedAvatarMaxBytes) && parsedAvatarMaxBytes > 0
    ? parsedAvatarMaxBytes
    : DEFAULT_AVATAR_MAX_BYTES;

let accessToken: string | null = null;
let currentUser: UserProfile | null = null;
let refreshInFlight: Promise<boolean> | null = null;

function formatBytesToMb(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return Number.isInteger(mb) ? `${mb} MB` : `${mb.toFixed(1)} MB`;
}

function avatarTooLargeMessage(): string {
  return `Avatar must be at most ${formatBytesToMb(AVATAR_MAX_BYTES)}`;
}

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
  const hasRequestBody = init.body !== undefined && init.body !== null;
  const shouldSetJsonContentType =
    hasRequestBody && !isFormDataBody && !hasContentTypeHeader(init.headers);

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

async function assertOk(response: Response, fallbackMessage: string): Promise<void> {
  if (response.ok) {
    return;
  }

  let serverMessage: string | undefined;
  try {
    const body = (await response.json()) as { message?: string };
    serverMessage = body.message;
  } catch {}

  throw new Error(serverMessage ?? `${fallbackMessage} (HTTP ${response.status})`);
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
  await assertOk(response, "Login failed");

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
  await assertOk(response, "Registration failed");

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
  await assertOk(response, "Failed to load profile");

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
  query: Partial<ListCryptoQuery> = {},
  signal?: AbortSignal
): Promise<CryptoListResponse> {
  const parsed = listCryptoQuerySchema.partial().parse(query);
  const params = new URLSearchParams();

  if (parsed.search) params.set("search", parsed.search);
  if (parsed.type) params.set("type", parsed.type);
  if (parsed.sort) params.set("sort", parsed.sort);
  if (parsed.page) params.set("page", String(parsed.page));
  if (parsed.limit) params.set("limit", String(parsed.limit));

  const suffix = params.toString();
  const path = suffix.length > 0 ? `/crypto?${suffix}` : "/crypto";
  const response = await requestWithAuth(path, { signal });
  await assertOk(response, "Failed to load cryptocurrencies");

  return cryptoListResponseSchema.parse(await parseJson(response));
}

export async function getCryptoDetail(coinId: string): Promise<CryptoDetail> {
  const normalizedCoinId = coinId.trim();
  if (!normalizedCoinId) {
    throw new Error("Invalid CoinId");
  }

  const response = await requestWithAuth(`/crypto/${encodeURIComponent(normalizedCoinId)}`);
  await assertOk(response, "Failed to load crypto details");
  return cryptoDetailSchema.parse(await parseJson(response));
}

export async function addFavorite(coinId: string): Promise<FavoritesResponse> {
  const normalizedCoinId = coinId.trim();
  if (!normalizedCoinId) {
    throw new Error("Invalid CoinId");
  }

  const response = await requestWithAuth(
    `/users/me/favorites/${encodeURIComponent(normalizedCoinId)}`,
    {
      method: "POST"
    }
  );
  await assertOk(response, "Failed to add favorite");

  return favoritesResponseSchema.parse(await parseJson(response));
}

export async function removeFavorite(coinId: string): Promise<FavoritesResponse> {
  const normalizedCoinId = coinId.trim();
  if (!normalizedCoinId) {
    throw new Error("Invalid CoinId");
  }

  const response = await requestWithAuth(
    `/users/me/favorites/${encodeURIComponent(normalizedCoinId)}`,
    {
      method: "DELETE"
    }
  );
  await assertOk(response, "Failed to remove favorite");

  return favoritesResponseSchema.parse(await parseJson(response));
}

export async function listFavorites(): Promise<FavoriteListResponse> {
  const response = await requestWithAuth("/users/me/favorites");
  await assertOk(response, "Failed to load favorites");
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
  await assertOk(response, "Failed to request password reset");
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
  await assertOk(response, "Failed to reset password");
  return authMessageResponseSchema.parse(await parseJson(response));
}

export async function updateMyProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
  const body = updateUserProfileInputSchema.parse(input);
  const response = await requestWithAuth("/users/me", {
    method: "PUT",
    body: JSON.stringify(body)
  });
  await assertOk(response, "Failed to update profile");

  const payload = userProfileSchema.parse(await parseJson(response));
  currentUser = payload;
  return payload;
}

export async function uploadAvatar(file: File): Promise<AvatarUpdateResponse> {
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error(avatarTooLargeMessage());
  }

  const formData = new FormData();
  formData.set("avatar", file);

  const response = await requestWithAuth("/users/me/avatar", {
    method: "PUT",
    body: formData
  });

  if (response.status === 413) {
    throw new Error(avatarTooLargeMessage());
  }

  await assertOk(response, "Failed to upload avatar");
  return avatarUpdateResponseSchema.parse(await parseJson(response));
}

export async function getMyAvatarSignedUrl(): Promise<string | null> {
  const response = await requestWithAuth("/users/me/avatar-url");
  if (response.status === 404) {
    return null;
  }

  await assertOk(response, "Failed to load avatar");
  const payload = await parseJson<{ url?: unknown }>(response);
  if (typeof payload.url !== "string" || payload.url.length === 0) {
    throw new Error("Invalid avatar URL response");
  }

  return payload.url;
}
