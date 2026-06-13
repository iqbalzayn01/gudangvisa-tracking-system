import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as apiLogin, getProfile } from '../api/auth.api';
import type { User, UserRole, LoginPayload } from '../types';

export const useAuthStore = defineStore('auth', () => {
  // ── State ────────────────────────────────────────────────────────────────
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isLoading = ref(false);

  // ── Getters ──────────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const isStaff = computed(() => user.value?.role === 'STAFF');

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Restore session from localStorage on app startup.
   */
  function initialize(): void {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken) {
      token.value = savedToken;
    }

    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser) as User;
      } catch {
        localStorage.removeItem('auth_user');
      }
    }
  }

  /**
   * Authenticate with email & password, persist token + user profile.
   */
  async function login(payload: LoginPayload): Promise<void> {
    isLoading.value = true;

    try {
      const response = await apiLogin(payload);

      token.value = response.token;
      localStorage.setItem('auth_token', response.token);

      // Use the user data returned by login immediately
      const partialUser: User = {
        id: '',
        fullName: response.user.fullName,
        email: payload.email,
        role: response.user.role as UserRole,
      };
      user.value = partialUser;
      localStorage.setItem('auth_user', JSON.stringify(partialUser));

      // Fetch full profile (with id) in background — non-blocking
      getProfile()
        .then((profile) => {
          user.value = profile;
          localStorage.setItem('auth_user', JSON.stringify(profile));
        })
        .catch(() => {
          /* silent — partial data is sufficient */
        });
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Refresh the user profile from the server.
   */
  async function fetchProfile(): Promise<void> {
    const profile = await getProfile();
    user.value = profile;
    localStorage.setItem('auth_user', JSON.stringify(profile));
  }

  /**
   * Update editable profile fields locally (frontend-only).
   *
   * Persists to the current session/localStorage. Not yet synced to the
   * server — wire this to a PATCH endpoint when the backend exposes one.
   */
  function updateProfileLocal(
    data: Partial<Pick<User, 'fullName' | 'email'>>,
  ): void {
    if (!user.value) return;
    user.value = { ...user.value, ...data };
    localStorage.setItem('auth_user', JSON.stringify(user.value));
  }

  /**
   * Clear all auth state and redirect to login.
   */
  function logout(): void {
    user.value = null;
    token.value = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    isAdmin,
    isStaff,
    initialize,
    login,
    fetchProfile,
    updateProfileLocal,
    logout,
  };
});
