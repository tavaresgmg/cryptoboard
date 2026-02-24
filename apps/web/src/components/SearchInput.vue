<script setup lang="ts">
import { Search } from "lucide-vue-next";
import { Input } from "@/components/ui/input";

defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div class="relative">
    <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      :model-value="modelValue"
      :placeholder="placeholder"
      class="pl-9"
      @update:model-value="(value) => emit('update:modelValue', String(value))"
    />
  </div>
</template>
