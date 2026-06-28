<script setup lang="ts">
import { Button } from '@/components/ui/button';
import ClientCombobox from '@/components/ClientCombobox.vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createApplication } from '../api/applications.api';
import { useClientStore } from '../stores/client.store';
import { useApplicationStore } from '../stores/application.store';
import { useNotificationStore } from '../stores/notification.store';
import type { Application, Priority, VisaType } from '../types';
import {
  VISA_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
  visaTypeLabel,
  applicationStatusLabel,
} from '../utils/labels';

const router = useRouter();
const clientStore = useClientStore();
const applicationStore = useApplicationStore();
const notify = useNotificationStore();

const clientId = ref('');
const visaType = ref<VisaType | ''>('');
const priority = ref<Priority>('medium');
const notes = ref('');
const isSubmitting = ref(false);
const created = ref<Application | null>(null);

const visaTypeOptions = VISA_TYPE_OPTIONS;
const priorityOptions = PRIORITY_OPTIONS;

onMounted(() => {
  if (!clientStore.hasFetched) clientStore.fetchAll();
});

async function handleSubmit(): Promise<void> {
  if (!clientId.value || !visaType.value) return;
  isSubmitting.value = true;
  try {
    const application = await createApplication({
      clientId: clientId.value,
      visaType: visaType.value,
      priority: priority.value,
      notes: notes.value.trim() || undefined,
    });
    applicationStore.addLocal(application);
    created.value = application;
    notify.success('Application created successfully!');
  } catch (err) {
    notify.error(
      err instanceof Error ? err.message : 'Failed to create application',
    );
  } finally {
    isSubmitting.value = false;
  }
}

function handleReset(): void {
  clientId.value = '';
  visaType.value = '';
  priority.value = 'medium';
  notes.value = '';
  created.value = null;
}
</script>

<template>
  <div class="max-w-lg">
    <div class="mb-8">
      <Button variant="ghost"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors mb-3 cursor-pointer h-auto"
        @click="router.push('/applications')"
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
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back
      </Button>
      <h1 class="text-[28px] font-bold text-heading">New Application</h1>
      <p class="text-sm text-subtle mt-1">
        Register a new immigration document application for a client.
      </p>
    </div>

    <!-- Form -->
    <form
      v-if="!created"
      class="bg-panel border border-edge rounded-2xl p-6 flex flex-col gap-5"
      @submit.prevent="handleSubmit"
    >
      <div class="flex flex-col gap-1.5">
        <label class="text-[13px] font-semibold text-heading" for="tc-client"
          >Client *</label
        >
        <ClientCombobox id="tc-client" v-model="clientId" />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[13px] font-semibold text-heading" for="tc-service">
          Visa Type *
        </label>
        <select
          id="tc-service"
          v-model="visaType"
          class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none cursor-pointer appearance-none focus:border-red-500 focus:ring-3 focus:ring-red-500/12"
          required
        >
          <option value="" disabled>Select visa type</option>
          <option v-for="o in visaTypeOptions" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </select>
        <p class="text-xs text-subtle mt-0.5">
          The correct type sets the right document checklist for this case.
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[13px] font-semibold text-heading" for="tc-priority">
          Priority
        </label>
        <select
          id="tc-priority"
          v-model="priority"
          class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-full outline-none cursor-pointer appearance-none focus:border-red-500 focus:ring-3 focus:ring-red-500/12"
        >
          <option v-for="p in priorityOptions" :key="p.value" :value="p.value">
            {{ p.label }}
          </option>
        </select>
        <p class="text-xs text-subtle mt-0.5">
          How urgently this application should be handled.
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[13px] font-semibold text-heading" for="tc-notes">
          Notes
        </label>
        <textarea
          id="tc-notes"
          v-model="notes"
          rows="3"
          class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-red-500 focus:ring-3 focus:ring-red-500/12 placeholder:text-subtle resize-y"
          placeholder="Optional internal notes about this application."
        />
      </div>

      <Button variant="ghost"
        type="submit"
        class="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer h-auto"
        :disabled="isSubmitting || !clientId || !visaType"
      >
        <span
          v-if="isSubmitting"
          class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
        />
        {{ isSubmitting ? 'Creating…' : 'Create Application' }}
      </Button>
    </form>

    <!-- Success -->
    <div
      v-if="created"
      class="bg-panel border border-edge rounded-2xl p-10 text-center"
    >
      <div class="text-emerald-400 mb-4">
        <svg
          class="mx-auto"
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-heading mb-2">Application Created!</h2>
      <p class="text-[15px] text-subtle mb-5">
        Share this reference number with the client:
      </p>
      <div class="mb-6">
        <code
          class="text-[28px] font-bold text-red-400 bg-red-500/10 px-6 py-3 rounded-xl tracking-widest"
          >{{ created.trackingCode }}</code
        >
      </div>
      <div class="flex flex-col gap-2 text-sm text-body mb-6">
        <div>
          <span class="text-subtle">Visa Type:</span>
          {{ visaTypeLabel(created.visaType) }}
        </div>
        <div>
          <span class="text-subtle">Status:</span>
          {{ applicationStatusLabel(created.currentStatus) }}
        </div>
      </div>
      <div class="flex justify-center gap-3">
        <Button variant="ghost"
          class="px-5 py-2.5 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer h-auto"
          @click="handleReset"
        >
          Create Another
        </Button>
        <Button variant="ghost"
          class="px-5 py-2.5 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer h-auto"
          @click="router.push(`/applications/${created.id}`)"
        >
          View Application
        </Button>
      </div>
    </div>
  </div>
</template>
