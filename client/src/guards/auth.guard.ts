import type { NavigationGuardWithThis } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { useClientAuthStore } from '../stores/client-auth.store';

/**
 * Global navigation guard.
 *
 * The app has two independent authentication domains:
 *  - Staff/admin dashboard (`auth.store`)
 *  - Client tracking portal under `/portal/*` (`client-auth.store`)
 * plus a set of fully public routes (login pages, public tracking).
 */
export const authGuard: NavigationGuardWithThis<undefined> = (
  to,
  _from,
  next,
) => {
  // ── Client portal domain ──────────────────────────────────────────────
  if (to.meta.portal === true || to.path.startsWith('/portal')) {
    // The portal landing (`/portal`) is a fully public page.
    if (to.meta.public === true) return next();

    const clientAuth = useClientAuthStore();

    if (to.path === '/portal/login') {
      // Already signed in → skip the login screen.
      if (clientAuth.isAuthenticated) return next('/portal/applications');
      return next();
    }

    if (!clientAuth.isAuthenticated) {
      return next({ path: '/portal/login' });
    }
    return next();
  }

  // ── Staff/admin domain ────────────────────────────────────────────────
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
