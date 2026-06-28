<script setup lang="ts">
import { computed } from 'vue';
import type { ApplicationStatus } from '../types';
import { phaseOf, STATUS_PHASES } from '../utils/labels';

const props = defineProps<{ currentStatus: ApplicationStatus }>();

// The visible "happy path" of the lifecycle, by phase.
const steps = STATUS_PHASES.filter((p) => p.key !== 'exception');

const isRejected = computed(
  () =>
    props.currentStatus === 'rejected' || props.currentStatus === 'cancelled',
);
const isOnHold = computed(() => props.currentStatus === 'on_hold');

const currentIdx = computed(() => {
  if (isRejected.value || isOnHold.value) return -1;
  const phase = phaseOf(props.currentStatus);
  return steps.findIndex((s) => s.key === phase);
});
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
              currentIdx >= 0 && idx < currentIdx
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : currentIdx >= 0 && idx === currentIdx
                  ? 'bg-red-500 border-red-500 text-white ring-4 ring-red-500/20'
                  : 'bg-panel border-edge text-subtle',
            ]"
          >
            <svg
              v-if="currentIdx >= 0 && idx < currentIdx"
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

    <!-- On hold indicator -->
    <div
      v-if="isOnHold"
      class="mt-10 flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
    >
      <div
        class="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0"
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
          <line x1="10" y1="15" x2="10" y2="9" />
          <line x1="14" y1="15" x2="14" y2="9" />
        </svg>
      </div>
      <div>
        <p class="text-sm font-semibold text-yellow-500">Application On Hold</p>
        <p class="text-xs text-yellow-500/70">
          Processing is temporarily paused. See the tracking history for details.
        </p>
      </div>
    </div>

    <!-- Rejected / cancelled branch indicator -->
    <div
      v-else-if="isRejected"
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
        <p class="text-sm font-semibold text-rose-400">
          Application {{ currentStatus === 'cancelled' ? 'Cancelled' : 'Rejected' }}
        </p>
        <p class="text-xs text-rose-400/70">
          Please check the tracking history for details.
        </p>
      </div>
    </div>

    <!-- Spacer for labels when on the happy path -->
    <div v-else class="h-6" />
  </div>
</template>
