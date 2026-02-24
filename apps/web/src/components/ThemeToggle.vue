<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Moon, Sun } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { Button } from "@/components/ui/button";

const { t } = useI18n();
const isDark = ref(true);

function toggle() {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
  localStorage.setItem("crypto-theme", isDark.value ? "dark" : "light");
}

onMounted(() => {
  const stored = localStorage.getItem("crypto-theme");
  isDark.value = stored !== "light";
  document.documentElement.classList.toggle("dark", isDark.value);
});
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    :aria-label="isDark ? t('common.switchToLight') : t('common.switchToDark')"
    @click="toggle"
  >
    <Sun v-if="isDark" class="size-5" />
    <Moon v-else class="size-5" />
  </Button>
</template>
