<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const isScrolled = ref(false);

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
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
        ? 'bg-panel/90 backdrop-blur-md border-b border-edge shadow-sm'
        : 'bg-transparent',
    ]"
  >
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <!-- Left: Logo -->
      <div class="flex items-center gap-2">
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
      </div>

      <!-- Middle: Menu -->
      <div
        class="hidden md:flex items-center gap-8 text-sm font-medium text-white/80"
      >
        <a href="#" class="hover:text-white transition-colors">Services</a>
        <a href="#" class="hover:text-white transition-colors">FAQ</a>
        <a href="#" class="hover:text-white transition-colors">About</a>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-4">
        <!-- Language Dropdown -->
        <div class="relative group">
          <button
            class="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors py-2"
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
            EN
          </button>
          <!-- Dropdown menu -->
          <div
            class="absolute right-0 mt-0 w-36 bg-panel border border-edge rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1.5 overflow-hidden"
          >
            <button
              class="w-full text-left px-4 py-2 text-sm text-heading hover:bg-panel-light transition-colors"
            >
              English (EN)
            </button>
            <button
              class="w-full text-left px-4 py-2 text-sm text-heading hover:bg-panel-light transition-colors"
            >
              Indonesia (ID)
            </button>
          </div>
        </div>

        <!-- Contact CS Button -->
        <button
          class="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
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
          Contact CS
        </button>
      </div>
    </div>
  </nav>
</template>
