<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useTicketStore } from '../stores/ticket.store';

const router = useRouter();
const auth = useAuthStore();
const ticketStore = useTicketStore();

const quickActions = [
  { title: 'New Ticket', desc: 'Create a tracking ticket for a client', icon: 'add', path: '/tickets/create', color: 'indigo' },
  { title: 'Manage Clients', desc: 'View and manage client records', icon: 'clients', path: '/clients', color: 'emerald' },
  { title: 'Public Tracking', desc: 'Share with clients to track status', icon: 'globe', path: '/tracking', color: 'amber' },
];

onMounted(() => {
  if (!ticketStore.hasFetched) ticketStore.fetchAll();
});
</script>

<template>
  <div class="max-w-4xl">
    <div class="mb-8">
      <h1 class="text-[28px] font-bold text-heading mb-2">Welcome back, {{ auth.user?.fullName ?? 'User' }} 👋</h1>
      <p class="text-[15px] text-subtle">Here's your document management overview.</p>
    </div>

    <section v-if="ticketStore.hasFetched" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      <div class="bg-panel border border-edge rounded-2xl p-4 text-center">
        <p class="text-2xl font-bold text-heading">{{ ticketStore.totalCount }}</p>
        <p class="text-xs text-subtle mt-1">Total Tickets</p>
      </div>
      <div class="bg-panel border border-edge rounded-2xl p-4 text-center">
        <p class="text-2xl font-bold text-amber-400">{{ ticketStore.countByStatus['IN_REVIEW'] ?? 0 }}</p>
        <p class="text-xs text-subtle mt-1">In Review</p>
      </div>
      <div class="bg-panel border border-edge rounded-2xl p-4 text-center">
        <p class="text-2xl font-bold text-indigo-400">{{ ticketStore.countByStatus['IN_PROCESS'] ?? 0 }}</p>
        <p class="text-xs text-subtle mt-1">In Process</p>
      </div>
      <div class="bg-panel border border-edge rounded-2xl p-4 text-center">
        <p class="text-2xl font-bold text-emerald-400">{{ ticketStore.countByStatus['COMPLETED'] ?? 0 }}</p>
        <p class="text-xs text-subtle mt-1">Completed</p>
      </div>
    </section>

    <section class="mb-8">
      <h2 class="text-base font-semibold text-heading mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button v-for="a in quickActions" :key="a.path" class="flex items-center gap-4 p-5 bg-panel border border-edge rounded-2xl text-left cursor-pointer transition-all hover:border-indigo-500 hover:shadow-lg hover:-translate-y-0.5 group" @click="router.push(a.path)">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" :class="{ 'bg-indigo-500/12 text-indigo-400': a.color === 'indigo', 'bg-emerald-500/12 text-emerald-400': a.color === 'emerald', 'bg-amber-500/12 text-amber-400': a.color === 'amber' }">
            <svg v-if="a.icon==='add'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <svg v-else-if="a.icon==='clients'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-[15px] font-semibold text-heading mb-1">{{ a.title }}</h3>
            <p class="text-[13px] text-subtle">{{ a.desc }}</p>
          </div>
          <svg class="text-subtle group-hover:translate-x-1 transition-transform flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </section>

    <section class="mb-8">
      <div class="px-5 py-4 rounded-2xl bg-indigo-500/8 border border-indigo-500/20">
        <h3 class="text-[15px] font-semibold text-heading mb-1">📋 Document Processing Flow</h3>
        <p class="text-sm text-body leading-relaxed">Each ticket follows: <strong class="text-heading">Received → In Review → In Process → Approved / Rejected → Completed</strong></p>
      </div>
    </section>

    <section>
      <h2 class="text-base font-semibold text-heading mb-4">Your Profile</h2>
      <div class="flex items-center gap-6 p-6 bg-panel border border-edge rounded-2xl max-sm:flex-col max-sm:text-center">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">{{ auth.user?.fullName?.charAt(0) ?? 'U' }}</div>
        <div class="flex-1 flex flex-col gap-2">
          <div class="flex gap-4 items-center max-sm:justify-center"><span class="text-[13px] text-subtle min-w-15">Name</span><span class="text-sm text-heading font-medium">{{ auth.user?.fullName }}</span></div>
          <div class="flex gap-4 items-center max-sm:justify-center"><span class="text-[13px] text-subtle min-w-15">Email</span><span class="text-sm text-heading font-medium">{{ auth.user?.email }}</span></div>
          <div class="flex gap-4 items-center max-sm:justify-center"><span class="text-[13px] text-subtle min-w-15">Role</span><span class="px-2.5 py-0.5 rounded-md bg-indigo-500/12 text-indigo-400 text-xs font-semibold uppercase tracking-wider">{{ auth.user?.role }}</span></div>
        </div>
      </div>
    </section>
  </div>
</template>
