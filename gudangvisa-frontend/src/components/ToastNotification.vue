<script setup lang="ts">
import { useNotificationStore } from '../stores/notification.store';

const store = useNotificationStore();
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-5 right-5 z-[2000] flex flex-col gap-2 max-w-sm" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="notification in store.notifications"
          :key="notification.id"
          class="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-panel-light border border-edge shadow-lg text-sm text-heading backdrop-blur-sm"
          :class="{
            'border-l-3 border-l-emerald-500': notification.type === 'success',
            'border-l-3 border-l-rose-500': notification.type === 'error',
            'border-l-3 border-l-amber-500': notification.type === 'warning',
            'border-l-3 border-l-indigo-500': notification.type === 'info',
          }"
        >
          <!-- Icons -->
          <svg v-if="notification.type === 'success'" class="text-emerald-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <svg v-else-if="notification.type === 'error'" class="text-rose-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <svg v-else-if="notification.type === 'warning'" class="text-amber-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <svg v-else class="text-indigo-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>

          <span class="flex-1 leading-snug">{{ notification.message }}</span>

          <button
            class="p-0.5 rounded text-subtle hover:text-heading transition-colors cursor-pointer"
            @click="store.remove(notification.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  animation: toastIn 0.3s ease;
}
.toast-leave-active {
  animation: toastOut 0.25s ease forwards;
}
@keyframes toastIn {
  from { opacity: 0; transform: translateX(40px) scale(0.95); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
}
@keyframes toastOut {
  from { opacity: 1; transform: translateX(0) scale(1); }
  to   { opacity: 0; transform: translateX(40px) scale(0.95); }
}
</style>
