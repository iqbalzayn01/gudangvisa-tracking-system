import { ref, watch, onUnmounted } from 'vue';

/**
 * Debounced search state shared by the list pages.
 *
 * `searchInput` is bound to the text field (updates on every keystroke);
 * `searchQuery` trails it by `delay` ms and is what filtering/highlighting read,
 * so we don't re-filter a large list on every keypress.
 *
 * Use `setSearch()` to seed both immediately (e.g. a `?q=` deep-link) without
 * waiting for the debounce.
 */
export function useDebouncedSearch(delay = 200) {
  const searchInput = ref('');
  const searchQuery = ref('');
  let timer: ReturnType<typeof setTimeout> | null = null;

  watch(searchInput, (val) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      searchQuery.value = val;
    }, delay);
  });

  function setSearch(val: string): void {
    if (timer) clearTimeout(timer);
    searchInput.value = val;
    searchQuery.value = val;
  }

  onUnmounted(() => {
    if (timer) clearTimeout(timer);
  });

  return { searchInput, searchQuery, setSearch };
}
