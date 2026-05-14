<script setup lang="ts">
defineProps<{
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}>();

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] animate-fade-in"
      @click.self="emit('cancel')"
    >
      <div
        class="bg-panel border border-edge rounded-2xl p-7 max-w-md w-[90%] shadow-2xl animate-slide-up"
        role="alertdialog"
        :aria-label="title"
      >
        <h3 class="text-lg font-semibold text-heading mb-2">{{ title }}</h3>
        <p class="text-sm text-body leading-relaxed mb-6">{{ message }}</p>
        <div class="flex justify-end gap-2">
          <button
            class="px-5 py-2.5 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer"
            @click="emit('cancel')"
          >
            {{ cancelText ?? 'Cancel' }}
          </button>
          <button
            class="px-5 py-2.5 text-sm font-semibold rounded-lg text-white transition-colors cursor-pointer"
            :class="variant === 'danger' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-500 hover:bg-indigo-600'"
            @click="emit('confirm')"
          >
            {{ confirmText ?? 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease;
}
.animate-slide-up {
  animation: slideUp 0.25s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
