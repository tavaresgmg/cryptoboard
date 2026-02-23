<script setup lang="ts">
import { computed, useAttrs } from "vue";
import type { VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

type ButtonVariants = VariantProps<typeof buttonVariants>;

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariants["variant"];
    size?: ButtonVariants["size"];
    class?: string;
  }>(),
  {
    variant: "default",
    size: "default",
    class: ""
  }
);

const attrs = useAttrs();

const mergedClass = computed(() =>
  cn(buttonVariants({ variant: props.variant, size: props.size }), props.class, attrs.class as string)
);
</script>

<template>
  <button v-bind="attrs" :class="mergedClass">
    <slot />
  </button>
</template>
