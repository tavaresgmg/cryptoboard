<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login } from "@/services/auth-client";
import AuthLayout from "@/components/AuthLayout.vue";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const email = ref("");
const password = ref("");
const loading = ref(false);

async function submit() {
  loading.value = true;
  try {
    await login({ email: email.value, password: password.value });
    const raw = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    const redirect = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
    await router.push(redirect);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t("common.unexpectedError"));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <div class="space-y-2 text-center">
      <h1 class="text-2xl font-bold tracking-tight">{{ t("auth.loginTitle") }}</h1>
      <p class="text-sm text-muted-foreground">{{ t("auth.loginSubtitle") }}</p>
    </div>

    <form class="space-y-4" @submit.prevent="submit">
      <div class="space-y-2">
        <Label for="email">{{ t("common.email") }}</Label>
        <Input id="email" v-model="email" type="email" autocomplete="email" placeholder="you@example.com" required />
      </div>
      <div class="space-y-2">
        <Label for="password">{{ t("common.password") }}</Label>
        <Input id="password" v-model="password" type="password" autocomplete="current-password" required />
      </div>
      <Button type="submit" :disabled="loading" class="w-full">
        {{ loading ? t("common.loading") : t("auth.loginAction") }}
      </Button>
    </form>

    <div class="flex flex-col items-center gap-2 text-sm">
      <RouterLink class="text-primary font-medium hover:underline" to="/register">
        {{ t("auth.createAccount") }}
      </RouterLink>
      <RouterLink class="text-muted-foreground hover:underline" to="/forgot-password">
        {{ t("auth.forgotPassword") }}
      </RouterLink>
    </div>
  </AuthLayout>
</template>
