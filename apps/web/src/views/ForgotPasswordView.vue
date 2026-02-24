<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { forgotPassword } from "@/services/auth-client";

const { t } = useI18n();

const email = ref("");
const loading = ref(false);

async function submit() {
  loading.value = true;
  try {
    const response = await forgotPassword({ email: email.value });
    toast.success(response.message);
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
        <CardTitle class="text-2xl">{{ t("auth.forgotTitle") }}</CardTitle>
        <p class="text-sm text-muted-foreground">{{ t("auth.forgotSubtitle") }}</p>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="email">{{ t("common.email") }}</Label>
            <Input id="email" v-model="email" type="email" autocomplete="email" required />
          </div>
          <Button type="submit" :disabled="loading" class="w-full">
            {{ loading ? t("common.loading") : t("auth.forgotAction") }}
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
