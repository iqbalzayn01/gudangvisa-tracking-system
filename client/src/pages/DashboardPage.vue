<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useApplicationStore } from '../stores/application.store';
import { useClientStore } from '../stores/client.store';
import StatusBadge from '../components/StatusBadge.vue';
import PriorityBadge from '../components/PriorityBadge.vue';
import type { DocStatus } from '../types';
import { formatDate } from '../utils/formatters';

const router = useRouter();
const auth = useAuthStore();
const applicationStore = useApplicationStore();
const clientStore = useClientStore();

onMounted(() => {
  if (!applicationStore.hasFetched) applicationStore.fetchAll();
  if (!clientStore.hasFetched) clientStore.fetchAll();
});

// ── Metrics ──────────────────────────────────────────────────────────────────
const metrics = computed(() => [
  {
    label: 'Total Clients',
    value: clientStore.totalCount,
    hint: 'Registered clients',
    icon: 'users',
  },
  {
    label: 'Total Cases',
    value: applicationStore.totalCount,
    hint: 'All applications',
    icon: 'layers',
  },
  {
    label: 'New Today',
    value: applicationStore.newToday,
    hint: 'Created today',
    icon: 'plus',
  },
  {
    label: 'This Month',
    value: applicationStore.newThisMonth,
    hint: 'Created this month',
    icon: 'calendar',
  },
  {
    label: 'Avg. Days Open',
    value: applicationStore.avgDays,
    hint: 'Per application',
    icon: 'clock',
  },
]);

const recent = computed(() =>
  applicationStore.sortedApplications.slice(0, 5),
);

const statusList: DocStatus[] = [
  'RECEIVED',
  'IN_REVIEW',
  'IN_PROCESS',
  'APPROVED',
  'COMPLETED',
  'REJECTED',
];

const statusBarColor: Record<DocStatus, string> = {
  RECEIVED: 'bg-slate-500',
  IN_REVIEW: 'bg-amber-500',
  IN_PROCESS: 'bg-red-500',
  APPROVED: 'bg-emerald-500',
  COMPLETED: 'bg-emerald-400',
  REJECTED: 'bg-rose-500',
};

const statusDistribution = computed(() => {
  const total = applicationStore.totalCount || 1;
  return statusList.map((s) => {
    const count = applicationStore.countByStatus[s] ?? 0;
    return {
      status: s,
      label: s.replace(/_/g, ' '),
      count,
      pct: Math.round((count / total) * 100),
    };
  });
});
</script>

<template>
  <div class="max-w-6xl">
    <!-- ── Header / copywriting ─────────────────────────────────────────── -->
    <div class="mb-7">
      <p
        class="inline-flex items-center gap-2 text-xs font-semibold text-red-400 bg-red-500/10 px-3 py-1 rounded-full mb-3"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
        Overseeing Active Applications
      </p>
      <h1 class="text-[28px] font-bold text-heading mb-1.5">
        Welcome back, {{ auth.user?.fullName ?? 'User' }} 👋
      </h1>
      <p class="text-[15px] text-body max-w-2xl">
        Immigration document monitoring &amp; lifecycle management
        <span class="text-subtle">— Gudang Visa, Bali, Indonesia.</span>
      </p>
    </div>

    <!-- ── Metrics Bar (Summary Cards) ──────────────────────────────────── -->
    <section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
      <div
        v-for="m in metrics"
        :key="m.label"
        class="bg-panel border border-edge rounded-2xl p-4 flex items-center gap-3.5"
      >
        <div
          class="w-11 h-11 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center shrink-0"
        >
          <svg
            v-if="m.icon === 'users'"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <svg
            v-else-if="m.icon === 'layers'"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <svg
            v-else-if="m.icon === 'plus'"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <svg
            v-else-if="m.icon === 'calendar'"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
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
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-2xl font-bold text-heading leading-tight">
            {{ m.value }}
          </p>
          <p class="text-xs text-subtle truncate">{{ m.label }}</p>
        </div>
      </div>
    </section>

    <!-- ── Bento Grid ───────────────────────────────────────────────────── -->
    <section
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch"
    >
      <!-- Applications Ledger (wide, spans 2 rows on desktop) -->
      <div
        class="md:col-span-2 lg:row-span-2 bg-panel border border-edge rounded-2xl p-5 flex flex-col"
      >
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-semibold text-heading">
              Applications Ledger
            </h2>
            <p class="text-xs text-subtle mt-0.5">
              {{ applicationStore.totalCount }} total ·
              {{ applicationStore.newThisMonth }} this month
            </p>
          </div>
          <button
            class="inline-flex items-center gap-1.5 text-sm font-semibold text-red-400 hover:text-red-500 transition-colors cursor-pointer"
            @click="router.push('/applications')"
          >
            View all
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div v-if="recent.length" class="flex flex-col -mx-1 flex-1">
          <div
            v-for="a in recent"
            :key="a.id"
            class="flex items-center gap-3 px-1 py-2.5 rounded-xl hover:bg-panel-light cursor-pointer transition-colors"
            @click="router.push(`/applications/${a.id}`)"
          >
            <code
              class="text-[12px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-mono shrink-0"
              >{{ a.trackingCode }}</code
            >
            <span class="text-sm text-heading font-medium truncate flex-1">{{
              a.client?.name ?? '—'
            }}</span>
            <PriorityBadge
              :priority="a.priority ?? 'MEDIUM'"
              class="max-sm:hidden"
            />
            <StatusBadge :status="a.currentStatus" />
            <span class="text-xs text-subtle whitespace-nowrap max-md:hidden">{{
              formatDate(a.createdAt)
            }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-subtle text-center py-8">
          No applications yet.
        </p>
      </div>

      <!-- Quick: Check Document -->
      <div
        class="bg-gradient-to-br from-red-500 to-red-700 text-white rounded-2xl p-5 flex flex-col justify-between"
      >
        <div>
          <div
            class="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center mb-3"
          >
            <svg
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
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h2 class="text-lg font-bold mb-1">Check Document</h2>
          <p class="text-[13px] text-white/80">
            Look up an application by its reference number and review its
            real-time status.
          </p>
        </div>
        <button
          class="mt-4 inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full bg-white text-red-600 text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer"
          @click="router.push('/applications')"
        >
          Check now
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      <!-- Biometric Hub -->
      <button
        class="bg-panel border border-edge rounded-2xl p-5 text-left hover:border-red-500/40 transition-colors cursor-pointer flex flex-col justify-between gap-3"
        @click="router.push('/biometrics')"
      >
        <div class="flex items-center justify-between mb-3">
          <div
            class="w-11 h-11 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center"
          >
            <svg
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
              <path d="M2 12a10 10 0 0 1 18-6" />
              <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
              <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
              <path d="M12 11c0 3-2 5-2 5" />
            </svg>
          </div>
          <svg
            class="text-subtle"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
        <div>
          <p class="text-2xl font-bold text-heading">
            {{ applicationStore.biometricCount }}
          </p>
          <h2 class="text-base font-semibold text-heading mt-0.5">
            Biometric Hub
          </h2>
          <p class="text-xs text-subtle mt-0.5">
            Active appointments to manage
          </p>
        </div>
      </button>

      <!-- Status Distribution (wide) -->
      <div
        class="md:col-span-2 bg-panel border border-edge rounded-2xl p-5 flex flex-col"
      >
        <h2 class="text-base font-semibold text-heading mb-4">
          Status Distribution
        </h2>
        <div class="flex flex-col justify-center gap-3 flex-1">
          <div
            v-for="d in statusDistribution"
            :key="d.status"
            class="flex items-center gap-3"
          >
            <span
              class="text-xs text-body w-24 shrink-0 capitalize lowercase first-letter:uppercase"
              >{{ d.label.toLowerCase() }}</span
            >
            <div
              class="flex-1 h-2.5 rounded-full bg-panel-light overflow-hidden"
            >
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="statusBarColor[d.status]"
                :style="{ width: `${d.pct}%` }"
              ></div>
            </div>
            <span
              class="text-xs font-semibold text-heading w-10 text-right shrink-0"
              >{{ d.count }}</span
            >
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div
        class="md:col-span-2 lg:col-span-1 bg-panel border border-edge rounded-2xl p-5 flex flex-col"
      >
        <h2 class="text-base font-semibold text-heading mb-4">
          Recent Activity
        </h2>
        <div v-if="recent.length" class="flex flex-col gap-3 flex-1">
          <div
            v-for="a in recent.slice(0, 4)"
            :key="a.id"
            class="flex items-start gap-3"
          >
            <span
              class="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"
            ></span>
            <div class="min-w-0">
              <p class="text-[13px] text-heading truncate">
                <span class="font-medium">{{ a.client?.name ?? '—' }}</span>
                <span class="text-subtle"> · {{ a.trackingCode }}</span>
              </p>
              <p class="text-xs text-subtle">
                {{ a.currentStatus.replace(/_/g, ' ').toLowerCase() }} ·
                {{ formatDate(a.createdAt) }}
              </p>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-subtle text-center py-6">
          No recent activity.
        </p>
      </div>
    </section>

    <!-- ── Document Processing Flow ─────────────────────────────────────── -->
    <section class="mt-3">
      <div class="px-5 py-4 rounded-2xl bg-red-500/8 border border-red-500/20">
        <h3 class="text-[15px] font-semibold text-heading mb-1">
          📋 Document Processing Flow
        </h3>
        <p class="text-sm text-body leading-relaxed">
          Each application follows:
          <strong class="text-heading"
            >Received → In Review → In Process → Approved / Rejected →
            Completed</strong
          >
        </p>
      </div>
    </section>
  </div>
</template>
