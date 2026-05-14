<script setup lang="ts">
defineProps<{ size?: 'sm' | 'md' | 'lg' }>();
</script>

<template>
  <div class="flex items-center justify-center p-6">
    <div
      class="rounded-full border-3 border-edge border-t-indigo-500 animate-spin"
      :class="{
        'w-5 h-5 border-2': size === 'sm',
        'w-9 h-9': !size || size === 'md',
        'w-13 h-13 border-4': size === 'lg',
      }"
      role="status"
    >
      <span class="sr-only">Loading…</span>
    </div>
  </div>
</template>
