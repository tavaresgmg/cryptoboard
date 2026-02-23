import { createMemoryHistory, createRouter, createWebHistory } from "vue-router";
import type { RouterHistory } from "vue-router";

import DashboardView from "../views/DashboardView.vue";
import ForgotPasswordView from "../views/ForgotPasswordView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import ResetPasswordView from "../views/ResetPasswordView.vue";
import { ensureSession, isAuthenticated } from "../services/auth-client";

export function createAppRouter(history?: RouterHistory) {
  const resolvedHistory = history ?? createWebHistory();

  const router = createRouter({
    history: resolvedHistory,
    routes: [
      {
        path: "/",
        name: "dashboard",
        component: DashboardView,
        meta: {
          requiresAuth: true
        }
      },
      {
        path: "/login",
        name: "login",
        component: LoginView
      },
      {
        path: "/register",
        name: "register",
        component: RegisterView
      },
      {
        path: "/forgot-password",
        name: "forgot-password",
        component: ForgotPasswordView
      },
      {
        path: "/reset-password",
        name: "reset-password",
        component: ResetPasswordView
      }
    ]
  });

  router.beforeEach(async (to) => {
    const requiresAuth = Boolean(to.meta.requiresAuth);

    if (requiresAuth) {
      const hasSession = isAuthenticated() || (await ensureSession());
      if (!hasSession) {
        return {
          name: "login",
          query: {
            redirect: to.fullPath
          }
        };
      }

      return true;
    }

    if (to.name === "login" || to.name === "register") {
      const hasSession = isAuthenticated() || (await ensureSession());
      if (hasSession) {
        return { name: "dashboard" };
      }
    }

    return true;
  });

  return router;
}

const router = createAppRouter(
  typeof window !== "undefined" ? createWebHistory() : createMemoryHistory()
);

export default router;
