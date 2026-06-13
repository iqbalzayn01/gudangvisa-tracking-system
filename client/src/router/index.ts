import { createRouter, createWebHistory } from 'vue-router';
import { authGuard } from '../guards/auth.guard';
import { applyRouteSeo } from '../utils/seo';
import DashboardLayout from '../layouts/DashboardLayout.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ── Public Routes ──────────────────────────────────────────────────────
    {
      path: '/login',
      name: 'Login',
      component: () => import('../pages/LoginPage.vue'),
      // Public route, but Secure for SEO (not indexed).
      meta: { public: true, title: 'Masuk Staf — GudangVisa' },
    },
    // ── Client Portal (separate client authentication) ─────────────────────
    // Public landing / entry point for clients — the only indexable page.
    {
      path: '/portal',
      name: 'PortalLanding',
      component: () => import('../pages/PublicTrackingPage.vue'),
      meta: {
        public: true,
        index: true,
        title:
          'GudangVisa — Lacak Dokumen Imigrasi Anda (Visa, KITAS, Paspor)',
        description:
          'Lacak status dan riwayat dokumen imigrasi Anda secara real-time. Layanan pengurusan Visa, KITAS/KITAP, dan Paspor yang cepat, andal, dan transparan di Bali.',
      },
    },
    {
      path: '/portal/login',
      name: 'ClientLogin',
      component: () => import('../pages/ClientLoginPage.vue'),
      meta: { portal: true, title: 'Masuk Portal Klien — GudangVisa' },
    },
    // Authenticated client portal (their applications + details) — Secure.
    {
      path: '/portal/applications',
      name: 'ClientPortal',
      component: () => import('../pages/ClientPortalPage.vue'),
      meta: { portal: true, title: 'Dokumen Saya — GudangVisa' },
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
          meta: { title: 'Dashboard — GudangVisa' },
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('../pages/ProfilePage.vue'),
          meta: { title: 'Profile — GudangVisa' },
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

// Keep document title + robots/canonical/OG in sync with the active route.
router.afterEach((to) => {
  applyRouteSeo(to);
});

export default router;
