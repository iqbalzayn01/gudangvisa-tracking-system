import { createApiClient } from './create-client';

/**
 * Axios instance for the INTERNAL staff/admin dashboard. Sends the staff access
 * token (`auth_token`) and refreshes via the internal refresh endpoint.
 */
const apiClient = createApiClient({
  tokenKey: 'auth_token',
  userKey: 'auth_user',
  refreshPath: '/auth/internal/refresh',
  loginRedirect: '/login',
  shouldRedirect: (path) => !path.startsWith('/login'),
});

export default apiClient;
