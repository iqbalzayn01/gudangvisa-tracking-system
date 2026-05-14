<script setup lang="ts">
import type { DocStatus } from '../types';
import { statusLabel } from '../utils/formatters';

const props = defineProps<{ status: DocStatus }>();

const colorMap: Record<DocStatus, string> = {
  RECEIVED: 'bg-slate-500/15 text-slate-400',
  IN_REVIEW: 'bg-amber-500/15 text-amber-400',
  IN_PROCESS: 'bg-indigo-500/15 text-indigo-400',
  APPROVED: 'bg-emerald-500/15 text-emerald-400',
  REJECTED: 'bg-rose-500/15 text-rose-400',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400',
};
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide whitespace-nowrap',
      colorMap[props.status] ?? 'bg-slate-500/15 text-slate-400',
    ]"
  >
    {{ statusLabel(props.status) }}
  </span>
</template>
