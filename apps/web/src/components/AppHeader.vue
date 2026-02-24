<script setup lang="ts">
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import ThemeToggle from "@/components/ThemeToggle.vue";
import LocaleSelector from "@/components/LocaleSelector.vue";
</script>

<template>
  <header class="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
    <div class="flex items-center gap-2 px-4">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-2 !h-4" />
    </div>
    <div class="flex-1" />
    <div class="flex items-center gap-2 px-4">
      <ThemeToggle />
      <LocaleSelector />
    </div>
  </header>
</template>
