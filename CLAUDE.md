# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (server/)
- `npm run dev` — start dev server (tsx watch `src/server.ts`) on :8000
- `npm run build` — tsc typecheck + compile to dist/
- `npm start` — run compiled build (`node dist/src/server.js`)
- `npm run db:generate` — generate Drizzle migration from schema.ts changes
- `npm run db:migrate` — run migrations (uses DIRECT_URL / session pooler)
- `npm run seed` — idempotent seed (1 admin + 100 demo clients)
- `npm run check:dups` / `npm run cleanup:dups` — duplicate client account maintenance scripts
- No test suite and no lint script configured. `npm run build` (tsc, no emit errors) is the only correctness gate.

### Frontend (client/)
- `npm run dev` — Vite dev server on :3000 (`client/vite.config.ts` `server.port`)
- `npm run build` — `vue-tsc -b` typecheck + vite build
- No test suite or lint script configured.

### Env setup
- `server/.env`: DATABASE_URL (transaction pooler :6543, runtime), DIRECT_URL (session pooler :5432, migrations only), JWT_SECRET, JWT_REFRESH_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY, BUCKETID, FRONTEND_URL, plus PORT / NODE_ENV. The server refuses to boot if the JWT secrets are missing (no insecure fallback); FRONTEND_URL defaults to `http://localhost:3000`.
- `client/.env`: VITE_BASE_URL (must include `/api` suffix).

## Architecture

**What it is:** Gudang Visa Bali — a VISA/KITAS immigration-document tracking system serving two audiences: an internal staff/admin dashboard for processing cases, and an external client self-service portal for tracking and downloading finished documents.

Two independent apps in one repo, no shared package and no root/workspace tooling: `server/` (Express 5 + TypeScript + Drizzle + PostgreSQL/Supabase) and `client/` (Vue 3 + Vite + TypeScript + Tailwind v4 + Pinia). Full feature/route inventory and product behavior is in README.md — read it for what the system does; this section is about how the code is organized.

Every API response is uniformly shaped `{ success, message, data }` (typed as `ApiResponse<T>` on the client). Both apps deploy on Vercel; the server runs as a serverless function via `server/api/index.ts` (`server/vercel.json` rewrites `/(.*)` → `/api`, `maxDuration: 30`).

### Backend module pattern
Most features live under `server/src/modules/<feature>/` with a 5-file shape: `*.controller.ts` (HTTP layer) → `*.service.ts` (business logic) → `*.repository.ts` (Drizzle queries) → `*.routes.ts` (route wiring + middleware) → `*.validation.ts` (Zod schemas). Follow this shape when adding a module — copy an existing one (e.g. `applications/`) as a template. Four modules omit `*.validation.ts`: `auth-internal` and `auth-client` (both reuse `loginSchema` from `server/src/utils/validation.ts`), plus `audit-logs` and `notifications`. Note a module's directory name and its mount path can differ — e.g. `application-documents/` mounts at `/api/documents` (routes are wired individually in `server/src/app.ts`, there is no aggregating router).

Single source of truth for the DB schema is `server/src/db/schema.ts` (7 tables — see README for the list). Biometric data is merged into `applications` as flat 1:1 columns (`biometricStatus`, `biometricDate`, etc.) rather than a separate table; the document `checklist` is stored as a JSONB column on the same table. After editing schema.ts, run `db:generate` then `db:migrate`.

Cross-cutting middleware lives in `server/src/middlewares/`: `auth.middleware.ts` (JWT verification), `role.middleware.ts` (RBAC), `validate.middleware.ts` (Zod body/query validation), `rate-limit.middleware.ts`, `error.middleware.ts`. Routes compose these rather than re-implementing checks per-module.

### Dual authentication domains
The app has two fully isolated auth systems — internal staff/admin vs external clients. Isolation is by DB table (`staff_accounts` vs `client_accounts`), routes (`/api/auth/internal` vs `/api/auth/client`), frontend Pinia store (`auth.store` vs `client-auth.store`), localStorage token key (`auth_token` vs `client_auth_token`), and refresh endpoint — **not** by secret: both systems share the single `JWT_SECRET` / `JWT_REFRESH_SECRET` pair. JWTs are issued with `jose` (HS256; 15m access token, 7d refresh token in the HttpOnly cookie `gv_refresh_token`). Never mix the two: a fix to staff auth almost never applies to client auth and vice versa. Client data isolation (a client only sees their own applications) is enforced in repository/service query filters, not Postgres RLS — when adding client-facing endpoints, filter by the authenticated client's ID explicitly.

### Frontend API layer
`client/src/api/create-client.ts` is an axios-instance factory (token storage key, refresh path, login redirect, single-flight 401→refresh→retry interceptor). `client.ts` and `portal.client.ts` each instantiate it once for their respective auth domain. Per-resource API modules (`applications.api.ts`, `documents.api.ts`, etc.) import one of these two instances — check which domain a new endpoint belongs to before adding a call, and add it to the correct `*.api.ts` file. After a refresh, the interceptor pushes the new token into Pinia through `token-sync.ts` (a small setter registry) so the api layer never imports a store directly — keeps the dependency one-way. Don't confuse `client.store.ts` (CRUD over client *records*) with `client-auth.store.ts` (portal session auth).

### Frontend routing
`client/src/guards/` implements one global nav guard that branches on `to.meta.portal` (client-portal routes under `/portal/*`) vs the staff/admin domain, then checks `to.meta.public` / `to.meta.requiresAdmin` against the relevant Pinia auth store. New routes must set the correct `meta` flags — the guard has no other way to know which domain/role a route needs.

### Frontend UI & i18n
UI is built with shadcn-vue (new-york style) on top of reka-ui primitives, styled with Tailwind v4 via its Vite plugin (`@tailwindcss/vite`, no PostCSS config), with lucide icons. Reusable primitives live under `client/src/components/ui/`; use the `cn` helper (`src/lib/utils.ts`) for class merging. Copy is localized with `vue-i18n` (`src/i18n/`), and **Indonesian (`id`) is the default locale** (`en` is the alternate) — route titles and user-facing strings are authored in Indonesian first.

## Reference
- `README.md` — product features, full route table, dashboard user guide, seed credentials (admin `admin@gudangvisa.com` / `admin123`; demo clients `client1..100@gudangvisa.com` / `client123`).
- `server/README.md` — authoritative per-module API endpoint reference (auth, accounts, applications, documents, audit logs, notifications), storage, seeding, deployment.
- `client/README.md` — frontend feature summaries, status-label metadata, document-expiry monitoring, SEO.
- `PRD.md` — full product requirements document. **Caveat:** it is partly aspirational — it specifies Postgres RLS (F-05) and WebSocket notifications (F-07), but neither is implemented (isolation is app-layer query filters; live updates are polling). Trust README/code over PRD where they disagree.
