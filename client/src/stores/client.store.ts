import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getAllClients } from '../api/clients.api';
import type { Client } from '../types';

/**
 * Server-backed client store.
 * Used for client dropdowns in application creation and client management page.
 */
export const useClientStore = defineStore('clients', () => {
  // ── State ──────────────────────────────────────────────────────────────
  const clients = ref<Client[]>([]);
  const isLoading = ref(false);
  const hasFetched = ref(false);
  const error = ref('');

  // ── Getters ──────────────────────────────────────────────────────────────
  const sortedClients = computed(() =>
    [...clients.value].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );

  const totalCount = computed(() => clients.value.length);

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Fetch all clients from the server. */
  async function fetchAll(): Promise<void> {
    isLoading.value = true;
    error.value = '';

    try {
      clients.value = await getAllClients();
      hasFetched.value = true;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load clients';
    } finally {
      isLoading.value = false;
    }
  }

  /** Optimistic: add a newly created client to the local list. */
  function addLocal(client: Client): void {
    clients.value.unshift(client);
  }

  /** Optimistic: remove a client from the local list. */
  function removeLocal(id: string): void {
    clients.value = clients.value.filter((c) => c.id !== id);
  }

  /** Replace a client in the local list with an updated copy. */
  function updateLocal(client: Client): void {
    const idx = clients.value.findIndex((c) => c.id === client.id);
    if (idx !== -1) clients.value[idx] = client;
  }

  return {
    clients,
    sortedClients,
    totalCount,
    isLoading,
    hasFetched,
    error,
    fetchAll,
    addLocal,
    removeLocal,
    updateLocal,
  };
});
