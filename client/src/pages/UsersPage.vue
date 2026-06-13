<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { getUsers, createUser, deleteUser } from '../api/users.api';
import { useNotificationStore } from '../stores/notification.store';
import type { User } from '../types';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import FilterSelect from '../components/FilterSelect.vue';
import { formatDate } from '../utils/formatters';

const notify = useNotificationStore();

const users = ref<User[]>([]);
const isLoading = ref(true);
const showCreateForm = ref(false);
const newName = ref('');
const newEmail = ref('');
const newPassword = ref('');
const isCreating = ref(false);
const deleteTarget = ref<User | null>(null);
const isDeleting = ref(false);

// ── Search & Filter state ────────────────────────────────────────────────────
const searchInput = ref('');
const searchQuery = ref('');
const filterField = ref<'all' | 'name' | 'email'>('all');
const filterRole = ref<'' | 'ADMIN' | 'STAFF'>('');
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
  { label: 'Name', value: 'name' as const },
  { label: 'Email', value: 'email' as const },
];

const roleSelectOptions = [
  { value: 'ADMIN' as const, label: 'Admin' },
  { value: 'STAFF' as const, label: 'Staff' },
];

const filteredUsers = computed(() => {
  let list = users.value;
  if (filterRole.value) list = list.filter((u) => u.role === filterRole.value);
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter((u) => {
      if (filterField.value === 'name')
        return (u.fullName ?? '').toLowerCase().includes(q);
      if (filterField.value === 'email')
        return u.email.toLowerCase().includes(q);
      return (
        (u.fullName ?? '').toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }
  return list;
});

const hasActiveFilters = computed(
  () =>
    searchQuery.value.trim() !== '' ||
    filterField.value !== 'all' ||
    filterRole.value !== '',
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
  filterRole.value = '';
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    nextTick(() => searchRef.value?.focus());
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  fetchUsers();
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
async function fetchUsers(): Promise<void> {
  isLoading.value = true;
  try {
    users.value = await getUsers();
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Failed to load users');
  } finally {
    isLoading.value = false;
  }
}

async function handleCreate(): Promise<void> {
  isCreating.value = true;
  try {
    const newUser = await createUser({
      fullName: newName.value.trim(),
      email: newEmail.value.trim(),
      password: newPassword.value,
    });
    notify.success('Staff member created successfully');
    showCreateForm.value = false;
    newName.value = '';
    newEmail.value = '';
    newPassword.value = '';
    users.value.push(newUser);
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Failed to create user');
  } finally {
    isCreating.value = false;
  }
}

async function handleDelete(): Promise<void> {
  if (!deleteTarget.value) return;
  const targetId = deleteTarget.value.id;
  isDeleting.value = true;
  try {
    await deleteUser(targetId);
    notify.success('User deleted successfully');
    users.value = users.value.filter((u) => u.id !== targetId);
    deleteTarget.value = null;
  } catch (err) {
    notify.error(err instanceof Error ? err.message : 'Failed to delete user');
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div class="w-full max-w-640">
    <div class="flex justify-between items-start mb-6 gap-4 flex-wrap">
      <div>
        <h1 class="text-[28px] font-bold text-heading mb-1">User Management</h1>
        <p class="text-sm text-subtle">
          Manage staff members and administrators
        </p>
      </div>
      <Button
        variant="ghost"
        class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer h-auto"
        @click="showCreateForm = !showCreateForm"
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
        Add Staff
      </Button>
    </div>

    <!-- ── Search & Filter Bar ──────────────────────────────────────────── -->
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
          ref="searchRef"
          v-model="searchInput"
          type="text"
          class="w-full py-2 pl-9 pr-16 bg-transparent border-none text-sm text-heading outline-none placeholder:text-subtle"
          placeholder="Search users…"
        />
        <kbd
          v-if="!searchInput"
          class="absolute right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-panel-light border border-edge text-subtle pointer-events-none whitespace-nowrap"
          >Ctrl K</kbd
        >
        <Button
          variant="ghost"
          v-else
          class="absolute right-2 p-1 rounded-md bg-panel-light text-subtle hover:text-heading hover:bg-edge transition-colors cursor-pointer h-auto"
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
        </Button>
      </div>
      <FilterSelect
        v-model="filterField"
        :options="fieldOptions"
        placeholder="All Fields"
        trigger-class="min-w-30 rounded-lg"
      />
      <FilterSelect
        v-model="filterRole"
        :options="roleSelectOptions"
        all-label="All Roles"
        placeholder="All Roles"
        trigger-class="min-w-27.5 rounded-lg"
      />
    </div>

    <!-- ── Active Filters Summary ───────────────────────────────────────── -->
    <Transition name="slide">
      <div
        v-if="hasActiveFilters"
        class="flex items-center justify-between gap-3 px-4 py-2 mb-4 bg-red-500/8 border border-red-500/20 rounded-xl"
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
            <Button
              variant="ghost"
              class="text-subtle hover:text-rose-400 font-bold leading-none cursor-pointer h-auto rounded-full"
              @click="
                searchInput = '';
                searchQuery = '';
              "
            >
              ×
            </Button>
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
            <Button
              variant="ghost"
              class="text-subtle hover:text-rose-400 font-bold leading-none cursor-pointer h-auto rounded-full"
              @click="filterField = 'all'"
            >
              ×
            </Button>
          </span>
          <span
            v-if="filterRole !== ''"
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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            {{ filterRole }}
            <Button
              variant="ghost"
              class="text-subtle hover:text-rose-400 font-bold leading-none cursor-pointer h-auto rounded-full"
              @click="filterRole = ''"
            >
              ×
            </Button>
          </span>
        </div>
        <div class="flex items-center gap-3 whitespace-nowrap">
          <span class="text-[13px] font-bold text-red-400"
            >{{ filteredUsers.length }}
            <span class="font-normal text-subtle"
              >of {{ users.length }}</span
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

    <!-- ── Create Form ──────────────────────────────────────────────────── -->
    <Transition name="slide">
      <div
        v-if="showCreateForm"
        class="bg-panel border border-edge rounded-2xl p-6 mb-6"
      >
        <h3 class="text-base font-semibold text-heading mb-4">
          New Staff Member
        </h3>
        <form @submit.prevent="handleCreate" class="flex flex-col gap-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading"
                >Full Name</label
              >
              <input
                v-model="newName"
                type="text"
                class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-red-500 focus:ring-3 focus:ring-red-500/12 placeholder:text-subtle"
                placeholder="e.g. Staff Budi"
                required
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading"
                >Email</label
              >
              <input
                v-model="newEmail"
                type="email"
                class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-red-500 focus:ring-3 focus:ring-red-500/12 placeholder:text-subtle"
                placeholder="budi@gudangvisa.com"
                required
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-heading"
                >Password</label
              >
              <input
                v-model="newPassword"
                type="password"
                class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none focus:border-red-500 focus:ring-3 focus:ring-red-500/12 placeholder:text-subtle"
                placeholder="••••••••"
                required
                minlength="6"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              class="px-5 py-2.5 text-sm font-semibold rounded-lg border border-edge text-body hover:bg-panel-light transition-colors cursor-pointer h-auto"
              @click="showCreateForm = false"
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              type="submit"
              class="px-5 py-2.5 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer h-auto"
              :disabled="isCreating"
            >
              {{ isCreating ? 'Creating…' : 'Create Staff' }}
            </Button>
          </div>
        </form>
      </div>
    </Transition>

    <LoadingSpinner v-if="isLoading" />

    <div
      v-else-if="filteredUsers.length > 0"
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
              Email
            </th>
            <th
              class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge"
            >
              Role
            </th>
            <th
              class="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-subtle border-b border-edge"
            >
              Joined
            </th>
            <th class="px-4 py-3 border-b border-edge w-12"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="u in filteredUsers"
            :key="u.id"
            class="hover:bg-panel-light transition-colors"
          >
            <td class="px-4 py-3 border-b border-edge">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 rounded-lg bg-red-500/12 text-red-400 flex items-center justify-center font-bold text-[13px] shrink-0"
                >
                  {{ u.fullName.charAt(0) }}
                </div>
                <span
                  class="text-sm text-heading font-medium"
                  v-html="highlight(u.fullName)"
                ></span>
              </div>
            </td>
            <td
              class="px-4 py-3 text-sm text-body border-b border-edge"
              v-html="highlight(u.email)"
            ></td>
            <td class="px-4 py-3 border-b border-edge">
              <span
                class="px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider"
                :class="
                  u.role === 'ADMIN'
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-red-500/15 text-red-400'
                "
                >{{ u.role }}</span
              >
            </td>
            <td
              class="px-4 py-3 text-[13px] text-subtle border-b border-edge whitespace-nowrap"
            >
              {{ u.createdAt ? formatDate(u.createdAt) : '—' }}
            </td>
            <td class="px-4 py-3 border-b border-edge">
              <Button
                variant="ghost"
                v-if="u.role !== 'ADMIN'"
                class="p-1.5 rounded-md text-subtle hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer h-auto"
                title="Delete"
                @click="deleteTarget = u"
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

    <div v-else-if="!isLoading" class="text-center py-16 text-subtle">
      <p class="text-lg text-heading font-medium mb-2">
        {{ users.length === 0 ? 'No users found' : 'No results found' }}
      </p>
      <p v-if="users.length > 0" class="text-sm mb-5">
        Try adjusting your search or filter.
      </p>
    </div>

    <ConfirmDialog
      v-if="deleteTarget"
      title="Delete User"
      :message="`Are you sure you want to delete ${deleteTarget.fullName}? This action cannot be undone.`"
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

:deep(.hl) {
  background: rgba(99, 102, 241, 0.25);
  color: inherit;
  padding: 0 2px;
  border-radius: 3px;
}
</style>
