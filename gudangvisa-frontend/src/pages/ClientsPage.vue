<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { createClient, deleteClient } from '../api/clients.api';
import { useClientStore } from '../stores/client.store';
import { useAuthStore } from '../stores/auth.store';
import { useNotificationStore } from '../stores/notification.store';
import type { Client } from '../types';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { formatDate } from '../utils/formatters';

const auth = useAuthStore();
const clientStore = useClientStore();
const notify = useNotificationStore();

const showForm = ref(false);
const newName = ref('');
const newPassport = ref('');
const newContact = ref('');
const isCreating = ref(false);
const deleteTarget = ref<Client | null>(null);
const isDeleting = ref(false);

// ── Search & Filter state ────────────────────────────────────────────────────
const searchInput = ref('');
const searchQuery = ref('');
const filterField = ref<'all' | 'name' | 'passportNumber' | 'contactNumber'>(
  'all',
);
const searchRef = ref<HTMLInputElement | null>(null);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(searchInput, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchQuery.value = val;
  }, 200);
});

const filterOptions = [
  { label: 'All Fields', value: 'all' as const },
  { label: 'Name', value: 'name' as const },
  { label: 'Passport No.', value: 'passportNumber' as const },
  { label: 'Contact', value: 'contactNumber' as const },
];

const filteredClients = computed(() => {
  let list = clientStore.sortedClients;
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter((c) => {
    if (filterField.value === 'name') return c.name.toLowerCase().includes(q);
    if (filterField.value === 'passportNumber')
      return (c.passportNumber ?? '').toLowerCase().includes(q);
    if (filterField.value === 'contactNumber')
      return (c.contactNumber ?? '').toLowerCase().includes(q);
    return (
      c.name.toLowerCase().includes(q) ||
      (c.passportNumber ?? '').toLowerCase().includes(q) ||
      (c.contactNumber ?? '').toLowerCase().includes(q)
    );
  });
});

const hasActiveFilters = computed(
  () => searchQuery.value.trim() !== '' || filterField.value !== 'all',
);
const activeFilterLabel = computed(
  () =>
    filterOptions.find((o) => o.value === filterField.value)?.label ??
    'All Fields',
);

function clearAllFilters() {
  searchInput.value = '';
  searchQuery.value = '';
  filterField.value = 'all';
}

// Keyboard shortcut: Ctrl+K to focus search
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    nextTick(() => searchRef.value?.focus());
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  if (!clientStore.hasFetched) clientStore.fetchAll();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  if (debounceTimer) clearTimeout(debounceTimer);
});

// ── Highlight helper ─────────────────────────────────────────────────────────
function highlight(text: string): string {
  const q = searchQuery.value.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark class="hl">$1</mark>',
  );
}

// ── CRUD ─────────────────────────────────────────────────────────────────────
async function handleCreate(): Promise<void> {
  isCreating.value = true;
  try {
    const client = await createClient({
      name: newName.value.trim(),
      passportNumber: newPassport.value.trim() || undefined,
      contactNumber: newContact.value.trim() || undefined,
    });
    clientStore.addLocal(client);
    notify.success('Client created successfully');
    showForm.value = false;
    newName.value = '';
    newPassport.value = '';
    newContact.value = '';
  } catch (err) {
    notify.error(
      err instanceof Error ? err.message : 'Failed to create client',
    );
  } finally {
    isCreating.value = false;
  }
}

async function handleDelete(): Promise<void> {
  if (!deleteTarget.value) return;
  const id = deleteTarget.value.id;
  isDeleting.value = true;
  try {
    await deleteClient(id);
    clientStore.removeLocal(id);
    notify.success('Client deleted');
    deleteTarget.value = null;
  } catch (err) {
    notify.error(
      err instanceof Error ? err.message : 'Failed to delete client',
    );
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <div class="flex justify-between items-start mb-6 gap-4 flex-wrap">
      <div>
        <h1 class="text-[28px] font-bold text-heading mb-1">Clients</h1>
        <p class="text-sm text-subtle">
          {{ clientStore.totalCount }} client{{
            clientStore.totalCount !== 1 ? 's' : ''
          }}
          registered
        </p>
      </div>
      <button
        class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors cursor-pointer"
        @click="showForm = !showForm"
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
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Client
      </button>
    </div>

    <!-- ── Search & Filter Bar ──────────────────────────────────────────── -->
    <div
      class="flex gap-3 mb-4 bg-panel border border-edge rounded-2xl px-4 py-2.5 transition-all focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/12"
    >
      <div class="relative flex-1 flex items-center">
        <svg
          class="absolute left-2.5 text-subtle pointer-events-none transition-colors"
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
          ref="searchRef"
          v-model="searchInput"
          type="text"
          class="w-full py-2 pl-9 pr-16 bg-transparent border-none text-sm text-heading outline-none placeholder:text-subtle"
          placeholder="Search clients…"
        />
        <kbd
          v-if="!searchInput"
          class="absolute right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-panel-light border border-edge text-subtle pointer-events-none whitespace-nowrap"
          >Ctrl K</kbd
        >
        <button
          v-else
          class="absolute right-2 p-1 rounded-md bg-panel-light text-subtle hover:text-heading hover:bg-edge transition-colors cursor-pointer"
          @click="
            searchInput = '';
            searchQuery = '';
          "
          title="Clear search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <select
        v-model="filterField"
        class="px-3 py-2 bg-panel-light border border-edge rounded-lg text-heading text-[13px] outline-none cursor-pointer min-w-32.5 transition-colors focus:border-indigo-500"
      >
        <option
          v-for="opt in filterOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- ── Active Filters Summary ───────────────────────────────────────── -->
    <Transition name="slide">
      <div
        v-if="hasActiveFilters"
        class="flex items-center justify-between gap-3 px-4 py-2 mb-4 bg-indigo-500/8 border border-indigo-500/20 rounded-xl"
      >
        <div class="flex gap-2 flex-wrap">
          <span
            v-if="searchQuery.trim()"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-panel border border-edge text-xs font-medium text-body"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            "{{ searchQuery.trim() }}"
            <button
              class="text-subtle hover:text-rose-400 font-bold leading-none cursor-pointer"
              @click="
                searchInput = '';
                searchQuery = '';
              "
            >
              ×
            </button>
          </span>
          <span
            v-if="filterField !== 'all'"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-panel border border-edge text-xs font-medium text-body"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {{ activeFilterLabel }}
            <button
              class="text-subtle hover:text-rose-400 font-bold leading-none cursor-pointer"
              @click="filterField = 'all'"
            >
              ×
            </button>
          </span>
        </div>
        <div class="flex items-center gap-3 whitespace-nowrap">
          <span class="text-[13px] font-bold text-indigo-400"
            >{{ filteredClients.length }}
            <span class="font-normal text-subtle"
              >of {{ clientStore.totalCount }}</span
            ></span
          >
          <button
            class="text-xs text-subtle underline underline-offset-2 hover:text-heading transition-colors cursor-pointer"
            @click="clearAllFilters"
          >
            Clear all
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── Create Form ──────────────────────────────────────────────────── -->
    <Transition name="slide">
      <div
        v-if="showForm"
        class="bg-panel border border-edge rounded-2xl p-6 mb-6"
      >
        <h3 class="text-base font-semibold text-heading mb-4">New Client</h3>
        <form @submit.prevent="handleCreate" class="flex flex-col gap-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading"
                >Name *</label
              >
              <input
                v-model="newName"
                type="text"
                class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/12 placeholder:text-subtle"
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading"
                >Passport Number</label
              >
              <input
                v-model="newPassport"
                type="text"
                class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/12 placeholder:text-subtle"
                placeholder="e.g. A12345678"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading"
                >Contact Number</label
              >
              <input
                v-model="newContact"
                type="text"
                class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/12 placeholder:text-subtle"
                placeholder="e.g. +62812..."
              />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="px-5 py-2.5 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer"
              @click="showForm = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2.5 text-sm font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-50 cursor-pointer"
              :disabled="isCreating"
            >
              {{ isCreating ? 'Creating…' : 'Create Client' }}
            </button>
          </div>
        </form>
      </div>
    </Transition>

    <LoadingSpinner v-if="clientStore.isLoading && !clientStore.hasFetched" />

    <div
      v-else-if="filteredClients.length > 0"
      class="bg-panel border border-edge rounded-2xl overflow-hidden"
    >
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-panel-light">
            <th
              class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge"
            >
              Name
            </th>
            <th
              class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge"
            >
              Passport
            </th>
            <th
              class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge"
            >
              Contact
            </th>
            <th
              class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge"
            >
              Created
            </th>
            <th class="px-4 py-3 border-b border-edge w-12"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in filteredClients"
            :key="c.id"
            class="hover:bg-panel-light transition-colors"
          >
            <td
              class="px-4 py-3 text-sm text-heading font-medium border-b border-edge last:border-b-0"
              v-html="highlight(c.name)"
            ></td>
            <td
              class="px-4 py-3 text-sm text-body border-b border-edge font-mono"
              v-html="highlight(c.passportNumber ?? '—')"
            ></td>
            <td
              class="px-4 py-3 text-sm text-body border-b border-edge"
              v-html="highlight(c.contactNumber ?? '—')"
            ></td>
            <td
              class="px-4 py-3 text-[13px] text-subtle border-b border-edge whitespace-nowrap"
            >
              {{ formatDate(c.createdAt) }}
            </td>
            <td class="px-4 py-3 border-b border-edge">
              <button
                v-if="auth.isAdmin"
                class="p-1.5 rounded-md text-subtle hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Delete"
                @click="deleteTarget = c"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-else-if="clientStore.hasFetched"
      class="text-center py-16 text-subtle"
    >
      <p class="text-lg text-heading font-medium mb-2">
        {{
          clientStore.totalCount === 0 ? 'No clients yet' : 'No results found'
        }}
      </p>
      <p class="text-sm mb-5">
        {{
          clientStore.totalCount === 0
            ? 'Add your first client to get started.'
            : 'Try adjusting your search or filter.'
        }}
      </p>
      <button
        v-if="clientStore.totalCount === 0"
        class="px-5 py-2.5 text-sm font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors cursor-pointer"
        @click="showForm = true"
      >
        Add First Client
      </button>
    </div>

    <ConfirmDialog
      v-if="deleteTarget"
      title="Delete Client"
      :message="`Are you sure you want to delete ${deleteTarget.name}? This cannot be undone.`"
      confirm-text="Delete"
      variant="danger"
      @confirm="handleDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<style scoped>
.slide-enter-active {
  animation: slideDown 0.25s ease;
}
.slide-leave-active {
  animation: slideDown 0.2s ease reverse;
}
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Search highlight */
:deep(.hl) {
  background: rgba(99, 102, 241, 0.25);
  color: inherit;
  padding: 0 2px;
  border-radius: 3px;
}
</style>
