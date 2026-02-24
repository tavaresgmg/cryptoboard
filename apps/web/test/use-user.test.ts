import { beforeEach, describe, expect, test, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  fetchMe: vi.fn<() => Promise<unknown>>(),
  getCurrentUser: vi.fn<() => unknown>(),
  logout: vi.fn<() => Promise<void>>()
}));

vi.mock("../src/services/auth-client", () => ({
  fetchMe: authMocks.fetchMe,
  getCurrentUser: authMocks.getCurrentUser,
  logout: authMocks.logout
}));

describe("useUser", () => {
  beforeEach(() => {
    vi.resetModules();
    authMocks.fetchMe.mockReset();
    authMocks.getCurrentUser.mockReset();
    authMocks.logout.mockReset();
    authMocks.getCurrentUser.mockReturnValue(null);
    authMocks.logout.mockResolvedValue(undefined);
  });

  test("loadUser should update user and reset loading state", async () => {
    const userPayload = {
      id: "u-1",
      name: "User One",
      email: "user@example.com",
      description: "Test",
      hasAvatar: false,
      preferredCurrency: "USD",
      favorites: [],
      createdAt: "2026-02-24T00:00:00.000Z",
      updatedAt: "2026-02-24T00:00:00.000Z"
    };

    authMocks.fetchMe.mockResolvedValue(userPayload);

    const { useUser } = await import("../src/composables/useUser");
    const state = useUser();

    const loadPromise = state.loadUser();
    expect(state.loading.value).toBe(true);

    await loadPromise;

    expect(state.loading.value).toBe(false);
    expect(state.user.value).toEqual(userPayload);
  });

  test("loadUser should keep state consistent when fetch fails", async () => {
    authMocks.fetchMe.mockRejectedValue(new Error("network"));

    const { useUser } = await import("../src/composables/useUser");
    const state = useUser();

    await state.loadUser();

    expect(state.loading.value).toBe(false);
    expect(state.user.value).toBeNull();
  });

  test("updateFavorites should replace favorites when user exists", async () => {
    const userPayload = {
      id: "u-2",
      name: "User Two",
      email: "user2@example.com",
      description: undefined,
      hasAvatar: false,
      preferredCurrency: "BRL",
      favorites: ["btc-bitcoin"],
      createdAt: "2026-02-24T00:00:00.000Z",
      updatedAt: "2026-02-24T00:00:00.000Z"
    };

    const { useUser } = await import("../src/composables/useUser");
    const state = useUser();

    state.setUser(userPayload);
    state.updateFavorites(["eth-ethereum", "btc-bitcoin"]);

    expect(state.user.value?.favorites).toEqual(["eth-ethereum", "btc-bitcoin"]);
  });

  test("signOut should call logout and clear user", async () => {
    const userPayload = {
      id: "u-3",
      name: "User Three",
      email: "user3@example.com",
      description: undefined,
      hasAvatar: true,
      preferredCurrency: "EUR",
      favorites: [],
      createdAt: "2026-02-24T00:00:00.000Z",
      updatedAt: "2026-02-24T00:00:00.000Z"
    };

    const { useUser } = await import("../src/composables/useUser");
    const state = useUser();

    state.setUser(userPayload);
    await state.signOut();

    expect(authMocks.logout).toHaveBeenCalledTimes(1);
    expect(state.user.value).toBeNull();
  });

  test("updateFavorites should not throw when user is null", async () => {
    const { useUser } = await import("../src/composables/useUser");
    const state = useUser();

    state.updateFavorites(["btc-bitcoin"]);

    expect(state.user.value).toBeNull();
  });
});
