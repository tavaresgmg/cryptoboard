<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { ChevronsUpDown, Coins, Heart, LogOut, User } from "lucide-vue-next";
import AppLogo from "@/components/AppLogo.vue";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
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
  useSidebar
} from "@/components/ui/sidebar";
import { useUser } from "@/composables/useUser";
import { getMyAvatarSignedUrl } from "@/services/auth-client";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { user, signOut } = useUser();
const { isMobile, state } = useSidebar();
const avatarSrc = ref<string | undefined>(undefined);
const showBrandText = computed(() => isMobile.value || state.value !== "collapsed");

const navItems = [
  { to: "/", label: () => t("nav.cryptos"), icon: Coins, name: "cryptos" },
  { to: "/favorites", label: () => t("nav.favorites"), icon: Heart, name: "favorites" }
];

function isActive(name: string) {
  return route.name === name;
}

async function loadAvatar() {
  if (!user.value?.hasAvatar) {
    avatarSrc.value = undefined;
    return;
  }

  try {
    avatarSrc.value = (await getMyAvatarSignedUrl()) ?? undefined;
  } catch {
    avatarSrc.value = undefined;
  }
}

watch(
  user,
  () => {
    void loadAvatar();
  },
  { immediate: true }
);

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
          <SidebarMenuButton
            size="default"
            as-child
            :tooltip="t('nav.appName')"
            class="h-11 justify-start group-data-[collapsible=icon]:justify-center"
          >
            <RouterLink
              to="/"
              class="flex w-full items-center group-data-[collapsible=icon]:justify-center"
            >
              <AppLogo :size="showBrandText ? 'sm' : 'lg'" :icon-only="!showBrandText" />
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
                class="group-data-[collapsible=icon]:mx-auto"
              >
                <RouterLink
                  :to="item.to"
                  class="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
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
              <SidebarMenuButton
                size="lg"
                class="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
              >
                <Avatar class="size-9 rounded-lg">
                  <AvatarImage v-if="avatarSrc" :src="avatarSrc" :alt="user?.name ?? ''" />
                  <AvatarFallback class="rounded-lg text-xs font-semibold">
                    {{ initials() }}
                  </AvatarFallback>
                </Avatar>
                <div
                  class="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden"
                >
                  <span class="truncate font-semibold">{{ user?.name }}</span>
                  <span class="truncate text-xs text-muted-foreground">{{ user?.email }}</span>
                </div>
                <ChevronsUpDown class="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              :side="isMobile ? 'bottom' : state === 'collapsed' ? 'right' : 'top'"
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
              <DropdownMenuItem
                class="text-destructive focus:text-destructive"
                @click="handleLogout"
              >
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
