import { createMemoryHistory, createRouter, createWebHistory } from "vue-router";
import type { RouterHistory } from "vue-router";

import AppLayout from "@/components/AppLayout.vue";
import { ensureSession, isAuthenticated } from "@/services/auth-client";

export function createAppRouter(history?: RouterHistory) {
  const resolvedHistory = history ?? createWebHistory();

  const router = createRouter({
    history: resolvedHistory,
    routes: [
      {
        path: "/",
        component: AppLayout,
        meta: { requiresAuth: true },
        children: [
          {
            path: "",
            name: "cryptos",
            component: () => import("@/views/CryptoListView.vue"),
          },
          {
            path: "favorites",
            name: "favorites",
            component: () => import("@/views/FavoritesView.vue"),
          },
          {
            path: "profile",
            name: "profile",
            component: () => import("@/views/ProfileView.vue"),
          },
        ],
      },
      {
        path: "/login",
        name: "login",
        component: () => import("@/views/LoginView.vue"),
      },
      {
        path: "/register",
        name: "register",
        component: () => import("@/views/RegisterView.vue"),
      },
      {
        path: "/forgot-password",
        name: "forgot-password",
        component: () => import("@/views/ForgotPasswordView.vue"),
      },
      {
        path: "/reset-password",
        name: "reset-password",
        component: () => import("@/views/ResetPasswordView.vue"),
      },
      {
        path: "/:pathMatch(.*)*",
        name: "not-found",
        component: () => import("@/views/NotFoundView.vue"),
      },
    ],
  });

  router.beforeEach(async (to) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

    if (requiresAuth) {
      const hasSession = isAuthenticated() || (await ensureSession());
      if (!hasSession) {
        return {
          name: "login",
          query: { redirect: to.fullPath },
        };
      }
      return true;
    }

    if (to.name === "login" || to.name === "register") {
      const hasSession = isAuthenticated() || (await ensureSession());
      if (hasSession) {
        return { name: "cryptos" };
      }
    }

    return true;
  });

  return router;
}

const router = createAppRouter(
  typeof window !== "undefined" ? createWebHistory() : createMemoryHistory(),
);

export default router;
