<script setup lang="ts">
import { ref } from "vue";
import { trackByCode } from "../api/tracking.api";
import type { PublicTrackingResult } from "../types";
import StatusBadge from "../components/StatusBadge.vue";
import StatusStepper from "../components/StatusStepper.vue";
import TrackingTimeline from "../components/TrackingTimeline.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import { formatDate } from "../utils/formatters";
import PublicNavbar from "../components/PublicNavbar.vue";
import PublicAbout from "../components/PublicAbout.vue"; // 🟢 1. IMPORT KOMPONEN ABOUT BARU
import PublicFooter from "../components/PublicFooter.vue";

const code = ref("");
const result = ref<PublicTrackingResult | null>(null);
const isSearching = ref(false);
const error = ref("");

// State Akordion FAQ
const activeFaqIndex = ref<number | null>(null);

const toggleFaq = (index: number) => {
  activeFaqIndex.value = activeFaqIndex.value === index ? null : index;
};

async function handleTrack(): Promise<void> {
  if (!code.value.trim()) return;
  error.value = "";
  result.value = null;
  isSearching.value = true;

  try {
    result.value = await trackByCode(code.value.trim());
    setTimeout(() => {
      document
        .getElementById("search-result")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Ticket not found";
  } finally {
    isSearching.value = false;
  }
}
</script>

<template>
  <PublicNavbar />

  <div class="min-h-screen bg-dark text-gray-300 flex flex-col">
    <div
      class="w-full bg-dark/75 bg-[url('/design/background-public-tracking.png')] bg-cover bg-center bg-fixed bg-no-repeat bg-blend-overlay border-b border-edge"
    >
      <header class="max-w-xl mx-auto text-center px-6 pt-44 pb-48">
        <div
          class="inline-flex items-center gap-2 text-lg font-bold text-white mb-6"
        >
          <img
            src="/design/logo-square.png"
            alt="Logo Gudang Visa Indonesia Bali"
            width="32"
            height="32"
            fetchpriority="high"
          />
          GudangVisa
        </div>
        <h1 class="text-4xl font-bold text-heading mb-3 max-sm:text-[28px]">
          {{ $t("hero.title") }}
        </h1>
        <p class="text-base text-white/90 mb-8 leading-relaxed">
          {{ $t("hero.subtitle") }}
        </p>

        <form
          @submit.prevent="handleTrack"
          class="flex gap-2 bg-panel border border-edge rounded-2xl p-1.5 transition-colors focus-within:border-indigo-500 max-sm:flex-col shadow-2xl"
        >
          <input
            v-model="code"
            type="text"
            class="flex-1 bg-transparent text-heading text-base px-4 py-3 outline-none placeholder:text-subtle"
            :placeholder="$t('hero.placeholder')"
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
            {{ isSearching ? $t("hero.searching") : $t("hero.button") }}
          </button>
        </form>
      </header>
    </div>

    <main
      v-if="error || result || isSearching"
      id="search-result"
      class="px-6 py-16 bg-dark border-b border-edge"
    >
      <div class="max-w-2xl mx-auto">
        <div
          v-if="error"
          class="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 mb-6"
        >
          {{ error }}
        </div>

        <LoadingSpinner v-if="isSearching" />

        <div v-if="result" class="flex flex-col gap-6">
          <div class="bg-panel border border-edge rounded-2xl p-6 shadow-md">
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

            <StatusStepper :current-status="result.currentStatus" />
          </div>

          <div
            v-if="result.documents.length > 0"
            class="bg-panel border border-edge rounded-2xl p-6 shadow-md"
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

          <div class="bg-panel border border-edge rounded-2xl p-6 shadow-md">
            <h3 class="text-base font-semibold text-heading mb-5">
              Tracking History
            </h3>
            <TrackingTimeline :histories="result.histories" />
          </div>
        </div>
      </div>
    </main>

    <section id="services" class="py-24 px-6 border-b border-edge bg-dark">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2
            class="text-3xl font-bold text-white mb-4 tracking-tight sm:text-4xl"
          >
            {{ $t("services.title") }}
          </h2>
          <p class="text-base text-subtle max-w-2xl mx-auto leading-relaxed">
            {{ $t("services.subtitle") }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            class="bg-panel border border-edge rounded-2xl p-8 transition-all duration-300 hover:border-indigo-500/50 hover:-translate-y-1 flex flex-col gap-5 shadow-lg"
          >
            <div
              class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white mb-2">
                {{ $t("services.visa.title") }}
              </h3>
              <p class="text-sm text-subtle leading-relaxed">
                {{ $t("services.visa.desc") }}
              </p>
            </div>
          </div>

          <div
            class="bg-panel border border-edge rounded-2xl p-8 transition-all duration-300 hover:border-indigo-500/50 hover:-translate-y-1 flex flex-col gap-5 shadow-lg"
          >
            <div
              class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                <rect width="20" height="14" x="2" y="6" rx="2" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white mb-2">
                {{ $t("services.kitas.title") }}
              </h3>
              <p class="text-sm text-subtle leading-relaxed">
                {{ $t("services.kitas.desc") }}
              </p>
            </div>
          </div>

          <div
            class="bg-panel border border-edge rounded-2xl p-8 transition-all duration-300 hover:border-indigo-500/50 hover:-translate-y-1 flex flex-col gap-5 shadow-lg"
          >
            <div
              class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 21v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" />
                <circle cx="12" cy="11" r="2" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white mb-2">
                {{ $t("services.passport.title") }}
              </h3>
              <p class="text-sm text-subtle leading-relaxed">
                {{ $t("services.passport.desc") }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="faq" class="py-24 px-6 border-b border-edge bg-dark">
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-16">
          <h2
            class="text-3xl font-bold text-white mb-4 tracking-tight sm:text-4xl"
          >
            {{ $t("faq.title") }}
          </h2>
          <p class="text-base text-subtle max-w-2xl mx-auto leading-relaxed">
            {{ $t("faq.subtitle") }}
          </p>
        </div>

        <div class="space-y-4">
          <div
            class="bg-panel border border-edge rounded-2xl overflow-hidden shadow-md"
          >
            <button
              @click="toggleFaq(0)"
              class="w-full flex items-center justify-between p-6 text-left text-white font-semibold text-lg hover:text-indigo-400 transition-colors focus:outline-none"
            >
              <span>{{ $t("faq.q1.q") }}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="transform transition-transform duration-200"
                :class="{ 'rotate-180': activeFaqIndex === 0 }"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div
              v-show="activeFaqIndex === 0"
              class="px-6 pb-6 text-sm text-subtle leading-relaxed border-t border-edge/30 pt-4"
            >
              {{ $t("faq.q1.a") }}
            </div>
          </div>

          <div
            class="bg-panel border border-edge rounded-2xl overflow-hidden shadow-md"
          >
            <button
              @click="toggleFaq(1)"
              class="w-full flex items-center justify-between p-6 text-left text-white font-semibold text-lg hover:text-indigo-400 transition-colors focus:outline-none"
            >
              <span>{{ $t("faq.q2.q") }}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="transform transition-transform duration-200"
                :class="{ 'rotate-180': activeFaqIndex === 1 }"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div
              v-show="activeFaqIndex === 1"
              class="px-6 pb-6 text-sm text-subtle leading-relaxed border-t border-edge/30 pt-4"
            >
              {{ $t("faq.q2.a") }}
            </div>
          </div>

          <div
            class="bg-panel border border-edge rounded-2xl overflow-hidden shadow-md"
          >
            <button
              @click="toggleFaq(2)"
              class="w-full flex items-center justify-between p-6 text-left text-white font-semibold text-lg hover:text-indigo-400 transition-colors focus:outline-none"
            >
              <span>{{ $t("faq.q3.q") }}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="transform transition-transform duration-200"
                :class="{ 'rotate-180': activeFaqIndex === 2 }"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div
              v-show="activeFaqIndex === 2"
              class="px-6 pb-6 text-sm text-subtle leading-relaxed border-t border-edge/30 pt-4"
            >
              {{ $t("faq.q3.a") }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <PublicAbout />

    <PublicFooter />
  </div>
</template>
