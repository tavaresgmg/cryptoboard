import { beforeEach, describe, expect, test, vi } from "vitest";
import { createMemoryHistory } from "vue-router";

const authMocks = vi.hoisted(() => ({
  isAuthenticated: vi.fn<() => boolean>(),
  ensureSession: vi.fn<() => Promise<boolean>>()
}));

vi.mock("../src/services/auth-client", () => ({
  isAuthenticated: authMocks.isAuthenticated,
  ensureSession: authMocks.ensureSession,
  getCurrentUser: () => null,
  fetchMe: vi.fn().mockResolvedValue(null),
  logout: vi.fn().mockResolvedValue(undefined),
  login: vi.fn(),
  register: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  listCryptos: vi.fn(),
  getCryptoDetail: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  listFavorites: vi.fn(),
  updateMyProfile: vi.fn(),
  uploadAvatar: vi.fn()
}));

describe("router guards", () => {
  beforeEach(() => {
    vi.resetModules();
    authMocks.isAuthenticated.mockReset();
    authMocks.ensureSession.mockReset();
  });

  test("should redirect to login when unauthenticated user visits a protected route", async () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.ensureSession.mockResolvedValue(false);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe("/");
  });

  test("should allow protected route when session exists", async () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.ensureSession.mockResolvedValue(true);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("cryptos");
  });

  test("should redirect login to cryptos when user is already authenticated", async () => {
    authMocks.isAuthenticated.mockReturnValue(true);
    authMocks.ensureSession.mockResolvedValue(true);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/login");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("cryptos");
  });

  test("should not call ensureSession on login route when user is unauthenticated", async () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.ensureSession.mockResolvedValue(false);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/login");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("login");
    expect(authMocks.ensureSession).not.toHaveBeenCalled();
  });

  test("should allow forgot-password without authentication", async () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.ensureSession.mockResolvedValue(false);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/forgot-password");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("forgot-password");
  });

  test("should protect /favorites when authentication is required", async () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.ensureSession.mockResolvedValue(false);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/favorites");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe("/favorites");
  });

  test("should protect /profile when authentication is required", async () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.ensureSession.mockResolvedValue(false);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/profile");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe("/profile");
  });

  test("should render 404 for unknown route", async () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.ensureSession.mockResolvedValue(false);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/invalid-route");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("not-found");
  });

  test("should protect /onboarding when authentication is required", async () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.ensureSession.mockResolvedValue(false);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/onboarding");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe("/onboarding");
  });
});
