import { createRouter, createWebHistory } from "vue-router";

import DashboardView from "../views/DashboardView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import { ensureSession, isAuthenticated } from "../services/auth-client";

const router = createRouter({
  history: createWebHistory(),
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

export default router;
