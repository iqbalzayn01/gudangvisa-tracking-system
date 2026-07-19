<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
// eslint-disable-next-line import/no-unresolved
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const props = defineProps<{ url: string; title?: string }>();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const isLoading = ref(true);
const errorMsg = ref('');
const numPages = ref(0);
const currentPage = ref(1);

let pdfDoc: PDFDocumentProxy | null = null;
let loadingTask: PDFDocumentLoadingTask | null = null;
let renderTask: RenderTask | null = null;

async function renderPage(pageNum: number): Promise<void> {
  if (!pdfDoc || !canvasRef.value || !containerRef.value) return;
  const page = await pdfDoc.getPage(pageNum);
  const containerWidth = containerRef.value.clientWidth || 600;
  const unscaledViewport = page.getViewport({ scale: 1 });
  const scale = containerWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  renderTask?.cancel();
  renderTask = page.render({ canvasContext: ctx, viewport, canvas });
  await renderTask.promise;
}

async function loadPdf(): Promise<void> {
  isLoading.value = true;
  errorMsg.value = '';
  numPages.value = 0;
  currentPage.value = 1;
  try {
    await loadingTask?.destroy();
    loadingTask = pdfjsLib.getDocument({ url: props.url });
    pdfDoc = await loadingTask.promise;
    numPages.value = pdfDoc.numPages;
    await renderPage(1);
  } catch {
    errorMsg.value = 'Failed to load PDF preview.';
  } finally {
    isLoading.value = false;
  }
}

function goToPage(pageNum: number): void {
  if (pageNum < 1 || pageNum > numPages.value || pageNum === currentPage.value) return;
  currentPage.value = pageNum;
  renderPage(pageNum);
}

onMounted(loadPdf);
watch(() => props.url, loadPdf);
onBeforeUnmount(() => {
  renderTask?.cancel();
  loadingTask?.destroy();
});
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full min-h-[45vh] sm:min-h-[65vh] bg-dark flex items-center justify-center overflow-auto"
  >
    <canvas
      v-show="!isLoading && !errorMsg"
      ref="canvasRef"
      class="max-w-full h-auto"
    />

    <div
      v-if="isLoading"
      class="flex items-center gap-2 text-xs text-subtle"
    >
      <span
        class="w-3 h-3 rounded-full border-2 border-edge border-t-red-500 animate-spin"
      />
      Loading preview…
    </div>

    <div
      v-else-if="errorMsg"
      class="flex flex-col items-center gap-2 text-xs text-subtle p-4 text-center"
    >
      <span>{{ errorMsg }}</span>
      <a :href="url" target="_blank" class="text-red-400 hover:underline"
        >Open in new tab</a
      >
    </div>

    <div
      v-if="!isLoading && !errorMsg && numPages > 1"
      class="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3 py-1.5 rounded-full bg-dark/90 border border-edge text-xs text-subtle"
    >
      <button
        type="button"
        class="px-1.5 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage - 1)"
      >
        ‹ Prev
      </button>
      <span>Page {{ currentPage }} / {{ numPages }}</span>
      <button
        type="button"
        class="px-1.5 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
        :disabled="currentPage >= numPages"
        @click="goToPage(currentPage + 1)"
      >
        Next ›
      </button>
    </div>
  </div>
</template>
