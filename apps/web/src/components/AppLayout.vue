<script setup lang="ts">
import { onMounted } from "vue";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar.vue";
import AppHeader from "@/components/AppHeader.vue";
import { useUser } from "@/composables/useUser";

const { loadUser } = useUser();

onMounted(() => {
  loadUser();
});
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />
      <div class="flex flex-1 flex-col gap-4 p-4 pt-2 md:p-6 md:pt-4">
        <RouterView />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
