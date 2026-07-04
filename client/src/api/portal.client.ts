import { createApiClient } from './create-client';

/**
 * Axios instance dedicated to the CLIENT tracking portal.
 *
 * Kept separate from the staff `apiClient` so the two sessions never collide:
 * it sends the client access token (`client_auth_token`) and refreshes via the
 * client refresh endpoint instead of the internal one.
 */
const clientApi = createApiClient({
  tokenKey: 'client_auth_token',
  userKey: 'client_auth_user',
  refreshPath: '/auth/client/refresh',
  loginRedirect: '/portal/login',
  shouldRedirect: (path) =>
    path.startsWith('/portal') && path !== '/portal/login',
});

export default clientApi;
