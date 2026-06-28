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
├── api/
│   └── index.ts              # Vercel serverless entry (wraps the Express app)
├── config/
│   ├── env.ts                # Environment variables
│   └── supabase.ts           # Supabase client (service role) + bucket name
├── db/
│   ├── index.ts              # Database connection
│   └── schema.ts             # 7-table definitions, enums, and relations
├── middlewares/
│   ├── auth.middleware.ts     # requireStaffAuth / requireClientAuth (JWT)
│   ├── role.middleware.ts     # authorizeRoles('admin', 'staff')
│   ├── error.middleware.ts    # Global error handler
│   ├── validate.middleware.ts # Zod request validation
│   └── upload.middleware.ts   # Deprecated (signed URLs now)
├── modules/                  # Feature modules: controller · service · repository · routes · validation
│   ├── auth-internal/        # Staff/admin login + refresh + logout
│   ├── auth-client/          # Client login + refresh + logout
│   ├── staff-accounts/       # Staff/admin management
│   ├── client-accounts/      # Client account management
│   ├── applications/         # Core workflow (status, biometric, checklist) + client view
│   ├── application-documents/# Upload/verify/delete + client download
│   ├── audit-logs/           # Audit trail (admin viewer, action/entity filters)
│   └── notifications/        # Client notifications
├── scripts/
│   └── seed.ts               # Idempotent seeder (admin + 100 demo clients)
├── types/
│   ├── index.ts              # Shared types (ApiResponse, StaffJwtPayload, ClientJwtPayload, ChecklistItem)
│   └── express/index.d.ts    # Express Request augmentation (staffUser / clientUser)
└── utils/
    ├── AppError.ts           # Custom error class
    ├── audit.ts              # recordAudit() helper + client IP extraction
    ├── jwt.ts                # Token generation + refresh cookie options
    └── storage.ts            # Supabase Storage helpers (signed up/download URLs)
```

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

| Command               | Description                                |
| --------------------- | ------------------------------------------ |
| `npm run dev`         | Start dev server with hot reload (`tsx`)   |
| `npm run build`       | Compile TypeScript to `dist/`              |
| `npm start`           | Run the compiled production build          |
| `npm run seed`        | Seed admin + 100 demo clients (idempotent) |
| `npm run db:generate` | Generate database migration files          |
| `npm run db:migrate`  | Apply migrations to the database           |

---

## Database Schema

The schema has **7 tables**, defined in [`src/db/schema.ts`](./src/db/schema.ts). Biometric scheduling (a 1-to-1 relation) and the verification checklist (as JSONB) are merged into `applications` to eliminate JOIN overhead.

| Table                   | Purpose                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `staff_accounts`        | Internal admin/staff accounts (`role`: `admin` \| `staff`)                               |
| `client_accounts`       | External client accounts (email, passport, nationality, phone)                           |
| `applications`          | Core record: reference number, visa type, status, progress, `checklist` (JSONB), and merged biometric fields |
| `application_documents` | Uploaded documents (type, file path, verification status)                                |
| `tracking_history`      | Status-change timeline (`fromStatus` → `toStatus`, `isVisibleToClient`)                  |
| `notifications`         | Per-client notifications                                                                 |
| `audit_logs`            | Staff/admin action log (actor, action, entity, old/new values, IP)                       |

**Native enums:** `internal_role`, `application_status` (16 stages, `draft` → `completed`/`rejected`/`cancelled`/`on_hold`), `visa_type` (`B211A`, `KITAS_WORKING`, `KITAS_SPOUSE`, `KITAS_INVESTOR`, `KITAS_RETIREMENT`), `priority` (`low` \| `medium` \| `high` \| `urgent`), `document_type` (core: `passport`, `photo`, `sponsor_letter`, `company_nib`, `bank_statement`, `rejection_letter`, `final_evisa`; KITAS professional docs: `marriage_certificate`, `insurance_certificate`, `rptka`, `notifikasi`, `vitas_telex`, `dkptka_payment`, `domicile_certificate`, `diploma_certificate`, `cv_resume`, `kitas_card`, `other`), `document_status` (`pending` \| `verified` \| `rejected`), `biometric_status` (`not_scheduled` \| `scheduled` \| `completed` \| `rescheduled` \| `cancelled` \| `no_show`).

`application_documents` also tracks document validity via `issued_date` and `expiry_date` (used by the expiry-monitoring endpoint). The `applications.checklist` JSONB holds an array of `{ name, isChecked, checkedAt?, checkedByStaffId? }`.

---

## Authentication

Two **independent** dual-table sessions, signed with [`jose`](https://github.com/panva/jose):

| Domain | Login                            | Refresh                            | Token payload                                    |
| ------ | -------------------------------- | ---------------------------------- | ------------------------------------------------ |
| Staff  | `POST /api/auth/internal/login`  | `POST /api/auth/internal/refresh`  | `{ id, fullName, email, role, accountType: 'internal' }` |
| Client | `POST /api/auth/client/login`    | `POST /api/auth/client/refresh`    | `{ id, fullName, email, accountType: 'client' }`         |

- **Access token** — 15 minutes, signed with `JWT_SECRET`, returned in the response body (the frontend keeps it in memory/Pinia). Send it as `Authorization: Bearer <token>`.
- **Refresh token** — 7 days, signed with `JWT_REFRESH_SECRET`, set as an httpOnly cookie named **`gv_refresh_token`** (`secure` in production, `sameSite: 'strict'`, `path: '/api'`).
- Middleware: `requireStaffAuth` (verifies `accountType === 'internal'`, populates `req.staffUser`) and `requireClientAuth` (verifies `accountType === 'client'`, populates `req.clientUser`). Admin-only routes additionally pass through `authorizeRoles('admin')`.
- `app.set('trust proxy', 1)` is enabled so `req.ip` resolves the real client IP behind Vercel/Nginx (used for audit logging and rate limiting).

**Rate limiting:** 100 requests / 15 min per IP across `/api`; a stricter 20 / 15 min on the auth routes (`/api/auth/internal`, `/api/auth/client`).

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
| POST   | `/api/applications`                        | Staff  | `{ clientId, visaType, priority?, notes? }` — generates a unique reference number |
| GET    | `/api/applications`                        | Staff  | List all applications                                                       |
| GET    | `/api/applications/:id`                    | Staff  | Application detail (documents, tracking history)                            |
| PATCH  | `/api/applications/:id/status`             | Staff  | `{ status, description, isVisibleToClient? }` — appends tracking history    |
| PATCH  | `/api/applications/:id/biometric`          | Staff  | `{ biometricStatus, biometricDate?, biometricTime?, biometricLocation?, fieldAssistantName?, fieldAssistantPhone? }` |
| PATCH  | `/api/applications/:id/checklist`          | Staff  | `{ itemIndex, isChecked }` — toggles one JSONB checklist item              |
| DELETE | `/api/applications/:id`                    | Admin  | Delete an application (and its documents/history/files)                     |
| GET    | `/api/applications/client/my-applications` | Client | The logged-in client's own applications                                    |

### Documents

> Mounted at `/api/documents`. Uploads use signed URLs — files go directly from the browser to Supabase Storage. See [Documents & Storage](#documents--storage).

| Method | Endpoint                                 | Auth   | Body / Notes                                                       |
| ------ | ---------------------------------------- | ------ | ----------------------------------------------------------------- |
| POST   | `/api/documents/upload-url`              | Staff  | `{ fileName, contentType, fileSize? }` → `{ signedUrl, storagePath, token }` |
| POST   | `/api/documents`                         | Staff  | `{ applicationId, documentType, fileName, storagePath, issuedDate?, expiryDate? }` |
| GET    | `/api/documents/application/:applicationId` | Staff | Documents for an application (+ temporary signed download URLs)   |
| GET    | `/api/documents/expiring?days=30`        | Staff  | Documents expiring within N days (or already expired) for monitoring |
| PATCH  | `/api/documents/:id/verify`              | Staff  | `{ status: 'verified' \| 'rejected', rejectionReason? }`          |
| DELETE | `/api/documents/:id`                     | Admin  | Delete a document and its storage file                            |
| GET    | `/api/documents/client/:id/download`     | Client | Signed download URL for a document the client owns (ownership-verified) |

### Audit Logs

| Method | Endpoint                                | Auth  | Notes                                          |
| ------ | --------------------------------------- | ----- | ---------------------------------------------- |
| GET    | `/api/audit-logs?action=&entity=`       | Admin | Audit trail, filterable by action and entity   |
| GET    | `/api/audit-logs/:id`                   | Admin | Single audit-log entry                         |

### Notifications

| Method | Endpoint                          | Auth   | Notes                              |
| ------ | --------------------------------- | ------ | ---------------------------------- |
| GET    | `/api/notifications`              | Client | The logged-in client's notifications |
| PATCH  | `/api/notifications/:id/read`     | Client | Mark a notification as read        |

---

## Audit Trail

Staff/admin actions are recorded through a shared `recordAudit` helper ([`src/utils/audit.ts`](./src/utils/audit.ts)) capturing actor, action, entity, optional old/new values, and IP (honoring `X-Forwarded-For` behind the trusted proxy). Audit writes never break the main request — failures are logged and swallowed.

**Actions:** `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `LOGIN`, `UPLOAD`, `DOWNLOAD`. The admin viewer surfaces `Timestamp, User, Action, Entity, IP Address` and filters by `action` and `entity`.

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

---

## Seeding

`npm run seed` is **idempotent** — it creates the bootstrap admin if missing, then inserts 100 demo client accounts, skipping any that already exist (matched by email). Passwords are hashed with `bcryptjs` (12 rounds).

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
