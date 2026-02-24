<script setup lang="ts">
import type { CryptoListItem } from "@crypto/shared";
import { useI18n } from "vue-i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FavoriteButton from "@/components/FavoriteButton.vue";

defineProps<{
  crypto: CryptoListItem;
  isFavorite: boolean;
}>();

const emit = defineEmits<{
  select: [id: string];
  toggleFavorite: [id: string];
}>();

const { t } = useI18n();

function formatPrice(price?: number) {
  if (price === undefined) return "—";
  return `$ ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatChange(value?: number) {
  if (value === undefined) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function changeClass(value?: number) {
  if (value === undefined) return "text-muted-foreground";
  return value >= 0 ? "text-positive" : "text-destructive";
}
</script>

<template>
  <Card
    class="cursor-pointer transition-colors hover:border-primary/50"
    @click="emit('select', crypto.id)"
  >
    <CardContent class="flex items-start justify-between gap-3 p-4">
      <div class="flex items-center gap-3 min-w-0">
        <img
          v-if="crypto.logoUrl"
          :src="crypto.logoUrl"
          :alt="crypto.name"
          class="size-10 rounded-full"
        />
        <div
          v-else
          class="size-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground"
        >
          {{ crypto.symbol.slice(0, 2) }}
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-semibold truncate">{{ crypto.name }}</span>
            <Badge variant="secondary" class="text-xs uppercase">{{ crypto.symbol }}</Badge>
          </div>
          <div class="flex items-center gap-2 mt-1 text-sm">
            <span v-if="crypto.rank !== null" class="text-muted-foreground">
              #{{ crypto.rank }}
            </span>
            <span class="tabular-nums font-medium">{{ formatPrice(crypto.price) }}</span>
          </div>
        </div>
      </div>
      <div class="flex flex-col items-end gap-1 shrink-0">
        <FavoriteButton :active="isFavorite" @toggle="emit('toggleFavorite', crypto.id)" />
        <span
          class="text-sm tabular-nums font-medium"
          :class="changeClass(crypto.percentChange24h)"
        >
          {{ formatChange(crypto.percentChange24h) }}
        </span>
      </div>
    </CardContent>
  </Card>
</template>
