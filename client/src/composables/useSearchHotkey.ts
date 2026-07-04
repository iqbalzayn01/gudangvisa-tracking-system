import { onMounted, onUnmounted, nextTick, type Ref } from 'vue';

/**
 * Focus a search input on Ctrl/Cmd+K. Registers a `keydown` listener on mount
 * and removes it on unmount, so pages don't each re-implement the wiring.
 */
export function useSearchHotkey(
  target: Ref<HTMLInputElement | null>,
  key = 'k',
): void {
  function handleKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === key) {
      e.preventDefault();
      nextTick(() => target.value?.focus());
    }
  }

  onMounted(() => document.addEventListener('keydown', handleKeydown));
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown));
}
