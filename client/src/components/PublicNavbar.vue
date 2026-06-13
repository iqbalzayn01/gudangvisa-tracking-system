<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { setLocale, type AppLocale } from '../i18n';
import { Sun, Moon } from 'lucide-vue-next';

const { t, locale } = useI18n();

const isScrolled = ref(false);
const isDark = ref(false);

function toggleTheme() {
  const html = document.documentElement;
  if (html.classList.contains('dark')) {
    html.classList.remove('dark');
    localStorage.theme = 'light';
    isDark.value = false;
  } else {
    html.classList.add('dark');
    localStorage.theme = 'dark';
    isDark.value = true;
  }
}


const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  }
}

function changeLocale(l: AppLocale) {
  setLocale(l);
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  
  if (
    localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  } else {
    isDark.value = false;
    document.documentElement.classList.remove('dark');
  }
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <nav
    :class="[
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
      isScrolled
        ? 'bg-black/20 backdrop-blur-md border-b border-edge shadow-sm'
        : 'bg-transparent',
    ]"
  >
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <!-- Left: Logo -->
      <Button
        variant="ghost"
        type="button"
        class="flex items-center gap-2 cursor-pointer hover:bg-transparent h-auto rounded-full"
        @click="scrollToSection('top')"
      >
        <img
          src="/design/logo-square.png"
          alt="Gudang Visa Logo"
          width="32"
          height="32"
          class="shrink-0"
        />
        <span class="text-lg font-bold text-white tracking-wide"
          >GudangVisa</span
        >
      </Button>

      <!-- Middle: Menu -->
      <div
        class="hidden md:flex items-center gap-8 text-sm font-medium text-white"
      >
        <Button
          variant="ghost"
          type="button"
          class="hover:bg-white transition-colors cursor-pointer h-auto rounded-full"
          @click="scrollToSection('layanan')"
        >
          {{ t('nav.services') }}
        </Button>
        <Button
          variant="ghost"
          type="button"
          class="hover:bg-white transition-colors cursor-pointer h-auto rounded-full"
          @click="scrollToSection('faq')"
        >
          {{ t('nav.faq') }}
        </Button>
        <Button
          variant="ghost"
          type="button"
          class="hover:bg-white transition-colors cursor-pointer h-auto rounded-full"
          @click="scrollToSection('tentang')"
        >
          {{ t('nav.about') }}
        </Button>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-4">
        <!-- Theme Toggle Button -->
        <Button
          variant="ghost"
          class="flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer w-9 h-9 p-0 rounded-full"
          @click="toggleTheme"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <Sun v-if="isDark" class="w-5 h-5" />
          <Moon v-else class="w-5 h-5" />
        </Button>

        <!-- Language Dropdown -->
        <div class="relative group">
          <Button
            variant="ghost"
            class="flex items-center gap-1.5 text-sm font-medium text-white hover:bg-white transition-colors py-2 uppercase cursor-pointer h-auto rounded-full"
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
              <line x1="2" y1="12" x2="22" y2="12" />
              <path
                d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
              />
            </svg>
            {{ locale }}
          </Button>
          <!-- Dropdown menu -->
          <div
            class="absolute right-0 mt-1.5 w-36 bg-panel border border-edge rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1.5 overflow-hidden"
          >
            <Button
              variant="ghost"
              class="w-full text-left px-4 py-2 text-sm text-heading hover:bg-panel-light transition-colors cursor-pointer h-auto rounded-full justify-start"
              :class="{ 'text-red-400 font-semibold': locale === 'id' }"
              @click="changeLocale('id')"
            >
              Indonesia (ID)
            </Button>
            <Button
              variant="ghost"
              class="w-full text-left px-4 py-2 text-sm text-heading hover:bg-panel-light transition-colors cursor-pointer h-auto rounded-full justify-start"
              :class="{ 'text-red-400 font-semibold': locale === 'en' }"
              @click="changeLocale('en')"
            >
              English (EN)
            </Button>
          </div>
        </div>

        <!-- Contact CS Button -->
        <a
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
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
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            />
          </svg>
          {{ t('nav.contact') }}
        </a>
      </div>
    </div>
  </nav>
</template>
