# Gudang Visa — Frontend (Client)

The Vue 3 single-page application for the Gudang Visa Tracking System. It serves two separate audiences from one build:

- **Internal dashboard** (staff/admin) — applications, biometrics, document verification, users, and the audit-log viewer.
- **Client tracking portal** — a self-service area where clients log in to follow their document processing and download completed files (e-Visa, etc.). A document is offered for download as soon as staff mark it **Verified** (`ClientPortalPage` lists docs with `status === 'verified'`); there is no separate "make public" toggle.

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

Each session uses its own Axios instance (`api/client.ts` and `api/portal.client.ts`), both produced by the shared `createApiClient` factory described above.

## Feature Summaries

### Applications

The core staff workflow, spanning three views:

- **List** (`ApplicationsPage.vue`) — every application in one table with debounced search (`useDebouncedSearch`), status + priority filters, a Ctrl/Cmd-K search shortcut (`useSearchHotkey`), an auto-computed progress bar per status, and admin-only delete. Matched search terms are highlighted with the **HTML-safe** `highlight()` util (escapes the source text before wrapping matches, so a client name containing markup can't inject HTML through `v-html`). Rows deep-link via `?q=` and open the detail view.
- **Create** (`ApplicationCreatePage.vue`) — pick a client (searchable combobox), visa type, priority (`low`/`medium`/`high`/`urgent`) and notes; on success it shows the generated **reference number** and adds the row to the store optimistically.
- **Detail** (`ApplicationDetailPage.vue`) — drives the whole lifecycle: status updates (with a client-visible description toggle), the per-visa-type verification **checklist**, **document** management (3-step upload → Supabase signed URL → record; verify / reject-with-reason / delete; download), and the **tracking timeline**. Edits here are pushed back into the applications store (`updateLocal`) so the list and Biometrics views reflect them without a full refetch.

All views read shared metadata from `utils/labels.ts` (status labels, badge colors, lifecycle order, progress %), keeping them in sync with the backend enums.

### Biometric

Biometric scheduling lives on the application **detail** page (`updateBiometricSchedule`): status (`scheduled`/`completed`/`rescheduled`/`cancelled`/`no_show`), date, time, location, and field-assistant contact.

`BiometricSchedulesPage.vue` is a **derived** view — it does no fetching of its own. It reads the applications store, filters to those with a biometric schedule, shows summary counts per status, sorts soonest-first, and each row links back to the owning application's detail page. Times render through the shared `formatTime` helper (`HH:MM`), consistent with the detail view.

### Audit Log

`AuditLogsPage.vue` is the **admin-only** activity viewer (guarded by `meta.requiresAdmin`). It shows Timestamp, User (actor + role badge), Action (colored pill), Entity (+ description + `#entityId`), and IP Address. Action and Entity filters are applied **server-side** (a watcher refetches on change); a free-text box does client-side search over the loaded set. It renders **real data only** — a failed request surfaces an inline error banner (and clears stale rows) and an empty trail shows an empty state; there is no demo/mock fallback.

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
│                   #   create-client.ts — createApiClient() factory shared by both instances
│                   #   token-sync.ts    — bridges interceptor refreshes back into the auth stores
├── components/     # Reusable UI (StatusBadge, PriorityBadge, StatusStepper, TrackingTimeline, …)
│   └── ui/         # reka-ui / shadcn-vue primitives (Button, Select)
├── composables/    # useDebouncedSearch (debounced list search), useSearchHotkey (Ctrl/Cmd-K focus)
├── guards/         # Router navigation guard (staff + client domains)
├── i18n/           # vue-i18n setup + locales/{id,en}.ts
├── layouts/        # Dashboard / auth layouts
├── lib/            # cn() class-merge helper
├── pages/          # Route views (incl. PublicTrackingPage, ClientLoginPage, ClientPortalPage)
├── stores/         # Pinia stores (auth, client-auth, application, client, notification, theme)
├── styles/         # globals.css (Tailwind v4 + design tokens)
├── types/          # Shared TypeScript types (mirror backend enums: ApplicationStatus, VisaType, DocumentType, Priority, …)
└── utils/          # formatters.ts (dates, file size, expiry, XSS-safe highlight),
                    #   labels.ts (status/visa/document/priority/biometric labels + badge classes),
                    #   clipboard.ts, seo.ts
```

### Shared axios factory

Both sessions are built from one `createApiClient({ tokenKey, refreshPath, loginRedirect })` factory (`api/create-client.ts`) instead of two hand-copied instances. It injects the bearer token, normalizes error messages, and runs a **single-flight** 401→refresh→retry interceptor: concurrent 401s share one refresh request (rather than each firing its own and invalidating one another under refresh-token rotation), and the new token is pushed back into the Pinia store via `api/token-sync.ts`.

## Labels & Status Metadata

`src/utils/labels.ts` is the single source of truth for human-readable labels, badge colors, and the canonical ordering of the backend enums (the full 16-stage `application_status` lifecycle, `visa_type`, `document_type`, `priority`, `document_status`). Components like `StatusBadge`, `PriorityBadge`, `StatusStepper`, and the status `<select>` all read from it, so the UI stays in sync with the database enums in one place.

## Document Expiry Monitoring

Uploaded documents carry optional `issuedDate` / `expiryDate`. The staff dashboard surfaces an **Expiring Documents** widget (passports, KITAS, VITAS & permits expiring within 60 days, or already expired), backed by `GET /api/documents/expiring`. Expiry state and styling are derived in `utils/formatters.ts` (`expiryState`, `expiryClasses`, `daysUntil`).
