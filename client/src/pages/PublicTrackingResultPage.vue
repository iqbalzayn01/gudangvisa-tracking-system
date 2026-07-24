<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Home, RefreshCw, FileText } from 'lucide-vue-next';
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { trackByReference, getPublicDownloadUrl } from '../api/tracking.api';
import type { Application, ApplicationDocument } from '../types';
import StatusBadge from '../components/StatusBadge.vue';
import StatusStepper from '../components/StatusStepper.vue';
import TrackingTimeline from '../components/TrackingTimeline.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import { formatDate } from '../utils/formatters';
import { visaTypeLabel } from '../utils/labels';

const route = useRoute();
const router = useRouter();

const referenceNumber = computed(
  () => String(route.params.referenceNumber ?? '').trim(),
);

const application = ref<Application | null>(null);
const isLoading = ref(true);
const error = ref('');
const downloadingId = ref<string | null>(null);

/** Documents ready to download — only once the whole case is completed. */
const downloadableDocs = computed<ApplicationDocument[]>(() => {
  if (!application.value || application.value.currentStatus !== 'completed') {
    return [];
  }
  return application.value.documents ?? [];
});

async function load(): Promise<void> {
  isLoading.value = true;
  error.value = '';
  try {
    application.value = await trackByReference(referenceNumber.value);
  } catch (err) {
    application.value = null;
    error.value =
      err instanceof Error ? err.message : 'Application not found.';
  } finally {
    isLoading.value = false;
  }
}

async function download(doc: ApplicationDocument): Promise<void> {
  downloadingId.value = doc.id;
  try {
    const url = await getPublicDownloadUrl(referenceNumber.value, doc.id);
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Failed to generate download link';
  } finally {
    downloadingId.value = null;
  }
}

onMounted(load);
</script>

<template>
  <div class="min-h-screen bg-dark">
    <header
      class="h-16 bg-panel border-b border-edge flex items-center justify-between gap-4 px-6 sticky top-0 z-30"
    >
      <RouterLink
        to="/portal"
        class="flex items-center gap-2 cursor-pointer h-auto rounded-full"
      >
        <img
          src="/design/logo-square.png"
          alt="Gudang Visa Logo"
          width="32"
          height="32"
          class="shrink-0"
        />
        <span class="text-lg font-bold text-black dark:text-white tracking-wide"
          >GudangVisa</span
        >
      </RouterLink>

      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          class="p-2 rounded-lg text-subtle hover:bg-panel-light hover:text-heading transition-all cursor-pointer h-auto"
          title="Refresh"
          :disabled="isLoading"
          @click="load"
        >
          <RefreshCw :size="18" :class="{ 'animate-spin': isLoading }" />
        </Button>
        <Button
          variant="ghost"
          class="p-2 rounded-lg text-subtle hover:bg-panel-light hover:text-heading transition-all cursor-pointer h-auto"
          title="Home"
          @click="router.push('/portal')"
        >
          <Home :size="18" />
        </Button>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-6 py-8 max-md:px-4">
      <div class="mb-6">
        <h1 class="text-[26px] font-bold text-heading mb-1">
          Lacak Permohonan
        </h1>
        <p class="text-sm text-subtle font-mono tracking-wide">
          {{ referenceNumber }}
        </p>
      </div>

      <LoadingSpinner v-if="isLoading" />

      <div
        v-else-if="error || !application"
        class="text-center py-16 text-subtle"
      >
        <p class="text-lg text-heading font-medium mb-2">
          Permohonan tidak ditemukan
        </p>
        <p class="text-sm mb-6">
          {{ error || 'Periksa kembali nomor resi yang Anda masukkan.' }}
        </p>
        <RouterLink
          to="/portal"
          class="text-sm font-semibold text-red-500 hover:underline"
        >
          Kembali ke halaman pelacakan
        </RouterLink>
      </div>

      <article
        v-else
        class="bg-panel border border-edge rounded-2xl p-6"
      >
        <div class="flex justify-between items-start mb-5 gap-3 flex-wrap">
          <div>
            <p class="text-[13px] text-subtle font-mono tracking-wide mb-1">
              {{ application.trackingCode }}
            </p>
            <h2 class="text-lg font-semibold text-heading">
              {{ visaTypeLabel(application.visaType) }}
            </h2>
            <p class="text-xs text-subtle mt-0.5">
              Diajukan {{ formatDate(application.createdAt) }}
            </p>
          </div>
          <StatusBadge :status="application.currentStatus" />
        </div>

        <StatusStepper :current-status="application.currentStatus" />

        <RouterLink
          :to="`/portal/track/${referenceNumber}/receipt`"
          class="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light hover:text-heading transition-colors"
        >
          <FileText :size="16" />
          Unduh Tanda Terima
        </RouterLink>

        <div
          v-if="downloadableDocs.length > 0"
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
            Dokumen siap diunduh
          </h3>
          <div class="flex flex-col gap-2.5">
            <div
              v-for="doc in downloadableDocs"
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
                <p class="text-xs text-subtle">Dokumen terverifikasi</p>
              </div>
              <Button
                variant="ghost"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer h-auto"
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
                Unduh
              </Button>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-5 border-t border-edge">
          <h3 class="text-sm font-semibold text-heading mb-4">
            Riwayat Pelacakan
          </h3>
          <TrackingTimeline :histories="application.histories ?? []" />
        </div>
      </article>
    </main>
  </div>
</template>
