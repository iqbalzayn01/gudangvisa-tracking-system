<script setup lang="ts">
import type { ApplicationStatus } from '../types';
import { applicationStatusLabel, statusBadgeClass } from '../utils/labels';

const props = defineProps<{ status: ApplicationStatus }>();
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap',
      statusBadgeClass(props.status),
    ]"
  >
    {{ applicationStatusLabel(props.status) }}
  </span>
</template>
