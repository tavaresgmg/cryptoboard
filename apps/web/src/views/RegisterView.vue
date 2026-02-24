<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { register } from "@/services/auth-client";
import AuthLayout from "@/components/AuthLayout.vue";

const router = useRouter();
const { t } = useI18n();

const name = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);

async function submit() {
  loading.value = true;
  try {
    await register({ name: name.value, email: email.value, password: password.value });
    await router.push({ name: "onboarding" });
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
      <h1 class="text-2xl font-bold tracking-tight">{{ t("auth.registerTitle") }}</h1>
      <p class="text-sm text-muted-foreground">{{ t("auth.registerSubtitle") }}</p>
    </div>

    <form class="space-y-4" @submit.prevent="submit">
      <div class="space-y-2">
        <Label for="name">{{ t("common.name") }}</Label>
        <Input id="name" v-model="name" type="text" autocomplete="name" minlength="2" required />
      </div>
      <div class="space-y-2">
        <Label for="email">{{ t("common.email") }}</Label>
        <Input id="email" v-model="email" type="email" autocomplete="email" placeholder="you@example.com" required />
      </div>
      <div class="space-y-2">
        <Label for="password">{{ t("common.password") }}</Label>
        <Input id="password" v-model="password" type="password" autocomplete="new-password" minlength="8" required />
      </div>
      <Button type="submit" :disabled="loading" class="w-full">
        {{ loading ? t("common.loading") : t("auth.registerAction") }}
      </Button>
    </form>

    <div class="text-center">
      <RouterLink class="text-sm text-muted-foreground hover:underline" to="/login">
        {{ t("common.backToLogin") }}
      </RouterLink>
    </div>
  </AuthLayout>
</template>
