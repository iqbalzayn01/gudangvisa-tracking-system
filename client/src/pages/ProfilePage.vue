<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ref, computed, onMounted } from 'vue';
import { Shield, CalendarDays, IdCard, Mail } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth.store';
import { useNotificationStore } from '../stores/notification.store';
import { formatDate } from '../utils/formatters';

const auth = useAuthStore();
const notify = useNotificationStore();

const fullName = ref(auth.user?.fullName ?? '');
const email = ref(auth.user?.email ?? '');
const isSaving = ref(false);

const initial = computed(() =>
  (auth.user?.fullName?.charAt(0) ?? 'U').toUpperCase(),
);

const isDirty = computed(
  () =>
    fullName.value.trim() !== (auth.user?.fullName ?? '') ||
    email.value.trim() !== (auth.user?.email ?? ''),
);

const roleBadgeClass = computed(() =>
  auth.isAdmin
    ? 'bg-red-500/12 text-red-400 border-red-500/20'
    : 'bg-panel-light text-subtle border-edge',
);

function save(): void {
  if (!fullName.value.trim() || !email.value.trim()) return;
  isSaving.value = true;
  auth.updateProfileLocal({
    fullName: fullName.value.trim(),
    email: email.value.trim(),
  });
  notify.success('Profile updated.');
  isSaving.value = false;
}

function reset(): void {
  fullName.value = auth.user?.fullName ?? '';
  email.value = auth.user?.email ?? '';
}

onMounted(() => {
  // Refresh full profile (id, createdAt) in the background.
  auth
    .fetchProfile()
    .then(() => {
      if (!isDirty.value) reset();
    })
    .catch(() => {
      /* silent — keep cached data */
    });
});
</script>

<template>
  <div class="max-w-4xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-[28px] font-bold text-heading mb-1.5">Profile</h1>
      <p class="text-[15px] text-body">
        Manage your account details and preferences.
      </p>
    </div>

    <!-- Identity card -->
    <div class="bg-panel border border-edge rounded-2xl overflow-hidden mb-6">
      <div class="h-24 bg-gradient-to-br from-red-500 to-red-700"></div>
      <div class="px-6 pb-6 -mt-10">
        <div class="flex items-end gap-4 flex-wrap">
          <div
            class="w-20 h-20 rounded-2xl bg-red-500/15 text-red-400 border-4 border-panel flex items-center justify-center text-2xl font-bold shrink-0"
          >
            {{ initial }}
          </div>
          <div class="flex-1 min-w-0 pb-1">
            <h2 class="text-xl font-bold text-heading truncate">
              {{ auth.user?.fullName ?? 'User' }}
            </h2>
            <p class="text-sm text-subtle truncate">{{ auth.user?.email }}</p>
          </div>
          <span
            class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border"
            :class="roleBadgeClass"
          >
            {{ auth.user?.role ?? '—' }}
          </span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <!-- Edit profile -->
      <div class="bg-panel border border-edge rounded-2xl p-6">
        <h3 class="text-base font-semibold text-heading">Edit Profile</h3>
        <p class="text-xs text-subtle mt-0.5">
          Update your display name and email address.
        </p>

        <form class="flex flex-col gap-5 mt-5" @submit.prevent="save">
          <div class="flex flex-col gap-1.5">
            <label
              for="profile-name"
              class="text-[13px] font-semibold text-heading tracking-wide"
              >Full name</label
            >
            <input
              id="profile-name"
              v-model="fullName"
              type="text"
              class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none transition-all focus:border-red-500 focus:ring-3 focus:ring-red-500/12 placeholder:text-subtle"
              placeholder="Your name"
              required
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label
              for="profile-email"
              class="text-[13px] font-semibold text-heading tracking-wide"
              >Email address</label
            >
            <input
              id="profile-email"
              v-model="email"
              type="email"
              class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none transition-all focus:border-red-500 focus:ring-3 focus:ring-red-500/12 placeholder:text-subtle"
              placeholder="you@gudangvisa.com"
              required
            />
          </div>

          <div class="flex items-center gap-3">
            <Button
              type="submit"
              variant="ghost"
              class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-auto"
              :disabled="!isDirty || isSaving"
            >
              {{ isSaving ? 'Saving…' : 'Save changes' }}
            </Button>
            <Button
              type="button"
              variant="ghost"
              class="px-4 py-2.5 rounded-lg text-sm font-medium text-subtle hover:text-heading hover:bg-panel-light transition-colors cursor-pointer h-auto disabled:opacity-50"
              :disabled="!isDirty || isSaving"
              @click="reset"
            >
              Cancel
            </Button>
          </div>

          <p class="text-xs text-subtle">
            Changes apply to your current session on this device.
          </p>
        </form>
      </div>

      <!-- Account information -->
      <div class="bg-panel border border-edge rounded-2xl p-6">
        <h3 class="text-base font-semibold text-heading mb-4">
          Account Information
        </h3>
        <dl class="flex flex-col divide-y divide-edge">
          <div class="flex items-center gap-3 py-3.5">
            <div
              class="w-9 h-9 rounded-lg bg-panel-light text-subtle flex items-center justify-center shrink-0"
            >
              <Mail :size="18" />
            </div>
            <div class="min-w-0">
              <dt class="text-xs text-subtle">Email</dt>
              <dd class="text-sm text-heading truncate">
                {{ auth.user?.email ?? '—' }}
              </dd>
            </div>
          </div>

          <div class="flex items-center gap-3 py-3.5">
            <div
              class="w-9 h-9 rounded-lg bg-panel-light text-subtle flex items-center justify-center shrink-0"
            >
              <Shield :size="18" />
            </div>
            <div class="min-w-0">
              <dt class="text-xs text-subtle">Role</dt>
              <dd class="text-sm text-heading capitalize">
                {{ (auth.user?.role ?? '—').toLowerCase() }}
              </dd>
            </div>
          </div>

          <div class="flex items-center gap-3 py-3.5">
            <div
              class="w-9 h-9 rounded-lg bg-panel-light text-subtle flex items-center justify-center shrink-0"
            >
              <CalendarDays :size="18" />
            </div>
            <div class="min-w-0">
              <dt class="text-xs text-subtle">Member since</dt>
              <dd class="text-sm text-heading">
                {{ auth.user?.createdAt ? formatDate(auth.user.createdAt) : '—' }}
              </dd>
            </div>
          </div>

          <div class="flex items-center gap-3 py-3.5">
            <div
              class="w-9 h-9 rounded-lg bg-panel-light text-subtle flex items-center justify-center shrink-0"
            >
              <IdCard :size="18" />
            </div>
            <div class="min-w-0">
              <dt class="text-xs text-subtle">Account ID</dt>
              <dd class="text-sm text-heading font-mono truncate">
                {{ auth.user?.id || '—' }}
              </dd>
            </div>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>
