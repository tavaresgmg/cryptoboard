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

  test("deve redirecionar para login quando usuario nao autenticado acessa rota protegida", async () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.ensureSession.mockResolvedValue(false);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe("/");
  });

  test("deve permitir rota protegida quando sessao existe", async () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.ensureSession.mockResolvedValue(true);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("cryptos");
  });

  test("deve redirecionar login para cryptos quando usuario ja autenticado", async () => {
    authMocks.isAuthenticated.mockReturnValue(true);
    authMocks.ensureSession.mockResolvedValue(true);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/login");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("cryptos");
  });

  test("deve permitir forgot-password sem autenticacao", async () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.ensureSession.mockResolvedValue(false);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/forgot-password");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("forgot-password");
  });

  test("deve proteger /favorites exigindo autenticacao", async () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.ensureSession.mockResolvedValue(false);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/favorites");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe("/favorites");
  });

  test("deve proteger /profile exigindo autenticacao", async () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.ensureSession.mockResolvedValue(false);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/profile");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe("/profile");
  });

  test("deve mostrar 404 para rota inexistente", async () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.ensureSession.mockResolvedValue(false);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/url-invalida");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("not-found");
  });
});
