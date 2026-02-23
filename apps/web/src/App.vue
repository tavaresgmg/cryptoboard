<script setup lang="ts">
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@crypto/shared";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { persistLocale } from "./i18n";

const { locale } = useI18n();
const theme = ref<"light" | "dark">("light");

function applyTheme(value: "light" | "dark") {
  document.documentElement.dataset.theme = value;
  localStorage.setItem("crypto-dashboard-theme", value);
}

function onLocaleChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const selected = target.value as SupportedLanguage;
  if (!SUPPORTED_LANGUAGES.includes(selected)) {
    return;
  }

  locale.value = selected;
  persistLocale(selected);
}

function toggleTheme() {
  theme.value = theme.value === "light" ? "dark" : "light";
  applyTheme(theme.value);
}

onMounted(() => {
  const storedTheme = localStorage.getItem("crypto-dashboard-theme");
  theme.value = storedTheme === "dark" ? "dark" : "light";
  applyTheme(theme.value);
});
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <button class="theme-toggle" type="button" @click="toggleTheme">
        {{ theme === "light" ? "Dark" : "Light" }}
      </button>

      <label class="locale-switcher">
        <span>Idioma</span>
        <select :value="locale" @change="onLocaleChange">
          <option v-for="lang in SUPPORTED_LANGUAGES" :key="lang" :value="lang">
            {{ lang }}
          </option>
        </select>
      </label>
    </header>

    <RouterView />
  </div>
</template>
