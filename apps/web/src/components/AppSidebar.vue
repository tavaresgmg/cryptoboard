<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { Coins, Heart } from "lucide-vue-next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const { t } = useI18n();
const route = useRoute();

const navItems = [
  { to: "/", label: () => t("nav.cryptos"), icon: Coins, name: "cryptos" },
  { to: "/favorites", label: () => t("nav.favorites"), icon: Heart, name: "favorites" },
];

function isActive(name: string) {
  return route.name === name;
}
</script>

<template>
  <Sidebar collapsible="icon" variant="sidebar">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child :tooltip="t('nav.appName')">
            <RouterLink to="/">
              <div class="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground shrink-0">
                <Coins class="size-4" />
              </div>
              <div class="flex flex-col gap-0.5 leading-none">
                <span class="font-bold text-base">Crypto</span>
                <span class="text-xs text-muted-foreground">Dashboard</span>
              </div>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in navItems" :key="item.name">
              <SidebarMenuButton
                as-child
                :is-active="isActive(item.name)"
                :tooltip="item.label()"
              >
                <RouterLink :to="item.to">
                  <component :is="item.icon" class="shrink-0" />
                  <span>{{ item.label() }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarRail />
  </Sidebar>
</template>
