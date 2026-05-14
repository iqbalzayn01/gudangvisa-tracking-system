<script setup lang="ts">
import type { PublicHistory, TrackingHistory } from '../types';
import StatusBadge from './StatusBadge.vue';
import { formatDateTime } from '../utils/formatters';

defineProps<{
  histories: (PublicHistory | TrackingHistory)[];
  showInternal?: boolean;
}>();
</script>

<template>
  <div class="flex flex-col">
    <div
      v-for="(entry, index) in histories"
      :key="entry.id"
      class="flex gap-4 relative pb-6 last:pb-0"
    >
      <!-- Dot -->
      <div
        class="w-3 h-3 min-w-3 rounded-full mt-1.5 z-10 transition-all duration-300"
        :class="index === 0 ? 'bg-indigo-500 ring-4 ring-indigo-500/20' : 'bg-edge'"
      />

      <!-- Connector line -->
      <div
        v-if="index < histories.length - 1"
        class="absolute left-[5px] top-4 bottom-0 w-0.5 bg-edge"
      />

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 flex-wrap">
          <StatusBadge :status="entry.statusName" />
          <span class="text-[13px] text-subtle">{{ formatDateTime(entry.createdAt) }}</span>
        </div>

        <p v-if="entry.descriptionPublic" class="mt-2 text-sm text-body leading-relaxed">
          {{ entry.descriptionPublic }}
        </p>

        <!-- Internal notes (staff only) -->
        <p
          v-if="showInternal && 'descriptionInternal' in entry && entry.descriptionInternal"
          class="mt-1 text-xs text-amber-400/80 italic"
        >
          🔒 {{ entry.descriptionInternal }}
        </p>

        <p class="flex items-center gap-1.5 text-[13px] text-subtle mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {{ 'updater' in entry ? entry.updater?.fullName : ('updatedBy' in entry && typeof entry.updatedBy === 'object' ? entry.updatedBy.fullName : 'Staff') }}
        </p>
      </div>
    </div>

    <div v-if="histories.length === 0" class="text-center py-8 text-subtle text-sm">
      No tracking history available.
    </div>
  </div>
</template>
