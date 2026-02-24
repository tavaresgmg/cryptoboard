<script setup lang="ts">
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@crypto/shared";
import { useI18n } from "vue-i18n";
import { persistLocale } from "@/i18n";
import { Globe } from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const { locale } = useI18n();

const labels: Record<SupportedLanguage, string> = {
  es: "Español",
  en: "English",
  "pt-BR": "Português",
};

const shortLabels: Record<SupportedLanguage, string> = {
  es: "ES",
  en: "EN",
  "pt-BR": "PT",
};

function selectLocale(lang: SupportedLanguage) {
  locale.value = lang;
  persistLocale(lang);
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="sm" class="gap-1.5 h-9 px-2.5">
        <Globe class="size-4" />
        <span class="text-xs font-medium">{{ shortLabels[locale as SupportedLanguage] }}</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        v-for="lang in SUPPORTED_LANGUAGES"
        :key="lang"
        :class="{ 'bg-accent': locale === lang }"
        @click="selectLocale(lang)"
      >
        <span class="font-medium">{{ shortLabels[lang] }}</span>
        <span class="ml-2 text-muted-foreground">{{ labels[lang] }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
