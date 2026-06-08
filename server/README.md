# Gudang Visa Backend

A REST API for the Gudang Visa Tracking System. Internal staff/admins manage immigration applications (VISA / KITAS), and external clients log in to track their own document processing and download completed files (e-Visa, etc.).

> **⚠️ Architecture note (v2.0):** The current codebase uses an optimized **7-table** Drizzle schema, **dual-table authentication**, and routes under **`/api/...`**. The new surface is summarized in [Current Architecture & Endpoints (v2.0)](#current-architecture--endpoints-v20) directly below. The older detailed reference further down (the `/api/v1`, `users`/`tickets` sections) describes a previous iteration and is retained for historical context only.

---

## Current Architecture & Endpoints (v2.0)

**Database (7 tables):** `staff_accounts`, `client_accounts`, `applications` (biometric fields + JSONB checklist merged in), `application_documents`, `tracking_history`, `notifications`, `audit_logs`. The authoritative definition lives in [`src/db/schema.ts`](./src/db/schema.ts).

**Authentication (dual-table, isolated):**

| Domain | Login                          | Refresh                          |
| ------ | ------------------------------ | -------------------------------- |
| Staff  | `POST /api/auth/internal/login`| `POST /api/auth/internal/refresh`|
| Client | `POST /api/auth/client/login`  | `POST /api/auth/client/refresh`  |

Each issues a short-lived JWT access token (response body) plus an httpOnly refresh cookie. `app.set('trust proxy', 1)` is enabled so `req.ip` resolves the real client IP behind Vercel/Nginx (used for audit logging and rate limiting).

**Main route groups (all under `/api`):**

| Method(s)        | Endpoint                                  | Auth          | Notes                                            |
| ---------------- | ----------------------------------------- | ------------- | ------------------------------------------------ |
| POST/GET/…       | `/staff-accounts`, `/staff-accounts/me`   | Staff/Admin   | Staff management (create/delete are admin)       |
| POST/GET/DELETE  | `/client-accounts`                        | Staff/Admin   | Client account management                        |
| POST/GET/PATCH   | `/applications` (+ `/:id/status`, `/:id/biometric`, `/:id/checklist`) | Staff/Admin | Core workflow; DELETE is admin |
| GET              | `/applications/client/my-applications`    | **Client**    | The logged-in client's own applications          |
| POST/GET/PATCH   | `/documents` (+ `/upload-url`, `/:id/verify`) | Staff/Admin | Direct-to-Supabase signed-URL uploads            |
| GET              | `/documents/client/:id/download`          | **Client**    | Signed download URL for a document the client owns |
| GET              | `/audit-logs?action=&entity=`             | **Admin**     | Audit trail, filterable by action and entity     |
| GET/PATCH        | `/notifications`, `/notifications/:id/read` | **Client**  | Client notifications                             |

**Audit trail:** Staff/admin actions are recorded through a shared `recordAudit` helper (`src/utils/audit.ts`) capturing actor, action, entity, optional old/new values, and IP. The viewer returns `Timestamp, User, Action, Entity, IP Address`.

**Seeding:** `npm run seed` is idempotent — it creates the admin account (`admin@gudangvisa.com` / `admin123`) if missing, then inserts **100 demo clients** (`client1@gudangvisa.com` … `client100@gudangvisa.com`, all with password `client123`), skipping any that already exist.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Users (Admin Only)](#users-admin-only)
  - [Clients](#clients)
  - [Tickets](#tickets)
  - [Documents (File Attachments)](#documents-file-attachments)
  - [Tracking (Public)](#tracking-public)
- [All Endpoints Summary](#all-endpoints-summary)
- [Error Handling](#error-handling)
- [License](#license)

---

## Tech Stack

| Technology           | Purpose                         |
| -------------------- | ------------------------------- |
| **Node.js**          | Runtime                         |
| **TypeScript**       | Language (strict mode)          |
| **Express 5**        | Web framework                   |
| **Drizzle ORM**      | Database queries and migrations |
| **PostgreSQL**       | Database (via Supabase)         |
| **Supabase Storage** | File storage with signed URLs   |
| **JWT (jose)**       | Authentication                  |
| **bcrypt**           | Password hashing                |

---

## Project Structure

```
src/
├── app.ts                    # Express app setup and middleware
├── server.ts                 # Server entry point
├── config/
│   ├── env.ts                # Environment variables
│   └── supabase.ts           # Supabase client (service role, storage)
├── db/
│   ├── index.ts              # Database connection
│   └── schema.ts             # 7-table definitions and relations
├── middlewares/
│   ├── auth.middleware.ts     # requireStaffAuth / requireClientAuth (JWT)
│   ├── role.middleware.ts     # Role-based access control
│   ├── error.middleware.ts    # Global error handler
│   ├── validate.middleware.ts # Zod request validation
│   └── upload.middleware.ts   # Deprecated (signed URLs now)
├── modules/                  # Feature modules: controller · service · repository · routes · validation
│   ├── auth-internal/        # Staff/admin login + refresh
│   ├── auth-client/          # Client login + refresh
│   ├── staff-accounts/       # Staff/admin management
│   ├── client-accounts/      # Client account management
│   ├── applications/         # Core workflow (status, biometric, checklist) + client view
│   ├── application-documents/# Upload/verify/delete + client download
│   ├── audit-logs/           # Audit trail (admin viewer, action/entity filters)
│   └── notifications/        # Client notifications
├── scripts/
│   └── seed.ts               # Idempotent seeder (admin + 100 demo clients)
├── types/
│   ├── index.ts              # Shared TypeScript types
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
DATABASE_URL="your-supabase-database-url"

# JWT
JWT_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your-service-role-key"
BUCKETID="gudangvisa-bucket"

# CORS — the frontend origin allowed to send credentials
FRONTEND_URL="http://localhost:5173"
```

**Where to find these values:**

| Variable       | Where to find it                                                                        |
| -------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL` | Supabase Dashboard → Project Settings → Database → Connection string (Transaction mode) |
| `JWT_SECRET`   | Any random string. Generate one with: `openssl rand -hex 32`                            |
| `SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL                               |
| `SUPABASE_KEY` | Supabase Dashboard → Project Settings → API → `anon` or `service_role` key              |

### 5. Set up the database

Generate and apply the database tables:

```bash
npm run db:generate
npm run db:migrate
```

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

This is **idempotent** — it creates the bootstrap admin (if missing) and 100 demo client accounts, skipping any that already exist:

| Account | Email                                    | Password    |
| ------- | ---------------------------------------- | ----------- |
| Admin   | `admin@gudangvisa.com`                   | `admin123`  |
| Clients | `client1@gudangvisa.com` … `client100@…` | `client123` |

> **Important:** Change the seeded passwords before using this in production. The demo clients are intended for local development and testing of the client tracking portal.

### 8. Start the server

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

The server will start at `http://localhost:8000`.

---

## Available Scripts

| Command               | Description                       |
| --------------------- | --------------------------------- |
| `npm run dev`         | Start dev server with hot reload  |
| `npm run build`       | Compile TypeScript to JavaScript  |
| `npm start`           | Run the compiled production build |
| `npm run seed`        | Seed admin + 100 demo clients (idempotent) |
| `npm run db:generate` | Generate database migration files |
| `npm run db:migrate`  | Apply migrations to the database  |

---

## Database Schema

> **Legacy (v1):** The tables below describe the earlier 5-table ticket model. The current schema has **7 tables** with dual-table accounts and merged biometric/checklist columns — see [`src/db/schema.ts`](./src/db/schema.ts) and the [Current Architecture](#current-architecture--endpoints-v20) section above. The rest of this document (v1 `/api/v1` reference) is retained for historical context.

The (legacy) database has 5 tables:

### Users

| Column          | Type         | Description              |
| --------------- | ------------ | ------------------------ |
| `id`            | UUID         | Primary key              |
| `full_name`     | VARCHAR(255) | Full name                |
| `email`         | VARCHAR(255) | Email (unique)           |
| `password_hash` | TEXT         | Hashed password          |
| `role`          | ENUM         | `STAFF` or `ADMIN`       |
| `created_at`    | TIMESTAMP    | Account creation date    |

### Clients

| Column            | Type         | Description                        |
| ----------------- | ------------ | ---------------------------------- |
| `id`              | UUID         | Primary key                        |
| `name`            | VARCHAR(255) | Client name                        |
| `passport_number` | VARCHAR(100) | Passport number (optional)         |
| `contact_number`  | VARCHAR(50)  | Contact number (optional)          |
| `created_by`      | UUID         | Staff member who registered client |
| `created_at`      | TIMESTAMP    | Creation date                      |

### Tracking Tickets

| Column           | Type         | Description                                   |
| ---------------- | ------------ | --------------------------------------------- |
| `id`             | UUID         | Primary key                                   |
| `tracking_code`  | VARCHAR(50)  | Unique tracking code (e.g., `GVI-1712345678`) |
| `client_id`      | UUID         | Reference to the client                       |
| `service_type`   | VARCHAR(100) | Type of service (e.g., `VISA Extension`)      |
| `current_status` | ENUM         | Current status (see status flow below)        |
| `handled_by`     | UUID         | Staff member handling the ticket              |
| `created_at`     | TIMESTAMP    | Creation date                                 |

### Documents (File Attachments)

| Column       | Type         | Description                      |
| ------------ | ------------ | -------------------------------- |
| `id`         | UUID         | Primary key                      |
| `ticket_id`  | UUID         | Reference to the tracking ticket |
| `doc_name`   | VARCHAR(255) | Document name                    |
| `doc_type`   | ENUM         | `VISA`, `KITAS`, or `PASSPORT`   |
| `status`     | ENUM         | Document status                  |
| `file_url`   | TEXT         | Storage path in Supabase         |
| `is_public`  | BOOLEAN      | Visible to client when tracking  |
| `created_at` | TIMESTAMP    | Creation date                    |

### Tracking Histories

| Column                 | Type      | Description                               |
| ---------------------- | --------- | ----------------------------------------- |
| `id`                   | UUID      | Primary key                               |
| `ticket_id`            | UUID      | Reference to the tracking ticket          |
| `status_name`          | ENUM      | Status at that point in time              |
| `description_public`   | TEXT      | Public description (visible to clients)   |
| `description_internal` | TEXT      | Internal notes (staff only, optional)     |
| `updated_by`           | UUID      | Staff member who made the change          |
| `created_at`           | TIMESTAMP | When the change was made                  |

### Document Status Flow

```
RECEIVED → IN_REVIEW → IN_PROCESS → APPROVED → COMPLETED
                                   → REJECTED
```

---

## Authentication

This API uses **JWT (JSON Web Token)** for authentication.

### How to authenticate

1. Call `POST /api/v1/auth/login` with your email and password.
2. You will receive a `token` in the response.
3. Include this token in all protected requests:

```
Authorization: Bearer your-token-here
```

The token expires after **8 hours**.

### Roles

| Role      | Permissions                                                               |
| --------- | ------------------------------------------------------------------------- |
| **ADMIN** | Full access. Can manage users, clients, tickets, documents, and deletions |
| **STAFF** | Can manage clients, create tickets, upload documents, and update status   |

---

## API Reference

**Base URL:** `http://localhost:8000`

All responses follow this format:

```json
{
  "success": true,
  "message": "Description of what happened",
  "data": {}
}
```

---

### Auth

#### `POST /api/v1/auth/login`

Login and get a JWT token.

**Request body:**

```json
{
  "email": "admin@gudangvisa.com",
  "password": "admin123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "fullName": "Super Admin",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### Users (Admin Only)

> All user management routes require an **ADMIN** token (except `GET /me`).

#### `GET /api/v1/users/me`

Get the current logged-in user's profile. Accessible by both ADMIN and STAFF.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "message": "User profile retrieved successfully!",
  "data": {
    "id": "uuid",
    "fullName": "Super Admin",
    "email": "admin@gudangvisa.com",
    "role": "ADMIN"
  }
}
```

#### `POST /api/v1/users`

Create a new staff member. **Admin only.**

**Headers:** `Authorization: Bearer <admin-token>`

**Request body:**

```json
{
  "name": "Staff Budi",
  "email": "budi@gudangvisa.com",
  "password": "staff123"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "New staff member added successfully!",
  "data": {
    "id": "uuid",
    "fullName": "Staff Budi",
    "email": "budi@gudangvisa.com",
    "role": "STAFF",
    "createdAt": "..."
  }
}
```

#### `GET /api/v1/users`

Get a list of all users. **Admin only.**

**Headers:** `Authorization: Bearer <admin-token>`

#### `DELETE /api/v1/users/:id`

Delete a user by their ID. **Admin only.**

**Headers:** `Authorization: Bearer <admin-token>`

---

### Clients

> All client routes require authentication (STAFF or ADMIN).

#### `POST /api/v1/clients`

Register a new client.

**Headers:** `Authorization: Bearer <token>`

**Request body:**

```json
{
  "name": "John Doe",
  "passportNumber": "A12345678",
  "contactNumber": "+62812345678"
}
```

| Field            | Type   | Required | Description               |
| ---------------- | ------ | -------- | ------------------------- |
| `name`           | string | Yes      | Client's full name        |
| `passportNumber` | string | No       | Passport number           |
| `contactNumber`  | string | No       | Phone or contact number   |

**Response (201):**

```json
{
  "success": true,
  "message": "Client created successfully!",
  "data": {
    "id": "client-uuid",
    "name": "John Doe",
    "passportNumber": "A12345678",
    "contactNumber": "+62812345678",
    "createdBy": "staff-uuid",
    "createdAt": "..."
  }
}
```

#### `GET /api/v1/clients`

Get all clients.

#### `GET /api/v1/clients/:id`

Get a single client by ID.

#### `DELETE /api/v1/clients/:id`

Delete a client. **Admin only.**

---

### Tickets

> All ticket routes require authentication (STAFF or ADMIN).

#### `POST /api/v1/tickets`

Create a new tracking ticket. Automatically generates a tracking code and adds an initial `RECEIVED` history entry.

**Headers:** `Authorization: Bearer <token>`

**Request body:**

```json
{
  "clientId": "client-uuid",
  "serviceType": "VISA Extension"
}
```

| Field         | Type   | Required | Description                           |
| ------------- | ------ | -------- | ------------------------------------- |
| `clientId`    | string | Yes      | UUID of an existing client            |
| `serviceType` | string | Yes      | Type of service (free-text)           |

**Response (201):**

```json
{
  "success": true,
  "message": "Ticket created successfully!",
  "data": {
    "id": "ticket-uuid",
    "trackingCode": "GVI-1712345678",
    "clientId": "client-uuid",
    "serviceType": "VISA Extension",
    "currentStatus": "RECEIVED",
    "handledBy": "staff-uuid",
    "createdAt": "..."
  }
}
```

> **Tip:** Share the `trackingCode` with the client so they can track their application.

#### `GET /api/v1/tickets`

Get all tickets with client and handler info.

#### `GET /api/v1/tickets/:id`

Get a single ticket with full details (client, handler, documents, and history timeline).

#### `PATCH /api/v1/tickets/:id/status`

Update a ticket's status and add a history entry.

**Request body:**

```json
{
  "statusName": "IN_REVIEW",
  "descriptionPublic": "Document is being reviewed by staff.",
  "descriptionInternal": "Waiting for passport copy verification."
}
```

| Field                  | Type   | Required | Description                            |
| ---------------------- | ------ | -------- | -------------------------------------- |
| `statusName`           | string | Yes      | New status (see status flow)           |
| `descriptionPublic`    | string | Yes      | Public note (visible to clients)       |
| `descriptionInternal`  | string | No       | Internal note (staff only)             |

**Valid status values:** `RECEIVED`, `IN_REVIEW`, `IN_PROCESS`, `APPROVED`, `REJECTED`, `COMPLETED`

#### `DELETE /api/v1/tickets/:id`

Delete a ticket, all its histories, documents, and associated storage files. **Admin only.**

---

### Documents (File Attachments)

Documents are file attachments linked to a ticket. This API uses **Signed URLs** — files go directly from the client to Supabase Storage, never through the API server.

**File restrictions:**

- Maximum size: **2 MB**
- Allowed types: **JPG**, **PNG**, **PDF**

#### Upload Flow (3 steps)

```
Step 1: Client → API         : Request a signed upload URL
Step 2: Client → Supabase    : Upload the file directly using the signed URL
Step 3: Client → API         : Attach the document to a ticket with the storage path
```

#### `POST /api/v1/documents/upload-url`

**Step 1:** Get a signed upload URL.

**Headers:** `Authorization: Bearer <token>`

**Request body:**

```json
{
  "fileName": "passport_scan.pdf",
  "contentType": "application/pdf",
  "fileSize": 1048576
}
```

| Field         | Type   | Required | Description                                                 |
| ------------- | ------ | -------- | ----------------------------------------------------------- |
| `fileName`    | string | Yes      | Name of the file                                            |
| `contentType` | string | Yes      | MIME type (`image/jpeg`, `image/png`, or `application/pdf`) |
| `fileSize`    | number | No       | File size in bytes (validated against 2 MB limit)           |

**Response (200):**

```json
{
  "success": true,
  "message": "Signed upload URL generated successfully.",
  "data": {
    "signedUrl": "https://...supabase.co/storage/v1/object/upload/sign/...",
    "storagePath": "documents/uuid/passport_scan.pdf",
    "token": "eyJ..."
  }
}
```

#### Step 2: Upload the file

Use the `signedUrl` from Step 1 to upload directly to Supabase:

```bash
curl -X PUT "SIGNED_URL_HERE" \
  -H "Content-Type: application/pdf" \
  --data-binary @/path/to/your/file.pdf
```

Or in JavaScript:

```javascript
await fetch(signedUrl, {
  method: 'PUT',
  headers: { 'Content-Type': file.type },
  body: file,
});
```

#### `POST /api/v1/documents`

**Step 3:** Attach the document to a ticket.

**Headers:** `Authorization: Bearer <token>`

**Request body:**

```json
{
  "ticketId": "ticket-uuid",
  "docName": "Passport Scan",
  "docType": "PASSPORT",
  "status": "RECEIVED",
  "isPublic": true,
  "storagePath": "documents/uuid/passport_scan.pdf"
}
```

| Field         | Type    | Required | Description                                |
| ------------- | ------- | -------- | ------------------------------------------ |
| `ticketId`    | string  | Yes      | UUID of the ticket to attach the file to   |
| `docName`     | string  | Yes      | Display name for the document              |
| `docType`     | string  | Yes      | `VISA`, `KITAS`, or `PASSPORT`             |
| `status`      | string  | No       | Document status (defaults to `RECEIVED`)   |
| `isPublic`    | boolean | No       | Show to client on tracking (default false) |
| `storagePath` | string  | Yes      | The path returned from Step 1              |

**Response (201):**

```json
{
  "success": true,
  "message": "Document added successfully!",
  "data": {
    "id": "document-uuid",
    "ticketId": "ticket-uuid",
    "docName": "Passport Scan",
    "docType": "PASSPORT",
    "status": "RECEIVED",
    "fileUrl": "documents/uuid/passport_scan.pdf",
    "isPublic": true,
    "createdAt": "..."
  }
}
```

#### `GET /api/v1/documents/ticket/:ticketId`

Get all documents for a specific ticket. Returns temporary signed download URLs.

**Response (200):**

```json
{
  "success": true,
  "message": "Documents retrieved successfully.",
  "data": [
    {
      "id": "document-uuid",
      "docName": "Passport Scan",
      "docType": "PASSPORT",
      "status": "RECEIVED",
      "fileUrl": "documents/uuid/passport_scan.pdf",
      "fileDownloadUrl": "https://...signed-temporary-url...",
      "isPublic": true,
      "createdAt": "..."
    }
  ]
}
```

> **Note:** `fileDownloadUrl` is a temporary signed URL that expires after 1 hour.

#### `DELETE /api/v1/documents/:id`

Delete a document and its file from storage. **Admin only.**

---

### Tracking (Public)

#### `GET /api/v1/tracking/:code`

Track a ticket by its tracking code. **No authentication required** — this is for clients.

Only returns **public** documents (where `isPublic = true`) and strips internal descriptions from the history.

**Example:** `GET /api/v1/tracking/GVI-1712345678`

**Response (200):**

```json
{
  "success": true,
  "message": "Ticket found.",
  "data": {
    "id": "ticket-uuid",
    "trackingCode": "GVI-1712345678",
    "serviceType": "VISA Extension",
    "currentStatus": "IN_REVIEW",
    "client": { "name": "John Doe" },
    "handler": { "fullName": "Staff Budi" },
    "documents": [
      {
        "id": "doc-uuid",
        "docName": "Passport Scan",
        "docType": "PASSPORT",
        "status": "RECEIVED",
        "fileDownloadUrl": "https://...signed-temporary-url...",
        "createdAt": "..."
      }
    ],
    "histories": [
      {
        "id": "history-uuid",
        "statusName": "IN_REVIEW",
        "descriptionPublic": "Document is being reviewed by staff.",
        "updatedBy": { "fullName": "Staff Budi" },
        "createdAt": "..."
      }
    ],
    "createdAt": "..."
  }
}
```

**Errors:**

| Status | Message                                            |
| ------ | -------------------------------------------------- |
| 404    | Ticket not found. Please check your tracking code. |

#### `PATCH /api/v1/tracking/:id/status`

Update ticket status via the tracking module. **Requires authentication.**

**Headers:** `Authorization: Bearer <token>`

**Request body:**

```json
{
  "statusName": "IN_PROCESS",
  "descriptionPublic": "Document is being processed.",
  "descriptionInternal": "Forwarded to immigration office."
}
```

---

## All Endpoints Summary

| #   | Method   | Endpoint                             | Auth | Role         | Description              |
| --- | -------- | ------------------------------------ | ---- | ------------ | ------------------------ |
| 1   | `POST`   | `/api/v1/auth/login`                 | No   | —            | Login                    |
| 2   | `GET`    | `/api/v1/users/me`                   | Yes  | ADMIN, STAFF | Get my profile           |
| 3   | `POST`   | `/api/v1/users`                      | Yes  | ADMIN        | Create staff             |
| 4   | `GET`    | `/api/v1/users`                      | Yes  | ADMIN        | List all users           |
| 5   | `DELETE` | `/api/v1/users/:id`                  | Yes  | ADMIN        | Delete a user            |
| 6   | `POST`   | `/api/v1/clients`                    | Yes  | STAFF, ADMIN | Create a client          |
| 7   | `GET`    | `/api/v1/clients`                    | Yes  | STAFF, ADMIN | List all clients         |
| 8   | `GET`    | `/api/v1/clients/:id`                | Yes  | STAFF, ADMIN | Get a client             |
| 9   | `DELETE` | `/api/v1/clients/:id`                | Yes  | ADMIN        | Delete a client          |
| 10  | `POST`   | `/api/v1/tickets`                    | Yes  | STAFF, ADMIN | Create a ticket          |
| 11  | `GET`    | `/api/v1/tickets`                    | Yes  | STAFF, ADMIN | List all tickets         |
| 12  | `GET`    | `/api/v1/tickets/:id`                | Yes  | STAFF, ADMIN | Get ticket details       |
| 13  | `PATCH`  | `/api/v1/tickets/:id/status`         | Yes  | STAFF, ADMIN | Update ticket status     |
| 14  | `DELETE` | `/api/v1/tickets/:id`                | Yes  | ADMIN        | Delete a ticket          |
| 15  | `POST`   | `/api/v1/documents/upload-url`       | Yes  | STAFF, ADMIN | Get signed upload URL    |
| 16  | `POST`   | `/api/v1/documents`                  | Yes  | STAFF, ADMIN | Attach document          |
| 17  | `GET`    | `/api/v1/documents/ticket/:ticketId` | Yes  | STAFF, ADMIN | Get documents by ticket  |
| 18  | `DELETE` | `/api/v1/documents/:id`              | Yes  | ADMIN        | Delete a document        |
| 19  | `GET`    | `/api/v1/tracking/:code`             | No   | —            | Public ticket tracking   |
| 20  | `PATCH`  | `/api/v1/tracking/:id/status`        | Yes  | Authenticated| Update status (tracking) |

---

## Error Handling

All errors follow the same format:

```json
{
  "success": false,
  "message": "Description of what went wrong"
}
```

| Status Code | Meaning                                                      |
| ----------- | ------------------------------------------------------------ |
| 400         | Bad request (invalid input, wrong file type, file too large) |
| 401         | Not authenticated (missing or invalid token)                 |
| 403         | Forbidden (you don't have permission)                        |
| 404         | Not found                                                    |
| 500         | Server error                                                 |

---

## License

ISC
