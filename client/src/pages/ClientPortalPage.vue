<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useClientAuthStore } from '../stores/client-auth.store';
import { useNotificationStore } from '../stores/notification.store';
import { getMyApplications, getDocumentDownloadUrl } from '../api/portal.api';
import type { Application, ApplicationDocument } from '../types';
import StatusBadge from '../components/StatusBadge.vue';
import StatusStepper from '../components/StatusStepper.vue';
import TrackingTimeline from '../components/TrackingTimeline.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import { formatDate, formatDateTime } from '../utils/formatters';

const router = useRouter();
const clientAuth = useClientAuthStore();
const notify = useNotificationStore();

/** How often (ms) to silently refetch status so the view stays live. */
const POLL_INTERVAL = 10_000;

const applications = ref<Application[]>([]);
const isLoading = ref(true);
const error = ref('');
const lastUpdated = ref<Date | null>(null);
const downloadingId = ref<string | null>(null);

let pollTimer: ReturnType<typeof setInterval> | null = null;

/** Documents ready for the client to download (verified / approved). */
function downloadableDocs(app: Application): ApplicationDocument[] {
  return (app.documents ?? []).filter((d) => d.status === 'APPROVED');
}

async function load(silent = false): Promise<void> {
  if (!silent) isLoading.value = true;
  try {
    applications.value = await getMyApplications();
    lastUpdated.value = new Date();
    error.value = '';
  } catch (err) {
    // Don't clobber existing data on a transient background poll failure.
    if (!silent) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load your applications';
    }
  } finally {
    if (!silent) isLoading.value = false;
  }
}

async function download(doc: ApplicationDocument): Promise<void> {
  downloadingId.value = doc.id;
  try {
    const url = await getDocumentDownloadUrl(doc.id);
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (err) {
    notify.error(
      err instanceof Error ? err.message : 'Failed to generate download link',
    );
  } finally {
    downloadingId.value = null;
  }
}

async function handleLogout(): Promise<void> {
  await clientAuth.logout();
  router.push('/portal/login');
}

// ── Live updates via polling (no manual refresh needed) ───────────────────
function startPolling(): void {
  stopPolling();
  pollTimer = setInterval(() => {
    // Skip work while the tab is hidden to avoid wasteful requests.
    if (!document.hidden) load(true);
  }, POLL_INTERVAL);
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function onVisibilityChange(): void {
  if (!document.hidden) load(true);
}

onMounted(() => {
  load();
  startPolling();
  document.addEventListener('visibilitychange', onVisibilityChange);
});

onUnmounted(() => {
  stopPolling();
  document.removeEventListener('visibilitychange', onVisibilityChange);
});
</script>

<template>
  <div class="min-h-screen bg-dark">
    <!-- Top bar -->
    <header
      class="h-16 bg-panel border-b border-edge flex items-center justify-between gap-4 px-6 sticky top-0 z-30"
    >
      <div class="flex items-center gap-2.5">
        <span class="text-red-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </span>
        <span class="text-lg font-bold text-heading">GudangVisa</span>
        <span class="text-xs text-subtle hidden sm:inline">Client Portal</span>
      </div>

      <div class="flex items-center gap-4">
        <!-- Live indicator -->
        <span
          class="hidden sm:inline-flex items-center gap-1.5 text-xs text-subtle"
          title="Status updates automatically"
        >
          <span class="relative flex h-2 w-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
            />
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Live
        </span>

        <div class="text-right hidden sm:block">
          <p class="text-[13px] font-semibold text-heading leading-tight">
            {{ clientAuth.user?.fullName ?? 'Client' }}
          </p>
          <p class="text-[11px] text-subtle">{{ clientAuth.user?.email }}</p>
        </div>

        <button
          class="p-2 rounded-lg text-subtle hover:bg-rose-500/10 hover:text-rose-400 transition-all cursor-pointer"
          title="Logout"
          @click="handleLogout"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-6 py-8 max-md:px-4">
      <div class="mb-6">
        <h1 class="text-[26px] font-bold text-heading mb-1">
          Your Applications
        </h1>
        <p class="text-sm text-subtle">
          Track the status of your immigration documents in real time.
          <span v-if="lastUpdated" class="text-subtle/70"
            >Updated {{ formatDateTime(lastUpdated.toISOString()) }}.</span
          >
        </p>
      </div>

      <div
        v-if="error"
        class="px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 mb-4"
      >
        {{ error }}
      </div>

      <LoadingSpinner v-if="isLoading" />

      <div
        v-else-if="applications.length === 0"
        class="text-center py-16 text-subtle"
      >
        <p class="text-lg text-heading font-medium mb-2">No applications yet</p>
        <p class="text-sm">
          Your assigned account manager will register your application shortly.
        </p>
      </div>

      <div v-else class="flex flex-col gap-6">
        <article
          v-for="app in applications"
          :key="app.id"
          class="bg-panel border border-edge rounded-2xl p-6"
        >
          <!-- Header -->
          <div class="flex justify-between items-start mb-5 gap-3 flex-wrap">
            <div>
              <p class="text-[13px] text-subtle font-mono tracking-wide mb-1">
                {{ app.trackingCode }}
              </p>
              <h2 class="text-lg font-semibold text-heading">
                {{ app.visaType ?? app.serviceType }}
              </h2>
              <p class="text-xs text-subtle mt-0.5">
                Submitted {{ formatDate(app.createdAt) }}
              </p>
            </div>
            <StatusBadge :status="app.currentStatus" />
          </div>

          <!-- Stepper -->
          <StatusStepper :current-status="app.currentStatus" />

          <!-- Completed documents -->
          <div
            v-if="downloadableDocs(app).length > 0"
            class="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"
          >
            <h3
              class="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2"
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
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Documents ready to download
            </h3>
            <div class="flex flex-col gap-2.5">
              <div
                v-for="doc in downloadableDocs(app)"
                :key="doc.id"
                class="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
              >
                <div
                  class="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-heading truncate">
                    {{ doc.docName }}
                  </p>
                  <p class="text-xs text-subtle">Approved document</p>
                </div>
                <button
                  class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                  :disabled="downloadingId === doc.id"
                  @click="download(doc)"
                >
                  <span
                    v-if="downloadingId === doc.id"
                    class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                  <svg
                    v-else
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
                  Download
                </button>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div class="mt-6 pt-5 border-t border-edge">
            <h3 class="text-sm font-semibold text-heading mb-4">
              Tracking History
            </h3>
            <TrackingTimeline :histories="app.histories ?? []" />
          </div>
        </article>
      </div>
    </main>
  </div>
</template>
