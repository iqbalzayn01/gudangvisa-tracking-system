import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getAllTickets } from '../api/tickets.api';
import type { TrackingTicket, DocStatus } from '../types';

/**
 * Server-backed ticket store.
 *
 * Fetches all tickets from GET /api/v1/tickets.
 * Provides reactive filtering, sorting, and optimistic local updates.
 */
export const useTicketStore = defineStore('tickets', () => {
  // ── State ──────────────────────────────────────────────────────────────
  const tickets = ref<TrackingTicket[]>([]);
  const isLoading = ref(false);
  const hasFetched = ref(false);
  const error = ref('');

  // ── Getters ──────────────────────────────────────────────────────────────
  const sortedTickets = computed(() =>
    [...tickets.value].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );

  const totalCount = computed(() => tickets.value.length);

  const countByStatus = computed(() => {
    const counts: Partial<Record<DocStatus, number>> = {};
    for (const ticket of tickets.value) {
      counts[ticket.currentStatus] =
        (counts[ticket.currentStatus] ?? 0) + 1;
    }
    return counts;
  });

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Fetch all tickets from the server. */
  async function fetchAll(): Promise<void> {
    isLoading.value = true;
    error.value = '';

    try {
      tickets.value = await getAllTickets();
      hasFetched.value = true;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load tickets';
    } finally {
      isLoading.value = false;
    }
  }

  /** Optimistic: add a newly created ticket to the local list. */
  function addLocal(ticket: TrackingTicket): void {
    tickets.value.unshift(ticket);
  }

  /** Optimistic: update a ticket's status locally. */
  function updateStatusLocal(id: string, status: DocStatus): void {
    const ticket = tickets.value.find((t) => t.id === id);
    if (ticket) {
      ticket.currentStatus = status;
    }
  }

  /** Optimistic: remove a ticket from the local list. */
  function removeLocal(id: string): void {
    tickets.value = tickets.value.filter((t) => t.id !== id);
  }

  return {
    tickets,
    sortedTickets,
    totalCount,
    countByStatus,
    isLoading,
    hasFetched,
    error,
    fetchAll,
    addLocal,
    updateStatusLocal,
    removeLocal,
  };
});
