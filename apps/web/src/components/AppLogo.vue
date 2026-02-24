<script setup lang="ts">
withDefaults(defineProps<{ size?: "sm" | "md" | "lg"; iconOnly?: boolean }>(), {
  size: "md",
  iconOnly: false
});
</script>

<template>
  <div
    class="inline-flex items-center gap-2"
    :class="{
      'gap-1.5': size === 'sm',
      'gap-2': size === 'md',
      'gap-3': size === 'lg',
      'gap-0': iconOnly,
    }"
  >
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      :class="{
        'size-6': size === 'sm',
        'size-8': size === 'md',
        'size-10': size === 'lg',
      }"
    >
      <!-- Rounded square background -->
      <rect width="32" height="32" rx="8" class="fill-primary" />
      <!-- Bar chart / pulse line representing crypto activity -->
      <rect x="6" y="18" width="4" height="8" rx="1" class="fill-primary-foreground" opacity="0.7" />
      <rect x="12" y="12" width="4" height="14" rx="1" class="fill-primary-foreground" opacity="0.85" />
      <rect x="18" y="8" width="4" height="18" rx="1" class="fill-primary-foreground" />
      <rect x="24" y="14" width="4" height="12" rx="1" class="fill-primary-foreground" opacity="0.7" />
      <!-- Upward trend line -->
      <path
        d="M8 17 L14 11 L20 7 L26 13"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-primary-foreground"
      />
      <!-- Arrow tip -->
      <path
        d="M23 10 L26 13 L23 13"
        fill="currentColor"
        class="text-primary-foreground"
      />
    </svg>
    <div
      v-if="!iconOnly"
      class="flex flex-col leading-none"
      :class="{
        'gap-0': size === 'sm',
        'gap-0.5': size === 'md' || size === 'lg',
      }"
    >
      <span
        class="font-bold tracking-tight"
        :class="{
          'text-sm': size === 'sm',
          'text-base': size === 'md',
          'text-xl': size === 'lg',
        }"
      >Crypto</span>
      <span
        class="text-muted-foreground"
        :class="{
          'text-[10px]': size === 'sm',
          'text-xs': size === 'md',
          'text-sm': size === 'lg',
        }"
      >Board</span>
    </div>
  </div>
</template>
