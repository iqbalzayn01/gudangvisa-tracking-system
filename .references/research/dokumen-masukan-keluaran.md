# Lampiran Skripsi: Dokumen Masukan & Dokumen Keluaran — Gudang Visa Bali

Analisa sistem Gudang Visa Bali (backend Express+Drizzle+Postgres di `server/`, frontend Vue3 di `client/`) untuk lampiran skripsi, berupa daftar dokumen masukan (input) dan dokumen keluaran (output) sistem.

## Dokumen Masukan (Input)

| # | Dokumen/Data | Isi | Lokasi Kode |
|---|---|---|---|
| 1 | Formulir registrasi klien | Nama, email, password, no. paspor, kewarganegaraan, telp | `server/src/db/schema.ts:113-135`, `POST /api/client-accounts` |
| 2 | Formulir pengajuan aplikasi visa | Klien, jenis visa (B211A/KITAS), prioritas, catatan | `client/src/pages/ApplicationCreatePage.vue:103-150`, `POST /api/applications` |
| 3 | Upload dokumen pendukung | File (JPG/PNG/PDF ≤2MB) + jenis dokumen + tgl terbit/kadaluarsa — 17 jenis (paspor, foto, sponsor letter, NIB, rekening koran, akta nikah, RPTKA, notifikasi, VITAS/telex, bukti bayar DKPTKA, domisili, ijazah, CV, kartu KITAS, dll) | `server/src/db/schema.ts:50-71`, `application-documents/` module |
| 4 | Entri perubahan status aplikasi | Status baru, deskripsi, flag visible-to-client | `PATCH /api/applications/:id/status` |
| 5 | Data biometrik | Status, tgl, jam, lokasi, nama/telp petugas | `server/src/db/schema.ts:163-176` |
| 6 | Checklist dokumen | Toggle kelengkapan tiap item | `PATCH /api/applications/:id/checklist` |
| 7 | Keputusan verifikasi dokumen | Verified/rejected + alasan | `PATCH /api/documents/:id/verify` |
| 8 | Formulir akun staff/admin | Nama, email, password, role | `POST /api/staff-accounts` |
| 9 | Edit profil | Nama, email | `client/src/pages/ProfilePage.vue:114-130` |
| 10 | Kredensial login | Email/password (2 domain terpisah: staff & klien) | `auth-internal/`, `auth-client/` |
| 11 | Pencarian tracking publik | No. tracking | `client/src/pages/PublicTrackingPage.vue` |

## Dokumen Keluaran (Output)

| # | Dokumen/Data | Deskripsi | Lokasi Kode |
|---|---|---|---|
| 1 | Dokumen terverifikasi (unduh klien) | File asli (copy paspor, e-Visa, kartu KITAS) via signed URL Supabase Storage | `GET /api/documents/client/:id/download` |
| 2 | e-Visa final & kartu KITAS | Deliverable akhir proses | `server/src/db/schema.ts:58,69` |
| 3 | Timeline status aplikasi | Riwayat progres per aplikasi, visible ke klien | `GET /api/applications/:id`, `schema.ts:227-249` |
| 4 | Notifikasi otomatis | Trigger saat status/biometrik berubah | `notifications/` module |
| 5 | Laporan audit trail (admin) | Actor, aksi, entity, nilai lama/baru, IP — filterable | `audit-logs/` module |
| 6 | Laporan dokumen mendekati kadaluarsa | List dokumen expiring dlm N hari | `GET /api/documents/expiring?days=30` |

## Catatan

Gak ada fitur generate PDF/CSV/report di codebase — semua "output" itu file asli upload di-serve ulang lewat signed URL, atau data on-screen (timeline, tabel audit), bukan dokumen yg digenerate sistem. Kalau skripsi butuh contoh dokumen keluaran berupa file digenerate (misal laporan PDF), itu belum ada — perlu dicatat sbg gap/future work di skripsi.
