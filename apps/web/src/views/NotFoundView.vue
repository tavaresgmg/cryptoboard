<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const { t } = useI18n();
</script>

<template>
  <main class="min-h-screen flex items-center justify-center bg-background p-4">
    <Card class="w-full max-w-md text-center">
      <CardContent class="pt-6">
        <p class="text-6xl font-bold text-muted-foreground mb-4">404</p>
        <h1 class="text-xl font-semibold mb-2">{{ t("notFound.title") }}</h1>
        <p class="text-sm text-muted-foreground mb-6">{{ t("notFound.description") }}</p>
        <Button as-child>
          <RouterLink to="/">{{ t("notFound.goHome") }}</RouterLink>
        </Button>
      </CardContent>
    </Card>
  </main>
</template>
