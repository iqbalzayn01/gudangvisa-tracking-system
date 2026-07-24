import os
from actlib import render_activity

OUT_DIR = os.path.join(os.path.dirname(__file__), "activity_diagrams")
os.makedirs(OUT_DIR, exist_ok=True)

ALT_DX = 280
ALT_W = 200


def N(t, lane, row, label=None, dx=0, w=None):
    d = {"type": t, "lane": lane, "row": row}
    if label is not None:
        d["label"] = label
    if dx:
        d["dx"] = dx
    if w:
        d["w"] = w
    return d


DIAGRAMS = []

# 01 -----------------------------------------------------------------
DIAGRAMS.append(dict(
    file="01_melakukan_login.png",
    title="Activity Diagram - Melakukan Login (Staff/Admin)",
    lanes=["Staff/Admin", "Sistem"],
    nodes={
        "s0": N("start", 0, 0),
        "a1": N("activity", 0, 1, "Membuka halaman login"),
        "a2": N("activity", 0, 2, "Mengisi & mengirim email + password"),
        "a3": N("activity", 1, 3, "Memverifikasi kredensial ke database"),
        "d1": N("decision", 1, 4, "Kredensial valid & akun aktif?"),
        "a4": N("activity", 1, 5, "Generate accessToken & refreshToken (JWT), catat audit log"),
        "a5": N("activity", 0, 6, "Redirect ke Dashboard sesuai role (Staff/Admin)"),
        "e1": N("end", 0, 7),
        "a6": N("activity", 0, 4, "Tampilkan pesan 'Email atau Password salah'", dx=ALT_DX, w=ALT_W),
    },
    edges=[
        ("s0", "a1", None, False), ("a1", "a2", None, False), ("a2", "a3", None, False),
        ("a3", "d1", None, False),
        ("d1", "a4", "Valid", False), ("a4", "a5", None, False), ("a5", "e1", None, False),
        ("d1", "a6", "Tidak valid", False), ("a6", "a2", "Ulangi", True),
    ],
))

# 02 -----------------------------------------------------------------
DIAGRAMS.append(dict(
    file="02_memantau_status_dokumen.png",
    title="Activity Diagram - Memantau Status Dokumen (Cek via Nomor Resi)",
    lanes=["Client (tanpa login)", "Sistem"],
    nodes={
        "s0": N("start", 0, 0),
        "a1": N("activity", 0, 1, "Membuka halaman pelacakan publik & memasukkan nomor resi permohonan"),
        "a2": N("activity", 1, 2, "Mencari permohonan berdasarkan nomor resi di database"),
        "d1": N("decision", 1, 3, "Nomor resi ditemukan?"),
        "a3": N("activity", 1, 4, "Ambil status terbaru (Pending/Verification/Approved/Rejected)"),
        "a4": N("activity", 0, 5, "Menampilkan status permohonan ke Client"),
        "e1": N("end", 0, 6),
        "a5": N("activity", 0, 4, "Tampilkan pesan 'Nomor resi tidak ditemukan/salah'", dx=ALT_DX, w=ALT_W),
        "e2": N("end", 0, 5, dx=ALT_DX),
    },
    edges=[
        ("s0", "a1", None, False), ("a1", "a2", None, False), ("a2", "d1", None, False),
        ("d1", "a3", "Ditemukan", False), ("a3", "a4", None, False), ("a4", "e1", None, False),
        ("d1", "a5", "Tidak ditemukan", False), ("a5", "e2", None, False),
    ],
))

# 03 -----------------------------------------------------------------
DIAGRAMS.append(dict(
    file="03_mengelola_permohonan_visa.png",
    title="Activity Diagram - Mengelola Permohonan Visa",
    lanes=["Staff/Admin", "Sistem"],
    nodes={
        "s0": N("start", 0, 0),
        "a1": N("activity", 0, 1, "Membuka menu 'Kelola Permohonan Visa'"),
        "a2": N("activity", 1, 2, "Tampilkan daftar permohonan masuk"),
        "a3": N("activity", 0, 3, "Memilih permohonan untuk diperiksa"),
        "a4": N("activity", 0, 4, "Memperbarui data/status permohonan"),
        "a5": N("activity", 0, 5, "Menekan tombol 'Simpan'"),
        "d1": N("decision", 1, 6, "Data valid & belum dibatalkan Client?"),
        "a6": N("activity", 1, 7, "Validasi & update database, trigger perubahan status ke portal Client"),
        "e1": N("end", 1, 8),
        "a7": N("activity", 0, 6, "Tampilkan peringatan validasi, atau notifikasi 'permohonan telah dibatalkan Client' & kunci tombol edit", dx=ALT_DX, w=ALT_W),
        "e2": N("end", 0, 7, dx=ALT_DX),
    },
    edges=[
        ("s0", "a1", None, False), ("a1", "a2", None, False), ("a2", "a3", None, False),
        ("a3", "a4", None, False), ("a4", "a5", None, False), ("a5", "d1", None, False),
        ("d1", "a6", "Valid", False), ("a6", "e1", None, False),
        ("d1", "a7", "Tidak valid/dibatalkan", False), ("a7", "e2", None, False),
    ],
))

# 04 -----------------------------------------------------------------
DIAGRAMS.append(dict(
    file="04_melihat_riwayat_pelacakan.png",
    title="Activity Diagram - Melihat Riwayat Pelacakan (Cek via Nomor Resi)",
    lanes=["Client (tanpa login)", "Sistem"],
    nodes={
        "s0": N("start", 0, 0),
        "a1": N("activity", 0, 1, "Membuka halaman pelacakan & memasukkan nomor resi permohonan"),
        "a2": N("activity", 1, 2, "Mencari permohonan berdasarkan nomor resi"),
        "d0": N("decision", 1, 3, "Nomor resi ditemukan?"),
        "a3": N("activity", 1, 4, "Melacak seluruh riwayat perubahan status permohonan"),
        "d1": N("decision", 1, 5, "Status saat ini Ditolak/Dibatalkan?"),
        "a4": N("activity", 1, 6, "Tampilkan daftar riwayat kronologis (tanggal & jam)"),
        "a5": N("activity", 0, 7, "Melihat detail proses"),
        "e1": N("end", 0, 8),
        "a6": N("activity", 1, 6, "Hentikan timeline, tampilkan indikator merah & alasan penolakan/pembatalan", dx=ALT_DX, w=ALT_W),
        "e2": N("end", 1, 7, dx=ALT_DX),
        "a7": N("activity", 0, 4, "Tampilkan pesan 'Nomor resi tidak ditemukan/salah'", dx=ALT_DX, w=ALT_W),
        "e3": N("end", 0, 5, dx=ALT_DX),
    },
    edges=[
        ("s0", "a1", None, False), ("a1", "a2", None, False), ("a2", "d0", None, False),
        ("d0", "a3", "Ditemukan", False), ("a3", "d1", None, False),
        ("d1", "a4", "Tidak", False), ("a4", "a5", None, False), ("a5", "e1", None, False),
        ("d1", "a6", "Ya", False), ("a6", "e2", None, False),
        ("d0", "a7", "Tidak ditemukan", False), ("a7", "e3", None, False),
    ],
))

# 05 -----------------------------------------------------------------
DIAGRAMS.append(dict(
    file="05_mengunduh_dokumen.png",
    title="Activity Diagram - Mengunduh Dokumen (via Nomor Resi)",
    lanes=["Client (tanpa login)", "Sistem"],
    nodes={
        "s0": N("start", 0, 0),
        "a1": N("activity", 0, 1, "Membuka halaman pelacakan & memasukkan nomor resi permohonan"),
        "a2": N("activity", 1, 2, "Mencari permohonan & dokumen terkait berdasarkan nomor resi"),
        "d0": N("decision", 1, 3, "Nomor resi & dokumen ditemukan?"),
        "a2b": N("activity", 1, 4, "Tampilkan detail dokumen yang tersedia untuk diunduh"),
        "a3": N("activity", 0, 5, "Menekan tombol 'Unduh Dokumen'"),
        "a4": N("activity", 1, 6, "Verifikasi ketersediaan file di server"),
        "d1": N("decision", 1, 7, "File ditemukan & unduhan lancar?"),
        "a5": N("activity", 1, 8, "Kirim respons unduhan ke browser"),
        "a6": N("activity", 0, 9, "File tersimpan di perangkat Client"),
        "e1": N("end", 0, 10),
        "a7": N("activity", 1, 8, "Tampilkan 'File tidak ditemukan/kedaluwarsa' atau 'Unduhan Gagal' + tombol Retry", dx=ALT_DX, w=ALT_W),
        "e2": N("end", 1, 9, dx=ALT_DX),
        "a8": N("activity", 0, 4, "Tampilkan pesan 'Nomor resi tidak ditemukan/salah'", dx=ALT_DX, w=ALT_W),
        "e3": N("end", 0, 5, dx=ALT_DX),
    },
    edges=[
        ("s0", "a1", None, False), ("a1", "a2", None, False), ("a2", "d0", None, False),
        ("d0", "a2b", "Ditemukan", False), ("a2b", "a3", None, False),
        ("a3", "a4", None, False), ("a4", "d1", None, False),
        ("d1", "a5", "Ya", False), ("a5", "a6", None, False), ("a6", "e1", None, False),
        ("d1", "a7", "Tidak", False), ("a7", "e2", None, False),
        ("d0", "a8", "Tidak ditemukan", False), ("a8", "e3", None, False),
    ],
))

# 06 -----------------------------------------------------------------
DIAGRAMS.append(dict(
    file="06_memverifikasi_dokumen.png",
    title="Activity Diagram - Memverifikasi Dokumen",
    lanes=["Staff/Admin", "Sistem"],
    nodes={
        "s0": N("start", 0, 0),
        "a1": N("activity", 0, 1, "Membuka dokumen lampiran Client"),
        "a2": N("activity", 0, 2, "Memeriksa kesesuaian data & fisik berkas"),
        "d1": N("decision", 0, 3, "Dokumen disetujui?"),
        "a3": N("activity", 1, 4, "Simpan status verifikasi: Approved"),
        "e1": N("end", 1, 5),
        "a4": N("activity", 0, 4, "Mengisi catatan/alasan penolakan", dx=ALT_DX, w=ALT_W),
        "a5": N("activity", 1, 5, "Simpan status Rejected, kirim notifikasi otomatis ke akun Client", dx=ALT_DX, w=ALT_W),
        "e2": N("end", 1, 6, dx=ALT_DX),
    },
    edges=[
        ("s0", "a1", None, False), ("a1", "a2", None, False), ("a2", "d1", None, False),
        ("d1", "a3", "Setuju", False), ("a3", "e1", None, False),
        ("d1", "a4", "Tolak", False), ("a4", "a5", None, False), ("a5", "e2", None, False),
    ],
))

# 07 -----------------------------------------------------------------
DIAGRAMS.append(dict(
    file="07_mengunggah_dokumen.png",
    title="Activity Diagram - Mengunggah Dokumen",
    lanes=["Staff/Admin", "Sistem"],
    nodes={
        "s0": N("start", 0, 0),
        "a1": N("activity", 0, 1, "Klik 'Unggah Dokumen' & memilih file lokal"),
        "a2": N("activity", 0, 2, "Menekan tombol 'Upload/Simpan'"),
        "a3": N("activity", 1, 3, "Mengecek format (.PDF) & ukuran file (maks 2MB)"),
        "d1": N("decision", 1, 4, "Format & ukuran valid?"),
        "a4": N("activity", 1, 5, "Simpan berkas ke server"),
        "e1": N("end", 1, 6),
        "a5": N("activity", 0, 5, "Tampilkan error (format wajib .PDF / ukuran-corrupt), batalkan proses & kosongkan kolom upload", dx=ALT_DX, w=ALT_W),
        "e2": N("end", 0, 6, dx=ALT_DX),
    },
    edges=[
        ("s0", "a1", None, False), ("a1", "a2", None, False), ("a2", "a3", None, False),
        ("a3", "d1", None, False),
        ("d1", "a4", "Valid", False), ("a4", "e1", None, False),
        ("d1", "a5", "Tidak valid", False), ("a5", "e2", None, False),
    ],
))

# 08 -----------------------------------------------------------------
DIAGRAMS.append(dict(
    file="08_memperbarui_status_permohonan.png",
    title="Activity Diagram - Memperbarui Status Permohonan",
    lanes=["Staff/Admin", "Sistem"],
    nodes={
        "s0": N("start", 0, 0),
        "a1": N("activity", 0, 1, "Memilih 'Ubah Status'"),
        "a2": N("activity", 0, 2, "Memilih status baru dari dropdown"),
        "d1": N("decision", 0, 3, "Submit atau batalkan?"),
        "a4": N("activity", 0, 4, "Menekan tombol 'Perbarui Status'"),
        "a5": N("activity", 1, 5, "Simpan status baru & kirim sinyal update ke portal Client"),
        "d2": N("decision", 1, 6, "Status baru = Approved (Selesai)?"),
        "a6": N("activity", 1, 7, "Buat nomor registrasi visa baru & aktifkan tombol 'Unduh Dokumen' di portal Client"),
        "e2": N("end", 1, 8),
        "e3": N("end", 1, 7, dx=ALT_DX),
        "a3": N("activity", 0, 4, "Status kembali ke semula, tidak tersimpan", dx=ALT_DX, w=ALT_W),
        "e1": N("end", 0, 5, dx=ALT_DX),
    },
    edges=[
        ("s0", "a1", None, False), ("a1", "a2", None, False), ("a2", "d1", None, False),
        ("d1", "a4", "Submit", False), ("a4", "a5", None, False), ("a5", "d2", None, False),
        ("d2", "a6", "Approved", False), ("a6", "e2", None, False),
        ("d2", "e3", "Status lain", False),
        ("d1", "a3", "Batal", False), ("a3", "e1", None, False),
    ],
))

# 09 -----------------------------------------------------------------
DIAGRAMS.append(dict(
    file="09_mengelola_data_client.png",
    title="Activity Diagram - Mengelola Data Client",
    lanes=["Staff/Admin", "Sistem"],
    nodes={
        "s0": N("start", 0, 0),
        "a1": N("activity", 0, 1, "Membuka direktori 'Data Client'"),
        "a2": N("activity", 0, 2, "Mencari nama Client & mengubah data (mis. telepon, blokir akun)"),
        "a3": N("activity", 0, 3, "Menekan 'Simpan Perubahan'"),
        "d1": N("decision", 1, 4, "Data valid (format email, dsb.)?"),
        "a4": N("activity", 1, 5, "Update data master Client di database"),
        "d2": N("decision", 1, 6, "Permintaan hapus akun dgn permohonan aktif?"),
        "e1": N("end", 1, 7),
        "a5": N("activity", 1, 7, "Tolak hapus: 'Akun tidak dapat dihapus karena memiliki permohonan yang sedang berjalan'", dx=ALT_DX, w=ALT_W),
        "e2": N("end", 1, 8, dx=ALT_DX),
        "a6": N("activity", 0, 5, "Tampilkan error 'Format email tidak valid', tolak simpan", dx=ALT_DX, w=ALT_W),
        "e3": N("end", 0, 6, dx=ALT_DX),
    },
    edges=[
        ("s0", "a1", None, False), ("a1", "a2", None, False), ("a2", "a3", None, False),
        ("a3", "d1", None, False),
        ("d1", "a4", "Valid", False), ("a4", "d2", None, False),
        ("d2", "e1", "Tidak", False),
        ("d2", "a5", "Ya", False), ("a5", "e2", None, False),
        ("d1", "a6", "Tidak valid", False), ("a6", "e3", None, False),
    ],
))

# 10 -----------------------------------------------------------------
DIAGRAMS.append(dict(
    file="10_mengelola_data_staff.png",
    title="Activity Diagram - Mengelola Data Staff",
    lanes=["Admin", "Sistem"],
    nodes={
        "s0": N("start", 0, 0),
        "a1": N("activity", 0, 1, "Membuka menu 'Manajemen Staff'"),
        "a2": N("activity", 1, 2, "Tampilkan daftar staff"),
        "a3": N("activity", 0, 3, "Menambah/mengubah data staff & menentukan hak akses"),
        "d1": N("decision", 1, 4, "Username sudah dipakai?"),
        "a4": N("activity", 1, 5, "Simpan ke database internal"),
        "e1": N("end", 1, 6),
        "a5": N("activity", 0, 5, "Tampilkan error 'Username sudah digunakan'", dx=ALT_DX, w=ALT_W),
        "e2": N("end", 0, 6, dx=ALT_DX),
    },
    edges=[
        ("s0", "a1", None, False), ("a1", "a2", None, False), ("a2", "a3", None, False),
        ("a3", "d1", None, False),
        ("d1", "a4", "Tidak", False), ("a4", "e1", None, False),
        ("d1", "a5", "Ya", False), ("a5", "e2", None, False),
    ],
))

# 11 -----------------------------------------------------------------
DIAGRAMS.append(dict(
    file="11_melihat_log_audit.png",
    title="Activity Diagram - Melihat Log Audit",
    lanes=["Admin", "Sistem"],
    nodes={
        "s0": N("start", 0, 0),
        "a1": N("activity", 0, 1, "Memilih menu 'Log Audit/Aktivitas'"),
        "a2": N("activity", 1, 2, "Memuat rekaman aktivitas (mis. 'Staff A mengubah status berkas X pukul 12.00')"),
        "a3": N("activity", 0, 3, "Memfilter berdasarkan tanggal/nama aktor"),
        "a4": N("activity", 1, 4, "Menyajikan hasil filter"),
        "d1": N("decision", 1, 5, "Ada log pada rentang dicari?"),
        "e1": N("end", 1, 6),
        "a5": N("activity", 0, 6, "Tampilkan halaman kosong 'Tidak ada log aktivitas pada periode ini'", dx=ALT_DX, w=ALT_W),
        "e2": N("end", 0, 7, dx=ALT_DX),
    },
    edges=[
        ("s0", "a1", None, False), ("a1", "a2", None, False), ("a2", "a3", None, False),
        ("a3", "a4", None, False), ("a4", "d1", None, False),
        ("d1", "e1", "Ya", False),
        ("d1", "a5", "Tidak", False), ("a5", "e2", None, False),
    ],
))

for spec in DIAGRAMS:
    out = os.path.join(OUT_DIR, spec["file"])
    render_activity(out, spec["title"], spec["lanes"], spec["nodes"], spec["edges"])
    print("saved", out)
