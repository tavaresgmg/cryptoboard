<script setup lang="ts">
import type { Component } from "vue";

defineProps<{
  icon?: Component;
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <component :is="icon" v-if="icon" class="size-12 text-muted-foreground mb-4" />
    <h3 class="text-lg font-semibold">{{ title }}</h3>
    <p v-if="description" class="text-sm text-muted-foreground mt-1 max-w-sm">
      {{ description }}
    </p>
    <div class="mt-4">
      <slot />
    </div>
  </div>
</template>
