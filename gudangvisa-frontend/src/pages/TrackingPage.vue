<script setup lang="ts">
import { ref, computed } from 'vue';
import { trackByCode } from '../api/tracking.api';
import type { PublicTrackingResult } from '../types';
import StatusBadge from '../components/StatusBadge.vue';
import StatusStepper from '../components/StatusStepper.vue';
import TrackingTimeline from '../components/TrackingTimeline.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import { formatDate } from '../utils/formatters';
import PublicNavbar from '../components/PublicNavbar.vue';
import PublicFooter from '../components/PublicFooter.vue';

const code = ref('');
const result = ref<PublicTrackingResult | null>(null);
const isSearching = ref(false);
const error = ref('');

/** Documents with COMPLETED or APPROVED status that have a download URL — shown in the dedicated download card. */
const completedDocuments = computed(
  () =>
    result.value?.documents.filter(
      (doc) =>
        (doc.status === 'COMPLETED' || doc.status === 'APPROVED') &&
        doc.fileDownloadUrl,
    ) ?? [],
);

const documentsResult = result.value?.documents.map((doc) => doc.status);

console.log(documentsResult);

/** Remaining public documents that are NOT completed/approved — shown in the generic Documents list. */
const otherDocuments = computed(
  () =>
    result.value?.documents.filter(
      (doc) => doc.status !== 'COMPLETED' && doc.status !== 'APPROVED',
    ) ?? [],
);

async function handleTrack(): Promise<void> {
  if (!code.value.trim()) return;
  error.value = '';
  result.value = null;
  isSearching.value = true;

  try {
    result.value = await trackByCode(code.value.trim());
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ticket not found';
  } finally {
    isSearching.value = false;
  }
}
</script>

<template>
  <PublicNavbar />
  <div
    class="min-h-screen flex flex-col justify-between bg-dark/75 bg-[url('/design/background-public-tracking.png')] bg-cover bg-center bg-fixed bg-no-repeat bg-blend-overlay"
  >
    <!-- Hero section -->
    <header
      class="flex justify-center items-center my-auto px-6 pt-32 pb-16 text-center"
    >
      <div class="max-w-xl mx-auto">
        <div
          class="inline-flex items-center gap-2 text-lg font-bold text-white mb-6"
        >
          <img
            src="/design/logo-square.png"
            alt="Logo Gudang VIsa Indonesia Bali"
            width="32"
            height="32"
            fetchpriority="high"
          />
          GudangVisa
        </div>
        <h1 class="text-4xl font-bold text-heading mb-3 max-sm:text-[28px]">
          Track Your Document
        </h1>
        <p class="text-base text-white mb-8 leading-relaxed">
          Enter your tracking code to see the current status and full history of
          your immigration document.
        </p>

        <form
          @submit.prevent="handleTrack"
          class="flex gap-2 bg-panel border border-edge rounded-2xl p-1.5 transition-colors focus-within:border-indigo-500 max-sm:flex-col"
        >
          <input
            v-model="code"
            type="text"
            class="flex-1 bg-transparent text-heading text-base px-4 py-3 outline-none placeholder:text-subtle"
            placeholder="Enter tracking code (e.g. GVI-1712345678)"
            required
          />
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 px-6 py-3 text-[15px] font-semibold rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-50 cursor-pointer"
            :disabled="isSearching"
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
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {{ isSearching ? 'Searching…' : 'Track' }}
          </button>
        </form>

        <!-- <router-link
          to="/login"
          class="inline-block mt-5 text-sm text-subtle hover:text-indigo-400 transition-colors"
        >
          Staff Login →
        </router-link> -->
      </div>
    </header>

    <!-- Results -->
    <main v-if="error || result || isSearching" class="px-6 pb-30 max-sm:py-6">
      <div class="max-w-2xl mx-auto">
        <div
          v-if="error"
          class="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400"
        >
          {{ error }}
        </div>

        <LoadingSpinner v-if="isSearching" />

        <div v-if="result" class="flex flex-col gap-6">
          <!-- Ticket info card -->
          <div class="bg-panel border border-edge rounded-2xl p-6">
            <div class="flex justify-between items-start mb-5 gap-3 flex-wrap">
              <div>
                <p class="text-[13px] text-subtle font-mono tracking-wide mb-1">
                  {{ result.trackingCode }}
                </p>
                <h2 class="text-xl font-semibold text-heading">
                  {{ result.client.name }}
                </h2>
              </div>
              <StatusBadge :status="result.currentStatus" />
            </div>

            <div class="flex gap-8 flex-wrap mb-6">
              <div class="flex flex-col gap-1">
                <span class="text-[11px] text-subtle uppercase tracking-wider"
                  >Service Type</span
                >
                <span class="text-sm text-heading font-medium">{{
                  result.serviceType
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[11px] text-subtle uppercase tracking-wider"
                  >Handled By</span
                >
                <span class="text-sm text-heading font-medium">{{
                  result.handler.fullName
                }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[11px] text-subtle uppercase tracking-wider"
                  >Created</span
                >
                <span class="text-sm text-heading font-medium">{{
                  formatDate(result.createdAt)
                }}</span>
              </div>
            </div>

            <!-- Status stepper -->
            <StatusStepper :current-status="result.currentStatus" />
          </div>

          <!-- Completed documents download card -->
          <div
            v-if="
              result.currentStatus === 'COMPLETED' &&
              completedDocuments.length > 0
            "
            class="relative bg-panel border border-emerald-500/30 rounded-2xl p-6 overflow-hidden"
          >
            <!-- Subtle gradient accent along the top -->
            <div
              class="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-emerald-500 via-emerald-400 to-teal-400"
            />

            <!-- Header -->
            <div class="flex items-start gap-3 mb-2">
              <div
                class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5"
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
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-semibold text-emerald-400">
                  Your Documents Are Ready
                </h3>
                <p class="text-sm text-subtle mt-0.5 leading-relaxed">
                  Your {{ result.serviceType }} documents have been processed
                  and approved. Download them below.
                </p>
              </div>
            </div>

            <!-- Document list -->
            <div class="flex flex-col gap-2.5 mt-5">
              <div
                v-for="doc in completedDocuments"
                :key="doc.id"
                class="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 transition-colors hover:bg-emerald-500/10"
              >
                <!-- File icon -->
                <div
                  class="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>

                <!-- Name & type -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-heading truncate">
                    {{ doc.docName }}
                  </p>
                  <p class="text-xs text-subtle">{{ doc.docType }}</p>
                </div>

                <!-- Download button -->
                <a
                  :href="doc.fileDownloadUrl!"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shrink-0"
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
                  Download
                </a>
              </div>
            </div>
          </div>

          <!-- Other public documents -->
          <div
            v-if="otherDocuments.length > 0"
            class="bg-panel border border-edge rounded-2xl p-6"
          >
            <h3 class="text-base font-semibold text-heading mb-4">Documents</h3>
            <div class="flex flex-col gap-3">
              <div
                v-for="doc in otherDocuments"
                :key="doc.id"
                class="flex items-center gap-3 p-3 rounded-lg bg-panel-light"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
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
                  <p class="text-xs text-subtle">{{ doc.docType }}</p>
                </div>
                <a
                  v-if="doc.fileDownloadUrl"
                  :href="doc.fileDownloadUrl"
                  target="_blank"
                  class="inline-flex items-center gap-1 text-sm text-indigo-400 hover:underline"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </a>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div class="bg-panel border border-edge rounded-2xl p-6">
            <h3 class="text-base font-semibold text-heading mb-5">
              Tracking History
            </h3>
            <TrackingTimeline :histories="result.histories" />
          </div>
        </div>
      </div>
    </main>
  </div>
  <PublicFooter />
</template>
