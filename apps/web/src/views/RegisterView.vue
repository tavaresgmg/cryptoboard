<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { register } from "@/services/auth-client";

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
    await router.push("/");
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
        <CardTitle class="text-2xl">{{ t("auth.registerTitle") }}</CardTitle>
        <p class="text-sm text-muted-foreground">{{ t("auth.registerSubtitle") }}</p>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="name">{{ t("common.name") }}</Label>
            <Input id="name" v-model="name" type="text" autocomplete="name" minlength="2" required />
          </div>
          <div class="grid gap-2">
            <Label for="email">{{ t("common.email") }}</Label>
            <Input id="email" v-model="email" type="email" autocomplete="email" required />
          </div>
          <div class="grid gap-2">
            <Label for="password">{{ t("common.password") }}</Label>
            <Input id="password" v-model="password" type="password" autocomplete="new-password" minlength="8" required />
          </div>
          <Button type="submit" :disabled="loading" class="w-full">
            {{ loading ? t("common.loading") : t("auth.registerAction") }}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <RouterLink class="text-sm text-muted-foreground hover:underline" to="/login">
          {{ t("common.backToLogin") }}
        </RouterLink>
      </CardFooter>
    </Card>
  </main>
</template>
