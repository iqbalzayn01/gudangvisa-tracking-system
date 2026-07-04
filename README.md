# Gudang Visa Tracking System

A web-based monitoring & tracking system for immigration documents (VISA / KITAS) for **Gudang Visa Bali Indonesia**. Staff and admins manage applications through an internal dashboard, while clients track their own document processing — and download completed files such as e-Visas — through a dedicated self-service portal.

See [`PRD.md`](./PRD.md) for the full product requirement document.

## Architecture

| Part         | Directory   | Stack                                                              |
| ------------ | ----------- | ------------------------------------------------------------------ |
| **Backend**  | `server/`   | Node.js · Express 5 · TypeScript · Drizzle ORM · PostgreSQL (Supabase) |
| **Frontend** | `client/`   | Vue 3 (`<script setup>`) · Vite · TypeScript · Tailwind CSS v4 · reka-ui/shadcn-vue · vue-i18n · Pinia · Vue Router |

The database uses an optimized **7-table** schema (`staff_accounts`, `client_accounts`, `applications`, `application_documents`, `tracking_history`, `notifications`, `audit_logs`). Biometric scheduling and the verification checklist are merged into the `applications` table (the checklist as JSONB) to eliminate JOIN overhead.

## Key Features

- **Dual-table authentication** — internal staff/admin (`/api/auth/internal`) and external clients (`/api/auth/client`) are fully isolated, each with its own JWT access token (HS256-pinned) + httpOnly refresh cookie that **rotates on every refresh**. Login is hardened against user enumeration (uniform errors + timing-equalized bcrypt). Client data isolation is enforced at the application layer (ownership-checked queries), not Postgres RLS. On the frontend the two sessions share one axios factory whose 401→refresh→retry interceptor is **single-flight** — concurrent 401s share one refresh so rotation can't invalidate itself into a spurious logout.
- **Staff/Admin dashboard** — applications (searchable/filterable list with `low`/`medium`/`high`/`urgent` priority and an auto-computed progress % per status; create → reference number; detail view driving the status lifecycle), biometric scheduling, per-visa-type document verification checklists, client + user management (admin), and a global audit log viewer (admin). List search highlighting is HTML-escaped before render, so user-supplied names/labels can't inject markup.
- **Client notifications** — status changes (when visible to the client) and biometric scheduling automatically create in-portal notifications, written in the same DB transaction as the change.
- **Document compliance monitoring** — uploaded documents track `issuedDate` / `expiryDate`; the dashboard surfaces an **Expiring Documents** widget (passports, KITAS, VITAS & permits expiring soon or already expired) backed by `GET /api/documents/expiring`. The full Indonesian KITAS document set is supported (RPTKA, Notifikasi/IMTA, VITAS/Telex, DKPTKA, domicile, diploma, CV, KITAS card, …).
- **Audit trail** — every staff/admin action (CREATE, UPDATE, DELETE, STATUS_CHANGE, LOGIN, UPLOAD, DOWNLOAD) is logged with **Timestamp, User, Action, Entity, and IP Address**, filterable by action and entity (server-side) plus a client-side text search. Client-portal logins and document downloads are audited too. The admin viewer renders **real data only** — a failed load shows an error, an empty trail shows an empty state, with no demo/mock fallback that could mask an auth or backend failure.
- **Client tracking portal** — clients log in at `/portal/login`, view their applications' status timeline at `/portal/applications`, and download completed documents via temporary signed URLs (ownership-verified). A document becomes downloadable as soon as staff mark it **Verified** — there is no separate "make public" step. A public tracking landing lives at `/portal`.
- **Internationalization** — UI ships in Indonesian (default) and English via `vue-i18n`, persisted per browser.
- **SEO** — per-route meta via `utils/seo.ts`; only the public `/portal` landing is indexable, every private route is `noindex`; `robots.txt` + `sitemap.xml` expose only `/portal`.
- **Live updates** — the client portal and public tracking landing refresh status automatically via polling (no manual refresh); polling pauses on hidden tabs and is cleaned up on unmount.
- **Direct-to-storage uploads** — files are uploaded straight to Supabase Storage using signed URLs; the API only stores the path. Deleting a document, application, or client also cleans up the storage files (no orphaned blobs).

## Getting Started

### Backend (`server/`)

```bash
cd server
npm install
cp .env.example .env   # then fill in DATABASE_URL, DIRECT_URL, JWT secrets, SUPABASE_* …
npm run db:generate && npm run db:migrate   # migrations run over DIRECT_URL (Supabase session pooler)
npm run seed           # creates admin + 100 demo clients (idempotent)
npm run dev            # http://localhost:8000
```

Seed credentials:

| Account | Email                                          | Password   |
| ------- | ---------------------------------------------- | ---------- |
| Admin   | `admin@gudangvisa.com`                         | `admin123` |
| Clients | `client1@gudangvisa.com` … `client100@…`       | `client123`|

> The seed is idempotent — re-running it only inserts accounts that don't already exist.

### Frontend (`client/`)

```bash
cd client
npm install
# .env: VITE_BASE_URL=http://localhost:8000/api
npm run dev            # http://localhost:5173
```

## Routes (frontend)

| Path                    | Audience      | Description                                  |
| ----------------------- | ------------- | -------------------------------------------- |
| `/login`                | Staff / Admin | Internal dashboard login                     |
| `/dashboard`            | Staff / Admin | Overview                                     |
| `/profile`              | Staff / Admin | Signed-in user profile                       |
| `/clients`              | Staff / Admin | Client account management                    |
| `/applications`         | Staff / Admin | Manage applications (+ create / detail)      |
| `/biometrics`           | Staff / Admin | Biometric scheduling                         |
| `/audit-logs`           | Admin         | Global audit log viewer                      |
| `/users`                | Admin         | Staff account management                     |
| `/portal`               | Public        | Public tracking landing (no login)           |
| `/portal/login`         | Client        | Client portal login                          |
| `/portal/applications`  | Client        | Client's own applications + downloads        |

## Dashboard Guide (Staff & Admin)

The internal dashboard is where staff process visa/KITAS cases end-to-end. This section explains how to sign in, what each screen does, and the day-to-day workflow.

### Roles & access

Two internal roles, enforced by the router guard + backend RBAC:

| Capability                                   | Staff | Admin |
| -------------------------------------------- | :---: | :---: |
| Dashboard, Applications (list/create/detail) |  ✅   |  ✅   |
| Biometric scheduling                         |  ✅   |  ✅   |
| Document upload / verify / reject            |  ✅   |  ✅   |
| Client directory (view)                      |  ✅   |  ✅   |
| Edit client details                          |  ❌   |  ✅   |
| Delete applications / documents              |  ❌   |  ✅   |
| **Users** (manage staff accounts)            |  ❌   |  ✅   |
| **Audit Logs**                               |  ❌   |  ✅   |

> Admin-only pages (`/users`, `/audit-logs`) are hidden from the nav and blocked by the guard for staff. Authorization is also enforced server-side — the UI check is convenience, not the security boundary.

### Signing in

1. Go to `/login` and sign in with a staff/admin account (see the seed credentials above).
2. You land on `/dashboard`. The sidebar exposes only the pages your role can access.
3. Sessions refresh silently in the background; you stay signed in until you log out or the refresh token expires.

### The screens

- **Dashboard** (`/dashboard`) — overview: totals, applications by lifecycle phase and priority, biometric count, and the **Expiring Documents** widget (passports/KITAS/permits due within 60 days or already expired). Your daily starting point.
- **Applications** (`/applications`) — the master list. Search (⌘/Ctrl-K to jump to the box), filter by status and priority, and read the progress bar per row. Click a row to open its detail. Admins get a delete action.
- **Application detail** (`/applications/:id`) — the workspace for one case (status, checklist, documents, biometric, timeline). See the workflow below.
- **Biometrics** (`/biometrics`) — a read-only calendar derived from all applications that have a biometric appointment, grouped by status and sorted soonest-first. Click any row to open the owning application and edit it.
- **Clients** (`/clients`) — directory of client accounts. Staff view; admins can edit name / nationality / phone.
- **Users** (`/users`, admin) — create and remove staff accounts.
- **Audit Logs** (`/audit-logs`, admin) — every staff/admin action with Timestamp, User, Action, Entity, IP. Filter by action/entity, or text-search the loaded set.

### Processing an application (typical workflow)

1. **Create** — Applications → **New**. Pick the client (searchable), the visa type, a priority, and notes. On save you get a **reference number** (share this with the client for tracking).
2. **Collect documents** — open the application → **Documents**. Upload each required file; it streams straight to storage via a signed URL. Set `issued`/`expiry` dates where relevant so the Expiring-Documents widget can track them.
3. **Verify documents** — review each upload and mark it **Verified** or **Reject** (with a reason). A verified document immediately becomes downloadable to the client in their portal — there is no separate "publish" step.
4. **Work the checklist** — the per-visa-type verification checklist tracks the required items for that case; tick them off as you complete them.
5. **Schedule biometrics** — in the **Biometric** panel set status, date, time, location, and the field assistant. Saving notifies the client in their portal. Mark it **Completed** after the appointment.
6. **Advance the status** — use **Update status** to move the case through the 16-stage lifecycle (draft → document collection → immigration → biometric → decision → e-Visa issued → completed). Add a description; toggle **visible to client** when you want that update (and a notification) to appear in their portal — leave it off for internal-only notes.
7. **Track & close** — the **timeline** shows the full history. When the final document (e.g. e-Visa) is verified and the status reaches **Completed**, the client can download it from their portal.

### Tips

- **Status visibility** — every status update has a *visible to client* toggle. Client-visible updates create a portal notification; internal notes stay hidden.
- **Priority** — set `urgent`/`high` to surface a case; priority drives the dashboard breakdown and the list filter.
- **Reference number** — the shareable tracking code; clients enter it (or log in) on `/portal` to follow progress.
- **Search shortcut** — ⌘/Ctrl-K focuses the search box on the Applications and Users lists.

## Development Conventions

- **TypeScript** everywhere; both apps type-check clean (`tsc --noEmit` / `vue-tsc --noEmit`).
- **Backend** is modular under `server/src/modules/<feature>/` (controller · service · repository · routes · validation), with Drizzle schema in `server/src/db/`.
- **RBAC** is enforced via auth + role middleware; audit logging is wired through a shared `recordAudit` helper.
- **API responses** follow `{ "success": boolean, "message": string, "data": object | null }`.
