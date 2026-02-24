<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/services/auth-client";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const token = ref(typeof route.query.token === "string" ? route.query.token : "");
const password = ref("");
const loading = ref(false);

const canSubmit = computed(() => token.value.trim().length > 0 && password.value.length >= 8);

async function submit() {
  loading.value = true;
  try {
    const response = await resetPassword({ token: token.value, password: password.value });
    toast.success(response.message);
    await router.push("/login");
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
        <CardTitle class="text-2xl">{{ t("auth.resetTitle") }}</CardTitle>
        <p class="text-sm text-muted-foreground">{{ t("auth.resetSubtitle") }}</p>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="token">{{ t("auth.tokenLabel") }}</Label>
            <Input id="token" v-model="token" type="text" required />
          </div>
          <div class="grid gap-2">
            <Label for="password">{{ t("common.password") }}</Label>
            <Input id="password" v-model="password" type="password" minlength="8" required />
          </div>
          <Button type="submit" :disabled="loading || !canSubmit" class="w-full">
            {{ loading ? t("common.loading") : t("auth.resetAction") }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </main>
</template>
