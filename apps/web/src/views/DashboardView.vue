<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import type { CryptoDetail, CryptoListItem, HealthResponse, UserProfile } from "@crypto/shared";

import {
  addFavorite,
  fetchMe,
  getCryptoDetail,
  getCurrentUser,
  listCryptos,
  logout,
  removeFavorite
} from "../services/auth-client";

const router = useRouter();

const user = ref<UserProfile | null>(getCurrentUser());
const health = ref<HealthResponse | null>(null);
const cryptos = ref<CryptoListItem[]>([]);
const selectedCrypto = ref<CryptoDetail | null>(null);
const loadingProfile = ref(false);
const loadingHealth = ref(false);
const loadingCryptos = ref(false);
const loadingDetail = ref(false);
const page = ref(1);
const limit = ref(8);
const total = ref(0);
const search = ref("");
const type = ref<"coin" | "token" | "">("");
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

async function loadCryptos() {
  loadingCryptos.value = true;
  error.value = null;

  try {
    const response = await listCryptos({
      page: page.value,
      limit: limit.value,
      search: search.value || undefined,
      type: type.value || undefined
    });

    cryptos.value = response.data;
    total.value = response.pagination.total;
  } catch (unknownError) {
    error.value = unknownError instanceof Error ? unknownError.message : "Erro inesperado";
  } finally {
    loadingCryptos.value = false;
  }
}

async function openCryptoDetail(coinId: string) {
  loadingDetail.value = true;
  error.value = null;

  try {
    selectedCrypto.value = await getCryptoDetail(coinId);
  } catch (unknownError) {
    error.value = unknownError instanceof Error ? unknownError.message : "Erro inesperado";
  } finally {
    loadingDetail.value = false;
  }
}

function isFavorite(coinId: string): boolean {
  return user.value?.favorites.includes(coinId) ?? false;
}

async function toggleFavorite(coinId: string) {
  error.value = null;

  try {
    if (isFavorite(coinId)) {
      const payload = await removeFavorite(coinId);
      if (user.value) {
        user.value = {
          ...user.value,
          favorites: payload.favorites
        };
      }
      return;
    }

    const payload = await addFavorite(coinId);
    if (user.value) {
      user.value = {
        ...user.value,
        favorites: payload.favorites
      };
    }
  } catch (unknownError) {
    error.value = unknownError instanceof Error ? unknownError.message : "Erro inesperado";
  }
}

async function previousPage() {
  if (page.value <= 1) {
    return;
  }

  page.value -= 1;
  await loadCryptos();
}

async function nextPage() {
  if (page.value * limit.value >= total.value) {
    return;
  }

  page.value += 1;
  await loadCryptos();
}

async function applyFilters() {
  page.value = 1;
  await loadCryptos();
}

async function signOut() {
  await logout();
  await router.push("/login");
}

onMounted(async () => {
  await Promise.all([loadProfile(), loadHealth(), loadCryptos()]);
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
        <h2>Criptomoedas</h2>
        <form class="filters" @submit.prevent="applyFilters">
          <input
            v-model="search"
            type="text"
            placeholder="Buscar por nome ou símbolo"
          />
          <select v-model="type">
            <option value="">Todos</option>
            <option value="coin">Coin</option>
            <option value="token">Token</option>
          </select>
          <button class="button" type="submit">Filtrar</button>
        </form>

        <p v-if="loadingCryptos">Carregando criptomoedas...</p>
        <ul v-else class="crypto-list">
          <li v-for="coin in cryptos" :key="coin.id" class="crypto-item">
            <button class="link-button" type="button" @click="openCryptoDetail(coin.id)">
              {{ coin.name }} ({{ coin.symbol }})
            </button>
            <span>{{ coin.price !== undefined ? `$ ${coin.price.toFixed(2)}` : "—" }}</span>
            <button
              class="button button-secondary"
              type="button"
              @click="toggleFavorite(coin.id)"
            >
              {{ isFavorite(coin.id) ? "Desfavoritar" : "Favoritar" }}
            </button>
          </li>
        </ul>

        <div class="pagination">
          <button class="button button-secondary" type="button" @click="previousPage">Anterior</button>
          <span>Página {{ page }} · Total {{ total }}</span>
          <button class="button button-secondary" type="button" @click="nextPage">Próxima</button>
        </div>
      </div>

      <div class="panel">
        <h2>Detalhe da Cripto</h2>
        <p v-if="loadingDetail">Carregando detalhes...</p>
        <template v-else-if="selectedCrypto">
          <p><strong>Nome:</strong> {{ selectedCrypto.name }} ({{ selectedCrypto.symbol }})</p>
          <p><strong>Tipo:</strong> {{ selectedCrypto.type }}</p>
          <p><strong>Preço:</strong> {{ selectedCrypto.price !== undefined ? `$ ${selectedCrypto.price.toFixed(2)}` : "—" }}</p>
          <p><strong>24h:</strong> {{ selectedCrypto.percentChange24h ?? "—" }}</p>
          <p><strong>Market Cap:</strong> {{ selectedCrypto.marketCap ?? "—" }}</p>
        </template>
        <p v-else>Selecione uma cripto para ver detalhes.</p>
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
