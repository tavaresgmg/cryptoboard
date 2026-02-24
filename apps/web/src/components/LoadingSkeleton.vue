<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";

defineProps<{
  count?: number;
}>();
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <Skeleton
      v-for="i in (count ?? 8)"
      :key="i"
      class="h-[100px] rounded-lg"
    />
  </div>
</template>
