<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import type { CryptoDetail, CryptoListItem } from "@crypto/shared";
import { Star } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import CryptoCard from "@/components/CryptoCard.vue";
import CryptoDetailDialog from "@/components/CryptoDetailDialog.vue";
import LoadingSkeleton from "@/components/LoadingSkeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useUser } from "@/composables/useUser";
import {
  getCryptoDetail,
  listFavorites,
  removeFavorite,
} from "@/services/auth-client";

const { t } = useI18n();
const { updateFavorites } = useUser();

const favorites = ref<CryptoListItem[]>([]);
const selectedCrypto = ref<CryptoDetail | null>(null);
const dialogOpen = ref(false);
const loading = ref(false);
const loadingDetail = ref(false);

async function load() {
  loading.value = true;
  try {
    const response = await listFavorites();
    favorites.value = response.data;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
  } finally {
    loading.value = false;
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

async function handleRemove(coinId: string) {
  try {
    const payload = await removeFavorite(coinId);
    updateFavorites(payload.favorites);
    favorites.value = favorites.value.filter((f) => f.id !== coinId);
    toast.success(t("favorites.removed"));
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
  }
}

onMounted(() => {
  load();
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ t("favorites.title") }}</h1>

    <LoadingSkeleton v-if="loading" />

    <EmptyState
      v-else-if="favorites.length === 0"
      :icon="Star"
      :title="t('favorites.emptyTitle')"
      :description="t('favorites.emptyDescription')"
    >
      <Button as-child>
        <RouterLink to="/">{{ t("favorites.goToCryptos") }}</RouterLink>
      </Button>
    </EmptyState>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <CryptoCard
        v-for="coin in favorites"
        :key="coin.id"
        :crypto="coin"
        :is-favorite="true"
        @select="openDetail"
        @toggle-favorite="handleRemove"
      />
    </div>

    <CryptoDetailDialog
      :open="dialogOpen"
      :crypto="selectedCrypto"
      :loading="loadingDetail"
      @update:open="dialogOpen = $event"
    />
  </div>
</template>
