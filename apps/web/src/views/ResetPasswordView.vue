<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import Button from "../components/ui/Button.vue";
import { resetPassword } from "../services/auth-client";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const token = ref(typeof route.query.token === "string" ? route.query.token : "");
const password = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const message = ref<string | null>(null);

const canSubmit = computed(() => token.value.trim().length > 0 && password.value.length >= 8);

async function submit() {
  loading.value = true;
  error.value = null;
  message.value = null;

  try {
    const response = await resetPassword({
      token: token.value,
      password: password.value
    });
    message.value = response.message;
    setTimeout(() => {
      void router.push("/login");
    }, 1000);
  } catch (unknownError) {
    error.value = unknownError instanceof Error ? unknownError.message : "Erro inesperado";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="container">
    <section class="card">
      <h1>{{ t("auth.resetTitle") }}</h1>
      <p>{{ t("auth.resetSubtitle") }}</p>

      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span>Token</span>
          <input v-model="token" type="text" required />
        </label>

        <label class="field">
          <span>{{ t("common.password") }}</span>
          <input v-model="password" type="password" minlength="8" required />
        </label>

        <Button type="submit" :disabled="loading || !canSubmit">
          {{ loading ? t("common.loading") : t("auth.resetAction") }}
        </Button>
      </form>

      <p v-if="message">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </section>
  </main>
</template>
