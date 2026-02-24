<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import type { CryptoDetail, CryptoListItem } from "@crypto/shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchInput from "@/components/SearchInput.vue";
import CryptoCard from "@/components/CryptoCard.vue";
import CryptoDetailDialog from "@/components/CryptoDetailDialog.vue";
import LoadingSkeleton from "@/components/LoadingSkeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useUser } from "@/composables/useUser";
import {
  addFavorite,
  getCryptoDetail,
  listCryptos,
  removeFavorite,
} from "@/services/auth-client";

const { t } = useI18n();
const { user, updateFavorites } = useUser();

const cryptos = ref<CryptoListItem[]>([]);
const selectedCrypto = ref<CryptoDetail | null>(null);
const dialogOpen = ref(false);
const loadingList = ref(false);
const loadingDetail = ref(false);
const page = ref(1);
const limit = ref(12);
const total = ref(0);
const search = ref("");
const type = ref("");

async function loadCryptos() {
  loadingList.value = true;
  try {
    const response = await listCryptos({
      page: page.value,
      limit: limit.value,
      search: search.value || undefined,
      type: (type.value as "coin" | "token") || undefined,
    });
    cryptos.value = response.data;
    total.value = response.pagination.total;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
  } finally {
    loadingList.value = false;
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
    const payload = isFavorite(coinId)
      ? await removeFavorite(coinId)
      : await addFavorite(coinId);
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

watch(search, () => {
  page.value = 1;
  loadCryptos();
});

watch(type, () => {
  page.value = 1;
  loadCryptos();
});

watch(page, () => {
  loadCryptos();
});

onMounted(() => {
  loadCryptos();
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t("crypto.title") }}</h1>

    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <SearchInput
        v-model="search"
        :placeholder="t('crypto.searchPlaceholder')"
        class="flex-1"
      />
      <Select :model-value="type" @update:model-value="(v) => (type = String(v ?? ''))">
        <SelectTrigger class="w-full sm:w-[140px]">
          <SelectValue :placeholder="t('crypto.filterAll')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{{ t("crypto.filterAll") }}</SelectItem>
          <SelectItem value="coin">{{ t("crypto.filterCoin") }}</SelectItem>
          <SelectItem value="token">{{ t("crypto.filterToken") }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <LoadingSkeleton v-if="loadingList" />

    <EmptyState
      v-else-if="cryptos.length === 0"
      :title="t('crypto.title')"
      :description="t('crypto.noResults')"
    />

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <CryptoCard
        v-for="coin in cryptos"
        :key="coin.id"
        :crypto="coin"
        :is-favorite="isFavorite(coin.id)"
        @select="openDetail"
        @toggle-favorite="toggleFavorite"
      />
    </div>

    <div v-if="!loadingList && cryptos.length > 0" class="flex items-center justify-between mt-6">
      <Button variant="outline" :disabled="page <= 1" @click="previousPage">
        {{ t("pagination.previous") }}
      </Button>
      <span class="text-sm text-muted-foreground">
        {{ t("pagination.page") }} {{ page }} {{ t("pagination.of") }} {{ totalPages }}
        · {{ t("pagination.total") }} {{ total }}
      </span>
      <Button variant="outline" :disabled="page * limit >= total" @click="nextPage">
        {{ t("pagination.next") }}
      </Button>
    </div>

    <CryptoDetailDialog
      :open="dialogOpen"
      :crypto="selectedCrypto"
      :loading="loadingDetail"
      @update:open="dialogOpen = $event"
    />
  </div>
</template>
