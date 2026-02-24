<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/composables/useUser";
import {
  getMyAvatarSignedUrl,
  updateMyProfile,
  uploadAvatar
} from "@/services/auth-client";

const { t } = useI18n();
const { user, setUser, loadUser } = useUser();

const profileName = ref("");
const profileDescription = ref("");
const profileCurrency = ref<string>("USD");
const avatarFile = ref<File | null>(null);
const avatarSrc = ref<string | undefined>(undefined);
const savingProfile = ref(false);
const uploadingAvatar = ref(false);

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

function initials() {
  return user.value?.name?.charAt(0).toUpperCase() ?? "?";
}

function syncForm() {
  if (user.value) {
    profileName.value = user.value.name;
    profileDescription.value = user.value.description ?? "";
    profileCurrency.value = user.value.preferredCurrency;
  }
}

async function saveProfile() {
  savingProfile.value = true;
  try {
    const updated = await updateMyProfile({
      name: profileName.value,
      description: profileDescription.value || undefined,
      preferredCurrency: profileCurrency.value as "USD" | "EUR" | "BRL" | "GBP",
    });
    setUser(updated);
    toast.success(t("profile.profileUpdated"));
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
  } finally {
    savingProfile.value = false;
  }
}

function onAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement;
  avatarFile.value = target.files?.[0] ?? null;
}

async function submitAvatar() {
  if (!avatarFile.value) return;
  uploadingAvatar.value = true;
  try {
    await uploadAvatar(avatarFile.value);
    toast.success(t("profile.avatarUpdated"));
    await loadUser();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
  } finally {
    uploadingAvatar.value = false;
  }
}

watch(user, (u) => {
  if (u) {
    syncForm();
  }

  void loadAvatar();
}, { immediate: true });
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <h1 class="text-2xl font-bold">{{ t("profile.title") }}</h1>

    <Card>
      <CardHeader>
        <CardTitle>{{ t("profile.avatar") }}</CardTitle>
      </CardHeader>
      <CardContent class="flex items-center gap-6">
        <Avatar class="size-20">
          <AvatarImage v-if="avatarSrc" :src="avatarSrc" :alt="user?.name ?? ''" />
          <AvatarFallback class="bg-primary text-primary-foreground text-2xl">
            {{ initials() }}
          </AvatarFallback>
        </Avatar>
        <form class="flex items-center gap-3" @submit.prevent="submitAvatar">
          <Input type="file" accept="image/*" @change="onAvatarChange" />
          <Button type="submit" variant="secondary" :disabled="uploadingAvatar || !avatarFile">
            {{ uploadingAvatar ? t("profile.uploading") : t("profile.uploadAvatar") }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>{{ t("profile.title") }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="saveProfile">
          <div class="grid gap-2">
            <Label for="profileName">{{ t("profile.name") }}</Label>
            <Input id="profileName" v-model="profileName" type="text" minlength="2" required />
          </div>
          <div class="grid gap-2">
            <Label for="profileEmail">{{ t("profile.email") }}</Label>
            <Input id="profileEmail" :model-value="user?.email ?? ''" type="email" disabled />
          </div>
          <div class="grid gap-2">
            <Label for="profileDescription">{{ t("profile.description") }}</Label>
            <Textarea
              id="profileDescription"
              v-model="profileDescription"
              maxlength="500"
              rows="3"
            />
          </div>
          <div class="grid gap-2">
            <Label>{{ t("profile.preferredCurrency") }}</Label>
            <Select v-model="profileCurrency">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="BRL">BRL</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" :disabled="savingProfile" class="w-full sm:w-auto">
            {{ savingProfile ? t("profile.saving") : t("profile.saveProfile") }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
