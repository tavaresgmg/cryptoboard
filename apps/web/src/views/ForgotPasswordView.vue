<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import Button from "../components/ui/Button.vue";
import { forgotPassword } from "../services/auth-client";

const { t } = useI18n();
const email = ref("");
const loading = ref(false);
const error = ref<string | null>(null);
const message = ref<string | null>(null);

async function submit() {
  loading.value = true;
  error.value = null;
  message.value = null;

  try {
    const response = await forgotPassword({ email: email.value });
    message.value = response.message;
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
      <h1>{{ t("auth.forgotTitle") }}</h1>
      <p>{{ t("auth.forgotSubtitle") }}</p>

      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span>{{ t("common.email") }}</span>
          <input v-model="email" type="email" autocomplete="email" required />
        </label>

        <Button type="submit" :disabled="loading">
          {{ loading ? t("common.loading") : t("auth.forgotAction") }}
        </Button>
      </form>

      <p v-if="message">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>

      <RouterLink class="link" to="/login">{{ t("auth.loginAction") }}</RouterLink>
    </section>
  </main>
</template>
