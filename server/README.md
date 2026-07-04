# Gudang Visa Backend

A REST API for the Gudang Visa Tracking System. Internal staff/admins manage immigration applications (VISA / KITAS), and external clients log in to track their own document processing and download completed files (e-Visa, etc.).

The API exposes an optimized **7-table** Drizzle schema, **dual-table authentication** (internal staff vs. external clients, fully isolated), and routes under **`/api/...`**. Client data isolation is enforced at the **application layer** (ownership-checked queries on the logged-in `client_id`), not Postgres Row Level Security. The authoritative schema lives in [`src/db/schema.ts`](./src/db/schema.ts).

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [API Reference](#api-reference)
- [Audit Trail](#audit-trail)
- [Documents & Storage](#documents--storage)
- [Seeding](#seeding)
- [Deployment (Vercel)](#deployment-vercel)
- [Error Handling](#error-handling)
- [License](#license)

---

## Tech Stack

| Technology            | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| **Node.js**           | Runtime (v18+)                                      |
| **TypeScript**        | Language (strict mode)                              |
| **Express 5**         | Web framework                                       |
| **Drizzle ORM**       | Database queries and migrations (`drizzle-kit`)     |
| **PostgreSQL**        | Database (via Supabase), `postgres` driver          |
| **Supabase Storage**  | File storage with signed URLs                       |
| **jose**              | JWT signing / verification                          |
| **bcryptjs**          | Password hashing                                    |
| **zod**               | Request validation                                  |
| **helmet · cors · cookie-parser · morgan** | Security headers, CORS w/ credentials, cookie parsing, request logging |
| **express-rate-limit** | Brute-force protection                             |

---

## Project Structure

```
src/
├── app.ts                    # Express app setup and middleware
├── server.ts                 # Local server entry point
├── config/
│   ├── env.ts                # Environment variables (fails fast on missing secrets)
│   └── supabase.ts           # Supabase client (service role) + bucket name
├── db/
│   ├── index.ts              # Database connection
│   └── schema.ts             # 7-table definitions, enums, indexes, and relations
├── middlewares/
│   ├── auth.middleware.ts     # requireStaffAuth / requireClientAuth (JWT, HS256-pinned)
│   ├── role.middleware.ts     # authorizeRoles('admin', 'staff')
│   ├── rate-limit.middleware.ts # apiLimiter (global) + authLimiter (login only)
│   ├── error.middleware.ts    # Global error handler
│   └── validate.middleware.ts # Zod request validation
├── modules/                  # Feature modules: controller · service · repository · routes · validation
│   ├── auth-internal/        # Staff/admin login + refresh + logout
│   ├── auth-client/          # Client login + refresh + logout
│   ├── staff-accounts/       # Staff/admin management
│   ├── client-accounts/      # Client account management
│   ├── applications/         # Core workflow (status, biometric, checklist) + client view
│   ├── application-documents/# Upload/verify/delete + client download
│   ├── audit-logs/           # Audit trail (admin viewer, action/entity filters)
│   └── notifications/        # Client notifications (created on status/biometric changes)
├── scripts/
│   ├── seed.ts               # Idempotent seeder (admin + 100 demo clients, unique names)
│   ├── find-duplicate-clients.ts     # Read-only duplicate report (npm run check:dups)
│   ├── analyze-duplicate-clients.ts  # Read-only keeper/loser analysis per dup group
│   └── cleanup-duplicate-clients.ts  # Destructive dedupe w/ backup (npm run cleanup:dups)
├── types/
│   ├── index.ts              # Shared types (ApiResponse, StaffJwtPayload, ClientJwtPayload, ChecklistItem)
│   └── express/index.d.ts    # Express Request augmentation (staffUser / clientUser)
└── utils/
    ├── AppError.ts           # Custom error class
    ├── audit.ts              # recordAudit() helper + client IP extraction
    ├── handler.ts            # asyncHandler / sendSuccess / getStaffUser / getClientUser
    ├── jwt.ts                # Token generation + refresh cookie helpers (HS256 pinned)
    ├── password.ts           # bcrypt hashing (12 rounds) + timing-equalization helper
    ├── validation.ts         # Shared login schema (staff + client)
    └── storage.ts            # Supabase Storage helpers (signed up/download URLs, bulk cleanup)
```

> `api/index.ts` (repo root) is the Vercel serverless entry — it re-exports the Express app.

---

## Installation

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- A [Supabase](https://supabase.com/) account (for database and storage)

### 2. Clone the repository

```bash
git clone https://github.com/iqbalzayn01/gudangvisa-backend.git gudangvisa-backend
cd gudangvisa-backend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up environment variables

Create a `.env` file in the project root:

```env
PORT=8000
NODE_ENV="development"

# Runtime connection — Supabase transaction pooler (port 6543). Correct for serverless.
DATABASE_URL="your-supabase-database-url"
# Migration connection — Supabase session pooler (port 5432). Used by drizzle-kit.
# Optional: falls back to DATABASE_URL if unset.
DIRECT_URL="your-supabase-session-pooler-url"

# JWT (access = 15m, refresh = 7d — lifetimes are fixed in code)
# REQUIRED — the server refuses to start without them (no insecure fallbacks).
JWT_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your-service-role-key"   # SUPABASE_KEY is also accepted
BUCKETID="gudangvisa-bucket"

# CORS — the frontend origin allowed to send credentials
FRONTEND_URL="http://localhost:5173"   # defaults to http://localhost:3000 if unset
```

**Where to find these values:**

| Variable               | Where to find it                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Supabase Dashboard → Project Settings → Database → Connection string (**Transaction** pooler, port 6543) |
| `DIRECT_URL`           | Same dialog → **Session** pooler (port 5432). Used only for migrations; see note below  |
| `JWT_SECRET`           | Any random string. Generate one with: `openssl rand -hex 32`                            |
| `SUPABASE_URL`         | Supabase Dashboard → Project Settings → API → Project URL                               |
| `SUPABASE_SERVICE_KEY` | Supabase Dashboard → Project Settings → API → `service_role` key                        |

> The token lifetimes (access 15 min / refresh 7 days) are constants in [`src/utils/jwt.ts`](./src/utils/jwt.ts); there are no `JWT_EXPIRES_IN` env vars.

### 5. Set up the database

```bash
npm run db:generate
npm run db:migrate
```

> **Migrations run over `DIRECT_URL` (Supabase session pooler, port 5432)** — see [`drizzle.config.ts`](./drizzle.config.ts). The transaction pooler (port 6543) used at runtime can stall `drizzle-kit migrate` on multi-statement DDL, so migration tooling uses the session pooler instead. If `DIRECT_URL` is unset it falls back to `DATABASE_URL`.

### 6. Set up Supabase Storage

Go to your Supabase Dashboard → **Storage** and create a bucket with these settings:

| Setting            | Value                                        |
| ------------------ | -------------------------------------------- |
| Bucket name        | `gudangvisa-bucket`                          |
| Public             | `No` (private)                               |
| Allowed MIME types | `image/jpeg`, `image/png`, `application/pdf` |
| File size limit    | `2097152` (2 MB)                             |

### 7. Seed the database

```bash
npm run seed
```

See [Seeding](#seeding) for what this creates.

### 8. Start the server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

The server starts at `http://localhost:8000`.

---

## Available Scripts

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Start dev server with hot reload (`tsx`)   |
| `npm run build`        | Compile TypeScript to `dist/`              |
| `npm start`            | Run the compiled production build          |
| `npm run seed`         | Seed admin + 100 demo clients (idempotent; skips rows whose email **or name** already exists) |
| `npm run check:dups`   | Read-only report of duplicate client names/emails |
| `npm run cleanup:dups` | **Destructive** dedupe of duplicate-name clients (JSON backup to `backups/` first; add `-- --dry-run` to preview). Also removes the deleted clients' files from Storage |
| `npm run db:generate`  | Generate database migration files          |
| `npm run db:migrate`   | Apply migrations to the database           |

> Migration `0002` adds a **unique index on `lower(trim(full_name))`** for clients — run `npm run check:dups` (and `cleanup:dups` if needed) **before** `db:migrate` on a database that predates it. `backups/` contains password hashes and is git-ignored.

---

## Database Schema

The schema has **7 tables**, defined in [`src/db/schema.ts`](./src/db/schema.ts). Biometric scheduling (a 1-to-1 relation) and the verification checklist (as JSONB) are merged into `applications` to eliminate JOIN overhead.

| Table                   | Purpose                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `staff_accounts`        | Internal admin/staff accounts (`role`: `admin` \| `staff`)                               |
| `client_accounts`       | External client accounts (email, passport, nationality, phone). Full name is **unique** (case-/whitespace-insensitive index) |
| `applications`          | Core record: reference number, visa type, status, auto-computed progress %, `checklist` (JSONB), and merged biometric fields |
| `application_documents` | Uploaded documents (type, file path, verification status)                                |
| `tracking_history`      | Status-change timeline (`fromStatus` → `toStatus`, `isVisibleToClient`)                  |
| `notifications`         | Per-client notifications                                                                 |
| `audit_logs`            | Staff/admin action log (actor, action, entity, old/new values, IP)                       |

**Native enums:** `internal_role`, `application_status` (16 stages, `draft` → `completed`/`rejected`/`cancelled`/`on_hold`), `visa_type` (`B211A`, `KITAS_WORKING`, `KITAS_SPOUSE`, `KITAS_INVESTOR`, `KITAS_RETIREMENT`), `priority` (`low` \| `medium` \| `high` \| `urgent`), `document_type` (core: `passport`, `photo`, `sponsor_letter`, `company_nib`, `bank_statement`, `rejection_letter`, `final_evisa`; KITAS professional docs: `marriage_certificate`, `insurance_certificate`, `rptka`, `notifikasi`, `vitas_telex`, `dkptka_payment`, `domicile_certificate`, `diploma_certificate`, `cv_resume`, `kitas_card`, `other`), `document_status` (`pending` \| `verified` \| `rejected`), `biometric_status` (`not_scheduled` \| `scheduled` \| `completed` \| `rescheduled` \| `cancelled` \| `no_show`).

`application_documents` also tracks document validity via `issued_date` and `expiry_date` (used by the expiry-monitoring endpoint). The `applications.checklist` JSONB holds an array of `{ name, isChecked, checkedAt?, checkedByStaffId? }`.

**Indexes:** besides the unique columns, hot filter paths are indexed — `applications(client_id, status)`, `application_documents(application_id, expiry_date)`, `tracking_history(application_id)`, `notifications(client_id, application_id)`, and `audit_logs(created_at, action+entity_type)` (each as separate single/composite indexes; see `schema.ts`).

> Known gap: `client_accounts.passport_number` is **not** unique — add a unique index only after checking existing data for duplicates.

---

## Authentication

Two **independent** dual-table sessions, signed with [`jose`](https://github.com/panva/jose):

| Domain | Login                            | Refresh                            | Token payload                                    |
| ------ | -------------------------------- | ---------------------------------- | ------------------------------------------------ |
| Staff  | `POST /api/auth/internal/login`  | `POST /api/auth/internal/refresh`  | `{ id, fullName, email, role, accountType: 'internal' }` |
| Client | `POST /api/auth/client/login`    | `POST /api/auth/client/refresh`    | `{ id, fullName, email, accountType: 'client' }`         |

- **Access token** — 15 minutes, signed with `JWT_SECRET`, returned in the response body (the frontend keeps it in memory/Pinia). Send it as `Authorization: Bearer <token>`.
- **Refresh token** — 7 days, signed with `JWT_REFRESH_SECRET`, set as an httpOnly cookie named **`gv_refresh_token`** (`secure` in production, `sameSite: 'strict'`, `path: '/api'`). **Rotated on every `/refresh`** — each refresh response sets a new cookie, shrinking the replay window of a stolen token.
- All JWT verification is **pinned to HS256**; `JWT_SECRET` / `JWT_REFRESH_SECRET` are mandatory (the server refuses to boot without them).
- **Login hardening:** unknown emails burn the same bcrypt cost as a wrong password (no timing-based user enumeration), and both cases return the identical `401 Invalid credentials.`; account-deactivated (`403`) is only disclosed after the password verifies. Both staff **and client** logins are written to the audit log.
- Middleware: `requireStaffAuth` (verifies `accountType === 'internal'`, populates `req.staffUser`) and `requireClientAuth` (verifies `accountType === 'client'`, populates `req.clientUser`). Admin-only routes additionally pass through `authorizeRoles('admin')`.
- `app.set('trust proxy', 1)` is enabled so `req.ip` resolves the real client IP behind Vercel/Nginx (used for audit logging and rate limiting).

**Rate limiting:** 100 requests / 15 min per IP across `/api`; a stricter 20 / 15 min on the **login endpoints only** (`/refresh` is exempt so many open tabs behind one office IP can't lock out logins).

---

## API Reference

**Base URL:** `http://localhost:8000` · **All routes are under `/api`.** Responses follow:

```json
{ "success": true, "message": "Description of what happened", "data": {} }
```

Auth column: **Public** (no token), **Staff** (`admin` or `staff`), **Admin** (admin only), **Client** (client token).

### Auth

| Method | Endpoint                       | Auth   | Body / Notes                          |
| ------ | ------------------------------ | ------ | ------------------------------------- |
| POST   | `/api/auth/internal/login`     | Public | `{ email, password }` → staff session |
| POST   | `/api/auth/internal/refresh`   | Public | Reads `gv_refresh_token` cookie       |
| POST   | `/api/auth/internal/logout`    | Public | Clears the refresh cookie             |
| POST   | `/api/auth/client/login`       | Public | `{ email, password }` → client session |
| POST   | `/api/auth/client/refresh`     | Public | Reads `gv_refresh_token` cookie       |
| POST   | `/api/auth/client/logout`      | Public | Clears the refresh cookie             |

### Staff Accounts

| Method | Endpoint                    | Auth  | Body / Notes                                            |
| ------ | --------------------------- | ----- | ------------------------------------------------------- |
| GET    | `/api/staff-accounts/me`    | Staff | Current staff/admin profile                             |
| POST   | `/api/staff-accounts`       | Admin | `{ fullName, email, password, role?, phone? }`          |
| GET    | `/api/staff-accounts`       | Admin | List all staff/admin accounts                           |
| DELETE | `/api/staff-accounts/:id`   | Admin | Delete a staff account                                  |

### Client Accounts

| Method | Endpoint                     | Auth  | Body / Notes                                                       |
| ------ | ---------------------------- | ----- | ----------------------------------------------------------------- |
| POST   | `/api/client-accounts`       | Staff | `{ fullName, email, password, passportNumber, nationality, phone? }` |
| GET    | `/api/client-accounts`       | Staff | List all clients                                                  |
| GET    | `/api/client-accounts/:id`   | Staff | Get one client                                                    |
| PATCH  | `/api/client-accounts/:id`   | Admin | `{ fullName?, nationality?, phone? }` (email/passport not editable) |
| DELETE | `/api/client-accounts/:id`   | Admin | Delete a client account                                           |

### Applications

| Method | Endpoint                                   | Auth   | Body / Notes                                                                 |
| ------ | ------------------------------------------ | ------ | --------------------------------------------------------------------------- |
| POST   | `/api/applications`                        | Staff  | `{ clientId, visaType, priority?, notes? }` — generates a unique reference number (auto-retry on collision) |
| GET    | `/api/applications`                        | Staff  | List all applications                                                       |
| GET    | `/api/applications/:id`                    | Staff  | Application detail (documents, tracking history)                            |
| PATCH  | `/api/applications/:id/status`             | Staff  | `{ status, description, isVisibleToClient? }` — in one transaction: updates status + progress %, appends tracking history, and (when visible) creates a client notification |
| PATCH  | `/api/applications/:id/biometric`          | Staff  | `{ biometricStatus, biometricDate? (YYYY-MM-DD), biometricTime? (HH:MM), biometricLocation?, fieldAssistantName?, fieldAssistantPhone? }` — scheduling/rescheduling/cancelling notifies the client |
| PATCH  | `/api/applications/:id/checklist`          | Staff  | `{ itemIndex, isChecked }` — toggles one JSONB checklist item atomically (row-locked) |
| DELETE | `/api/applications/:id`                    | Admin  | Delete an application (and its documents/history/files)                     |
| GET    | `/api/applications/client/my-applications` | Client | The logged-in client's own applications                                    |

### Documents

> Mounted at `/api/documents`. Uploads use signed URLs — files go directly from the browser to Supabase Storage. See [Documents & Storage](#documents--storage).

| Method | Endpoint                                 | Auth   | Body / Notes                                                       |
| ------ | ---------------------------------------- | ------ | ----------------------------------------------------------------- |
| POST   | `/api/documents/upload-url`              | Staff  | `{ fileName, contentType, fileSize? }` (zod-validated: JPG/PNG/PDF, ≤ 2 MB) → `{ signedUrl, storagePath, token }` |
| POST   | `/api/documents`                         | Staff  | `{ applicationId, documentType, fileName, storagePath, issuedDate?, expiryDate? }` |
| GET    | `/api/documents/application/:applicationId` | Staff | Documents for an application (+ temporary signed download URLs)   |
| GET    | `/api/documents/expiring?days=30`        | Staff  | Documents expiring within N days (or already expired) for monitoring |
| PATCH  | `/api/documents/:id/verify`              | Staff  | `{ status: 'verified' \| 'rejected', rejectionReason? }`          |
| DELETE | `/api/documents/:id`                     | Admin  | Delete a document and its storage file                            |
| GET    | `/api/documents/client/:id/download`     | Client | Signed download URL for a document the client owns (ownership-verified, `DOWNLOAD` audit-logged) |

### Audit Logs

| Method | Endpoint                                | Auth  | Notes                                          |
| ------ | --------------------------------------- | ----- | ---------------------------------------------- |
| GET    | `/api/audit-logs?action=&entity=`       | Admin | Audit trail, filterable by action and entity   |
| GET    | `/api/audit-logs/:id`                   | Admin | Single audit-log entry                         |

### Notifications

Notifications are **created automatically** for the owning client when staff change an application's status (if `isVisibleToClient`) or schedule / reschedule / cancel a biometric appointment — in the same DB transaction as the change itself.

| Method | Endpoint                          | Auth   | Notes                              |
| ------ | --------------------------------- | ------ | ---------------------------------- |
| GET    | `/api/notifications`              | Client | The logged-in client's notifications |
| PATCH  | `/api/notifications/:id/read`     | Client | Mark a notification as read (ownership enforced in the UPDATE itself) |

---

## Audit Trail

Staff/admin actions are recorded through a shared `recordAudit` helper ([`src/utils/audit.ts`](./src/utils/audit.ts)) capturing actor, action, entity, optional old/new values, and IP (honoring `X-Forwarded-For` behind the trusted proxy). Audit writes never break the main request — failures are logged and swallowed.

**Actions:** `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `LOGIN`, `UPLOAD`, `DOWNLOAD` — all seven are wired: client-portal events are captured too (client `LOGIN` and document `DOWNLOAD` are logged with `staffId = null`). The admin viewer surfaces `Timestamp, User, Action, Entity, IP Address` and filters by `action` and `entity`.

---

## Documents & Storage

Documents are file attachments linked to an application. The API uses **signed URLs** — files move directly between the browser and Supabase Storage, never through the API server. Helpers live in [`src/utils/storage.ts`](./src/utils/storage.ts).

**Restrictions:** max **2 MB**, types **JPG / PNG / PDF**. Download URLs are signed and expire after **1 hour**.

**Upload flow (3 steps):**

```
1. Browser → API        : POST /api/documents/upload-url   → { signedUrl, storagePath }
2. Browser → Supabase   : PUT the file directly to signedUrl
3. Browser → API        : POST /api/documents              → attach { applicationId, documentType, fileName, storagePath }
```

Clients download their own files via `GET /api/documents/client/:id/download`, which verifies ownership (document → application → `client_id`) before issuing a temporary signed URL. A document is surfaced to the client for download once staff mark it **Verified** (`document_status = 'verified'`) — there is no separate public/private visibility flag on documents.

**Storage cleanup:** deleting a document, an application, or a client account also removes the affected files from the bucket (best-effort, after the DB transaction commits), so cascade deletes don't orphan blobs.

---

## Seeding

`npm run seed` is **idempotent** — it creates the bootstrap admin if missing, then inserts 100 demo client accounts with **unique full names**, skipping any that already exist (matched by email, or by name via `ON CONFLICT DO NOTHING` against the unique-name index). Passwords are hashed with `bcryptjs` (12 rounds).

| Account | Email                                    | Password    |
| ------- | ---------------------------------------- | ----------- |
| Admin   | `admin@gudangvisa.com`                   | `admin123`  |
| Clients | `client1@gudangvisa.com` … `client100@…` | `client123` |

> **Important:** Change the seeded passwords before using this in production. The demo clients are intended for local development and testing of the client tracking portal.

---

## Deployment (Vercel)

[`vercel.json`](./vercel.json) deploys the Express app as a single serverless function:

- `buildCommand`: `npm run build` → `outputDirectory`: `dist/`
- Function entry: `api/index.ts` (wraps the app), `maxDuration: 30`
- All routes are rewritten to `/api`

Set the same environment variables from the [Installation](#4-set-up-environment-variables) step in the Vercel project settings (`FRONTEND_URL` must point at the deployed frontend origin).

---

## Error Handling

All errors follow the same format:

```json
{ "success": false, "message": "Description of what went wrong" }
```

| Status Code | Meaning                                                       |
| ----------- | ------------------------------------------------------------ |
| 400         | Bad request (invalid input, wrong file type, file too large) |
| 401         | Not authenticated (missing or invalid token)                 |
| 403         | Forbidden (you don't have permission)                        |
| 404         | Not found                                                    |
| 429         | Too many requests (rate limited)                             |
| 500         | Server error                                                 |

---

## License

ISC
