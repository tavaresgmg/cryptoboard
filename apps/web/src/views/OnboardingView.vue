<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@crypto/shared";
import { toast } from "vue-sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/composables/useUser";
import { getMyAvatarSignedUrl, updateMyProfile, uploadAvatar } from "@/services/auth-client";

const router = useRouter();
const { t } = useI18n();
const { user, setUser, loadUser } = useUser();

const preferredCurrency = ref<SupportedCurrency>("USD");
const description = ref("");
const avatarFile = ref<File | null>(null);
const avatarInputRef = ref<HTMLInputElement | null>(null);
const avatarSrc = ref<string | undefined>(undefined);
const avatarPreviewSrc = ref<string | undefined>(undefined);
const saving = ref(false);

const displayedAvatarSrc = computed(() => avatarPreviewSrc.value ?? avatarSrc.value);
const selectedAvatarFileLabel = computed(
  () => avatarFile.value?.name ?? t("onboarding.noFileChosen")
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

function clearAvatarPreview() {
  if (avatarPreviewSrc.value) {
    URL.revokeObjectURL(avatarPreviewSrc.value);
    avatarPreviewSrc.value = undefined;
  }
}

function onAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement;
  avatarFile.value = target.files?.[0] ?? null;

  clearAvatarPreview();
  if (avatarFile.value) {
    avatarPreviewSrc.value = URL.createObjectURL(avatarFile.value);
  }
}

function openAvatarFilePicker() {
  avatarInputRef.value?.click();
}

function clearAvatarFileInput() {
  if (avatarInputRef.value) {
    avatarInputRef.value.value = "";
  }
}

async function loadAvatar() {
  try {
    avatarSrc.value = (await getMyAvatarSignedUrl()) ?? undefined;

    if (avatarSrc.value && user.value && !user.value.hasAvatar) {
      setUser({
        ...user.value,
        favorites: [...user.value.favorites],
        hasAvatar: true
      });
    }
  } catch {
    avatarSrc.value = undefined;
  }
}

async function syncInitialState() {
  if (!user.value) {
    try {
      await loadUser();
    } catch {}
  }

  if (user.value) {
    preferredCurrency.value = user.value.preferredCurrency;
    description.value = user.value.description ?? "";
  }

  await loadAvatar();
}

async function saveAndContinue() {
  saving.value = true;

  try {
    const updatedUser = await updateMyProfile({
      preferredCurrency: preferredCurrency.value,
      description: description.value.trim() || undefined
    });

    setUser(updatedUser);

    if (avatarFile.value) {
      await uploadAvatar(avatarFile.value);
      await loadAvatar();
      avatarFile.value = null;
      clearAvatarFileInput();
      clearAvatarPreview();
    }

    try {
      await loadUser();
    } catch {}

    toast.success(t("onboarding.completed"));
    await router.push({ name: "cryptos" });
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
  } finally {
    saving.value = false;
  }
}

async function skipForNow() {
  await router.push({ name: "cryptos" });
}

onMounted(() => {
  void syncInitialState();
});

onBeforeUnmount(() => {
  clearAvatarPreview();
});
</script>

<template>
  <div class="mx-auto w-full max-w-2xl space-y-6">
    <div class="space-y-2">
      <h1 class="text-2xl font-bold">{{ t("onboarding.title") }}</h1>
      <p class="text-sm text-muted-foreground">{{ t("onboarding.subtitle") }}</p>
    </div>

    <Card>
      <CardContent>
        <form class="space-y-6" @submit.prevent="saveAndContinue">
          <div class="space-y-3">
            <Label>{{ t("onboarding.avatarLabel") }}</Label>
            <div class="flex items-center gap-4">
              <Avatar class="size-20">
                <AvatarImage
                  v-if="displayedAvatarSrc"
                  :src="displayedAvatarSrc"
                  :alt="user?.name ?? ''"
                />
                <AvatarFallback class="text-xl">
                  {{ initials() }}
                </AvatarFallback>
              </Avatar>

              <div class="grid flex-1 gap-2">
                <input
                  ref="avatarInputRef"
                  class="sr-only"
                  type="file"
                  accept="image/*"
                  @change="onAvatarChange"
                />
                <div class="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" @click="openAvatarFilePicker">
                    {{ t("onboarding.chooseAvatarFile") }}
                  </Button>
                  <p class="min-w-0 flex-1 text-xs text-muted-foreground truncate">
                    {{ selectedAvatarFileLabel }}
                  </p>
                </div>
                <p class="text-xs text-muted-foreground">{{ t("onboarding.avatarHint") }}</p>
              </div>
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="onboardingCurrency">{{ t("onboarding.currencyLabel") }}</Label>
            <Select v-model="preferredCurrency">
              <SelectTrigger id="onboardingCurrency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="currency in SUPPORTED_CURRENCIES"
                  :key="currency"
                  :value="currency"
                >
                  {{ currency }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2">
            <Label for="onboardingDescription">{{ t("onboarding.descriptionLabel") }}</Label>
            <Textarea
              id="onboardingDescription"
              v-model="description"
              :placeholder="t('onboarding.descriptionPlaceholder')"
              maxlength="500"
              rows="4"
            />
          </div>

          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" @click="skipForNow">
              {{ t("onboarding.skip") }}
            </Button>
            <Button type="submit" :disabled="saving">
              {{ saving ? t("onboarding.saving") : t("onboarding.submit") }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
