# Gudang Visa — Frontend (Client)

The Vue 3 single-page application for the Gudang Visa Tracking System. It serves two separate audiences from one build:

- **Internal dashboard** (staff/admin) — applications, biometrics, document verification, users, and the audit-log viewer.
- **Public tracking page** — clients need **no account**: entering their application's reference number ("nomor resi") at `/portal` shows its status timeline at `/portal/track/:referenceNumber`. Documents become downloadable once the application is **Completed** and the document is **Verified** — no login, no separate "make public" step.

## Tech Stack

- **Vue 3** (Composition API / `<script setup>`)
- **Vite 8** build tool
- **TypeScript** (strict)
- **Tailwind CSS v4** (`@tailwindcss/vite`) styling
- **reka-ui** + **shadcn-vue** UI primitives (`components.json`, `src/components/ui/`), with `class-variance-authority` + `tailwind-merge`
- **vue-i18n** internationalization (Indonesian default, English fallback)
- **@tabler/icons-vue** / **lucide-vue-next** icons
- **Pinia** state management
- **Vue Router** with a navigation guard for the staff/admin session (public routes, incl. all of `/portal/*`, pass straight through)
- **Axios** HTTP client — a staff-session instance plus a bare, unauthenticated instance for the public resi-tracking calls

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
| `/reports`              | Staff / Admin | Staff token                                |
| `/audit-logs`           | Admin         | Staff token + admin                        |
| `/users`                | Admin         | Staff token + admin                        |
| `/portal`               | Public        | None — public tracking landing (only indexable page) |
| `/portal/track/:referenceNumber` | Public | None — status/timeline/downloads for that application |

## Authentication

A single staff/admin session:

| Session | Store         | Token storage key | Refresh endpoint              |
| ------- | -------------- | ------------------ | -------------------------------- |
| Staff   | `auth.store`  | `auth_token`       | `/api/auth/internal/refresh`   |

`api/client.ts` is the staff-session Axios instance, produced by the shared `createApiClient` factory (bearer-token injection, single-flight 401→refresh→retry). The public resi-tracking calls (`api/tracking.api.ts`) use a separate, bare Axios instance with no token/refresh logic — those endpoints never require a session.

## Feature Summaries

### Applications

The core staff workflow, spanning three views:

- **List** (`ApplicationsPage.vue`) — every application in one table with debounced search (`useDebouncedSearch`), status + priority filters, a Ctrl/Cmd-K search shortcut (`useSearchHotkey`), an auto-computed progress bar per status, and admin-only delete. Matched search terms are highlighted with the **HTML-safe** `highlight()` util (escapes the source text before wrapping matches, so a client name containing markup can't inject HTML through `v-html`). Rows deep-link via `?q=` and open the detail view.
- **Create** (`ApplicationCreatePage.vue`) — pick a client (searchable combobox), visa type, priority (`low`/`medium`/`high`/`urgent`) and notes; on success it shows the generated **reference number** and adds the row to the store optimistically.
- **Detail** (`ApplicationDetailPage.vue`) — drives the whole lifecycle: status updates, the per-visa-type verification **checklist**, **document** management (3-step upload → Supabase signed URL → record; verify / reject-with-reason / delete; a self-rendered **PDF preview** via `pdf.js`, no native browser viewer), and the **tracking timeline** (every entry is public — there's no internal/visible-to-client split). Edits here are pushed back into the applications store (`updateLocal`) so the list and Biometrics views reflect them without a full refetch.

All views read shared metadata from `utils/labels.ts` (status labels, badge colors, lifecycle order, progress %), keeping them in sync with the backend enums.

### Biometric

Biometric scheduling lives on the application **detail** page (`updateBiometricSchedule`): status (`scheduled`/`completed`/`rescheduled`/`cancelled`/`no_show`), date, time, location, and field-assistant contact.

`BiometricSchedulesPage.vue` is a **derived** view — it does no fetching of its own. It reads the applications store, filters to those with a biometric schedule, shows summary counts per status, sorts soonest-first, and each row links back to the owning application's detail page. Times render through the shared `formatTime` helper (`HH:MM`), consistent with the detail view.

### Audit Log

`AuditLogsPage.vue` is the **admin-only** activity viewer (guarded by `meta.requiresAdmin`). It shows Timestamp, User (actor + role badge), Action (colored pill), Entity (+ description + `#entityId`), and IP Address. Action and Entity filters are applied **server-side** (a watcher refetches on change); a free-text box does client-side search over the loaded set. It renders **real data only** — a failed request surfaces an inline error banner (and clears stale rows) and an empty trail shows an empty state; there is no demo/mock fallback.

### Reports

`ReportsPage.vue` — a monthly recap of applications (new vs. completed, breakdown by visa type and status), computed client-side from the applications store (`utils/monthly-recap.ts`) with a year filter and CSV export (`utils/csv.ts`).

### Public Tracking

- `PublicTrackingPage.vue` (`/portal`) — the marketing landing; its hero has a reference-number search box that routes to the result page. No account, no form beyond the one input.
- `PublicTrackingResultPage.vue` (`/portal/track/:referenceNumber`) — fetches via `api/tracking.api.ts` (no auth), shows the status stepper/badge and full tracking timeline, and — only once the application is **Completed** — a download button per verified document that requests a fresh signed URL scoped to that reference number.

## Live Updates

`PublicTrackingResultPage.vue` has a manual refresh button rather than polling — the public tracking/download endpoints are rate-limited per IP, so this page intentionally doesn't auto-poll.

## Internationalization

UI copy is translated with **vue-i18n** (`src/i18n/`). Two locales ship: `id` (Indonesian, the default) and `en` (English, the fallback) under `src/i18n/locales/`. The active locale is persisted to `localStorage` under the `locale` key and the `<html lang>` attribute is kept in sync.

## SEO

Per-route metadata (title, description, `robots`, canonical, Open Graph / Twitter) is applied by `src/utils/seo.ts` from `router.afterEach`. Only the public tracking landing `/portal` is indexable (`index, follow`); every other route — including all staff and authenticated client pages — is served `noindex, nofollow, noarchive`. `public/robots.txt` and `public/sitemap.xml` expose only `/portal`.

## Project Structure

```
src/
├── api/            # Axios instances + typed API modules
│                   #   create-client.ts  — createApiClient() factory (staff session)
│                   #   token-sync.ts     — bridges interceptor refreshes back into the auth store
│                   #   tracking.api.ts   — bare, unauthenticated instance for public resi tracking/download
├── components/     # Reusable UI (StatusBadge, PriorityBadge, StatusStepper, TrackingTimeline, PdfPreview, …)
│   └── ui/         # reka-ui / shadcn-vue primitives (Button, Select)
├── composables/    # useDebouncedSearch (debounced list search), useSearchHotkey (Ctrl/Cmd-K focus)
├── guards/         # Router navigation guard (staff/admin session; all other routes are public)
├── i18n/           # vue-i18n setup + locales/{id,en}.ts
├── layouts/        # Dashboard / auth layouts
├── lib/            # cn() class-merge helper
├── pages/          # Route views (incl. PublicTrackingPage, PublicTrackingResultPage, ReportsPage)
├── stores/         # Pinia stores (auth, application, client, notification, theme)
├── styles/         # globals.css (Tailwind v4 + design tokens)
├── types/          # Shared TypeScript types (mirror backend enums: ApplicationStatus, VisaType, DocumentType, Priority, …)
└── utils/          # formatters.ts (dates, file size, expiry, XSS-safe highlight),
                    #   labels.ts (status/visa/document/priority/biometric labels + badge classes),
                    #   clipboard.ts, seo.ts, csv.ts, monthly-recap.ts
```

### Shared axios factory

The staff session is built from `createApiClient({ tokenKey, refreshPath, loginRedirect })` (`api/create-client.ts`). It injects the bearer token, normalizes error messages, and runs a **single-flight** 401→refresh→retry interceptor, pushing the refreshed token back into the Pinia store via `api/token-sync.ts`. The public tracking calls in `api/tracking.api.ts` intentionally don't use this factory — they're unauthenticated by design.

## Labels & Status Metadata

`src/utils/labels.ts` is the single source of truth for human-readable labels, badge colors, and the canonical ordering of the backend enums (the full 16-stage `application_status` lifecycle, `visa_type`, `document_type`, `priority`, `document_status`). Components like `StatusBadge`, `PriorityBadge`, `StatusStepper`, and the status `<select>` all read from it, so the UI stays in sync with the database enums in one place.

## Document Expiry Monitoring

Uploaded documents carry optional `issuedDate` / `expiryDate`. The staff dashboard surfaces an **Expiring Documents** widget (passports, KITAS, VITAS & permits expiring within 60 days, or already expired), backed by `GET /api/documents/expiring`. Expiry state and styling are derived in `utils/formatters.ts` (`expiryState`, `expiryClasses`, `daysUntil`).
