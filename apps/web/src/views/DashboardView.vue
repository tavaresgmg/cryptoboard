<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import type { CryptoDetail, CryptoListItem, HealthResponse, UserProfile } from "@crypto/shared";

import Button from "../components/ui/Button.vue";
import {
  addFavorite,
  fetchMe,
  getCryptoDetail,
  getCurrentUser,
  listCryptos,
  logout,
  removeFavorite,
  updateMyProfile,
  uploadAvatar
} from "../services/auth-client";

const router = useRouter();
const { t } = useI18n();

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
const profileMessage = ref<string | null>(null);
const avatarMessage = ref<string | null>(null);
const savingProfile = ref(false);
const uploadingAvatar = ref(false);
const profileName = ref("");
const profileDescription = ref("");
const profileCurrency = ref<"USD" | "EUR" | "BRL" | "GBP">("USD");
const avatarFile = ref<File | null>(null);

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

async function loadProfile() {
  loadingProfile.value = true;
  error.value = null;

  try {
    user.value = await fetchMe();
    profileName.value = user.value.name;
    profileDescription.value = user.value.description ?? "";
    profileCurrency.value = user.value.preferredCurrency;
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

async function saveProfile() {
  savingProfile.value = true;
  profileMessage.value = null;
  error.value = null;

  try {
    const updated = await updateMyProfile({
      name: profileName.value,
      description: profileDescription.value || undefined,
      preferredCurrency: profileCurrency.value
    });
    user.value = updated;
    profileMessage.value = "Perfil atualizado com sucesso";
  } catch (unknownError) {
    error.value = unknownError instanceof Error ? unknownError.message : "Erro inesperado";
  } finally {
    savingProfile.value = false;
  }
}

function onAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement;
  avatarFile.value = target.files?.[0] ?? null;
}

async function submitAvatar() {
  if (!avatarFile.value) {
    return;
  }

  uploadingAvatar.value = true;
  avatarMessage.value = null;
  error.value = null;

  try {
    const response = await uploadAvatar(avatarFile.value);
    avatarMessage.value = response.message;
    await loadProfile();
  } catch (unknownError) {
    error.value = unknownError instanceof Error ? unknownError.message : "Erro inesperado";
  } finally {
    uploadingAvatar.value = false;
  }
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
        <h1>{{ t("dashboard.title") }}</h1>
        <Button variant="secondary" type="button" @click="signOut">{{ t("dashboard.signOut") }}</Button>
      </div>
      <p>Área protegida por JWT. Sessão persistida via refresh token em cookie HttpOnly.</p>

      <div class="panel">
        <h2>Perfil</h2>
        <p v-if="loadingProfile">Carregando perfil...</p>
        <template v-else-if="user">
          <p><strong>Nome:</strong> {{ user.name }}</p>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>Moeda preferida:</strong> {{ user.preferredCurrency }}</p>
          <p><strong>Avatar:</strong> {{ user.hasAvatar ? "Configurado" : "Nao configurado" }}</p>
        </template>

        <form class="form" @submit.prevent="saveProfile">
          <label class="field">
            <span>Nome</span>
            <input v-model="profileName" type="text" minlength="2" required />
          </label>

          <label class="field">
            <span>Descricao</span>
            <input v-model="profileDescription" type="text" maxlength="500" />
          </label>

          <label class="field">
            <span>Moeda preferida</span>
            <select v-model="profileCurrency">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="BRL">BRL</option>
              <option value="GBP">GBP</option>
            </select>
          </label>

          <Button type="submit" :disabled="savingProfile">
            {{ savingProfile ? "Salvando..." : "Salvar perfil" }}
          </Button>
        </form>
        <p v-if="profileMessage">{{ profileMessage }}</p>

        <form class="form" @submit.prevent="submitAvatar">
          <label class="field">
            <span>Avatar</span>
            <input type="file" accept="image/*" @change="onAvatarChange" />
          </label>
          <Button variant="secondary" type="submit" :disabled="uploadingAvatar || !avatarFile">
            {{ uploadingAvatar ? "Enviando..." : "Enviar avatar" }}
          </Button>
        </form>
        <p v-if="avatarMessage">{{ avatarMessage }}</p>
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
          <Button type="submit">Filtrar</Button>
        </form>

        <p v-if="loadingCryptos">Carregando criptomoedas...</p>
        <ul v-else class="crypto-list">
          <li v-for="coin in cryptos" :key="coin.id" class="crypto-item">
            <button class="link-button" type="button" @click="openCryptoDetail(coin.id)">
              {{ coin.name }} ({{ coin.symbol }})
            </button>
            <span>{{ coin.price !== undefined ? `$ ${coin.price.toFixed(2)}` : "—" }}</span>
            <Button
              variant="secondary"
              type="button"
              @click="toggleFavorite(coin.id)"
            >
              {{ isFavorite(coin.id) ? "Desfavoritar" : "Favoritar" }}
            </Button>
          </li>
        </ul>

        <div class="pagination">
          <Button variant="secondary" type="button" @click="previousPage">Anterior</Button>
          <span>Página {{ page }} · Total {{ total }}</span>
          <Button variant="secondary" type="button" @click="nextPage">Próxima</Button>
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
