<script setup lang="ts">
import { Star } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { Button } from "@/components/ui/button";

const { t } = useI18n();

defineProps<{
  active: boolean;
}>();

defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <Button
    variant="ghost"
    size="icon-sm"
    :aria-label="active ? t('favorites.removeFromFavorites') : t('favorites.addToFavorites')"
    @click.stop="$emit('toggle')"
  >
    <Star
      class="size-4"
      :class="active ? 'fill-primary text-primary' : 'text-muted-foreground'"
    />
  </Button>
</template>
