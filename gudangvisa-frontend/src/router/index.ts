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
    {
      path: '/tracking',
      name: 'Tracking',
      component: () => import('../pages/TrackingPage.vue'),
      meta: { public: true },
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
          path: 'tickets',
          name: 'Tickets',
          component: () => import('../pages/TicketsPage.vue'),
        },
        {
          path: 'tickets/create',
          name: 'CreateTicket',
          component: () => import('../pages/TicketCreatePage.vue'),
        },
        {
          path: 'tickets/:id',
          name: 'TicketDetail',
          component: () => import('../pages/TicketDetailPage.vue'),
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
