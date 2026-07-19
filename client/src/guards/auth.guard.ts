import type { NavigationGuardWithThis } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

/**
 * Global navigation guard.
 *
 * The app has one authenticated domain (staff/admin dashboard, `auth.store`)
 * plus a set of fully public routes (staff login, public resi-based client
 * tracking under `/portal/*` — clients never authenticate).
 */
export const authGuard: NavigationGuardWithThis<undefined> = (
  to,
  _from,
  next,
) => {
  const auth = useAuthStore();

  const isPublic = to.meta.public === true;
  const requiresAdmin = to.meta.requiresAdmin === true;

  if (isPublic) {
    if (to.path === '/login' && auth.isAuthenticated) {
      return next('/dashboard');
    }
    return next();
  }

  if (!auth.isAuthenticated) {
    return next({ path: '/login' });
  }

  if (requiresAdmin && !auth.isAdmin) {
    return next('/dashboard');
  }

  return next();
};
