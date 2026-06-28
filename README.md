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

- **Dual-table authentication** — internal staff/admin (`/api/auth/internal`) and external clients (`/api/auth/client`) are fully isolated, each with its own JWT access token + httpOnly refresh cookie. Client data isolation is enforced at the application layer (ownership-checked queries), not Postgres RLS.
- **Staff/Admin dashboard** — applications (with `low`/`medium`/`high`/`urgent` priority), biometric scheduling, per-visa-type document verification checklists, client + user management (admin), and a global audit log viewer (admin).
- **Document compliance monitoring** — uploaded documents track `issuedDate` / `expiryDate`; the dashboard surfaces an **Expiring Documents** widget (passports, KITAS, VITAS & permits expiring soon or already expired) backed by `GET /api/documents/expiring`. The full Indonesian KITAS document set is supported (RPTKA, Notifikasi/IMTA, VITAS/Telex, DKPTKA, domicile, diploma, CV, KITAS card, …).
- **Audit trail** — every staff/admin action (CREATE, UPDATE, DELETE, STATUS_CHANGE, LOGIN, UPLOAD, DOWNLOAD) is logged with **Timestamp, User, Action, Entity, and IP Address**, filterable by action and entity.
- **Client tracking portal** — clients log in at `/portal/login`, view their applications' status timeline at `/portal/applications`, and download completed documents via temporary signed URLs (ownership-verified). A document becomes downloadable as soon as staff mark it **Verified** — there is no separate "make public" step. A public tracking landing lives at `/portal`.
- **Internationalization** — UI ships in Indonesian (default) and English via `vue-i18n`, persisted per browser.
- **SEO** — per-route meta via `utils/seo.ts`; only the public `/portal` landing is indexable, every private route is `noindex`; `robots.txt` + `sitemap.xml` expose only `/portal`.
- **Live updates** — the client portal and public tracking landing refresh status automatically via polling (no manual refresh); polling pauses on hidden tabs and is cleaned up on unmount.
- **Direct-to-storage uploads** — files are uploaded straight to Supabase Storage using signed URLs; the API only stores the path.

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

## Development Conventions

- **TypeScript** everywhere; both apps type-check clean (`tsc --noEmit` / `vue-tsc --noEmit`).
- **Backend** is modular under `server/src/modules/<feature>/` (controller · service · repository · routes · validation), with Drizzle schema in `server/src/db/`.
- **RBAC** is enforced via auth + role middleware; audit logging is wired through a shared `recordAudit` helper.
- **API responses** follow `{ "success": boolean, "message": string, "data": object | null }`.
