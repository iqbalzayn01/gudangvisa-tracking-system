<script setup lang="ts">
import { Sun, Moon, Menu } from 'lucide-vue-next';
import { useThemeStore } from '../stores/theme.store';
import { useAuthStore } from '../stores/auth.store';

const theme = useThemeStore();
const auth = useAuthStore();

defineEmits(['toggle-sidebar']);
</script>

<template>
  <header class="h-16 bg-panel border-b border-edge flex items-center justify-between px-6 sticky top-0 z-30 transition-colors duration-300">
    <div class="flex items-center gap-4">
      <button
        @click="$emit('toggle-sidebar')"
        class="p-2 rounded-lg text-subtle hover:bg-panel-light hover:text-heading md:hidden transition-all"
      >
        <Menu :size="20" />
      </button>

      <div class="hidden md:block">
        <h2 class="text-sm font-medium text-subtle">
          Welcome back, <span class="text-heading font-semibold">{{ auth.user?.fullName }}</span>
        </h2>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <!-- Theme Toggle Button -->
      <button
        @click="theme.toggleTheme"
        class="p-2.5 rounded-xl bg-panel-light border border-edge text-subtle hover:text-heading hover:border-indigo-500/30 transition-all duration-200 group relative"
        aria-label="Toggle theme"
      >
        <div class="relative w-5 h-5 overflow-hidden">
          <Transition name="sun-moon">
            <Sun
              v-if="!theme.isDark"
              class="absolute inset-0 text-amber-500"
              :size="20"
            />
            <Moon
              v-else
              class="absolute inset-0 text-indigo-400"
              :size="20"
            />
          </Transition>
        </div>
      </button>

      <!-- User Profile (Mobile) -->
      <div class="w-9 h-9 rounded-lg bg-indigo-500/12 text-indigo-400 flex items-center justify-center font-bold text-sm md:hidden">
        {{ auth.user?.fullName?.charAt(0) ?? 'U' }}
      </div>
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
</style>
