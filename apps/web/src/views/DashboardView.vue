<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import type { HealthResponse, UserProfile } from "@crypto/shared";

import { fetchMe, getCurrentUser, logout } from "../services/auth-client";

const router = useRouter();

const user = ref<UserProfile | null>(getCurrentUser());
const health = ref<HealthResponse | null>(null);
const loadingProfile = ref(false);
const loadingHealth = ref(false);
const error = ref<string | null>(null);

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function loadProfile() {
  loadingProfile.value = true;
  error.value = null;

  try {
    user.value = await fetchMe();
  } catch (unknownError) {
    error.value = unknownError instanceof Error ? unknownError.message : "Erro inesperado";
  } finally {
    loadingProfile.value = false;
  }
}

async function loadHealth() {
  loadingHealth.value = true;
  error.value = null;

  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
      throw new Error(`Falha no health check (HTTP ${response.status})`);
    }

    health.value = (await response.json()) as HealthResponse;
  } catch (unknownError) {
    error.value = unknownError instanceof Error ? unknownError.message : "Erro inesperado";
  } finally {
    loadingHealth.value = false;
  }
}

async function signOut() {
  await logout();
  await router.push("/login");
}

onMounted(async () => {
  await Promise.all([loadProfile(), loadHealth()]);
});
</script>

<template>
  <main class="container">
    <section class="card">
      <div class="header-row">
        <h1>Dashboard</h1>
        <button class="button button-secondary" type="button" @click="signOut">Sair</button>
      </div>
      <p>Área protegida por JWT. Sessão persistida via refresh token em cookie HttpOnly.</p>

      <div class="panel">
        <h2>Perfil</h2>
        <p v-if="loadingProfile">Carregando perfil...</p>
        <template v-else-if="user">
          <p><strong>Nome:</strong> {{ user.name }}</p>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>Moeda preferida:</strong> {{ user.preferredCurrency }}</p>
        </template>
      </div>

      <div class="panel">
        <h2>API</h2>
        <p v-if="loadingHealth">Consultando /health...</p>
        <template v-else-if="health">
          <p><strong>Status:</strong> {{ health.status }}</p>
          <p><strong>Timestamp:</strong> {{ health.timestamp }}</p>
        </template>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </section>
  </main>
</template>
