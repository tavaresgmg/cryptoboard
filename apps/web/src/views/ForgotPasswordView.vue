<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getLocalizedAuthErrorMessage } from "@/lib/auth-errors";
import { forgotPassword } from "@/services/auth-client";
import AuthLayout from "@/components/AuthLayout.vue";

const { t } = useI18n();
const router = useRouter();

const email = ref("");
const loading = ref(false);

async function submit() {
  loading.value = true;
  try {
    await forgotPassword({ email: email.value });
    toast.success(t("auth.forgotRequestSent"));
    await router.push("/login");
  } catch (err) {
    toast.error(getLocalizedAuthErrorMessage(err, t, "auth.forgotRequestFailed"));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <div class="space-y-2 text-center">
      <h1 class="text-2xl font-bold tracking-tight">{{ t("auth.forgotTitle") }}</h1>
      <p class="text-sm text-muted-foreground">{{ t("auth.forgotSubtitle") }}</p>
    </div>

    <form class="space-y-4" @submit.prevent="submit">
      <div class="space-y-2">
        <Label for="email">{{ t("common.email") }}</Label>
        <Input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          required
        />
      </div>
      <Button type="submit" :disabled="loading" class="w-full">
        {{ loading ? t("common.loading") : t("auth.forgotAction") }}
      </Button>
    </form>

    <div class="text-center">
      <RouterLink class="text-sm text-muted-foreground hover:underline" to="/login">
        {{ t("common.backToLogin") }}
      </RouterLink>
    </div>
  </AuthLayout>
</template>
