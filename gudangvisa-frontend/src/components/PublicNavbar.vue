<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

const isScrolled = ref(false);

const { locale } = useI18n();

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

const changeLanguage = (lang: "en" | "id") => {
  locale.value = lang;
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <nav
    :class="[
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
      isScrolled
        ? // 🟢 DIUBAH: bg-panel/90 diganti menjadi bg-dark/90 agar hitam solid serasi
          'bg-dark/90 backdrop-blur-md border-b border-edge shadow-sm'
        : 'bg-transparent',
    ]"
  >
    <div class="max-w-7xl mx-auto flex items-center justify-between">
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

      <div
        class="hidden md:flex items-center gap-8 text-sm font-medium text-white/80"
      >
        <a href="#services" class="hover:text-white transition-colors">
          {{ $t("nav.services") }}
        </a>
        <a href="#faq" class="hover:text-white transition-colors">
          {{ $t("nav.faq") }}
        </a>
        <a href="#about" class="hover:text-white transition-colors">
          {{ $t("nav.about") }}
        </a>
      </div>

      <div class="flex items-center gap-4">
        <div class="relative group">
          <button
            class="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors py-2 uppercase"
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
          </button>

          <div
            class="absolute right-0 mt-0 w-36 bg-dark border border-edge rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1.5 overflow-hidden"
          >
            <button
              @click="changeLanguage('en')"
              class="w-full text-left px-4 py-2 text-sm text-heading hover:bg-panel-light transition-colors"
              :class="{ 'text-indigo-400 font-semibold': locale === 'en' }"
            >
              English (EN)
            </button>

            <button
              @click="changeLanguage('id')"
              class="w-full text-left px-4 py-2 text-sm text-heading hover:bg-panel-light transition-colors"
              :class="{ 'text-indigo-400 font-semibold': locale === 'id' }"
            >
              Indonesia (ID)
            </button>
          </div>
        </div>

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
          {{ $t("nav.contact") }}
        </button>
      </div>
    </div>
  </nav>
</template>
