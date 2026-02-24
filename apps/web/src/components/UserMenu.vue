<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { LogOut, User } from "lucide-vue-next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/composables/useUser";
import { API_URL } from "@/services/auth-client";

const router = useRouter();
const { t } = useI18n();
const { user, signOut } = useUser();

const avatarSrc = computed(() => {
  if (!user.value?.hasAvatar) return undefined;
  return `${API_URL}/users/me/avatar?t=${user.value.updatedAt ?? ""}`;
});

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
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button class="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <Avatar class="size-9 cursor-pointer border border-border hover:border-muted-foreground/50 transition-colors">
          <AvatarImage v-if="avatarSrc" :src="avatarSrc" :alt="user?.name ?? ''" />
          <AvatarFallback class="bg-muted text-foreground font-semibold text-sm">
            {{ initials() }}
          </AvatarFallback>
        </Avatar>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-52">
      <DropdownMenuLabel v-if="user" class="font-normal">
        <div class="flex flex-col gap-0.5">
          <p class="text-sm font-medium leading-none">{{ user.name }}</p>
          <p class="text-xs text-muted-foreground">{{ user.email }}</p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator v-if="user" />
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
</template>
