<script setup lang="ts">
import type { DocStatus } from '../types';
import { statusLabel } from '../utils/formatters';

const props = defineProps<{ currentStatus: DocStatus }>();

const steps: DocStatus[] = ['RECEIVED', 'IN_REVIEW', 'IN_PROCESS', 'APPROVED', 'COMPLETED'];

function stepIndex(status: DocStatus): number {
  if (status === 'REJECTED') return 2; // branch after IN_PROCESS
  return steps.indexOf(status);
}

const currentIdx = stepIndex(props.currentStatus);
const isRejected = props.currentStatus === 'REJECTED';
</script>

<template>
  <div class="w-full">
    <!-- Stepper dots -->
    <div class="flex items-center">
      <template v-for="(step, idx) in steps" :key="step">
        <!-- Connector line -->
        <div
          v-if="idx > 0"
          class="flex-1 h-0.5 transition-colors duration-300"
          :class="idx <= currentIdx && !isRejected ? 'bg-emerald-500' : 'bg-edge'"
        />

        <!-- Step dot -->
        <div class="flex flex-col items-center relative">
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300"
            :class="[
              idx < currentIdx && !isRejected
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : idx === currentIdx && !isRejected
                  ? 'bg-indigo-500 border-indigo-500 text-white ring-4 ring-indigo-500/20'
                  : 'bg-panel border-edge text-subtle',
            ]"
          >
            <!-- Checkmark for completed steps -->
            <svg v-if="idx < currentIdx && !isRejected" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span v-else>{{ idx + 1 }}</span>
          </div>
          <span
            class="absolute -bottom-6 text-[11px] font-medium whitespace-nowrap"
            :class="idx <= currentIdx && !isRejected ? 'text-heading' : 'text-subtle'"
          >
            {{ statusLabel(step) }}
          </span>
        </div>
      </template>
    </div>

    <!-- Rejected branch indicator -->
    <div v-if="isRejected" class="mt-10 flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
      <div class="w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>
      <div>
        <p class="text-sm font-semibold text-rose-400">Application Rejected</p>
        <p class="text-xs text-rose-400/70">Please check the tracking history for details.</p>
      </div>
    </div>

    <!-- Spacer for labels when not rejected -->
    <div v-else class="h-6" />
  </div>
</template>
