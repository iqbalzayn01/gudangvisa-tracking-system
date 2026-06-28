<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { deleteApplication } from '../api/applications.api';
import { useAuthStore } from '../stores/auth.store';
import { useApplicationStore } from '../stores/application.store';
import { useNotificationStore } from '../stores/notification.store';
import type { ApplicationStatus, Priority } from '../types';
import StatusBadge from '../components/StatusBadge.vue';
import PriorityBadge from '../components/PriorityBadge.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import FilterSelect from '../components/FilterSelect.vue';
import { formatDate } from '../utils/formatters';
import {
  APPLICATION_STATUSES,
  PRIORITY_OPTIONS,
  applicationStatusLabel,
  priorityLabel,
  visaTypeLabel,
} from '../utils/labels';
import { copyToClipboard } from '../utils/clipboard';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const applicationStore = useApplicationStore();
const notify = useNotificationStore();

const deleteTargetId = ref<string | null>(null);

// ── Search & Filter state ────────────────────────────────────────────────────
const searchInput = ref('');
const searchQuery = ref('');
const filterStatus = ref<ApplicationStatus | ''>('');
const filterPriority = ref<Priority | ''>('');
const searchRef = ref<HTMLInputElement | null>(null);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(searchInput, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchQuery.value = val;
  }, 200);
});

const statusSelectOptions = computed(() =>
  APPLICATION_STATUSES.map((s) => ({
    value: s,
    label: applicationStatusLabel(s),
  })),
);
const prioritySelectOptions = computed(() => PRIORITY_OPTIONS);

const filteredApplications = computed(() => {
  let list = applicationStore.sortedApplications;
  if (filterStatus.value)
    list = list.filter((a) => a.currentStatus === filterStatus.value);
  if (filterPriority.value)
    list = list.filter(
      (a) => (a.priority ?? 'medium') === filterPriority.value,
    );
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (a) =>
        a.trackingCode.toLowerCase().includes(q) ||
        (a.client?.name ?? '').toLowerCase().includes(q) ||
        visaTypeLabel(a.visaType).toLowerCase().includes(q) ||
        (a.handler?.fullName ?? '').toLowerCase().includes(q),
    );
  }
  return list;
});

const hasActiveFilters = computed(
  () =>
    searchQuery.value.trim() !== '' ||
    filterStatus.value !== '' ||
    filterPriority.value !== '',
);

function clearAllFilters() {
  searchInput.value = '';
  searchQuery.value = '';
  filterStatus.value = '';
  filterPriority.value = '';
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    nextTick(() => searchRef.value?.focus());
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  if (!applicationStore.hasFetched) applicationStore.fetchAll();
  // Allow deep-links / topbar search to pre-fill the query (?q=…).
  const q = route.query.q;
  if (typeof q === 'string' && q) {
    searchInput.value = q;
    searchQuery.value = q;
  }
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

function progressColor(p: number): string {
  if (p >= 100) return 'bg-emerald-500';
  if (p >= 60) return 'bg-sky-500';
  if (p >= 30) return 'bg-amber-500';
  return 'bg-red-500';
}

async function handleDelete(): Promise<void> {
  if (!deleteTargetId.value) return;
  const id = deleteTargetId.value;
  try {
    await deleteApplication(id);
    applicationStore.removeLocal(id);
    notify.success('Application deleted');
  } catch (err) {
    notify.error(
      err instanceof Error ? err.message : 'Failed to delete application',
    );
  } finally {
    deleteTargetId.value = null;
  }
}
</script>

<template>
  <div class="w-full max-w-640">
    <div class="flex justify-between items-start mb-6 gap-4 flex-wrap">
      <div>
        <h1 class="text-[28px] font-bold text-heading mb-1">Applications</h1>
        <p class="text-sm text-subtle">
          {{ applicationStore.totalCount }} application{{
            applicationStore.totalCount !== 1 ? 's' : ''
          }}
          in the ledger
        </p>
      </div>
      <div class="flex gap-2 items-center">
        <Button
          variant="ghost"
          class="p-2.5 rounded-full border border-edge text-subtle hover:bg-panel-light transition-colors cursor-pointer h-auto"
          :disabled="applicationStore.isLoading"
          title="Refresh"
          @click="applicationStore.fetchAll()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            :class="{ 'animate-spin': applicationStore.isLoading }"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path
              d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
            />
          </svg>
        </Button>
        <Button
          variant="ghost"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer h-auto"
          @click="router.push('/applications/create')"
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
          New Application
        </Button>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="applicationStore.error"
      class="flex items-center gap-2.5 px-4 py-3 rounded-full bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-4"
    >
      {{ applicationStore.error }}
      <Button
        variant="ghost"
        class="ml-auto px-3 py-1 text-[13px] rounded-full border border-edge text-body hover:bg-panel-light cursor-pointer h-auto"
        @click="applicationStore.fetchAll()"
      >
        Retry
      </Button>
    </div>

    <!-- ── Search & Filter Bar ──────────────────────────────────────────── -->
    <div
      class="flex gap-3 mb-4 bg-panel border border-edge rounded-2xl px-4 py-2.5 transition-all focus-within:border-red-500 focus-within:ring-3 focus-within:ring-red-500/12 flex-wrap"
    >
      <div class="relative flex-1 flex items-center min-w-50">
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
          placeholder="Search reference, applicant, visa type…"
        />
        <kbd
          v-if="!searchInput"
          class="absolute right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-panel-light border border-edge text-subtle pointer-events-none whitespace-nowrap"
          >Ctrl K</kbd
        >
        <Button
          variant="ghost"
          v-else
          class="absolute right-2 p-1 rounded-full bg-panel-light text-subtle hover:text-heading hover:bg-edge transition-colors cursor-pointer h-auto"
          title="Clear search"
          @click="
            searchInput = '';
            searchQuery = '';
          "
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
        </Button>
      </div>
      <FilterSelect
        v-model="filterStatus"
        :options="statusSelectOptions"
        all-label="All Statuses"
        placeholder="All Statuses"
        trigger-class="min-w-32.5"
      />
      <FilterSelect
        v-model="filterPriority"
        :options="prioritySelectOptions"
        all-label="All Priorities"
        placeholder="All Priorities"
        trigger-class="min-w-32.5"
      />
    </div>

    <!-- ── Active Filters Summary ───────────────────────────────────────── -->
    <Transition name="slide">
      <div
        v-if="hasActiveFilters"
        class="flex items-center justify-between gap-3 px-4 py-2 mb-4 bg-red-500/8 border border-red-500/20 rounded-2xl flex-wrap"
      >
        <div class="flex gap-2 flex-wrap">
          <span
            v-if="searchQuery.trim()"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-panel border border-edge text-xs font-medium text-body"
          >
            "{{ searchQuery.trim() }}"
            <Button
              variant="ghost"
              class="text-subtle hover:text-red-400 font-bold leading-none cursor-pointer h-auto rounded-full"
              @click="
                searchInput = '';
                searchQuery = '';
              "
            >
              ×
            </Button>
          </span>
          <span
            v-if="filterStatus !== ''"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-panel border border-edge text-xs font-medium text-body"
          >
            {{ applicationStatusLabel(filterStatus) }}
            <Button
              variant="ghost"
              class="text-subtle hover:text-red-400 font-bold leading-none cursor-pointer h-auto rounded-full"
              @click="filterStatus = ''"
            >
              ×
            </Button>
          </span>
          <span
            v-if="filterPriority !== ''"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-panel border border-edge text-xs font-medium text-body"
          >
            {{ priorityLabel(filterPriority) }}
            <Button
              variant="ghost"
              class="text-subtle hover:text-red-400 font-bold leading-none cursor-pointer h-auto rounded-full"
              @click="filterPriority = ''"
            >
              ×
            </Button>
          </span>
        </div>
        <div class="flex items-center gap-3 whitespace-nowrap">
          <span class="text-[13px] font-bold text-red-400"
            >{{ filteredApplications.length }}
            <span class="font-normal text-subtle"
              >of {{ applicationStore.totalCount }}</span
            ></span
          >
          <Button
            variant="ghost"
            class="text-xs text-subtle underline underline-offset-2 hover:text-heading transition-colors cursor-pointer h-auto rounded-full"
            @click="clearAllFilters"
          >
            Clear all
          </Button>
        </div>
      </div>
    </Transition>

    <LoadingSpinner
      v-if="applicationStore.isLoading && !applicationStore.hasFetched"
    />

    <div
      v-else-if="filteredApplications.length > 0"
      class="bg-panel border border-edge rounded-2xl overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-panel-light">
              <th
                class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge"
              >
                Reference
              </th>
              <th
                class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge"
              >
                Applicant
              </th>
              <th
                class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge max-md:hidden"
              >
                Visa Type
              </th>
              <th
                class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge"
              >
                Status
              </th>
              <th
                class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge max-sm:hidden"
              >
                Priority
              </th>
              <th
                class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge max-md:hidden"
              >
                Progress
              </th>
              <th
                class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge max-md:hidden"
              >
                Date
              </th>
              <th class="px-4 py-3 border-b border-edge w-12"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="a in filteredApplications"
              :key="a.id"
              class="hover:bg-panel-light transition-colors cursor-pointer"
              @click="router.push(`/applications/${a.id}`)"
            >
              <td class="px-4 py-3 border-b border-edge">
                <div class="flex items-center gap-2">
                  <code
                    class="text-[13px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-mono whitespace-nowrap"
                    v-html="highlight(a.trackingCode)"
                  ></code>
                  <Button
                    variant="ghost"
                    class="p-1 rounded-full text-subtle hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0 h-auto"
                    title="Copy reference"
                    @click.stop="
                      copyToClipboard(
                        a.trackingCode,
                        'Reference number copied to clipboard',
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
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path
                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                      />
                    </svg>
                  </Button>
                </div>
              </td>
              <td
                class="px-4 py-3 text-sm text-heading font-medium border-b border-edge"
                v-html="highlight(a.client?.name ?? '—')"
              ></td>
              <td
                class="px-4 py-3 text-sm text-body border-b border-edge max-md:hidden whitespace-nowrap"
                v-html="highlight(visaTypeLabel(a.visaType))"
              ></td>
              <td class="px-4 py-3 border-b border-edge">
                <StatusBadge :status="a.currentStatus" />
              </td>
              <td class="px-4 py-3 border-b border-edge max-sm:hidden">
                <PriorityBadge :priority="a.priority ?? 'medium'" />
              </td>
              <td class="px-4 py-3 border-b border-edge max-md:hidden">
                <div class="flex items-center gap-2 min-w-28">
                  <div
                    class="flex-1 h-1.5 rounded-full bg-panel-light overflow-hidden"
                  >
                    <div
                      class="h-full rounded-full transition-all"
                      :class="progressColor(a.progress ?? 0)"
                      :style="{ width: `${a.progress ?? 0}%` }"
                    ></div>
                  </div>
                  <span
                    class="text-[11px] font-semibold text-subtle w-8 text-right"
                    >{{ a.progress ?? 0 }}%</span
                  >
                </div>
              </td>
              <td
                class="px-4 py-3 text-[13px] text-subtle border-b border-edge whitespace-nowrap max-md:hidden"
              >
                {{ formatDate(a.createdAt) }}
              </td>
              <td class="px-4 py-3 border-b border-edge">
                <Button
                  variant="ghost"
                  v-if="auth.isAdmin"
                  class="p-1.5 rounded-full text-subtle hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer h-auto"
                  title="Delete"
                  @click.stop="deleteTargetId = a.id"
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
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-else-if="applicationStore.hasFetched && !applicationStore.isLoading"
      class="text-center py-16 text-subtle"
    >
      <p class="text-lg text-heading font-medium mb-2">
        {{
          applicationStore.totalCount === 0
            ? 'No applications yet'
            : 'No results found'
        }}
      </p>
      <p class="text-sm mb-5">
        {{
          applicationStore.totalCount === 0
            ? 'Create your first application to get started.'
            : 'Try adjusting your search or filters.'
        }}
      </p>
      <Button
        variant="ghost"
        v-if="applicationStore.totalCount === 0"
        class="px-5 py-2.5 text-sm font-semibold rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer h-auto"
        @click="router.push('/applications/create')"
      >
        Create First Application
      </Button>
    </div>

    <ConfirmDialog
      v-if="deleteTargetId"
      title="Delete Application"
      message="This will permanently delete the application, all tracking history, documents, and uploaded files. This cannot be undone."
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
  background: rgba(239, 68, 68, 0.25);
  color: inherit;
  padding: 0 2px;
  border-radius: 3px;
}
</style>
