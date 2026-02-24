<script setup lang="ts">
import type { CryptoDetail, SupportedCurrency } from "@crypto/shared";
import { useI18n } from "vue-i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const props = withDefaults(
  defineProps<{
    open: boolean;
    crypto: CryptoDetail | null;
    loading: boolean;
    currency?: SupportedCurrency;
  }>(),
  {
    currency: "USD"
  }
);

defineEmits<{
  "update:open": [value: boolean];
}>();

const { t, locale } = useI18n();

function formatNumber(value: number | undefined, decimals = 2) {
  if (value === undefined) return "—";
  return value.toLocaleString(locale.value, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatCurrency(value: number | undefined, decimals = 2) {
  if (value === undefined) return "—";
  return new Intl.NumberFormat(locale.value, {
    style: "currency",
    currency: props.currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

function formatLargeCurrency(value: number | undefined) {
  if (value === undefined) return "—";
  if (value < 1_000_000) {
    return formatCurrency(value);
  }

  return new Intl.NumberFormat(locale.value, {
    style: "currency",
    currency: props.currency,
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function changeClass(value?: number) {
  if (value === undefined) return "text-muted-foreground";
  return value >= 0 ? "text-positive" : "text-destructive";
}

function formatChange(value?: number) {
  if (value === undefined) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-lg">
      <template v-if="loading">
        <DialogHeader>
          <DialogTitle>{{ t("common.loading") }}</DialogTitle>
        </DialogHeader>
      </template>
      <template v-else-if="crypto">
        <DialogHeader>
          <div class="flex items-center gap-3">
            <img
              v-if="crypto.logoUrl"
              :src="crypto.logoUrl"
              :alt="crypto.name"
              class="size-10 rounded-full"
            />
            <div>
              <DialogTitle class="flex items-center gap-2">
                {{ crypto.name }}
                <Badge variant="secondary" class="text-xs uppercase">{{ crypto.symbol }}</Badge>
              </DialogTitle>
              <DialogDescription v-if="crypto.rank !== null">
                {{ t("crypto.rank") }} #{{ crypto.rank }} · {{ crypto.type }}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div class="space-y-4 mt-4">
          <div class="flex items-baseline justify-between">
            <span class="text-2xl font-bold tabular-nums">{{ formatCurrency(crypto.price) }}</span>
            <span
              class="text-lg tabular-nums font-medium"
              :class="changeClass(crypto.percentChange24h)"
            >
              {{ formatChange(crypto.percentChange24h) }}
            </span>
          </div>

          <Separator />

          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p class="text-muted-foreground">{{ t("crypto.change1h") }}</p>
              <p class="font-medium tabular-nums" :class="changeClass(crypto.percentChange1h)">
                {{ formatChange(crypto.percentChange1h) }}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground">{{ t("crypto.change24h") }}</p>
              <p class="font-medium tabular-nums" :class="changeClass(crypto.percentChange24h)">
                {{ formatChange(crypto.percentChange24h) }}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground">{{ t("crypto.change7d") }}</p>
              <p class="font-medium tabular-nums" :class="changeClass(crypto.percentChange7d)">
                {{ formatChange(crypto.percentChange7d) }}
              </p>
            </div>
          </div>

          <Separator />

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-muted-foreground">{{ t("crypto.marketCap") }}</p>
              <p class="font-medium tabular-nums">{{ formatLargeCurrency(crypto.marketCap) }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">{{ t("crypto.volume") }}</p>
              <p class="font-medium tabular-nums">{{ formatLargeCurrency(crypto.volume24h) }}</p>
            </div>
            <div>
              <p class="text-muted-foreground">{{ t("crypto.supply") }}</p>
              <p class="font-medium tabular-nums">
                {{ formatNumber(crypto.circulatingSupply, 0) }}
              </p>
            </div>
            <div v-if="crypto.maxSupply">
              <p class="text-muted-foreground">{{ t("crypto.maxSupply") }}</p>
              <p class="font-medium tabular-nums">{{ formatNumber(crypto.maxSupply, 0) }}</p>
            </div>
          </div>

          <p v-if="crypto.description" class="text-sm text-muted-foreground leading-relaxed">
            {{ crypto.description }}
          </p>
        </div>
      </template>
    </DialogContent>
  </Dialog>
</template>
