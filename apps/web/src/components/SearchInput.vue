<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import { Search } from "lucide-vue-next";
import { Input } from "@/components/ui/input";

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const internal = ref(props.modelValue);
let timer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.modelValue,
  (v) => {
    internal.value = v;
  },
);

onUnmounted(() => {
  clearTimeout(timer);
});

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  internal.value = value;
  clearTimeout(timer);
  timer = setTimeout(() => {
    emit("update:modelValue", value);
  }, 300);
}
</script>

<template>
  <div class="relative">
    <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      :value="internal"
      :placeholder="placeholder"
      class="pl-9"
      @input="onInput"
    />
  </div>
</template>
