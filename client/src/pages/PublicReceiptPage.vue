<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-vue-next';
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { trackByReference } from '../api/tracking.api';
import type { Application } from '../types';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import { formatDate, formatDateTime } from '../utils/formatters';
import { applicationStatusLabel, visaTypeLabel } from '../utils/labels';

const route = useRoute();

const referenceNumber = computed(
  () => String(route.params.referenceNumber ?? '').trim(),
);

const application = ref<Application | null>(null);
const isLoading = ref(true);
const error = ref('');
const generatedAt = new Date();

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

function printPage(): void {
  window.print();
}

onMounted(load);
</script>

<template>
  <div class="min-h-screen bg-dark print:bg-white">
    <!-- Screen-only toolbar -->
    <header
      class="print:hidden h-16 bg-panel border-b border-edge flex items-center justify-between gap-4 px-6 sticky top-0 z-30"
    >
      <RouterLink
        :to="`/portal/track/${referenceNumber}`"
        class="inline-flex items-center gap-2 text-sm font-semibold text-body hover:text-heading transition-colors"
      >
        <ArrowLeft :size="18" />
        Kembali
      </RouterLink>
      <Button
        variant="ghost"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer h-auto"
        @click="printPage"
      >
        <Printer :size="16" />
        Cetak / Simpan PDF
      </Button>
    </header>

    <LoadingSpinner v-if="isLoading" class="print:hidden" />

    <div
      v-else-if="error || !application"
      class="print:hidden text-center py-16 text-subtle"
    >
      <p class="text-lg text-heading font-medium mb-2">
        Permohonan tidak ditemukan
      </p>
      <p class="text-sm">{{ error || 'Periksa kembali nomor resi Anda.' }}</p>
    </div>

    <!-- Receipt sheet -->
    <main
      v-else
      class="max-w-2xl mx-auto px-6 py-10 print:p-0 print:max-w-full"
    >
      <article
        class="bg-white text-black rounded-2xl border border-edge p-8 print:rounded-none print:border-0 print:p-10"
      >
        <!-- Letterhead -->
        <div
          class="flex items-center justify-between gap-4 pb-5 mb-6 border-b-2 border-black"
        >
          <div class="flex items-center gap-3">
            <img
              src="/design/logo-square.png"
              alt="Gudang Visa Logo"
              width="40"
              height="40"
            />
            <div>
              <p class="text-lg font-bold leading-tight">GudangVisa</p>
              <p class="text-xs text-neutral-600 leading-tight">
                Layanan Dokumen Imigrasi — Bali, Indonesia
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-bold uppercase tracking-wide">
              Tanda Terima
            </p>
            <p class="text-xs text-neutral-600">Receipt of Submission</p>
          </div>
        </div>

        <!-- Reference -->
        <div class="mb-6 text-center">
          <p class="text-xs text-neutral-600 uppercase tracking-wide mb-1">
            Nomor Resi
          </p>
          <p class="text-2xl font-bold font-mono tracking-widest">
            {{ application.trackingCode }}
          </p>
        </div>

        <!-- Details -->
        <dl class="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mb-6">
          <div>
            <dt class="text-neutral-600">Nama Klien</dt>
            <dd class="font-semibold">
              {{ application.client?.name ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-neutral-600">Jenis Layanan</dt>
            <dd class="font-semibold">
              {{ visaTypeLabel(application.visaType) }}
            </dd>
          </div>
          <div>
            <dt class="text-neutral-600">Tanggal Pengajuan</dt>
            <dd class="font-semibold">
              {{ formatDate(application.createdAt) }}
            </dd>
          </div>
          <div>
            <dt class="text-neutral-600">Status Saat Ini</dt>
            <dd class="font-semibold">
              {{ applicationStatusLabel(application.currentStatus) }}
            </dd>
          </div>
        </dl>

        <!-- Documents on file -->
        <div class="mb-6">
          <p
            class="text-xs text-neutral-600 uppercase tracking-wide mb-2 pb-1 border-b border-neutral-300"
          >
            Dokumen Diterima
          </p>
          <ul
            v-if="application.documents && application.documents.length"
            class="text-sm flex flex-col gap-1.5"
          >
            <li
              v-for="doc in application.documents"
              :key="doc.id"
              class="flex justify-between gap-3"
            >
              <span>{{ doc.docName }}</span>
              <span class="text-neutral-600 shrink-0">{{
                formatDate(doc.createdAt)
              }}</span>
            </li>
          </ul>
          <p v-else class="text-sm text-neutral-500">
            Dokumen belum tercatat pada sistem.
          </p>
        </div>

        <!-- Footer -->
        <div class="pt-4 border-t border-neutral-300 text-[11px] text-neutral-500">
          <p>
            Dokumen ini dibuat otomatis oleh sistem GudangVisa pada
            {{ formatDateTime(generatedAt.toISOString()) }} sebagai bukti
            tanda terima pengajuan. Bukan merupakan dokumen resmi keimigrasian.
          </p>
        </div>
      </article>
    </main>
  </div>
</template>

<style scoped>
@media print {
  :deep(body) {
    background: white;
  }
}
</style>
