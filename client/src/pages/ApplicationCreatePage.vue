<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { createApplication } from '../api/applications.api';
import { useClientStore } from '../stores/client.store';
import { useApplicationStore } from '../stores/application.store';
import { useNotificationStore } from '../stores/notification.store';
import type { Application, Priority } from '../types';

const router = useRouter();
const clientStore = useClientStore();
const applicationStore = useApplicationStore();
const notify = useNotificationStore();

const clientId = ref('');
const serviceType = ref('');
const priority = ref<Priority>('MEDIUM');
const isSubmitting = ref(false);
const created = ref<Application | null>(null);

const priorityOptions: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

onMounted(() => {
  if (!clientStore.hasFetched) clientStore.fetchAll();
});

async function handleSubmit(): Promise<void> {
  if (!clientId.value || !serviceType.value.trim()) return;
  isSubmitting.value = true;
  try {
    const application = await createApplication({
      clientId: clientId.value,
      serviceType: serviceType.value.trim(),
      priority: priority.value,
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
  serviceType.value = '';
  priority.value = 'MEDIUM';
  created.value = null;
}
</script>

<template>
  <div class="max-w-lg">
    <div class="mb-8">
      <button
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors mb-3 cursor-pointer"
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
      </button>
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
        <select
          id="tc-client"
          v-model="clientId"
          class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none cursor-pointer appearance-none focus:border-red-500 focus:ring-3 focus:ring-red-500/12"
          required
        >
          <option value="" disabled>Select a client</option>
          <option
            v-for="c in clientStore.sortedClients"
            :key="c.id"
            :value="c.id"
          >
            {{ c.name }} {{ c.passportNumber ? `(${c.passportNumber})` : '' }}
          </option>
        </select>
        <p
          v-if="
            clientStore.sortedClients.length === 0 && clientStore.hasFetched
          "
          class="text-xs text-amber-400"
        >
          No clients found.
          <router-link to="/clients" class="underline"
            >Create one first</router-link
          >.
        </p>
      </div>

      <!-- <div class="flex flex-col gap-1.5">
        <label class="text-[13px] font-semibold text-heading" for="tc-service"
          >Service Type *</label
        >
        <input
          id="tc-service"
          v-model="serviceType"
          type="text"
          class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-red-500 focus:ring-3 focus:ring-red-500/12 placeholder:text-subtle"
          placeholder="e.g. VISA Extension, KITAS Renewal"
          required
        />
      </div> -->

      <div class="flex flex-col gap-1.5">
        <label class="text-[13px] font-semibold text-heading" for="tc-service">
          Service Type *
        </label>
        <select
          id="tc-service"
          v-model="serviceType"
          class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none cursor-pointer appearance-none focus:border-red-500 focus:ring-3 focus:ring-red-500/12"
          required
        >
          <option value="" disabled>Select service type</option>
          <option value="VISA">VISA — Visa Application / Extension</option>
          <option value="KITAS">KITAS — KITAS Renewal / New Application</option>
          <option value="PASSPORT">
            PASSPORT — Passport Application / Renewal
          </option>
        </select>
        <p class="text-xs text-subtle mt-0.5">
          Select the immigration document service for this application.
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
          <option v-for="p in priorityOptions" :key="p" :value="p">
            {{ p.charAt(0) + p.slice(1).toLowerCase() }}
          </option>
        </select>
        <p class="text-xs text-subtle mt-0.5">
          How urgently this application should be handled.
        </p>
      </div>

      <button
        type="submit"
        class="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
        :disabled="isSubmitting || !clientId || !serviceType.trim()"
      >
        <span
          v-if="isSubmitting"
          class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
        />
        {{ isSubmitting ? 'Creating…' : 'Create Application' }}
      </button>
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
          <span class="text-subtle">Service:</span> {{ created.serviceType }}
        </div>
        <div>
          <span class="text-subtle">Status:</span> {{ created.currentStatus }}
        </div>
      </div>
      <div class="flex justify-center gap-3">
        <button
          class="px-5 py-2.5 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer"
          @click="handleReset"
        >
          Create Another
        </button>
        <button
          class="px-5 py-2.5 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
          @click="router.push(`/applications/${created.id}`)"
        >
          View Application
        </button>
      </div>
    </div>
  </div>
</template>
