<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-vue-next';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useNotificationStore } from '../stores/notification.store';

const router = useRouter();
const auth = useAuthStore();
const notify = useNotificationStore();

const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');

async function handleSubmit(): Promise<void> {
  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    await auth.login({ email: email.value, password: password.value });
    notify.success('Welcome back!');
    router.push('/dashboard');
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Login failed';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <Button
        variant="ghost"
        class="inline-flex items-center gap-1.5 mb-6 -ml-2 px-3 py-2 text-sm font-medium text-subtle hover:text-heading h-auto rounded-full"
        @click="router.push('/portal')"
      >
        <ArrowLeft :size="16" />
        Back
      </Button>
      <div class="text-center mb-8">
        <img
          src="/design/logo-square.png"
          alt="GudangVisa"
          width="56"
          height="56"
          class="w-14 h-14 rounded-2xl mx-auto mb-5"
        />
        <h1 class="text-[28px] font-bold text-heading mb-2">Welcome back</h1>
        <p class="text-[15px] text-subtle">
          Sign in to access the document tracking dashboard
        </p>
      </div>

      <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
        <div
          v-if="errorMessage"
          class="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400"
        >
          <svg
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
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {{ errorMessage }}
        </div>

        <div class="flex flex-col gap-1.5">
          <label
            class="text-[13px] font-semibold text-heading tracking-wide"
            for="login-email"
            >Email address</label
          >
          <input
            id="login-email"
            v-model="email"
            type="email"
            class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none transition-all focus:border-red-500 focus:ring-3 focus:ring-red-500/12 placeholder:text-subtle"
            placeholder="you@gudangvisa.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label
            class="text-[13px] font-semibold text-heading tracking-wide"
            for="login-password"
            >Password</label
          >
          <input
            id="login-password"
            v-model="password"
            type="password"
            class="w-full px-3.5 py-2.5 text-sm text-heading bg-panel-light border border-edge rounded-lg outline-none transition-all focus:border-red-500 focus:ring-3 focus:ring-red-500/12 placeholder:text-subtle"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <Button variant="ghost"
          type="submit"
          class="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-auto"
          :disabled="isSubmitting"
        >
          <span
            v-if="isSubmitting"
            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          />
          {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
        </Button>
      </form>
    </div>
  </div>
</template>
