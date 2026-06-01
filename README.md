# Gudang Visa Project Workspace

## Project Overview

This workspace contains the **Gudang Visa** project, which consists of a backend REST API and a frontend web application. It is a document tracking system for VISA, KITAS, and PASSPORT documents, where staff/admins manage tickets and clients can publicly track their application status.

### Architecture
- **Backend (`gudangvisa-backend/`)**: A REST API built with Node.js, Express 5, and TypeScript.
- **Frontend (`gudangvisa-frontend/`)**: A Single Page Application (SPA) built with Vue 3, Vite, and TypeScript.

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express 5
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage (with signed URLs)
- **Authentication**: JWT (using `jose` and `bcrypt`)

### Frontend
- **Framework**: Vue 3 (Composition API / `<script setup>`)
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios

## Building and Running

### Backend Commands
Navigate to `gudangvisa-backend/` to run these commands:

- `npm install`: Install dependencies.
- `npm run dev`: Start the development server with hot reload (using `tsx`).
- `npm run build`: Compile TypeScript to JavaScript.
- `npm start`: Run the compiled production build.
- `npm run db:generate`: Generate Drizzle database migration files.
- `npm run db:migrate`: Apply migrations to the database.
- `npm run seed`: Create the initial admin account (`admin@gudangvisa.com` / `admin123`).

**Environment Variables Required:** `PORT`, `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`, `SUPABASE_URL`, `SUPABASE_KEY`.

### Frontend Commands
Navigate to `gudangvisa-frontend/` to run these commands:

- `npm install`: Install dependencies.
- `npm run dev`: Start the Vite development server.
- `npm run build`: Type-check and build for production.
- `npm run preview`: Locally preview the production build.

## Development Conventions

- **TypeScript**: Both frontend and backend heavily rely on TypeScript for type safety. Ensure strict typing is maintained.
- **Vue 3**: The frontend uses Vue 3's `<script setup>` syntax for Single File Components (SFCs).
- **Backend Structure**:
  - Modular architecture under `src/modules/` (e.g., auth, users, clients, tickets).
  - Uses Drizzle ORM for database interactions (`src/db/`).
  - Implements role-based access control (Admin/Staff) using middleware.
- **Database**: The database is hosted on Supabase, and Drizzle ORM is used for defining schemas and running migrations.
- **File Uploads**: Files are not uploaded directly through the API server. Instead, the backend generates Supabase Storage signed URLs, and the client uploads the file directly to Supabase.
- **API Responses**: Standardized JSON response format: `{ "success": boolean, "message": string, "data": object | null }`.
