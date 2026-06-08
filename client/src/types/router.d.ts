import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /** If true, the route does not require authentication. */
    public?: boolean;
    /** If true, only users with the ADMIN role can access this route. */
    requiresAdmin?: boolean;
  }
}
