import sys
sys.path.insert(0, "/tmp/claude-1000/-home-miqbalzayyn-projects-gudang-visa/9de53541-bc54-4eb2-a3bc-536da4f33507/scratchpad/diagrams")
from seqlib import render_sequence

OUT = "/tmp/claude-1000/-home-miqbalzayyn-projects-gudang-visa/9de53541-bc54-4eb2-a3bc-536da4f33507/scratchpad/diagrams"

diagrams = []

# 1. Melakukan Login (Staff/Admin - Internal gateway)
diagrams.append(dict(
    file="01_melakukan_login.png",
    title="Sequence Diagram – Melakukan Login (Staff/Admin)",
    participants=[("Staff/Admin", "actor"), (":LoginPage\n(Vue)", "box"),
                  (":AuthInternalController", "box"), (":AuthInternalService", "box"),
                  ("PostgreSQL\n(staff_accounts,\naudit_logs)", "box")],
    messages=[
        dict(label="1: submit email & password", **{"from": 0, "to": 1}),
        dict(label="2: login(email, password)", **{"from": 1, "to": 2}),
        dict(label="3: login(email, password)", **{"from": 2, "to": 3}),
        dict(label="4: findByEmail(email)", **{"from": 3, "to": 4}),
        dict(label="5: staff row / null", **{"from": 4, "to": 3, "dashed": True}),
        dict(label="6: verifyPassword() / compareAgainstDummyHash()", **{"from": 3, "to": 3},
             note="[cegah user enumeration jika email tidak ditemukan]"),
        dict(label="7: cek isActive, generate accessToken & refreshToken (JWT)", **{"from": 3, "to": 3}),
        dict(label="8: return {user, accessToken, refreshToken}", **{"from": 3, "to": 2, "dashed": True}),
        dict(label="9: recordAudit(LOGIN, staff)", **{"from": 2, "to": 4}),
        dict(label="10: set refresh cookie, 200 OK {user, accessToken}", **{"from": 2, "to": 1, "dashed": True}),
        dict(label="11: redirect ke Dashboard sesuai role", **{"from": 1, "to": 0, "dashed": True}),
    ],
    notes=["Catatan: Client login memakai alur identik via AuthClientController/AuthClientService",
           "pada endpoint terpisah (ClientLoginPage -> /api/auth/client/login)."],
))

# 2. Memantau Status Dokumen (Client)
diagrams.append(dict(
    file="02_memantau_status_dokumen.png",
    title="Sequence Diagram – Memantau Status Dokumen (Client)",
    participants=[("Client", "actor"), (":ApplicationDetailPage\n(Vue)", "box"),
                  (":ApplicationsController", "box"), (":ApplicationsService", "box"),
                  ("PostgreSQL\n(applications,\ntracking_history)", "box")],
    messages=[
        dict(label="1: buka detail permohonan", **{"from": 0, "to": 1}),
        dict(label="2: GET /applications/my", **{"from": 1, "to": 2}),
        dict(label="3: getApplicationsByClientId(clientId)", **{"from": 2, "to": 3}),
        dict(label="4: SELECT applications WHERE clientId, JOIN tracking_history\n(isVisibleToClient=true)", **{"from": 3, "to": 4}),
        dict(label="5: daftar permohonan + status + progressPercentage", **{"from": 4, "to": 3, "dashed": True}),
        dict(label="6: return applications[]", **{"from": 3, "to": 2, "dashed": True}),
        dict(label="7: 200 OK, applications[]", **{"from": 2, "to": 1, "dashed": True}),
        dict(label="8: render status & progress bar", **{"from": 1, "to": 0, "dashed": True}),
    ],
))

# 3. Mengelola Permohonan Visa (Staff/Admin - create)
diagrams.append(dict(
    file="03_mengelola_permohonan_visa.png",
    title="Sequence Diagram – Mengelola Permohonan Visa (Staff: Membuat Permohonan Baru)",
    participants=[("Staff", "actor"), (":ApplicationCreatePage\n(Vue)", "box"),
                  (":ApplicationsController", "box"), (":ApplicationsService", "box"),
                  ("PostgreSQL\n(applications,\naudit_logs)", "box")],
    messages=[
        dict(label="1: isi form data client & visaType, submit", **{"from": 0, "to": 1}),
        dict(label="2: POST /applications", **{"from": 1, "to": 2}),
        dict(label="3: createApplication(data, staffId)", **{"from": 2, "to": 3}),
        dict(label="4: generateReferenceNumber() -> GV-YYYY-NNNNN", **{"from": 3, "to": 3}),
        dict(label="5: seed DEFAULT_CHECKLIST[visaType]", **{"from": 3, "to": 3}),
        dict(label="6: INSERT INTO applications", **{"from": 3, "to": 4}),
        dict(label="7: application row baru", **{"from": 4, "to": 3, "dashed": True}),
        dict(label="8: return application", **{"from": 3, "to": 2, "dashed": True}),
        dict(label="9: recordAudit(CREATE, application)", **{"from": 2, "to": 4}),
        dict(label="10: 201 Created, application", **{"from": 2, "to": 1, "dashed": True}),
        dict(label="11: tampilkan nomor referensi baru", **{"from": 1, "to": 0, "dashed": True}),
    ],
))

# 4. Melihat Riwayat Pelacakan (Client)
diagrams.append(dict(
    file="04_melihat_riwayat_pelacakan.png",
    title="Sequence Diagram – Melihat Riwayat Pelacakan (Client)",
    participants=[("Client", "actor"), (":ApplicationDetailPage\n(tab Riwayat)", "box"),
                  (":ApplicationsController", "box"), (":ApplicationsService", "box"),
                  ("PostgreSQL\n(tracking_history)", "box")],
    messages=[
        dict(label="1: buka tab riwayat pelacakan", **{"from": 0, "to": 1}),
        dict(label="2: GET /applications/:id", **{"from": 1, "to": 2}),
        dict(label="3: getApplicationById(id)", **{"from": 2, "to": 3}),
        dict(label="4: SELECT tracking_history WHERE applicationId\nAND isVisibleToClient=true ORDER BY createdAt", **{"from": 3, "to": 4}),
        dict(label="5: daftar riwayat status (fromStatus, toStatus, waktu)", **{"from": 4, "to": 3, "dashed": True}),
        dict(label="6: return application + trackingHistory[]", **{"from": 3, "to": 2, "dashed": True}),
        dict(label="7: 200 OK", **{"from": 2, "to": 1, "dashed": True}),
        dict(label="8: render timeline (TrackingTimeline.vue)", **{"from": 1, "to": 0, "dashed": True}),
    ],
))

# 5. Mengunduh Dokumen (Client)
diagrams.append(dict(
    file="05_mengunduh_dokumen.png",
    title="Sequence Diagram – Mengunduh Dokumen (Client)",
    participants=[("Client", "actor"), (":ApplicationDetailPage\n(Vue)", "box"),
                  (":ApplicationDocumentsController", "box"), (":ApplicationDocumentsService", "box"),
                  ("Supabase Storage /\nPostgreSQL", "box")],
    messages=[
        dict(label="1: klik unduh dokumen", **{"from": 0, "to": 1}),
        dict(label="2: GET /documents/:id/download-url", **{"from": 1, "to": 2}),
        dict(label="3: getClientDownloadUrl(documentId, clientId)", **{"from": 2, "to": 3}),
        dict(label="4: findByIdWithOwner(documentId)", **{"from": 3, "to": 4}),
        dict(label="5: dokumen + application.clientId", **{"from": 4, "to": 3, "dashed": True}),
        dict(label="6: verifikasi clientId cocok, generate signed URL", **{"from": 3, "to": 3}),
        dict(label="7: return {fileName, downloadUrl}", **{"from": 3, "to": 2, "dashed": True}),
        dict(label="8: recordAudit(DOWNLOAD, document)", **{"from": 2, "to": 4}),
        dict(label="9: 200 OK, downloadUrl", **{"from": 2, "to": 1, "dashed": True}),
        dict(label="10: GET signed URL langsung ke Storage", **{"from": 1, "to": 4}),
        dict(label="11: file stream (PDF/JPG/PNG)", **{"from": 4, "to": 1, "dashed": True}),
        dict(label="12: simpan file ke perangkat", **{"from": 1, "to": 0, "dashed": True}),
    ],
))

# 6. Memverifikasi Dokumen (Staff)
diagrams.append(dict(
    file="06_memverifikasi_dokumen.png",
    title="Sequence Diagram – Memverifikasi Dokumen (Staff)",
    participants=[("Staff", "actor"), (":ApplicationDetailPage\n(Vue)", "box"),
                  (":ApplicationDocumentsController", "box"), (":ApplicationDocumentsService", "box"),
                  ("PostgreSQL\n(application_documents,\naudit_logs)", "box")],
    messages=[
        dict(label="1: pilih verified/rejected & alasan", **{"from": 0, "to": 1}),
        dict(label="2: PATCH /documents/:id/verify", **{"from": 1, "to": 2}),
        dict(label="3: verifyDocument(docId, data, staffId)", **{"from": 2, "to": 3}),
        dict(label="4: UPDATE application_documents SET status,\nrejectionReason, verifiedByStaffId, verifiedAt", **{"from": 3, "to": 4}),
        dict(label="5: dokumen terupdate", **{"from": 4, "to": 3, "dashed": True}),
        dict(label="6: return result", **{"from": 3, "to": 2, "dashed": True}),
        dict(label="7: recordAudit(STATUS_CHANGE, document)", **{"from": 2, "to": 4}),
        dict(label="8: 200 OK, \"Document verified/rejected\"", **{"from": 2, "to": 1, "dashed": True}),
        dict(label="9: tampilkan status verifikasi terbaru", **{"from": 1, "to": 0, "dashed": True}),
    ],
))

# 7. Mengunggah Dokumen (Staff)
diagrams.append(dict(
    file="07_mengunggah_dokumen.png",
    title="Sequence Diagram – Mengunggah Dokumen (Staff)",
    participants=[("Staff", "actor"), (":ApplicationDetailPage\n(Vue)", "box"),
                  (":ApplicationDocumentsController", "box"), (":ApplicationDocumentsService", "box"),
                  ("Supabase Storage /\nPostgreSQL", "box")],
    messages=[
        dict(label="1: pilih berkas (PDF/JPG/PNG)", **{"from": 0, "to": 1}),
        dict(label="2: POST /documents/upload-url", **{"from": 1, "to": 2}),
        dict(label="3: generateUploadUrl(fileName, contentType, size)", **{"from": 2, "to": 3}),
        dict(label="4: buat signed upload URL", **{"from": 3, "to": 4}),
        dict(label="5: signed URL", **{"from": 4, "to": 3, "dashed": True}),
        dict(label="6: return {uploadUrl, filePath}", **{"from": 3, "to": 2, "dashed": True}),
        dict(label="7: 200 OK, uploadUrl", **{"from": 2, "to": 1, "dashed": True}),
        dict(label="8: PUT file langsung ke Storage (bytes tidak lewat server)", **{"from": 1, "to": 4}),
        dict(label="9: upload selesai", **{"from": 4, "to": 1, "dashed": True}),
        dict(label="10: POST /documents (metadata)", **{"from": 1, "to": 2}),
        dict(label="11: addDocument(data)", **{"from": 2, "to": 3}),
        dict(label="12: INSERT INTO application_documents", **{"from": 3, "to": 4}),
        dict(label="13: dokumen tersimpan", **{"from": 4, "to": 3, "dashed": True}),
        dict(label="14: return newDoc", **{"from": 3, "to": 2, "dashed": True}),
        dict(label="15: recordAudit(UPLOAD, document)", **{"from": 2, "to": 4}),
        dict(label="16: 201 Created", **{"from": 2, "to": 1, "dashed": True}),
        dict(label="17: tampilkan dokumen di checklist", **{"from": 1, "to": 0, "dashed": True}),
    ],
))

# 8. Memperbarui Status Permohonan (Staff) - regenerated with same lib for consistent style
diagrams.append(dict(
    file="08_memperbarui_status_permohonan.png",
    title="Sequence Diagram – Memperbarui Status Permohonan (Staff)",
    participants=[("Staff", "actor"), (":ApplicationDetailPage\n(Vue)", "box"),
                  (":ApplicationsController", "box"), (":ApplicationsService", "box"),
                  ("PostgreSQL\n(applications,\ntracking_history,\nnotifications,\naudit_logs)", "box")],
    messages=[
        dict(label="1: pilih status baru & submit", **{"from": 0, "to": 1}),
        dict(label="2: PATCH /applications/:id/status", **{"from": 1, "to": 2}),
        dict(label="3: updateApplicationStatus(id, data, staffId)", **{"from": 2, "to": 3}),
        dict(label="4: BEGIN TRANSACTION; UPDATE applications SET status,\nprogressPercentage", **{"from": 3, "to": 4}),
        dict(label="5: INSERT INTO tracking_history (fromStatus, toStatus)", **{"from": 3, "to": 4}),
        dict(label="6: INSERT INTO notifications (jika isVisibleToClient)", **{"from": 3, "to": 4}),
        dict(label="7: COMMIT", **{"from": 3, "to": 4}),
        dict(label="8: application row terbaru", **{"from": 4, "to": 3, "dashed": True}),
        dict(label="9: return result", **{"from": 3, "to": 2, "dashed": True}),
        dict(label="10: recordAudit(STATUS_CHANGE, application)", **{"from": 2, "to": 4}),
        dict(label="11: 200 OK, application status updated", **{"from": 2, "to": 1, "dashed": True}),
        dict(label="12: tampilkan status & riwayat terbaru", **{"from": 1, "to": 0, "dashed": True}),
    ],
    notes=["Catatan: Client memantau perubahan ini secara terpisah (pull-based),",
           "dengan mem-fetch ulang halaman detail permohonan / riwayat pelacakan."],
))

# 9. Mengelola Data Client (Admin - create)
diagrams.append(dict(
    file="09_mengelola_data_client.png",
    title="Sequence Diagram – Mengelola Data Client (Admin: Menambah Client)",
    participants=[("Admin", "actor"), (":ClientsPage\n(Vue)", "box"),
                  (":ClientAccountsController", "box"), (":ClientAccountsService", "box"),
                  ("PostgreSQL\n(client_accounts,\naudit_logs)", "box")],
    messages=[
        dict(label="1: isi form data client baru, submit", **{"from": 0, "to": 1}),
        dict(label="2: POST /clients", **{"from": 1, "to": 2}),
        dict(label="3: createClientAccount(data)", **{"from": 2, "to": 3}),
        dict(label="4: hash password, INSERT INTO client_accounts", **{"from": 3, "to": 4}),
        dict(label="5: client row baru", **{"from": 4, "to": 3, "dashed": True}),
        dict(label="6: return newClient", **{"from": 3, "to": 2, "dashed": True}),
        dict(label="7: recordAudit(CREATE, client)", **{"from": 2, "to": 4}),
        dict(label="8: 201 Created, newClient", **{"from": 2, "to": 1, "dashed": True}),
        dict(label="9: tampilkan client baru pada tabel", **{"from": 1, "to": 0, "dashed": True}),
    ],
    notes=["Update (PUT) dan Delete client mengikuti alur audit yang sama",
           "melalui ClientAccountsController.update() / delete()."],
))

# 10. Mengelola Data Staff (Admin - create)
diagrams.append(dict(
    file="10_mengelola_data_staff.png",
    title="Sequence Diagram – Mengelola Data Staff (Admin: Menambah Staff)",
    participants=[("Admin", "actor"), (":UsersPage\n(Vue)", "box"),
                  (":StaffAccountsController", "box"), (":StaffAccountsService", "box"),
                  ("PostgreSQL\n(staff_accounts,\naudit_logs)", "box")],
    messages=[
        dict(label="1: isi form data staff baru (email, role), submit", **{"from": 0, "to": 1}),
        dict(label="2: POST /staff", **{"from": 1, "to": 2}),
        dict(label="3: createNewStaff(data)", **{"from": 2, "to": 3}),
        dict(label="4: hash password, INSERT INTO staff_accounts", **{"from": 3, "to": 4}),
        dict(label="5: staff row baru", **{"from": 4, "to": 3, "dashed": True}),
        dict(label="6: return newStaff", **{"from": 3, "to": 2, "dashed": True}),
        dict(label="7: recordAudit(CREATE, staff)", **{"from": 2, "to": 4}),
        dict(label="8: 201 Created, newStaff", **{"from": 2, "to": 1, "dashed": True}),
        dict(label="9: tampilkan staff baru pada tabel", **{"from": 1, "to": 0, "dashed": True}),
    ],
    notes=["Hanya Admin yang dapat mengakses endpoint ini (authorizeRoles('admin'))."],
))

# 11. Melihat Log Audit (Admin)
diagrams.append(dict(
    file="11_melihat_log_audit.png",
    title="Sequence Diagram – Melihat Log Audit (Admin)",
    participants=[("Admin", "actor"), (":AuditLogsPage\n(Vue)", "box"),
                  (":AuditLogsController", "box"), (":AuditLogsService", "box"),
                  ("PostgreSQL\n(audit_logs)", "box")],
    messages=[
        dict(label="1: buka halaman log audit, pilih filter", **{"from": 0, "to": 1}),
        dict(label="2: GET /audit-logs?action=...&entityType=...", **{"from": 1, "to": 2}),
        dict(label="3: getAllLogs(filters)", **{"from": 2, "to": 3}),
        dict(label="4: SELECT audit_logs WHERE filters ORDER BY createdAt DESC", **{"from": 3, "to": 4}),
        dict(label="5: daftar log (action, staffId, entityType, old/newValues)", **{"from": 4, "to": 3, "dashed": True}),
        dict(label="6: return logs[]", **{"from": 3, "to": 2, "dashed": True}),
        dict(label="7: 200 OK, logs[]", **{"from": 2, "to": 1, "dashed": True}),
        dict(label="8: render tabel log audit", **{"from": 1, "to": 0, "dashed": True}),
    ],
    notes=["Hanya Admin yang dapat mengakses endpoint ini (authorizeRoles('admin'));",
           "aksi melihat log ini sendiri tidak dicatat ke audit_logs."],
))

for spec in diagrams:
    out = f"{OUT}/{spec['file']}"
    render_sequence(out, spec["title"], spec["participants"], spec["messages"], spec.get("notes"))
    print("saved", out)
