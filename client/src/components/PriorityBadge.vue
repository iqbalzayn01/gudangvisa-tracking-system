<script setup lang="ts">
import type { Priority } from '../types';
import { priorityClasses, priorityLabel } from '../utils/labels';

const props = defineProps<{ priority: Priority }>();
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap',
      priorityClasses(props.priority),
    ]"
  >
    <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
    {{ priorityLabel(props.priority) }}
  </span>
</template>
