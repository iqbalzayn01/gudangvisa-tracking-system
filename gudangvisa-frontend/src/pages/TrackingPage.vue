<script setup lang="ts">
import { ref } from 'vue';
import { trackByCode } from '../api/tracking.api';
import type { PublicTrackingResult } from '../types';
import StatusBadge from '../components/StatusBadge.vue';
import StatusStepper from '../components/StatusStepper.vue';
import TrackingTimeline from '../components/TrackingTimeline.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import { formatDate } from '../utils/formatters';

const code = ref('');
const result = ref<PublicTrackingResult | null>(null);
const isSearching = ref(false);
const error = ref('');

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
  <div
    class="min-h-screen bg-dark/75 bg-[url('/design/background-public-tracking.png')] bg-cover bg-center bg-fixed bg-no-repeat bg-blend-overlay"
  >
    <!-- Hero section -->
    <header
      class="flex justify-center items-center px-6 pt-20 pb-16 text-center"
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
    <main v-if="error || result || isSearching" class="px-6 py-10 max-sm:py-6">
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

          <!-- Public documents -->
          <div
            v-if="result.documents.length > 0"
            class="bg-panel border border-edge rounded-2xl p-6"
          >
            <h3 class="text-base font-semibold text-heading mb-4">Documents</h3>
            <div class="flex flex-col gap-3">
              <div
                v-for="doc in result.documents"
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
</template>
