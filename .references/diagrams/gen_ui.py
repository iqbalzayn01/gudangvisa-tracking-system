import os
from uilib import (
    W, CHROME_H, new_canvas, draw_chrome, draw_sidebar, draw_topbar, draw_card,
    draw_stat_card, draw_table, draw_button, draw_input, draw_badge, finish,
    rect, line_bar, text_w, F_TITLE, F_H, F_TEXT, F_CAPTION, TEXT, MUTED, PRIMARY,
    GREEN, RED, AMBER, CARD_BORDER, PANEL,
)

OUT_DIR = os.path.join(os.path.dirname(__file__), "ui_prototype")
os.makedirs(OUT_DIR, exist_ok=True)

SIDEBAR_W = 220
CONTENT_X = SIDEBAR_W + 24
CONTENT_W = W - SIDEBAR_W - 48

STAFF_NAV = ["Dashboard", "Kelola Permohonan Visa", "Verifikasi Dokumen",
             "Data Client", "Data Staff", "Log Audit"]
CLIENT_NAV = ["Dokumen Saya", "Riwayat Pelacakan"]


def add_caption(d, y, title):
    tw = text_w(d, title, F_CAPTION)
    d.text(((W - tw) / 2, y), title, font=F_CAPTION, fill="black")
    return y + 30


def app_shell(height, url, nav_items, active_idx, page_title, user_label):
    img, d = new_canvas(height)
    draw_chrome(d, url)
    draw_sidebar(d, 0, CHROME_H, SIDEBAR_W, height - CHROME_H - 60, nav_items, active_idx)
    content_top = draw_topbar(d, SIDEBAR_W, CHROME_H, W - SIDEBAR_W, 64, page_title, user_label)
    return img, d, content_top


# ---------------------------------------------------------------- 01 login
def gen_login_staff():
    height = 620
    img, d = new_canvas(height)
    draw_chrome(d, "gudangvisa.com/login")
    cw, ch = 420, 380
    cx, cy = (W - cw) / 2, (height - CHROME_H - ch) / 2 + CHROME_H - 20
    ty = draw_card(d, cx, cy, cw, ch, title=None)
    d.text((cx + 32, cy + 28), "Gudang Visa Bali", font=F_TITLE, fill=PRIMARY)
    d.text((cx + 32, cy + 58), "Masuk ke Dashboard Internal", font=F_TEXT, fill=MUTED)
    y = draw_input(d, cx + 32, cy + 100, cw - 64, 36, "Email", "nama@gudangvisa.com")
    y = draw_input(d, cx + 32, y + 20, cw - 64, 36, "Password", "••••••••")
    draw_button(d, cx + 32, y + 30, cw - 64, 40, "Masuk")
    lbl = "Lupa password?"
    tw = text_w(d, lbl, F_TEXT)
    d.text((cx + cw - 32 - tw, y + 82), lbl, font=F_TEXT, fill=PRIMARY)
    y2 = add_caption(d, height - 40, "Wireframe UI - Login Staff/Admin")
    finish(img, os.path.join(OUT_DIR, "01_login_staff_admin.png"))


def gen_login_client():
    height = 620
    img, d = new_canvas(height)
    draw_chrome(d, "gudangvisa.com/portal/login")
    cw, ch = 420, 340
    cx, cy = (W - cw) / 2, (height - CHROME_H - ch) / 2 + CHROME_H - 20
    draw_card(d, cx, cy, cw, ch)
    d.text((cx + 32, cy + 28), "Portal Klien", font=F_TITLE, fill=PRIMARY)
    d.text((cx + 32, cy + 58), "Pantau status permohonan visa Anda", font=F_TEXT, fill=MUTED)
    y = draw_input(d, cx + 32, cy + 100, cw - 64, 36, "Email", "client@email.com")
    y = draw_input(d, cx + 32, y + 20, cw - 64, 36, "Password", "••••••••")
    draw_button(d, cx + 32, y + 30, cw - 64, 40, "Masuk ke Portal")
    add_caption(d, height - 40, "Wireframe UI - Login Portal Klien")
    finish(img, os.path.join(OUT_DIR, "02_login_client_portal.png"))


# ---------------------------------------------------------------- 03 dashboard
def gen_dashboard():
    height = 760
    img, d, top = app_shell(height, "gudangvisa.com/dashboard", STAFF_NAV, 0, "Dashboard", "Admin")
    y = top + 24
    stat_w = (CONTENT_W - 3 * 16) / 4
    stats = [("Total Permohonan", "128", PRIMARY), ("Menunggu Verifikasi", "14", AMBER),
              ("Disetujui", "96", GREEN), ("Ditolak", "18", RED)]
    for i, (label, val, color) in enumerate(stats):
        draw_stat_card(d, CONTENT_X + i * (stat_w + 16), y, stat_w, 90, label, val, color)
    y += 90 + 28
    d.text((CONTENT_X, y), "Permohonan Terbaru", font=F_H, fill=TEXT)
    y += 30
    headers = ["No. Referensi", "Client", "Jenis Visa", "Status", "Tanggal"]
    rows = [
        ["GV-2026-48213", "Andi Wijaya", "B211A", ("badge", ("Pending", AMBER)), "18 Jul 2026"],
        ["GV-2026-48190", "Sarah Putri", "KITAS Working", ("badge", ("Verification", PRIMARY)), "17 Jul 2026"],
        ["GV-2026-48177", "John Miller", "KITAS Retirement", ("badge", ("Approved", GREEN)), "15 Jul 2026"],
        ["GV-2026-48150", "Made Surya", "B211A", ("badge", ("Rejected", RED)), "12 Jul 2026"],
    ]
    draw_table(d, CONTENT_X, y, CONTENT_W, headers, rows, col_ratios=[1.2, 1.2, 1.2, 1, 1])
    add_caption(d, height - 34, "Wireframe UI - Dashboard Staff/Admin")
    finish(img, os.path.join(OUT_DIR, "03_dashboard.png"))


# ---------------------------------------------------------------- 04 kelola permohonan
def gen_kelola_permohonan():
    height = 720
    img, d, top = app_shell(height, "gudangvisa.com/applications", STAFF_NAV, 1, "Kelola Permohonan Visa", "Staff")
    y = top + 20
    draw_input(d, CONTENT_X, y, 300, 34, "", "Cari nomor referensi / nama client")
    for i, (lbl, color) in enumerate([("Semua", PRIMARY), ("Pending", AMBER), ("Approved", GREEN), ("Rejected", RED)]):
        draw_badge(d, CONTENT_X + 320 + i * 90, y + 18, lbl, color if i else "#374151")
    draw_button(d, CONTENT_X + CONTENT_W - 160, y + 16, 160, 36, "+ Buat Permohonan")
    y += 70
    headers = ["No. Referensi", "Client", "Jenis Visa", "Prioritas", "Status", "Tanggal"]
    rows = [
        ["GV-2026-48213", "Andi Wijaya", "B211A", "Normal", ("badge", ("Pending", AMBER)), "18 Jul 2026"],
        ["GV-2026-48190", "Sarah Putri", "KITAS Working", "Tinggi", ("badge", ("Verification", PRIMARY)), "17 Jul 2026"],
        ["GV-2026-48177", "John Miller", "KITAS Retirement", "Normal", ("badge", ("Approved", GREEN)), "15 Jul 2026"],
        ["GV-2026-48150", "Made Surya", "B211A", "Mendesak", ("badge", ("Rejected", RED)), "12 Jul 2026"],
        ["GV-2026-48122", "Lisa Chen", "KITAS Spouse", "Normal", ("badge", ("Pending", AMBER)), "10 Jul 2026"],
    ]
    draw_table(d, CONTENT_X, y, CONTENT_W, headers, rows, col_ratios=[1.1, 1, 1.1, 0.8, 1, 0.9])
    add_caption(d, height - 34, "Wireframe UI - Kelola Permohonan Visa")
    finish(img, os.path.join(OUT_DIR, "04_kelola_permohonan_visa.png"))


# ---------------------------------------------------------------- 05 detail + verifikasi
def gen_detail_verifikasi():
    height = 760
    img, d, top = app_shell(height, "gudangvisa.com/applications/GV-2026-48213", STAFF_NAV, 2,
                             "Detail Permohonan - GV-2026-48213", "Staff")
    y = top + 20
    left_w = 340
    right_x = CONTENT_X + left_w + 20
    right_w = CONTENT_W - left_w - 20

    ty = draw_card(d, CONTENT_X, y, left_w, 300, "Informasi Permohonan")
    fields = [("Client", "Andi Wijaya"), ("Jenis Visa", "B211A"), ("Prioritas", "Normal"),
              ("Progress", "60%"), ("Ditangani oleh", "Staff - Rina")]
    fy = ty + 4
    for lbl, val in fields:
        d.text((CONTENT_X + 16, fy), lbl, font=F_TEXT, fill=MUTED)
        d.text((CONTENT_X + 16, fy + 16), val, font=F_H, fill=TEXT)
        fy += 44
    draw_badge(d, CONTENT_X + 16, fy + 4, "Verification", PRIMARY)

    ty2 = draw_card(d, right_x, y, right_w, 300, "Dokumen Permohonan")
    headers = ["Nama Dokumen", "Status", "Aksi"]
    rows = [
        ["Paspor", ("badge", ("Verified", GREEN)), "Lihat"],
        ["Foto", ("badge", ("Pending", AMBER)), "Setujui / Tolak"],
        ["Bukti Domisili", ("badge", ("Rejected", RED)), "Lihat catatan"],
    ]
    draw_table(d, right_x + 16, ty2, right_w - 32, headers, rows, col_ratios=[1.4, 1, 1.2], row_h=30)

    y2 = y + 320
    draw_card(d, CONTENT_X, y2, CONTENT_W, 200, "Verifikasi Dokumen: Foto")
    d.text((CONTENT_X + 16, y2 + 44), "Catatan (opsional bila ditolak)", font=F_TEXT, fill=MUTED)
    rect(d, CONTENT_X + 16, y2 + 62, CONTENT_X + CONTENT_W - 16, y2 + 110, fill="white", outline=CARD_BORDER, radius=6)
    draw_button(d, CONTENT_X + 16, y2 + 130, 140, 38, "Setujui", color=GREEN)
    draw_button(d, CONTENT_X + 172, y2 + 130, 140, 38, "Tolak", filled=False, color=RED)

    add_caption(d, height - 34, "Wireframe UI - Detail Permohonan & Verifikasi Dokumen")
    finish(img, os.path.join(OUT_DIR, "05_detail_verifikasi_dokumen.png"))


# ---------------------------------------------------------------- 06 data client
def gen_data_client():
    height = 680
    img, d, top = app_shell(height, "gudangvisa.com/clients", STAFF_NAV, 3, "Data Client", "Staff")
    y = top + 20
    draw_input(d, CONTENT_X, y, 320, 34, "", "Cari nama / email client")
    draw_button(d, CONTENT_X + CONTENT_W - 140, y + 16, 140, 36, "+ Tambah Client")
    y += 70
    headers = ["Nama", "Email", "Telepon", "Status", "Aksi"]
    rows = [
        ["Andi Wijaya", "andi@email.com", "0812xxxxxxx", ("badge", ("Aktif", GREEN)), "Edit"],
        ["Sarah Putri", "sarah@email.com", "0813xxxxxxx", ("badge", ("Aktif", GREEN)), "Edit"],
        ["Made Surya", "made@email.com", "0857xxxxxxx", ("badge", ("Nonaktif", "#6b7280")), "Edit"],
        ["Lisa Chen", "lisa@email.com", "0821xxxxxxx", ("badge", ("Aktif", GREEN)), "Edit"],
    ]
    draw_table(d, CONTENT_X, y, CONTENT_W, headers, rows, col_ratios=[1, 1.2, 1, 0.8, 0.6])
    add_caption(d, height - 34, "Wireframe UI - Manajemen Data Client")
    finish(img, os.path.join(OUT_DIR, "06_manajemen_data_client.png"))


# ---------------------------------------------------------------- 07 data staff
def gen_data_staff():
    height = 640
    img, d, top = app_shell(height, "gudangvisa.com/staff", STAFF_NAV, 4, "Data Staff", "Admin")
    y = top + 20
    draw_input(d, CONTENT_X, y, 320, 34, "", "Cari nama / email staff")
    draw_button(d, CONTENT_X + CONTENT_W - 140, y + 16, 140, 36, "+ Tambah Staff")
    y += 70
    headers = ["Nama", "Email", "Role", "Status", "Aksi"]
    rows = [
        ["Rina Amelia", "rina@gudangvisa.com", ("badge", ("Staff", PRIMARY)), ("badge", ("Aktif", GREEN)), "Edit"],
        ["Budi Santoso", "budi@gudangvisa.com", ("badge", ("Admin", "#7c3aed")), ("badge", ("Aktif", GREEN)), "Edit"],
        ["Dewi Lestari", "dewi@gudangvisa.com", ("badge", ("Staff", PRIMARY)), ("badge", ("Nonaktif", "#6b7280")), "Edit"],
    ]
    draw_table(d, CONTENT_X, y, CONTENT_W, headers, rows, col_ratios=[1, 1.3, 0.8, 0.8, 0.6])
    add_caption(d, height - 34, "Wireframe UI - Manajemen Data Staff")
    finish(img, os.path.join(OUT_DIR, "07_manajemen_data_staff.png"))


# ---------------------------------------------------------------- 08 log audit
def gen_log_audit():
    height = 680
    img, d, top = app_shell(height, "gudangvisa.com/audit-logs", STAFF_NAV, 5, "Log Audit", "Admin")
    y = top + 20
    draw_input(d, CONTENT_X, y, 220, 34, "", "Tanggal")
    draw_input(d, CONTENT_X + 240, y, 220, 34, "", "Nama Aktor")
    draw_button(d, CONTENT_X + CONTENT_W - 120, y + 16, 120, 36, "Ekspor", filled=False)
    y += 70
    headers = ["Waktu", "Aktor", "Aksi", "Entitas", "Keterangan"]
    rows = [
        ["18 Jul 2026 09.12", "Rina Amelia", "UPDATE_STATUS", "Application", "GV-2026-48213 -> Verification"],
        ["18 Jul 2026 08.40", "Budi Santoso", "LOGIN", "Staff", "Login berhasil"],
        ["17 Jul 2026 16.05", "Rina Amelia", "VERIFY_DOCUMENT", "Document", "Foto - rejected"],
        ["17 Jul 2026 11.22", "Budi Santoso", "CREATE_STAFF", "Staff", "Menambahkan Dewi Lestari"],
    ]
    draw_table(d, CONTENT_X, y, CONTENT_W, headers, rows, col_ratios=[1.1, 1, 1.1, 0.9, 1.8])
    add_caption(d, height - 34, "Wireframe UI - Log Audit")
    finish(img, os.path.join(OUT_DIR, "08_log_audit.png"))


# ---------------------------------------------------------------- 09 client portal
def gen_client_portal():
    height = 700
    img, d, top = app_shell(height, "gudangvisa.com/portal/applications", CLIENT_NAV, 0,
                             "Dokumen Saya", "Andi Wijaya")
    y = top + 20
    headers = ["No. Referensi", "Jenis Visa", "Status", "Progress", "Aksi"]
    rows = [
        ["GV-2026-48213", "B211A", ("badge", ("Verification", PRIMARY)), "60%", "Lihat Detail"],
        ["GV-2025-31890", "KITAS Working", ("badge", ("Approved", GREEN)), "100%", "Unduh Dokumen"],
    ]
    draw_table(d, CONTENT_X, y, CONTENT_W, headers, rows, col_ratios=[1.1, 1.1, 1, 0.7, 1])
    y += 32 + 34 * 2 + 30
    draw_card(d, CONTENT_X, y, CONTENT_W, 200, "Riwayat Pelacakan - GV-2026-48213")
    steps = [
        ("18 Jul 2026 09.12", "Status diperbarui menjadi Verification"),
        ("16 Jul 2026 14.30", "Dokumen Paspor diverifikasi"),
        ("14 Jul 2026 10.05", "Permohonan diterima, menunggu verifikasi"),
    ]
    sy = y + 46
    for waktu, desc in steps:
        d.ellipse([CONTENT_X + 16, sy + 4, CONTENT_X + 24, sy + 12], fill=PRIMARY)
        d.text((CONTENT_X + 36, sy - 2), waktu, font=F_TEXT, fill=MUTED)
        d.text((CONTENT_X + 36, sy + 14), desc, font=F_TEXT, fill=TEXT)
        sy += 44
    add_caption(d, height - 34, "Wireframe UI - Portal Klien (Dokumen Saya)")
    finish(img, os.path.join(OUT_DIR, "09_client_portal_dokumen_saya.png"))


if __name__ == "__main__":
    gen_login_staff()
    gen_login_client()
    gen_dashboard()
    gen_kelola_permohonan()
    gen_detail_verifikasi()
    gen_data_client()
    gen_data_staff()
    gen_log_audit()
    gen_client_portal()
    print("done, files in", OUT_DIR)
