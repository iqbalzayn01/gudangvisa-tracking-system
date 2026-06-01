import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { clientLogin, clientLogout } from '../api/portal.api';

interface ClientUser {
  fullName: string;
  email: string;
}

/**
 * Auth store for the EXTERNAL client tracking portal.
 * Completely separate from the staff `auth.store` (different token + storage
 * keys) to keep the internal and client sessions isolated.
 */
export const useClientAuthStore = defineStore('client-auth', () => {
  const user = ref<ClientUser | null>(null);
  const token = ref<string | null>(null);
  const isLoading = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  /** Restore session from localStorage on app startup. */
  function initialize(): void {
    const savedToken = localStorage.getItem('client_auth_token');
    const savedUser = localStorage.getItem('client_auth_user');

    if (savedToken) token.value = savedToken;
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser) as ClientUser;
      } catch {
        localStorage.removeItem('client_auth_user');
      }
    }
  }

  async function login(email: string, password: string): Promise<void> {
    isLoading.value = true;
    try {
      const result = await clientLogin(email, password);
      token.value = result.token;
      user.value = { fullName: result.fullName, email: result.email };
      localStorage.setItem('client_auth_token', result.token);
      localStorage.setItem('client_auth_user', JSON.stringify(user.value));
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    await clientLogout();
    user.value = null;
    token.value = null;
    localStorage.removeItem('client_auth_token');
    localStorage.removeItem('client_auth_user');
  }

  return { user, token, isLoading, isAuthenticated, initialize, login, logout };
});
