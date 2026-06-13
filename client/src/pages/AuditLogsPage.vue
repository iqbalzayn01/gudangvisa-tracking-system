<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ref, computed, onMounted, watch } from 'vue';
import { getAuditLogs } from '../api/audit-logs.api';
import type { AuditLog, AuditAction } from '../types';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import FilterSelect from '../components/FilterSelect.vue';
import { formatDateTime } from '../utils/formatters';

const logs = ref<AuditLog[]>([]);
const isLoading = ref(true);
const error = ref('');

const searchInput = ref('');
const filterAction = ref<AuditAction | ''>('');
const filterEntity = ref('');

const actionOptions: AuditAction[] = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'STATUS_CHANGE',
  'LOGIN',
  'UPLOAD',
  'DOWNLOAD',
];

// Entity types recorded by the backend audit trail.
const entityOptions = [
  'application',
  'document',
  'client',
  'staff',
  'biometric',
  'checklist',
];

const actionStyle: Record<AuditAction, string> = {
  CREATE: 'bg-emerald-500/15 text-emerald-400',
  UPDATE: 'bg-sky-500/15 text-sky-400',
  DELETE: 'bg-red-500/15 text-red-400',
  STATUS_CHANGE: 'bg-amber-500/15 text-amber-400',
  LOGIN: 'bg-purple-500/15 text-purple-400',
  UPLOAD: 'bg-cyan-500/15 text-cyan-400',
  DOWNLOAD: 'bg-teal-500/15 text-teal-400',
};

// Client-side text search over the (server-filtered) result set.
const filtered = computed(() => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return logs.value;
  return logs.value.filter(
    (l) =>
      l.description.toLowerCase().includes(q) ||
      l.actor.toLowerCase().includes(q) ||
      (l.entityId ?? '').toLowerCase().includes(q) ||
      l.entity.toLowerCase().includes(q) ||
      (l.ipAddress ?? '').toLowerCase().includes(q),
  );
});

function actionLabel(a: AuditAction): string {
  return a
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function entityLabel(e: string): string {
  return e.charAt(0).toUpperCase() + e.slice(1);
}

const actionSelectOptions = computed(() =>
  actionOptions.map((a) => ({ value: a, label: actionLabel(a) })),
);
const entitySelectOptions = computed(() =>
  entityOptions.map((e) => ({ value: e, label: entityLabel(e) })),
);

async function load() {
  isLoading.value = true;
  error.value = '';
  try {
    logs.value = await getAuditLogs({
      action: filterAction.value,
      entity: filterEntity.value,
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load logs';
  } finally {
    isLoading.value = false;
  }
}

// Action & entity filters are applied server-side, so refetch when they change.
watch([filterAction, filterEntity], load);

onMounted(load);
</script>

<template>
  <div class="w-full max-w-640">
    <div class="flex justify-between items-start mb-6 gap-4 flex-wrap">
      <div>
        <h1 class="text-[28px] font-bold text-heading mb-1">Audit Logs</h1>
        <p class="text-sm text-subtle">
          Track all system activities and changes made by staff and admins
        </p>
      </div>
      <Button
        variant="ghost"
        class="p-2.5 rounded-full border border-edge text-subtle hover:bg-panel-light transition-colors cursor-pointer h-auto"
        :disabled="isLoading"
        title="Refresh"
        @click="load"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          :class="{ 'animate-spin': isLoading }"
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path
            d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
          />
        </svg>
      </Button>
    </div>

    <!-- Search & filters -->
    <div
      class="flex gap-3 mb-4 bg-panel border border-edge rounded-2xl px-4 py-2.5 transition-all focus-within:border-red-500 focus-within:ring-3 focus-within:ring-red-500/12 flex-wrap"
    >
      <div class="relative flex-1 flex items-center min-w-50">
        <svg
          class="absolute left-2.5 text-subtle pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="searchInput"
          type="text"
          class="w-full py-2 pl-9 pr-3 bg-transparent border-none text-sm text-heading outline-none placeholder:text-subtle"
          placeholder="Search activity, user, reference, or IP…"
        />
      </div>
      <FilterSelect
        v-model="filterAction"
        :options="actionSelectOptions"
        all-label="All Actions"
        placeholder="All Actions"
        trigger-class="min-w-36"
      />
      <FilterSelect
        v-model="filterEntity"
        :options="entitySelectOptions"
        all-label="All Entities"
        placeholder="All Entities"
        trigger-class="min-w-36"
      />
    </div>

    <div
      v-if="error"
      class="px-4 py-3 rounded-full bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-4"
    >
      {{ error }}
    </div>

    <LoadingSpinner v-if="isLoading" />

    <!-- Activity table -->
    <div
      v-else-if="filtered.length"
      class="bg-panel border border-edge rounded-2xl overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-subtle border-b border-edge">
              <th class="font-medium px-4 py-3 whitespace-nowrap">Timestamp</th>
              <th class="font-medium px-4 py-3 whitespace-nowrap">User</th>
              <th class="font-medium px-4 py-3 whitespace-nowrap">Action</th>
              <th class="font-medium px-4 py-3">Entity</th>
              <th class="font-medium px-4 py-3 whitespace-nowrap">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="log in filtered"
              :key="log.id"
              class="border-b border-edge/60 last:border-0 hover:bg-panel-light/50 transition-colors"
            >
              <!-- Timestamp -->
              <td class="px-4 py-3 text-subtle whitespace-nowrap">
                {{ formatDateTime(log.createdAt) }}
              </td>

              <!-- User -->
              <td class="px-4 py-3 whitespace-nowrap">
                <span class="inline-flex items-center gap-2">
                  <span
                    class="w-6 h-6 rounded-full bg-red-500/12 text-red-400 flex items-center justify-center text-[10px] font-bold shrink-0"
                    >{{ log.actor.charAt(0) }}</span
                  >
                  <span class="text-heading font-medium">{{ log.actor }}</span>
                  <span
                    class="px-1.5 rounded-full bg-panel-light text-[9px] uppercase tracking-wide text-subtle"
                    >{{ log.actorRole }}</span
                  >
                </span>
              </td>

              <!-- Action -->
              <td class="px-4 py-3 whitespace-nowrap">
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                  :class="actionStyle[log.action]"
                  >{{ actionLabel(log.action) }}</span
                >
              </td>

              <!-- Entity -->
              <td class="px-4 py-3">
                <div class="flex flex-col">
                  <span class="text-heading">{{
                    entityLabel(log.entity)
                  }}</span>
                  <span class="text-xs text-subtle">{{ log.description }}</span>
                  <span
                    v-if="log.entityId"
                    class="text-xs font-mono text-red-400"
                    >#{{ log.entityId }}</span
                  >
                </div>
              </td>

              <!-- IP Address -->
              <td class="px-4 py-3 whitespace-nowrap font-mono text-subtle">
                {{ log.ipAddress ?? '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="text-center py-16 text-subtle">
      <p class="text-lg text-heading font-medium mb-2">No activity found</p>
      <p class="text-sm">Try adjusting your search or filters.</p>
    </div>
  </div>
</template>
