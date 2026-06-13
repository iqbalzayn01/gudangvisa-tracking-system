# Gudang Visa — Frontend (Client)

The Vue 3 single-page application for the Gudang Visa Tracking System. It serves two separate audiences from one build:

- **Internal dashboard** (staff/admin) — applications, biometrics, document verification, users, and the audit-log viewer.
- **Client tracking portal** — a self-service area where clients log in to follow their document processing and download completed files (e-Visa, etc.).

## Tech Stack

- **Vue 3** (Composition API / `<script setup>`)
- **Vite 8** build tool
- **TypeScript** (strict)
- **Tailwind CSS v4** (`@tailwindcss/vite`) styling
- **reka-ui** + **shadcn-vue** UI primitives (`components.json`, `src/components/ui/`), with `class-variance-authority` + `tailwind-merge`
- **vue-i18n** internationalization (Indonesian default, English fallback)
- **@tabler/icons-vue** / **lucide-vue-next** icons
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

| Path                    | Audience      | Auth                                       |
| ----------------------- | ------------- | ------------------------------------------ |
| `/login`                | Staff / Admin | Public (redirects if authenticated)        |
| `/dashboard`            | Staff / Admin | Staff token                                |
| `/profile`              | Staff / Admin | Staff token                                |
| `/clients`              | Staff / Admin | Staff token                                |
| `/applications`         | Staff / Admin | Staff token                                |
| `/applications/create`  | Staff / Admin | Staff token                                |
| `/applications/:id`     | Staff / Admin | Staff token                                |
| `/biometrics`           | Staff / Admin | Staff token                                |
| `/audit-logs`           | Admin         | Staff token + admin                        |
| `/users`                | Admin         | Staff token + admin                        |
| `/portal`               | Public        | None — public tracking landing (only indexable page) |
| `/portal/login`         | Client        | Public (redirects if authenticated)        |
| `/portal/applications`  | Client        | Client token                               |

## Authentication

There are two **independent** sessions, kept apart so a leak in one cannot escalate the other:

| Session | Store                  | Token storage key   | Refresh endpoint           |
| ------- | ---------------------- | ------------------- | -------------------------- |
| Staff   | `auth.store`           | `auth_token`        | `/api/auth/internal/refresh` |
| Client  | `client-auth.store`    | `client_auth_token` | `/api/auth/client/refresh`   |

Each session uses its own Axios instance (`api/client.ts` and `api/portal.client.ts`) with a silent-refresh response interceptor.

## Live Updates

The authenticated client portal (`/portal/applications`) and the public tracking landing (`/portal`) poll the API (~10s) so status stays current without a manual refresh. Polling pauses while the browser tab is hidden (`visibilitychange`) and the interval + listener are cleared on component unmount to avoid memory leaks. (A migration to Supabase Realtime/WebSocket is on the roadmap and would not change the UI layer.)

## Internationalization

UI copy is translated with **vue-i18n** (`src/i18n/`). Two locales ship: `id` (Indonesian, the default) and `en` (English, the fallback) under `src/i18n/locales/`. The active locale is persisted to `localStorage` under the `locale` key and the `<html lang>` attribute is kept in sync.

## SEO

Per-route metadata (title, description, `robots`, canonical, Open Graph / Twitter) is applied by `src/utils/seo.ts` from `router.afterEach`. Only the public tracking landing `/portal` is indexable (`index, follow`); every other route — including all staff and authenticated client pages — is served `noindex, nofollow, noarchive`. `public/robots.txt` and `public/sitemap.xml` expose only `/portal`.

## Project Structure

```
src/
├── api/            # Axios instances + typed API modules (staff + portal)
├── components/     # Reusable UI (StatusBadge, StatusStepper, TrackingTimeline, …)
│   └── ui/         # reka-ui / shadcn-vue primitives (Button, Select)
├── guards/         # Router navigation guard (staff + client domains)
├── i18n/           # vue-i18n setup + locales/{id,en}.ts
├── layouts/        # Dashboard / auth layouts
├── lib/            # cn() class-merge helper
├── pages/          # Route views (incl. PublicTrackingPage, ClientLoginPage, ClientPortalPage)
├── stores/         # Pinia stores (auth, client-auth, application, client, notification, theme)
├── styles/         # globals.css (Tailwind v4 + design tokens)
├── types/          # Shared TypeScript types
└── utils/          # Formatters, clipboard, seo.ts
```
