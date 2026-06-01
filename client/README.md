# Gudang Visa — Frontend (Client)

The Vue 3 single-page application for the Gudang Visa Tracking System. It serves two separate audiences from one build:

- **Internal dashboard** (staff/admin) — applications, biometrics, document verification, users, and the audit-log viewer.
- **Client tracking portal** — a self-service area where clients log in to follow their document processing and download completed files (e-Visa, etc.).

## Tech Stack

- **Vue 3** (Composition API / `<script setup>`)
- **Vite** build tool
- **TypeScript** (strict)
- **Tailwind CSS** styling
- **Pinia** state management
- **Vue Router** with a navigation guard that handles two auth domains
- **Axios** HTTP client (separate instances for the staff and client sessions)

## Setup

```bash
npm install
```

Create a `.env` file:

```env
VITE_BASE_URL=http://localhost:8000/api
```

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite dev server            |
| `npm run build`   | Type-check (`vue-tsc`) + production build |
| `npm run preview` | Preview the production build locally |

## Routes

| Path             | Audience      | Auth                                |
| ---------------- | ------------- | ----------------------------------- |
| `/login`         | Staff / Admin | Public (redirects if authenticated) |
| `/dashboard`     | Staff / Admin | Staff token                         |
| `/applications`  | Staff / Admin | Staff token                         |
| `/biometrics`    | Staff / Admin | Staff token                         |
| `/audit-logs`    | Admin         | Staff token + admin                 |
| `/users`         | Admin         | Staff token + admin                 |
| `/tracking`      | Public        | None (track by code)                |
| `/portal/login`  | Client        | Public (redirects if authenticated) |
| `/portal`        | Client        | Client token                        |

## Authentication

There are two **independent** sessions, kept apart so a leak in one cannot escalate the other:

| Session | Store                  | Token storage key   | Refresh endpoint           |
| ------- | ---------------------- | ------------------- | -------------------------- |
| Staff   | `auth.store`           | `auth_token`        | `/api/auth/internal/refresh` |
| Client  | `client-auth.store`    | `client_auth_token` | `/api/auth/client/refresh`   |

Each session uses its own Axios instance (`api/client.ts` and `api/portal.client.ts`) with a silent-refresh response interceptor.

## Live Updates

The client portal (`/portal`) and the public tracking page poll the API (~10s) so status stays current without a manual refresh. Polling pauses while the browser tab is hidden (`visibilitychange`) and the interval + listener are cleared on component unmount to avoid memory leaks.

## Project Structure

```
src/
├── api/            # Axios instances + typed API modules (staff + portal)
├── components/     # Reusable UI (StatusBadge, StatusStepper, TrackingTimeline, …)
├── guards/         # Router navigation guard (staff + client domains)
├── layouts/        # Dashboard / auth layouts
├── pages/          # Route views (incl. ClientLoginPage, ClientPortalPage)
├── stores/         # Pinia stores (auth, client-auth, application, theme, …)
├── types/          # Shared TypeScript types
└── utils/          # Formatters & helpers
```
