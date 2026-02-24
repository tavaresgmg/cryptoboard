<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { Coins, Heart } from "lucide-vue-next";
import AppLogo from "@/components/AppLogo.vue";
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
              <AppLogo size="md" />
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
