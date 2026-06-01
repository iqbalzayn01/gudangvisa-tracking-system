<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatFileSize } from '../utils/formatters';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 2 * 1024 * 1024;

defineProps<{ label?: string }>();

const emit = defineEmits<{
  (e: 'select', file: File): void;
  (e: 'clear'): void;
}>();

const selectedFile = ref<File | null>(null);
const isDragging = ref(false);
const error = ref('');

const fileInfo = computed(() => {
  if (!selectedFile.value) return null;
  return {
    name: selectedFile.value.name,
    size: formatFileSize(selectedFile.value.size),
  };
});

function validate(file: File): boolean {
  error.value = '';
  if (!ALLOWED_TYPES.includes(file.type)) {
    error.value = 'Invalid file type. Only JPG, PNG, and PDF files are allowed.';
    return false;
  }
  if (file.size > MAX_SIZE) {
    error.value = `File size (${formatFileSize(file.size)}) exceeds the 2 MB limit.`;
    return false;
  }
  return true;
}

function handleFile(file: File): void {
  if (validate(file)) {
    selectedFile.value = file;
    emit('select', file);
  }
}

function onDrop(e: DragEvent): void {
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) handleFile(file);
}

function onInputChange(e: Event): void {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) handleFile(file);
  input.value = '';
}

function clear(): void {
  selectedFile.value = null;
  error.value = '';
  emit('clear');
}
</script>

<template>
  <div>
    <!-- Drop zone -->
    <div
      v-if="!selectedFile"
      class="relative flex flex-col items-center justify-center gap-2 p-10 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300"
      :class="isDragging ? 'border-red-500 bg-red-500/10' : 'border-edge hover:border-red-500 hover:bg-red-500/5'"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <svg class="text-subtle" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <p class="text-base font-semibold text-heading mt-2">{{ label ?? 'Drag & drop your file here' }}</p>
      <p class="text-sm text-subtle">or click to browse</p>
      <p class="text-xs text-subtle/70 mt-1">JPG, PNG, or PDF — max 2 MB</p>
      <input
        type="file"
        class="absolute inset-0 opacity-0 cursor-pointer"
        accept=".jpg,.jpeg,.png,.pdf"
        @change="onInputChange"
      />
    </div>

    <!-- File preview -->
    <div v-else class="flex items-center gap-3 p-4 border border-edge rounded-xl bg-panel-light">
      <div class="w-11 h-11 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-heading truncate">{{ fileInfo?.name }}</p>
        <p class="text-xs text-subtle mt-0.5">{{ fileInfo?.size }}</p>
      </div>
      <button
        class="p-1 rounded-md text-subtle hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
        title="Remove file"
        @click="clear"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- Error -->
    <p v-if="error" class="mt-2 text-sm text-rose-400">{{ error }}</p>
  </div>
</template>
