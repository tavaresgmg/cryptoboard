import { beforeEach, describe, expect, test, vi } from "vitest";
import { createMemoryHistory } from "vue-router";

const authMocks = vi.hoisted(() => ({
  isAuthenticated: vi.fn<() => boolean>(),
  ensureSession: vi.fn<() => Promise<boolean>>()
}));

vi.mock("../src/services/auth-client", () => ({
  isAuthenticated: authMocks.isAuthenticated,
  ensureSession: authMocks.ensureSession
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

    expect(router.currentRoute.value.name).toBe("dashboard");
  });

  test("deve redirecionar login para dashboard quando usuario ja autenticado", async () => {
    authMocks.isAuthenticated.mockReturnValue(true);
    authMocks.ensureSession.mockResolvedValue(true);

    const { createAppRouter } = await import("../src/router/index");
    const router = createAppRouter(createMemoryHistory());

    await router.push("/login");
    await router.isReady();

    expect(router.currentRoute.value.name).toBe("dashboard");
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
});
