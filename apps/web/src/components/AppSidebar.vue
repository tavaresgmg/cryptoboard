<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { ChevronsUpDown, Coins, Heart, LogOut, User } from "lucide-vue-next";
import AppLogo from "@/components/AppLogo.vue";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useUser } from "@/composables/useUser";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { user, signOut } = useUser();

const navItems = [
  { to: "/", label: () => t("nav.cryptos"), icon: Coins, name: "cryptos" },
  { to: "/favorites", label: () => t("nav.favorites"), icon: Heart, name: "favorites" },
  { to: "/profile", label: () => t("nav.profile"), icon: User, name: "profile" },
];

function isActive(name: string) {
  return route.name === name;
}

function initials() {
  const name = user.value?.name;
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

async function handleLogout() {
  await signOut();
  await router.push("/login");
}
</script>

<template>
  <Sidebar collapsible="icon" variant="sidebar">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child :tooltip="t('nav.appName')">
            <RouterLink to="/">
              <AppLogo size="sm" />
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
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

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton size="lg" :tooltip="user?.name ?? ''">
                <Avatar class="size-8 rounded-lg">
                  <AvatarFallback class="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                    {{ initials() }}
                  </AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ user?.name }}</span>
                  <span class="truncate text-xs text-muted-foreground">{{ user?.email }}</span>
                </div>
                <ChevronsUpDown class="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side="bottom"
              align="end"
              :side-offset="4"
            >
              <DropdownMenuLabel class="font-normal">
                <div class="flex flex-col gap-0.5">
                  <p class="text-sm font-medium leading-none">{{ user?.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ user?.email }}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="router.push('/profile')">
                <User class="mr-2 size-4" />
                {{ t("nav.profile") }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleLogout">
                <LogOut class="mr-2 size-4" />
                {{ t("nav.logout") }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
