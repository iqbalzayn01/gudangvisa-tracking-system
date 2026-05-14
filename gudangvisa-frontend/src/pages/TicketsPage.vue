<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { deleteTicket } from '../api/tickets.api';
import { useAuthStore } from '../stores/auth.store';
import { useTicketStore } from '../stores/ticket.store';
import { useNotificationStore } from '../stores/notification.store';
import type { DocStatus } from '../types';
import StatusBadge from '../components/StatusBadge.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { formatDateTime } from '../utils/formatters';
import { copyToClipboard } from '../utils/clipboard';

const router = useRouter();
const auth = useAuthStore();
const ticketStore = useTicketStore();
const notify = useNotificationStore();

const deleteTargetId = ref<string | null>(null);

// ── Search & Filter state ────────────────────────────────────────────────────
const searchInput = ref('');
const searchQuery = ref('');
const filterField = ref<'all' | 'code' | 'client' | 'service' | 'handler'>(
  'all',
);
const filterStatus = ref<DocStatus | ''>('');
const searchRef = ref<HTMLInputElement | null>(null);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(searchInput, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchQuery.value = val;
  }, 200);
});

const fieldOptions = [
  { label: 'All Fields', value: 'all' as const },
  { label: 'Code', value: 'code' as const },
  { label: 'Client', value: 'client' as const },
  { label: 'Service', value: 'service' as const },
  { label: 'Handler', value: 'handler' as const },
];

const statusOptions: DocStatus[] = [
  'RECEIVED',
  'IN_REVIEW',
  'IN_PROCESS',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
];

const filteredTickets = computed(() => {
  let list = ticketStore.sortedTickets;
  if (filterStatus.value)
    list = list.filter((t) => t.currentStatus === filterStatus.value);
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter((t) => {
      if (filterField.value === 'code')
        return t.trackingCode.toLowerCase().includes(q);
      if (filterField.value === 'client')
        return (t.client?.name ?? '').toLowerCase().includes(q);
      if (filterField.value === 'service')
        return t.serviceType.toLowerCase().includes(q);
      if (filterField.value === 'handler')
        return (t.handler?.fullName ?? '').toLowerCase().includes(q);
      return (
        t.trackingCode.toLowerCase().includes(q) ||
        (t.client?.name ?? '').toLowerCase().includes(q) ||
        t.serviceType.toLowerCase().includes(q) ||
        (t.handler?.fullName ?? '').toLowerCase().includes(q)
      );
    });
  }
  return list;
});

const hasActiveFilters = computed(
  () =>
    searchQuery.value.trim() !== '' ||
    filterField.value !== 'all' ||
    filterStatus.value !== '',
);
const activeFieldLabel = computed(
  () =>
    fieldOptions.find((o) => o.value === filterField.value)?.label ??
    'All Fields',
);

function clearAllFilters() {
  searchInput.value = '';
  searchQuery.value = '';
  filterField.value = 'all';
  filterStatus.value = '';
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    nextTick(() => searchRef.value?.focus());
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  if (!ticketStore.hasFetched) ticketStore.fetchAll();
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

async function handleDelete(): Promise<void> {
  if (!deleteTargetId.value) return;
  const id = deleteTargetId.value;
  try {
    await deleteTicket(id);
    ticketStore.removeLocal(id);
    notify.success('Ticket deleted');
  } catch (err) {
    notify.error(
      err instanceof Error ? err.message : 'Failed to delete ticket',
    );
  } finally {
    deleteTargetId.value = null;
  }
}
</script>

<template>
  <div class="max-w-5xl">
    <div class="flex justify-between items-start mb-6 gap-4 flex-wrap">
      <div>
        <h1 class="text-[28px] font-bold text-heading mb-1">Tickets</h1>
        <p class="text-sm text-subtle">
          {{ ticketStore.totalCount }} ticket{{
            ticketStore.totalCount !== 1 ? 's' : ''
          }}
          total
        </p>
      </div>
      <div class="flex gap-2 items-center">
        <button
          class="p-2.5 rounded-lg border border-edge text-subtle hover:bg-panel-light transition-colors cursor-pointer"
          :disabled="ticketStore.isLoading"
          title="Refresh"
          @click="ticketStore.fetchAll()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            :class="{ 'animate-spin': ticketStore.isLoading }"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path
              d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
            />
          </svg>
        </button>
        <button
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors cursor-pointer"
          @click="router.push('/tickets/create')"
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
          New Ticket
        </button>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="ticketStore.error"
      class="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 mb-4"
    >
      {{ ticketStore.error }}
      <button
        class="ml-auto px-3 py-1 text-[13px] rounded-md border border-edge text-body hover:bg-panel-light cursor-pointer"
        @click="ticketStore.fetchAll()"
      >
        Retry
      </button>
    </div>

    <!-- ── Search & Filter Bar ──────────────────────────────────────────── -->
    <div
      class="flex gap-3 mb-4 bg-panel border border-edge rounded-2xl px-4 py-2.5 transition-all focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/12"
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
          ref="searchRef"
          v-model="searchInput"
          type="text"
          class="w-full py-2 pl-9 pr-16 bg-transparent border-none text-sm text-heading outline-none placeholder:text-subtle"
          placeholder="Search tickets…"
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
        class="px-3 py-2 bg-panel-light border border-edge rounded-lg text-heading text-[13px] outline-none cursor-pointer min-w-30 transition-colors focus:border-indigo-500"
      >
        <option v-for="opt in fieldOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <select
        v-model="filterStatus"
        class="px-3 py-2 bg-panel-light border border-edge rounded-lg text-heading text-[13px] outline-none cursor-pointer min-w-32.5 transition-colors focus:border-indigo-500"
      >
        <option value="">All Statuses</option>
        <option v-for="s in statusOptions" :key="s" :value="s">
          {{ s.replace(/_/g, ' ') }}
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
            {{ activeFieldLabel }}
            <button
              class="text-subtle hover:text-rose-400 font-bold leading-none cursor-pointer"
              @click="filterField = 'all'"
            >
              ×
            </button>
          </span>
          <span
            v-if="filterStatus !== ''"
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {{ filterStatus.replace(/_/g, ' ') }}
            <button
              class="text-subtle hover:text-rose-400 font-bold leading-none cursor-pointer"
              @click="filterStatus = ''"
            >
              ×
            </button>
          </span>
        </div>
        <div class="flex items-center gap-3 whitespace-nowrap">
          <span class="text-[13px] font-bold text-indigo-400"
            >{{ filteredTickets.length }}
            <span class="font-normal text-subtle"
              >of {{ ticketStore.totalCount }}</span
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

    <LoadingSpinner v-if="ticketStore.isLoading && !ticketStore.hasFetched" />

    <div
      v-else-if="filteredTickets.length > 0"
      class="bg-panel border border-edge rounded-2xl overflow-hidden"
    >
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-panel-light">
            <th
              class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge"
            >
              Code
            </th>
            <th
              class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge"
            >
              Client
            </th>
            <th
              class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge max-md:hidden"
            >
              Service
            </th>
            <th
              class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge"
            >
              Status
            </th>
            <th
              class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge max-md:hidden"
            >
              Handler
            </th>
            <th
              class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge max-md:hidden"
            >
              Created
            </th>
            <th class="px-4 py-3 border-b border-edge w-12"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="t in filteredTickets"
            :key="t.id"
            class="hover:bg-panel-light transition-colors cursor-pointer"
            @click="router.push(`/tickets/${t.id}`)"
          >
            <td class="px-4 py-3 border-b border-edge">
              <div class="flex items-center gap-2">
                <code
                  class="text-[13px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md font-mono whitespace-nowrap"
                  v-html="highlight(t.trackingCode)"
                ></code>
                <button
                  class="p-1 rounded-md text-subtle hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer shrink-0"
                  title="Copy Code"
                  @click.stop="
                    copyToClipboard(
                      t.trackingCode,
                      'Tracking code copied to clipboard',
                    )
                  "
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
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path
                      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                    ></path>
                  </svg>
                </button>
              </div>
            </td>
            <td
              class="px-4 py-3 text-sm text-heading font-medium border-b border-edge"
              v-html="highlight(t.client?.name ?? '—')"
            ></td>
            <td
              class="px-4 py-3 text-sm text-body border-b border-edge max-md:hidden"
              v-html="highlight(t.serviceType)"
            ></td>
            <td class="px-4 py-3 border-b border-edge">
              <StatusBadge :status="t.currentStatus" />
            </td>
            <td
              class="px-4 py-3 text-sm text-body border-b border-edge max-md:hidden"
              v-html="highlight(t.handler?.fullName ?? '—')"
            ></td>
            <td
              class="px-4 py-3 text-[13px] text-subtle border-b border-edge whitespace-nowrap max-md:hidden"
            >
              {{ formatDateTime(t.createdAt) }}
            </td>
            <td class="px-4 py-3 border-b border-edge">
              <button
                v-if="auth.isAdmin"
                class="p-1.5 rounded-md text-subtle hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Delete"
                @click.stop="deleteTargetId = t.id"
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
      v-else-if="ticketStore.hasFetched && !ticketStore.isLoading"
      class="text-center py-16 text-subtle"
    >
      <p class="text-lg text-heading font-medium mb-2">
        {{
          ticketStore.totalCount === 0 ? 'No tickets yet' : 'No results found'
        }}
      </p>
      <p class="text-sm mb-5">
        {{
          ticketStore.totalCount === 0
            ? 'Create your first tracking ticket to get started.'
            : 'Try adjusting your search or filters.'
        }}
      </p>
      <button
        v-if="ticketStore.totalCount === 0"
        class="px-5 py-2.5 text-sm font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors cursor-pointer"
        @click="router.push('/tickets/create')"
      >
        Create First Ticket
      </button>
    </div>

    <ConfirmDialog
      v-if="deleteTargetId"
      title="Delete Ticket"
      message="This will permanently delete the ticket, all tracking history, documents, and uploaded files. This cannot be undone."
      confirm-text="Delete"
      variant="danger"
      @confirm="handleDelete"
      @cancel="deleteTargetId = null"
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

:deep(.hl) {
  background: rgba(99, 102, 241, 0.25);
  color: inherit;
  padding: 0 2px;
  border-radius: 3px;
}
</style>
