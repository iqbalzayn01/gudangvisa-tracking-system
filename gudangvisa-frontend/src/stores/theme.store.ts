import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem('theme') !== 'light');

  function toggleTheme() {
    isDark.value = !isDark.value;
    updateTheme();
  }

  function updateTheme() {
    const root = document.documentElement;
    if (isDark.value) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  // Initialize theme
  updateTheme();

  return {
    isDark,
    toggleTheme,
    updateTheme
  };
});
