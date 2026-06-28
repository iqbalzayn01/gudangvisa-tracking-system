import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getAllApplications } from '../api/applications.api';
import type { Application, ApplicationStatus, Priority } from '../types';
import { phaseOf, type StatusPhase } from '../utils/labels';

/**
 * Server-backed application store.
 *
 * Fetches all applications from GET /api/v1/applications.
 * Provides reactive filtering, sorting, and optimistic local updates.
 */
export const useApplicationStore = defineStore('applications', () => {
  // ── State ──────────────────────────────────────────────────────────────
  const applications = ref<Application[]>([]);
  const isLoading = ref(false);
  const hasFetched = ref(false);
  const error = ref('');

  // ── Getters ──────────────────────────────────────────────────────────────
  const sortedApplications = computed(() =>
    [...applications.value].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );

  const totalCount = computed(() => applications.value.length);

  const countByStatus = computed(() => {
    const counts: Partial<Record<ApplicationStatus, number>> = {};
    for (const application of applications.value) {
      counts[application.currentStatus] =
        (counts[application.currentStatus] ?? 0) + 1;
    }
    return counts;
  });

  /** Application counts grouped by KITAS lifecycle phase (dashboard chart). */
  const countByPhase = computed(() => {
    const counts: Partial<Record<StatusPhase, number>> = {};
    for (const application of applications.value) {
      const phase = phaseOf(application.currentStatus);
      counts[phase] = (counts[phase] ?? 0) + 1;
    }
    return counts;
  });

  const countByPriority = computed(() => {
    const counts: Partial<Record<Priority, number>> = {};
    for (const application of applications.value) {
      const p = application.priority ?? 'medium';
      counts[p] = (counts[p] ?? 0) + 1;
    }
    return counts;
  });

  /** Applications created today (local time). */
  const newToday = computed(() => {
    const now = new Date();
    return applications.value.filter((a) => {
      const d = new Date(a.createdAt);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }).length;
  });

  /** Applications created in the current calendar month. */
  const newThisMonth = computed(() => {
    const now = new Date();
    return applications.value.filter((a) => {
      const d = new Date(a.createdAt);
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    }).length;
  });

  /** Average number of days an application has been open. */
  const avgDays = computed(() => {
    if (applications.value.length === 0) return 0;
    const now = Date.now();
    const total = applications.value.reduce((sum, a) => {
      const days = (now - new Date(a.createdAt).getTime()) / 86_400_000;
      return sum + Math.max(0, days);
    }, 0);
    return Math.round(total / applications.value.length);
  });

  /** Applications with an upcoming or active biometric appointment. */
  const biometricCount = computed(
    () =>
      applications.value.filter(
        (a) =>
          a.biometricStatus &&
          a.biometricStatus !== 'not_scheduled' &&
          a.biometricStatus !== 'cancelled',
      ).length,
  );

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Fetch all applications from the server. */
  async function fetchAll(): Promise<void> {
    isLoading.value = true;
    error.value = '';

    try {
      applications.value = await getAllApplications();
      hasFetched.value = true;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to load applications';
    } finally {
      isLoading.value = false;
    }
  }

  /** Optimistic: add a newly created application to the local list. */
  function addLocal(application: Application): void {
    applications.value.unshift(application);
  }

  /** Optimistic: update an application's status locally. */
  function updateStatusLocal(id: string, status: ApplicationStatus): void {
    const application = applications.value.find((a) => a.id === id);
    if (application) {
      application.currentStatus = status;
    }
  }

  /** Optimistic: remove an application from the local list. */
  function removeLocal(id: string): void {
    applications.value = applications.value.filter((a) => a.id !== id);
  }

  return {
    applications,
    sortedApplications,
    totalCount,
    countByStatus,
    countByPhase,
    countByPriority,
    newToday,
    newThisMonth,
    avgDays,
    biometricCount,
    isLoading,
    hasFetched,
    error,
    fetchAll,
    addLocal,
    updateStatusLocal,
    removeLocal,
  };
});
