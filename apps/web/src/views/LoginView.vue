<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login } from "@/services/auth-client";

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
  <main class="min-h-screen flex items-center justify-center bg-background p-4">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-2xl">{{ t("auth.loginTitle") }}</CardTitle>
        <p class="text-sm text-muted-foreground">{{ t("auth.loginSubtitle") }}</p>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="email">{{ t("common.email") }}</Label>
            <Input id="email" v-model="email" type="email" autocomplete="email" required />
          </div>
          <div class="grid gap-2">
            <Label for="password">{{ t("common.password") }}</Label>
            <Input id="password" v-model="password" type="password" autocomplete="current-password" required />
          </div>
          <Button type="submit" :disabled="loading" class="w-full">
            {{ loading ? t("common.loading") : t("auth.loginAction") }}
          </Button>
        </form>
      </CardContent>
      <CardFooter class="flex flex-col gap-2">
        <RouterLink class="text-sm text-primary hover:underline" to="/register">
          {{ t("auth.createAccount") }}
        </RouterLink>
        <RouterLink class="text-sm text-muted-foreground hover:underline" to="/forgot-password">
          {{ t("auth.forgotPassword") }}
        </RouterLink>
      </CardFooter>
    </Card>
  </main>
</template>
