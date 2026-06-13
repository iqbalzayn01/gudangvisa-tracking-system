<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApplicationStore } from '../stores/application.store';
import type { BiometricSchedule, BiometricStatus } from '../types';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import FilterSelect from '../components/FilterSelect.vue';
import {
  biometricStatusLabel,
  biometricStatusClasses,
} from '../utils/formatters';

const router = useRouter();
const applicationStore = useApplicationStore();

const searchInput = ref('');
const filterStatus = ref<BiometricStatus | ''>('');

const statusOptions: BiometricStatus[] = [
  'scheduled',
  'completed',
  'rescheduled',
  'cancelled',
  'no_show',
  'not_scheduled',
];

const statusSelectOptions = computed(() =>
  statusOptions.map((s) => ({ value: s, label: biometricStatusLabel(s) })),
);

// Derive schedules from applications (biometric data is merged on the record).
const schedules = computed<BiometricSchedule[]>(() =>
  applicationStore.applications.map((a) => ({
    id: a.id,
    applicationId: a.id,
    trackingCode: a.trackingCode,
    clientName: a.client?.name ?? 'Unknown client',
    status: a.biometricStatus ?? 'not_scheduled',
    date: a.biometricDate ?? null,
    time: a.biometricTime ?? null,
    location: a.biometricLocation ?? null,
    fieldAssistant: a.fieldAssistantName ?? null,
  })),
);

const counts = computed(() => {
  const c: Partial<Record<BiometricStatus, number>> = {};
  for (const s of schedules.value) c[s.status] = (c[s.status] ?? 0) + 1;
  return c;
});

const filtered = computed(() => {
  let list = [...schedules.value].sort((a, b) => {
    // Scheduled-with-a-date first, by soonest date.
    const da = a.date ? new Date(a.date).getTime() : Infinity;
    const db = b.date ? new Date(b.date).getTime() : Infinity;
    return da - db;
  });
  if (filterStatus.value)
    list = list.filter((s) => s.status === filterStatus.value);
  const q = searchInput.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (s) =>
        s.trackingCode.toLowerCase().includes(q) ||
        s.clientName.toLowerCase().includes(q) ||
        (s.location ?? '').toLowerCase().includes(q) ||
        (s.fieldAssistant ?? '').toLowerCase().includes(q),
    );
  }
  return list;
});

const summaryCards = computed(() => [
  { label: 'Scheduled', value: counts.value.scheduled ?? 0, tone: 'sky' },
  { label: 'Completed', value: counts.value.completed ?? 0, tone: 'emerald' },
  {
    label: 'Rescheduled',
    value: counts.value.rescheduled ?? 0,
    tone: 'amber',
  },
  {
    label: 'Not Scheduled',
    value: counts.value.not_scheduled ?? 0,
    tone: 'slate',
  },
]);

const toneClass: Record<string, string> = {
  sky: 'text-sky-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  slate: 'text-subtle',
};

function formatDay(date: string | null): string {
  if (!date) return 'Unscheduled';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(time: string | null): string {
  if (!time) return '';
  // Backend stores HH:MM:SS — show HH:MM.
  return time.slice(0, 5);
}

onMounted(() => {
  if (!applicationStore.hasFetched) applicationStore.fetchAll();
});
</script>

<template>
  <div class="w-full max-w-640">
    <div class="flex justify-between items-start mb-6 gap-4 flex-wrap">
      <div>
        <h1 class="text-[28px] font-bold text-heading mb-1">
          Biometric Schedules
        </h1>
        <p class="text-sm text-subtle">Manage biometric appointments</p>
      </div>
      <Button
        variant="ghost"
        class="p-2.5 rounded-full border border-edge text-subtle hover:bg-panel-light transition-colors cursor-pointer h-auto"
        :disabled="applicationStore.isLoading"
        title="Refresh"
        @click="applicationStore.fetchAll()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          :class="{ 'animate-spin': applicationStore.isLoading }"
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path
            d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
          />
        </svg>
      </Button>
    </div>

    <!-- Summary -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      <div
        v-for="c in summaryCards"
        :key="c.label"
        class="bg-panel border border-edge rounded-2xl p-4"
      >
        <p class="text-2xl font-bold" :class="toneClass[c.tone]">
          {{ c.value }}
        </p>
        <p class="text-xs text-subtle mt-1">{{ c.label }}</p>
      </div>
    </div>

    <!-- Search & filter -->
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
          placeholder="Search applicant, reference, location…"
        />
      </div>
      <FilterSelect
        v-model="filterStatus"
        :options="statusSelectOptions"
        all-label="All Statuses"
        placeholder="All Statuses"
        trigger-class="min-w-36"
      />
    </div>

    <LoadingSpinner
      v-if="applicationStore.isLoading && !applicationStore.hasFetched"
    />

    <div v-else-if="filtered.length" class="flex flex-col gap-2.5">
      <div
        v-for="s in filtered"
        :key="s.id"
        class="flex items-center gap-4 bg-panel border border-edge rounded-2xl p-4 hover:border-red-500/40 transition-colors cursor-pointer flex-wrap sm:flex-nowrap"
        @click="router.push(`/applications/${s.applicationId}`)"
      >
        <!-- Date block -->
        <div
          class="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 flex flex-col items-center justify-center shrink-0"
        >
          <template v-if="s.date">
            <span class="text-[10px] uppercase font-semibold">{{
              new Date(s.date).toLocaleDateString('en-US', { month: 'short' })
            }}</span>
            <span class="text-xl font-bold leading-none">{{
              new Date(s.date).getDate()
            }}</span>
          </template>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-sm font-semibold text-heading truncate">
              {{ s.clientName }}
            </p>
            <code
              class="text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-mono"
              >{{ s.trackingCode }}</code
            >
          </div>
          <p
            class="text-xs text-subtle mt-1 flex items-center gap-x-3 flex-wrap"
          >
            <span
              >{{ formatDay(s.date)
              }}{{ s.time ? ` · ${formatTime(s.time)}` : '' }}</span
            >
            <span v-if="s.location" class="inline-flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {{ s.location }}
            </span>
            <span v-if="s.fieldAssistant"
              >Assistant: {{ s.fieldAssistant }}</span
            >
          </p>
        </div>

        <!-- Status -->
        <span
          class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide whitespace-nowrap shrink-0"
          :class="biometricStatusClasses(s.status)"
          >{{ biometricStatusLabel(s.status) }}</span
        >
      </div>
    </div>

    <div
      v-else-if="applicationStore.hasFetched"
      class="text-center py-16 text-subtle"
    >
      <p class="text-lg text-heading font-medium mb-2">No appointments found</p>
      <p class="text-sm">
        Biometric appointments scheduled on applications will appear here.
      </p>
    </div>
  </div>
</template>
