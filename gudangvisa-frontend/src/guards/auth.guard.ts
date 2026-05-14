import type { NavigationGuardWithThis } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

/**
 * Global navigation guard that protects authenticated routes and
 * enforces role-based access control.
 */
export const authGuard: NavigationGuardWithThis<undefined> = (to, _from, next) => {
  const auth = useAuthStore();

  const isPublic = to.meta.public === true;
  const requiresAdmin = to.meta.requiresAdmin === true;

  // Allow public routes unconditionally
  if (isPublic) {
    // Redirect authenticated users away from login
    if (to.path === '/login' && auth.isAuthenticated) {
      return next('/dashboard');
    }
    return next();
  }

  // Require authentication for protected routes
  if (!auth.isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  // Enforce admin-only routes
  if (requiresAdmin && !auth.isAdmin) {
    return next('/dashboard');
  }

  return next();
};
