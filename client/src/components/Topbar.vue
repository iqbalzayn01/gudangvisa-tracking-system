<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { Sun, Moon, Menu, Search, X } from 'lucide-vue-next';
import { useThemeStore } from '../stores/theme.store';
import { useAuthStore } from '../stores/auth.store';
import { useApplicationStore } from '../stores/application.store';
import StatusBadge from './StatusBadge.vue';

const router = useRouter();
const theme = useThemeStore();
const auth = useAuthStore();
const applicationStore = useApplicationStore();

defineEmits(['toggle-sidebar']);

const query = ref('');
const showResults = ref(false);
const searchWrap = ref<HTMLElement | null>(null);

// Match by reference (document id), applicant name, or client id.
const results = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];
  return applicationStore.sortedApplications
    .filter(
      (a) =>
        a.trackingCode.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.clientId.toLowerCase().includes(q) ||
        (a.client?.name ?? '').toLowerCase().includes(q),
    )
    .slice(0, 6);
});

function go(id: string) {
  query.value = '';
  showResults.value = false;
  router.push(`/applications/${id}`);
}

function submit() {
  if (results.value.length === 1) {
    go(results.value[0].id);
    return;
  }
  if (query.value.trim()) {
    showResults.value = false;
    router.push({ path: '/applications', query: { q: query.value.trim() } });
    query.value = '';
  }
}

function onFocus() {
  showResults.value = true;
  if (!applicationStore.hasFetched) applicationStore.fetchAll();
}

function onClickOutside(e: MouseEvent) {
  if (searchWrap.value && !searchWrap.value.contains(e.target as Node)) {
    showResults.value = false;
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside));
onBeforeUnmount(() =>
  document.removeEventListener('mousedown', onClickOutside),
);
</script>

<template>
  <header
    class="h-16 bg-panel border-b border-edge flex items-center justify-between gap-4 px-6 sticky top-0 z-30 transition-colors duration-300"
  >
    <div class="flex items-center gap-4 shrink-0">
      <Button
        variant="ghost"
        @click="$emit('toggle-sidebar')"
        class="p-2 rounded-full text-subtle hover:bg-panel-light hover:text-heading md:hidden transition-all h-auto"
      >
        <Menu :size="20" />
      </Button>
    </div>

    <!-- Global search: client id / document (reference) id -->
    <div ref="searchWrap" class="relative flex-1 max-w-md">
      <div
        class="flex items-center gap-2 px-3.5 h-10 rounded-full bg-panel-light border border-edge transition-all focus-within:border-red-500 focus-within:ring-3 focus-within:ring-red-500/12"
      >
        <Search :size="16" class="text-subtle shrink-0" />
        <input
          v-model="query"
          type="text"
          class="flex-1 min-w-0 bg-transparent border-none text-sm text-heading outline-none placeholder:text-subtle"
          placeholder="Search client id / document id…"
          @focus="onFocus"
          @keydown.enter="submit"
          @keydown.escape="showResults = false"
        />
        <Button
          variant="ghost"
          v-if="query"
          class="p-0.5 rounded-full text-subtle hover:text-heading cursor-pointer shrink-0 h-auto"
          @click="query = ''"
        >
          <X :size="14" />
        </Button>
      </div>

      <!-- Results dropdown -->
      <Transition name="fade">
        <div
          v-if="showResults && query.trim()"
          class="absolute left-0 right-0 mt-2 bg-panel border border-edge rounded-2xl shadow-xl overflow-hidden z-40"
        >
          <ul v-if="results.length" class="py-1.5 max-h-80 overflow-y-auto">
            <li
              v-for="a in results"
              :key="a.id"
              class="flex items-center gap-3 px-3 py-2 mx-1.5 rounded-xl hover:bg-panel-light cursor-pointer transition-colors"
              @click="go(a.id)"
            >
              <code
                class="text-[12px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-mono shrink-0"
                >{{ a.trackingCode }}</code
              >
              <span class="text-sm text-heading font-medium truncate flex-1">{{
                a.client?.name ?? 'Unknown client'
              }}</span>
              <StatusBadge :status="a.currentStatus" />
            </li>
          </ul>
          <div v-else class="px-4 py-5 text-center text-sm text-subtle">
            No matching applications.
          </div>
        </div>
      </Transition>
    </div>

    <div class="flex items-center gap-3 shrink-0">
      <!-- Theme Toggle Button -->
      <Button
        variant="ghost"
        @click="theme.toggleTheme"
        class="p-2.5 rounded-full bg-panel-light border border-edge text-subtle hover:text-heading hover:border-red-500/30 transition-all duration-200 group relative h-auto"
        aria-label="Toggle theme"
      >
        <div class="relative w-3.5 h-3.5">
          <Transition name="sun-moon">
            <Sun
              v-if="!theme.isDark"
              class="absolute inset-0 m-auto text-red-400"
              :size="20"
            />
            <Moon
              v-else
              class="absolute inset-0 m-auto text-red-400"
              :size="20"
            />
          </Transition>
        </div>
      </Button>

      <!-- User Profile -->
      <router-link
        to="/profile"
        title="Profile"
        class="w-9 h-9 rounded-full bg-red-500/12 text-red-400 flex items-center justify-center font-bold text-sm hover:ring-2 hover:ring-red-500/30 transition-all"
      >
        {{ auth.user?.fullName?.charAt(0) ?? 'U' }}
      </router-link>
    </div>
  </header>
</template>

<style scoped>
.sun-moon-enter-active,
.sun-moon-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sun-moon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0);
}

.sun-moon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0);
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
