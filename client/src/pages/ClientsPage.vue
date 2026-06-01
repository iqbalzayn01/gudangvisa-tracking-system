<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useClientStore } from '../stores/client.store';
import { useAuthStore } from '../stores/auth.store';
import { useNotificationStore } from '../stores/notification.store';
import { updateClient } from '../api/clients.api';
import type { Client } from '../types';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import { formatDate } from '../utils/formatters';

const auth = useAuthStore();
const clientStore = useClientStore();
const notify = useNotificationStore();

// ── Search ─────────────────────────────────────────────────────────────────
const searchInput = ref('');
const searchQuery = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(searchInput, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchQuery.value = val;
  }, 200);
});

const filteredClients = computed(() => {
  const list = clientStore.sortedClients;
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.passportNumber ?? '').toLowerCase().includes(q) ||
      (c.nationality ?? '').toLowerCase().includes(q) ||
      (c.contactNumber ?? '').toLowerCase().includes(q),
  );
});

// ── Edit (admin only) ────────────────────────────────────────────────────────
const editTarget = ref<Client | null>(null);
const editName = ref('');
const editNationality = ref('');
const editPhone = ref('');
const isSaving = ref(false);

function openEdit(client: Client): void {
  if (!auth.isAdmin) return;
  editTarget.value = client;
  editName.value = client.name;
  editNationality.value = client.nationality ?? '';
  editPhone.value = client.contactNumber ?? '';
}

function closeEdit(): void {
  editTarget.value = null;
}

async function saveEdit(): Promise<void> {
  if (!editTarget.value) return;
  isSaving.value = true;
  try {
    const updated = await updateClient(editTarget.value.id, {
      name: editName.value.trim(),
      nationality: editNationality.value.trim(),
      contactNumber: editPhone.value.trim(),
    });
    clientStore.updateLocal(updated);
    notify.success('Client updated successfully.');
    closeEdit();
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Failed to update client');
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  if (!clientStore.hasFetched) clientStore.fetchAll();
});

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>

<template>
  <div class="max-w-6xl">
    <!-- Header -->
    <div class="flex justify-between items-start mb-6 gap-4 flex-wrap">
      <div>
        <h1 class="text-[28px] font-bold text-heading mb-1">Clients</h1>
        <p class="text-sm text-subtle">
          {{ auth.isAdmin
            ? 'View clients and edit their name, nationality, and phone.'
            : 'View-only directory of registered clients.' }}
        </p>
      </div>
      <span
        v-if="!auth.isAdmin"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-panel-light border border-edge text-xs text-subtle"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        View only
      </span>
    </div>

    <!-- Search -->
    <div
      class="flex gap-3 mb-4 bg-panel border border-edge rounded-2xl px-4 py-2.5 transition-all focus-within:border-red-500 focus-within:ring-3 focus-within:ring-red-500/12"
    >
      <div class="relative flex-1 flex items-center">
        <svg
          class="absolute left-2.5 text-subtle pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="searchInput"
          type="text"
          class="w-full py-2 pl-9 pr-3 bg-transparent border-none text-sm text-heading outline-none placeholder:text-subtle"
          placeholder="Search name, email, passport, nationality, or phone…"
        />
      </div>
    </div>

    <div
      v-if="clientStore.error"
      class="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-4"
    >
      {{ clientStore.error }}
    </div>

    <LoadingSpinner v-if="clientStore.isLoading" />

    <!-- Table -->
    <div
      v-else-if="filteredClients.length"
      class="bg-panel border border-edge rounded-2xl overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-subtle border-b border-edge">
              <th class="font-medium px-4 py-3">Name</th>
              <th class="font-medium px-4 py-3">Email</th>
              <th class="font-medium px-4 py-3 whitespace-nowrap">Passport</th>
              <th class="font-medium px-4 py-3">Nationality</th>
              <th class="font-medium px-4 py-3 whitespace-nowrap">Phone</th>
              <th class="font-medium px-4 py-3 whitespace-nowrap">Created</th>
              <th v-if="auth.isAdmin" class="font-medium px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in filteredClients"
              :key="c.id"
              class="border-b border-edge/60 last:border-0 hover:bg-panel-light/50 transition-colors"
            >
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-2">
                  <span
                    class="w-7 h-7 rounded-full bg-red-500/12 text-red-400 flex items-center justify-center text-[11px] font-bold shrink-0"
                    >{{ c.name.charAt(0) }}</span
                  >
                  <span class="text-heading font-medium">{{ c.name }}</span>
                </span>
              </td>
              <td class="px-4 py-3 text-subtle">{{ c.email ?? '—' }}</td>
              <td class="px-4 py-3 font-mono text-subtle">
                {{ c.passportNumber ?? '—' }}
              </td>
              <td class="px-4 py-3 text-body">{{ c.nationality ?? '—' }}</td>
              <td class="px-4 py-3 text-body whitespace-nowrap">
                {{ c.contactNumber ?? '—' }}
              </td>
              <td class="px-4 py-3 text-subtle whitespace-nowrap">
                {{ formatDate(c.createdAt) }}
              </td>
              <td v-if="auth.isAdmin" class="px-4 py-3 text-right">
                <button
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg border border-edge text-body hover:bg-panel-light hover:text-heading transition-colors cursor-pointer"
                  @click="openEdit(c)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="text-center py-16 text-subtle">
      <p class="text-lg text-heading font-medium mb-2">No clients found</p>
      <p class="text-sm">Try adjusting your search.</p>
    </div>

    <!-- Edit modal (admin only) -->
    <div
      v-if="editTarget"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      @click.self="closeEdit"
    >
      <div class="w-full max-w-md bg-panel border border-edge rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-heading mb-1">Edit Client</h2>
        <p class="text-xs text-subtle mb-5">
          Only name, nationality, and phone can be changed.
        </p>

        <form class="flex flex-col gap-4" @submit.prevent="saveEdit">
          <!-- Read-only identity fields -->
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-semibold text-subtle">Email</label>
              <input
                :value="editTarget.email ?? '—'"
                disabled
                class="w-full px-3 py-2 text-sm text-subtle bg-panel-light/50 border border-edge rounded-lg outline-none cursor-not-allowed"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-semibold text-subtle">Passport</label>
              <input
                :value="editTarget.passportNumber ?? '—'"
                disabled
                class="w-full px-3 py-2 text-sm text-subtle bg-panel-light/50 border border-edge rounded-lg outline-none cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-heading" for="edit-name"
              >Name</label
            >
            <input
              id="edit-name"
              v-model="editName"
              type="text"
              required
              minlength="2"
              class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none transition-all focus:border-red-500 focus:ring-3 focus:ring-red-500/12"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label
              class="text-[13px] font-semibold text-heading"
              for="edit-nationality"
              >Nationality</label
            >
            <input
              id="edit-nationality"
              v-model="editNationality"
              type="text"
              class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none transition-all focus:border-red-500 focus:ring-3 focus:ring-red-500/12"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-heading" for="edit-phone"
              >Phone</label
            >
            <input
              id="edit-phone"
              v-model="editPhone"
              type="text"
              class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none transition-all focus:border-red-500 focus:ring-3 focus:ring-red-500/12"
            />
          </div>

          <div class="flex gap-3 justify-end mt-2">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer"
              @click="closeEdit"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              :disabled="isSaving"
            >
              <span
                v-if="isSaving"
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              />
              {{ isSaving ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
