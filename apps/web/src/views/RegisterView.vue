<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import Button from "../components/ui/Button.vue";
import { register } from "../services/auth-client";

const router = useRouter();
const { t } = useI18n();

const name = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref<string | null>(null);

async function submit() {
  loading.value = true;
  error.value = null;

  try {
    await register({
      name: name.value,
      email: email.value,
      password: password.value
    });

    await router.push("/");
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
      <h1>{{ t("auth.registerTitle") }}</h1>
      <p>{{ t("auth.registerSubtitle") }}</p>

      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span>Nome</span>
          <input v-model="name" type="text" autocomplete="name" minlength="2" required />
        </label>

        <label class="field">
          <span>Email</span>
          <input v-model="email" type="email" autocomplete="email" required />
        </label>

        <label class="field">
          <span>Senha</span>
          <input v-model="password" type="password" autocomplete="new-password" minlength="8" required />
        </label>

        <Button type="submit" :disabled="loading">
          {{ loading ? t("common.loading") : t("auth.registerAction") }}
        </Button>
      </form>

      <p v-if="error" class="error">{{ error }}</p>

      <RouterLink class="link" to="/login">Voltar para login</RouterLink>
    </section>
  </main>
</template>
