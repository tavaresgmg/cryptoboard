<script setup lang="ts">
import AppLogo from "@/components/AppLogo.vue";
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
    <div class="w-full max-w-sm space-y-6">
      <div class="flex justify-center">
        <AppLogo size="lg" />
      </div>
      <div class="rounded-xl border bg-card p-6 shadow-lg space-y-6">
        <slot />
      </div>
    </div>
  </div>
</template>
