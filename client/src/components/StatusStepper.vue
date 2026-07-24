<script setup lang="ts">
import { computed } from 'vue';
import type { ApplicationStatus } from '../types';
import { STATUS_STEPS, applicationStatusLabel } from '../utils/labels';

const props = defineProps<{ currentStatus: ApplicationStatus }>();

// The visible "happy path" of the lifecycle.
const steps = STATUS_STEPS.map((s) => ({
  key: s,
  label: applicationStatusLabel(s),
}));

const isCancelled = computed(() => props.currentStatus === 'cancelled');

const currentIdx = computed(() => {
  if (isCancelled.value) return -1;
  return STATUS_STEPS.indexOf(props.currentStatus);
});

// The application is fully finished — there's no further step to be "in
// progress" toward, so the last dot (Completed) reads as done, not current.
const isFinished = computed(() => props.currentStatus === 'completed');
</script>

<template>
  <div class="w-full">
    <!-- Stepper dots -->
    <div class="flex items-center">
      <template v-for="(step, idx) in steps" :key="step.key">
        <!-- Connector line -->
        <div
          v-if="idx > 0"
          class="flex-1 h-0.5 transition-colors duration-300"
          :class="
            idx <= currentIdx && currentIdx >= 0 ? 'bg-emerald-500' : 'bg-edge'
          "
        />

        <!-- Step dot -->
        <div class="flex flex-col items-center relative">
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300"
            :class="[
              currentIdx >= 0 && (idx < currentIdx || (idx === currentIdx && isFinished))
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : currentIdx >= 0 && idx === currentIdx
                  ? 'bg-red-500 border-red-500 text-white ring-4 ring-red-500/20'
                  : 'bg-panel border-edge text-subtle',
            ]"
          >
            <svg
              v-if="currentIdx >= 0 && (idx < currentIdx || (idx === currentIdx && isFinished))"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span v-else>{{ idx + 1 }}</span>
          </div>
          <span
            class="absolute -bottom-6 text-[11px] font-medium whitespace-nowrap"
            :class="
              idx <= currentIdx && currentIdx >= 0
                ? 'text-heading'
                : 'text-subtle'
            "
          >
            {{ step.label }}
          </span>
        </div>
      </template>
    </div>

    <!-- Cancelled / rejected branch indicator -->
    <div
      v-if="isCancelled"
      class="mt-10 flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
    >
      <div
        class="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>
      <div>
        <p class="text-sm font-semibold text-rose-400">Application Cancelled</p>
        <p class="text-xs text-rose-400/70">
          Please check the tracking history for details.
        </p>
      </div>
    </div>

    <!-- Spacer for labels when on the happy path -->
    <div v-else class="h-6" />
  </div>
</template>
