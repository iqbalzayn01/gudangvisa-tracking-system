<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useTicketStore } from '../stores/ticket.store';
import Topbar from '../components/Topbar.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const ticketStore = useTicketStore();

const isSidebarOpen = ref(false);

const navItems = computed(() => {
  const items = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Clients', path: '/clients', icon: 'clients' },
    { label: 'Tickets', path: '/tickets', icon: 'tickets' },
  ];
  if (auth.isAdmin) {
    items.push({ label: 'Users', path: '/users', icon: 'users' });
  }
  return items;
});

function isActive(path: string): boolean {
  return route.path.startsWith(path);
}

function handleLogout(): void {
  auth.logout();
  router.push('/login');
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}
</script>

<template>
  <div class="flex min-h-screen bg-dark transition-colors duration-300">
    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
    ></div>

    <!-- Sidebar -->
    <aside
      class="w-64 min-w-64 bg-panel border-r border-edge flex flex-col sticky top-0 h-screen overflow-y-auto transition-all duration-300 z-50
             max-md:fixed max-md:left-0 max-md:top-0 max-md:bottom-0"
      :class="[isSidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full']"
    >
      <!-- Logo -->
      <div class="px-5 py-6 border-b border-edge">
        <h1 class="flex items-center gap-2.5 text-xl font-bold text-heading">
          <svg class="text-indigo-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>GudangVisa</span>
        </h1>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 flex flex-col gap-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          @click="isSidebarOpen = false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
          :class="isActive(item.path) ? 'bg-indigo-500/12 text-indigo-400' : 'text-body hover:bg-panel-light hover:text-heading'"
        >
          <!-- Dashboard icon -->
          <svg v-if="item.icon === 'dashboard'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <!-- Clients icon -->
          <svg v-else-if="item.icon === 'clients'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <!-- Tickets icon -->
          <svg v-else-if="item.icon === 'tickets'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <!-- Users icon -->
          <svg v-else-if="item.icon === 'users'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>

          <span>{{ item.label }}</span>

          <span
            v-if="item.icon === 'tickets' && ticketStore.totalCount > 0"
            class="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center"
          >
            {{ ticketStore.totalCount }}
          </span>
        </router-link>
      </nav>

      <!-- Footer / User Card -->
      <div class="px-4 py-4 border-t border-edge flex items-center gap-2">
        <div class="flex items-center gap-2.5 flex-1 min-w-0">
          <div class="w-9 h-9 rounded-lg bg-indigo-500/12 text-indigo-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {{ auth.user?.fullName?.charAt(0) ?? 'U' }}
          </div>
          <div class="min-w-0">
            <p class="text-[13px] font-semibold text-heading truncate">{{ auth.user?.fullName ?? 'User' }}</p>
            <p class="text-[11px] text-subtle uppercase tracking-wider">{{ auth.user?.role ?? '' }}</p>
          </div>
        </div>
        <button
          class="p-2 rounded-lg text-subtle hover:bg-rose-500/10 hover:text-rose-400 transition-all cursor-pointer"
          title="Logout"
          @click="handleLogout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </aside>

    <!-- Main content area -->
    <div class="flex-1 flex flex-col min-w-0">
      <Topbar @toggle-sidebar="toggleSidebar" />

      <main class="flex-1 p-8 overflow-y-auto max-md:p-5">
        <router-view />
      </main>
    </div>
  </div>
</template>
