<script setup lang="ts">
import { watchDebounced } from "@vueuse/core";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import type { CryptoDetail, CryptoListItem, ListCryptoSort } from "@crypto/shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import SearchInput from "@/components/SearchInput.vue";
import CryptoCard from "@/components/CryptoCard.vue";
import CryptoDetailDialog from "@/components/CryptoDetailDialog.vue";
import LoadingSkeleton from "@/components/LoadingSkeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useUser } from "@/composables/useUser";
import { addFavorite, getCryptoDetail, listCryptos, removeFavorite } from "@/services/auth-client";

const { t } = useI18n();
const { user, updateFavorites } = useUser();

const cryptos = ref<CryptoListItem[]>([]);
const selectedCrypto = ref<CryptoDetail | null>(null);
const dialogOpen = ref(false);
const loadingList = ref(false);
const loadingDetail = ref(false);
const page = ref(1);
const limit = ref(24);
const total = ref(0);
const search = ref("");
const ALL_TYPES_VALUE = "all";
const type = ref<typeof ALL_TYPES_VALUE | "coin" | "token">(ALL_TYPES_VALUE);
const sort = ref<ListCryptoSort>("price_desc");
const LIMIT_OPTIONS = [12, 24, 48] as const;
const selectedCurrency = computed(() => user.value?.preferredCurrency ?? "USD");
let abortController: AbortController | null = null;

async function loadCryptos() {
  abortController?.abort();
  abortController = new AbortController();
  const signal = abortController.signal;

  loadingList.value = true;
  try {
    const response = await listCryptos(
      {
        page: page.value,
        limit: limit.value,
        search: search.value || undefined,
        type: type.value === ALL_TYPES_VALUE ? undefined : type.value,
        sort: sort.value
      },
      signal
    );
    cryptos.value = response.data;
    total.value = response.pagination.total;
  } catch (err) {
    if (signal.aborted) return;
    toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
  } finally {
    if (!signal.aborted) loadingList.value = false;
  }
}

async function openDetail(coinId: string) {
  dialogOpen.value = true;
  loadingDetail.value = true;
  try {
    selectedCrypto.value = await getCryptoDetail(coinId);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
    dialogOpen.value = false;
  } finally {
    loadingDetail.value = false;
  }
}

function isFavorite(coinId: string): boolean {
  return user.value?.favorites.includes(coinId) ?? false;
}

async function toggleFavorite(coinId: string) {
  try {
    const payload = isFavorite(coinId) ? await removeFavorite(coinId) : await addFavorite(coinId);
    updateFavorites(payload.favorites);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
  }
}

function previousPage() {
  if (page.value > 1) {
    page.value -= 1;
  }
}

function nextPage() {
  if (page.value * limit.value < total.value) {
    page.value += 1;
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)));

watchDebounced(
  search,
  () => {
    page.value = 1;
    void loadCryptos();
  },
  { debounce: 300, maxWait: 1000 }
);

watch([type, sort, limit], () => {
  page.value = 1;
  void loadCryptos();
});

watch(page, () => {
  void loadCryptos();
});

onMounted(() => {
  void loadCryptos();
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t("crypto.title") }}</h1>

    <div class="flex flex-col lg:flex-row gap-3 mb-6">
      <SearchInput v-model="search" :placeholder="t('crypto.searchPlaceholder')" class="flex-1" />
      <Select v-model="type">
        <SelectTrigger class="w-full sm:w-[140px]">
          <SelectValue :placeholder="t('crypto.filterAll')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="ALL_TYPES_VALUE">{{ t("crypto.filterAll") }}</SelectItem>
          <SelectItem value="coin">{{ t("crypto.filterCoin") }}</SelectItem>
          <SelectItem value="token">{{ t("crypto.filterToken") }}</SelectItem>
        </SelectContent>
      </Select>
      <Select v-model="sort">
        <SelectTrigger class="w-full sm:w-[220px]">
          <SelectValue :placeholder="t('crypto.sortLabel')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="price_desc">{{ t("crypto.sortPriceDesc") }}</SelectItem>
          <SelectItem value="rank_asc">{{ t("crypto.sortRank") }}</SelectItem>
          <SelectItem value="price_asc">{{ t("crypto.sortPriceAsc") }}</SelectItem>
          <SelectItem value="change24_desc">{{ t("crypto.sortChangeDesc") }}</SelectItem>
          <SelectItem value="change24_asc">{{ t("crypto.sortChangeAsc") }}</SelectItem>
          <SelectItem value="name_asc">{{ t("crypto.sortNameAsc") }}</SelectItem>
          <SelectItem value="name_desc">{{ t("crypto.sortNameDesc") }}</SelectItem>
        </SelectContent>
      </Select>
      <Select :model-value="String(limit)" @update:model-value="(value) => (limit = Number(value))">
        <SelectTrigger class="w-full sm:w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in LIMIT_OPTIONS" :key="option" :value="String(option)">
            {{ option }} {{ t("crypto.perPage") }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <LoadingSkeleton v-if="loadingList" />

    <EmptyState
      v-else-if="cryptos.length === 0"
      :title="t('crypto.title')"
      :description="t('crypto.noResults')"
    />

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
    >
      <CryptoCard
        v-for="coin in cryptos"
        :key="coin.id"
        :crypto="coin"
        :is-favorite="isFavorite(coin.id)"
        :currency="selectedCurrency"
        @select="openDetail"
        @toggle-favorite="toggleFavorite"
      />
    </div>

    <div v-if="!loadingList && cryptos.length > 0" class="flex items-center justify-between mt-6">
      <Button variant="outline" :disabled="page <= 1" @click="previousPage">
        {{ t("pagination.previous") }}
      </Button>
      <span class="text-sm text-muted-foreground">
        {{ t("pagination.page") }} {{ page }} {{ t("pagination.of") }} {{ totalPages }} ·
        {{ t("pagination.total") }} {{ total }}
      </span>
      <Button variant="outline" :disabled="page * limit >= total" @click="nextPage">
        {{ t("pagination.next") }}
      </Button>
    </div>

    <CryptoDetailDialog
      :open="dialogOpen"
      :crypto="selectedCrypto"
      :loading="loadingDetail"
      :currency="selectedCurrency"
      @update:open="dialogOpen = $event"
    />
  </div>
</template>
