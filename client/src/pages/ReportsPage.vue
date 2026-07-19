<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ref, computed, onMounted } from 'vue';
import { useApplicationStore } from '../stores/application.store';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import StatusBadge from '../components/StatusBadge.vue';
import FilterSelect from '../components/FilterSelect.vue';
import { buildMonthlyRecap } from '../utils/monthly-recap';
import { toCsv, downloadCsv } from '../utils/csv';
import {
  APPLICATION_STATUSES,
  VISA_TYPE_META,
  applicationStatusLabel,
  visaTypeLabel,
} from '../utils/labels';
import type { VisaType } from '../types';

const applicationStore = useApplicationStore();

const VISA_TYPES = Object.keys(VISA_TYPE_META) as VisaType[];

const filterYear = ref<string>('');
const expanded = ref<Set<string>>(new Set());

const allRecap = computed(() =>
  buildMonthlyRecap(applicationStore.applications),
);

const yearOptions = computed(() => {
  const years = new Set(allRecap.value.map((r) => r.monthKey.slice(0, 4)));
  return [...years]
    .sort((a, b) => b.localeCompare(a))
    .map((y) => ({ value: y, label: y }));
});

const recap = computed(() =>
  filterYear.value
    ? allRecap.value.filter((r) => r.monthKey.startsWith(filterYear.value))
    : allRecap.value,
);

const totals = computed(() => ({
  months: recap.value.length,
  total: recap.value.reduce((sum, r) => sum + r.total, 0),
  completed: recap.value.reduce((sum, r) => sum + r.completed, 0),
}));

function toggle(monthKey: string): void {
  const next = new Set(expanded.value);
  next.has(monthKey) ? next.delete(monthKey) : next.add(monthKey);
  expanded.value = next;
}

function completionRate(total: number, completed: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

function handleExport(): void {
  const headers = [
    'Month',
    'New Applications',
    'Completed',
    ...VISA_TYPES.map((v) => visaTypeLabel(v)),
    ...APPLICATION_STATUSES.map((s) => applicationStatusLabel(s)),
  ];
  const rows = recap.value.map((r) => [
    r.label,
    r.total,
    r.completed,
    ...VISA_TYPES.map((v) => r.byVisaType[v]),
    ...APPLICATION_STATUSES.map((s) => r.byStatus[s]),
  ]);
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCsv(`monthly-recap-${stamp}.csv`, toCsv(headers, rows));
}

onMounted(() => {
  if (!applicationStore.hasFetched) applicationStore.fetchAll();
});
</script>

<template>
  <div class="w-full max-w-640">
    <!-- Header -->
    <div
      class="flex flex-wrap items-start justify-between gap-4 mb-6 max-md:mb-5"
    >
      <div>
        <h1 class="text-2xl font-bold text-heading">Monthly Recap Report</h1>
        <p class="text-sm text-subtle mt-1">
          Applications recapped by creation month. The "Completed" column
          counts applications with status Approved, E-Visa Issued, or
          Completed.
        </p>
      </div>
      <div class="flex items-center gap-2.5">
        <FilterSelect
          v-model="filterYear"
          :options="yearOptions"
          all-label="All Years"
          placeholder="All Years"
          trigger-class="w-36"
        />
        <Button
          variant="outline"
          class="gap-2"
          :disabled="recap.length === 0"
          @click="handleExport"
        >
          <svg
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download CSV
        </Button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="applicationStore.isLoading" class="py-20">
      <LoadingSpinner />
    </div>

    <template v-else>
      <!-- Summary cards -->
      <div class="grid grid-cols-3 gap-4 mb-6 max-md:grid-cols-1">
        <div class="bg-panel border border-edge rounded-xl p-4">
          <p class="text-xs font-medium text-subtle uppercase tracking-wider">
            Total Months
          </p>
          <p class="text-2xl font-bold text-heading mt-1">
            {{ totals.months }}
          </p>
        </div>
        <div class="bg-panel border border-edge rounded-xl p-4">
          <p class="text-xs font-medium text-subtle uppercase tracking-wider">
            Total Applications
          </p>
          <p class="text-2xl font-bold text-heading mt-1">
            {{ totals.total }}
          </p>
        </div>
        <div class="bg-panel border border-edge rounded-xl p-4">
          <p class="text-xs font-medium text-subtle uppercase tracking-wider">
            Total Completed
          </p>
          <p class="text-2xl font-bold text-emerald-400 mt-1">
            {{ totals.completed }}
          </p>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="recap.length === 0"
        class="bg-panel border border-edge rounded-xl py-16 text-center"
      >
        <p class="text-body font-medium">No recap data yet</p>
        <p class="text-sm text-subtle mt-1">
          The recap will appear once applications have been created.
        </p>
      </div>

      <!-- Recap table -->
      <div
        v-else
        class="bg-panel border border-edge rounded-xl overflow-hidden"
      >
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-edge text-left">
              <th class="px-4 py-3 font-semibold text-subtle">Month</th>
              <th class="px-4 py-3 font-semibold text-subtle text-right">
                New Applications
              </th>
              <th class="px-4 py-3 font-semibold text-subtle text-right">
                Completed
              </th>
              <th class="px-4 py-3 font-semibold text-subtle text-right">
                Completion Rate
              </th>
              <th class="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in recap" :key="row.monthKey">
              <tr
                class="border-b border-edge last:border-0 hover:bg-panel-light cursor-pointer transition-colors"
                @click="toggle(row.monthKey)"
              >
                <td class="px-4 py-3 font-medium text-heading">
                  {{ row.label }}
                </td>
                <td class="px-4 py-3 text-right text-body">{{ row.total }}</td>
                <td class="px-4 py-3 text-right text-emerald-400 font-medium">
                  {{ row.completed }}
                </td>
                <td class="px-4 py-3 text-right text-body">
                  {{ completionRate(row.total, row.completed) }}%
                </td>
                <td class="px-4 py-3 text-subtle">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="transition-transform"
                    :class="{ 'rotate-180': expanded.has(row.monthKey) }"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </td>
              </tr>

              <!-- Breakdown -->
              <tr v-if="expanded.has(row.monthKey)" class="border-b border-edge">
                <td colspan="5" class="px-4 py-4 bg-panel-light/40">
                  <div class="grid grid-cols-2 gap-6 max-md:grid-cols-1">
                    <div>
                      <p
                        class="text-xs font-semibold text-subtle uppercase tracking-wider mb-2"
                      >
                        By Visa Type
                      </p>
                      <ul class="flex flex-col gap-1.5">
                        <li
                          v-for="v in VISA_TYPES"
                          :key="v"
                          v-show="row.byVisaType[v] > 0"
                          class="flex items-center justify-between text-sm"
                        >
                          <span class="text-body">{{ visaTypeLabel(v) }}</span>
                          <span class="font-medium text-heading">
                            {{ row.byVisaType[v] }}
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p
                        class="text-xs font-semibold text-subtle uppercase tracking-wider mb-2"
                      >
                        By Status
                      </p>
                      <ul class="flex flex-col gap-1.5">
                        <li
                          v-for="s in APPLICATION_STATUSES"
                          :key="s"
                          v-show="row.byStatus[s] > 0"
                          class="flex items-center justify-between text-sm"
                        >
                          <StatusBadge :status="s" />
                          <span class="font-medium text-heading">
                            {{ row.byStatus[s] }}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
