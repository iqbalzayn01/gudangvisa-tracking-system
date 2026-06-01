import { createRouter, createWebHistory } from 'vue-router';
import { authGuard } from '../guards/auth.guard';
import DashboardLayout from '../layouts/DashboardLayout.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ── Public Routes ──────────────────────────────────────────────────────
    {
      path: '/login',
      name: 'Login',
      component: () => import('../pages/LoginPage.vue'),
      meta: { public: true },
    },
    // ── Client Portal (separate client authentication) ─────────────────────
    {
      path: '/portal/login',
      name: 'ClientLogin',
      component: () => import('../pages/ClientLoginPage.vue'),
      meta: { portal: true },
    },
    {
      path: '/portal',
      name: 'ClientPortal',
      component: () => import('../pages/ClientPortalPage.vue'),
      meta: { portal: true },
    },

    // ── Authenticated Routes ───────────────────────────────────────────────
    {
      path: '/',
      component: DashboardLayout,
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../pages/DashboardPage.vue'),
        },
        {
          path: 'clients',
          name: 'Clients',
          component: () => import('../pages/ClientsPage.vue'),
        },
        {
          path: 'applications',
          name: 'Applications',
          component: () => import('../pages/ApplicationsPage.vue'),
        },
        {
          path: 'applications/create',
          name: 'CreateApplication',
          component: () => import('../pages/ApplicationCreatePage.vue'),
        },
        {
          path: 'applications/:id',
          name: 'ApplicationDetail',
          component: () => import('../pages/ApplicationDetailPage.vue'),
        },
        {
          path: 'biometrics',
          name: 'Biometrics',
          component: () => import('../pages/BiometricSchedulesPage.vue'),
        },
        {
          path: 'audit-logs',
          name: 'AuditLogs',
          component: () => import('../pages/AuditLogsPage.vue'),
          meta: { requiresAdmin: true },
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('../pages/UsersPage.vue'),
          meta: { requiresAdmin: true },
        },
      ],
    },

    // ── Catch-all ──────────────────────────────────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
});

router.beforeEach(authGuard);

export default router;
