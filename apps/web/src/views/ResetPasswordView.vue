<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getLocalizedAuthErrorMessage } from "@/lib/auth-errors";
import { resetPassword } from "@/services/auth-client";
import AuthLayout from "@/components/AuthLayout.vue";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const token = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const hasValidToken = computed(() => token.value.trim().length > 0);
const passwordsMatch = computed(() => password.value === confirmPassword.value);

const canSubmit = computed(
  () =>
    hasValidToken.value &&
    password.value.length >= 8 &&
    confirmPassword.value.length >= 8 &&
    passwordsMatch.value
);

onMounted(() => {
  const queryToken = typeof route.query.token === "string" ? route.query.token : "";
  token.value = queryToken;

  if (queryToken) {
    void router.replace({ name: "reset-password", query: {} });
  }
});

async function submit() {
  if (!hasValidToken.value) {
    toast.error(t("auth.resetTokenMissing"));
    return;
  }

  if (!passwordsMatch.value) {
    toast.error(t("auth.passwordsDoNotMatch"));
    return;
  }

  loading.value = true;
  try {
    await resetPassword({ token: token.value, password: password.value });
    toast.success(t("auth.resetSucceeded"));
    await router.push("/login");
  } catch (err) {
    toast.error(getLocalizedAuthErrorMessage(err, t, "auth.resetFailed"));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <div class="space-y-2 text-center">
      <h1 class="text-2xl font-bold tracking-tight">{{ t("auth.resetTitle") }}</h1>
      <p class="text-sm text-muted-foreground">{{ t("auth.resetSubtitle") }}</p>
    </div>

    <form class="space-y-4" @submit.prevent="submit">
      <div class="space-y-2">
        <Label for="password">{{ t("common.password") }}</Label>
        <Input
          id="password"
          v-model="password"
          type="password"
          minlength="8"
          autocomplete="new-password"
          required
        />
      </div>
      <div class="space-y-2">
        <Label for="confirmPassword">{{ t("common.confirmPassword") }}</Label>
        <Input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          minlength="8"
          autocomplete="new-password"
          required
        />
      </div>
      <p v-if="confirmPassword.length > 0 && !passwordsMatch" class="text-xs text-destructive">
        {{ t("auth.passwordsDoNotMatch") }}
      </p>
      <Button type="submit" :disabled="loading || !canSubmit" class="w-full">
        {{ loading ? t("common.loading") : t("auth.resetAction") }}
      </Button>
    </form>
  </AuthLayout>
</template>
