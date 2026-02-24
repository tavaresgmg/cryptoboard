import { readonly, ref } from "vue";
import type { UserProfile } from "@crypto/shared";
import { fetchMe, getCurrentUser, logout } from "@/services/auth-client";

const user = ref<UserProfile | null>(getCurrentUser());
const loading = ref(false);

export function useUser() {
  async function loadUser() {
    loading.value = true;
    try {
      user.value = await fetchMe();
    } catch {
    } finally {
      loading.value = false;
    }
  }

  function setUser(updated: UserProfile) {
    user.value = updated;
  }

  function updateFavorites(favorites: string[]) {
    if (user.value) {
      user.value = { ...user.value, favorites };
    }
  }

  async function signOut() {
    await logout();
    user.value = null;
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    loadUser,
    setUser,
    updateFavorites,
    signOut
  };
}
