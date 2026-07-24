import os
from kodelib import render_kode

OUT_DIR = os.path.join(os.path.dirname(__file__), "struktur_kode")
os.makedirs(OUT_DIR, exist_ok=True)

DIAGRAMS = [
    dict(
        file="01_struktur_kode_client.png",
        gambar_no="III.22",
        title="Struktur Kode Akun Client",
        top_segments=[
            ("id client", ["X", "X", "X"]),
            ("nomor urut client", ["9", "9", "9", "9"]),
        ],
        bottom_segments=[
            ("kode client", ["C", "L", "I"]),
            ("nomor client ke-1", ["0", "0", "0", "1"]),
        ],
        keterangan=[
            ("CLI", "Kode yang menunjukkan akun Client"),
            ("0001", "Kode yang menunjukkan nomor urut Client ke 1"),
        ],
    ),
    dict(
        file="02_struktur_kode_staff.png",
        gambar_no="III.23",
        title="Struktur Kode Akun Staff",
        top_segments=[
            ("id staff", ["X", "X", "X"]),
            ("nomor urut staff", ["9", "9", "9", "9"]),
        ],
        bottom_segments=[
            ("kode staff", ["S", "T", "F"]),
            ("nomor staff ke-1", ["0", "0", "0", "1"]),
        ],
        keterangan=[
            ("STF", "Kode yang menunjukkan akun Staff/Admin"),
            ("0001", "Kode yang menunjukkan nomor urut Staff ke 1"),
        ],
    ),
    dict(
        file="03_struktur_kode_permohonan_visa.png",
        gambar_no="III.24",
        title="Struktur Kode Permohonan Visa (Reference Number)",
        top_segments=[
            ("id permohonan", ["X", "X"]),
            ("tahun", ["9", "9", "9", "9"]),
            ("nomor urut permohonan", ["9", "9", "9", "9", "9"]),
            ("4 digit terakhir no. HP client", ["9", "9", "9", "9"]),
        ],
        bottom_segments=[
            ("kode permohonan", ["G", "V"]),
            ("tahun 2026", ["2", "0", "2", "6"]),
            ("nomor permohonan ke-48213", ["4", "8", "2", "1", "3"]),
            ("4 digit terakhir HP (xxxx8213)", ["8", "2", "1", "3"]),
        ],
        keterangan=[
            ("GV", "Kode yang menunjukkan Gudang Visa (permohonan)"),
            ("2026", "Kode yang menunjukkan tahun permohonan dibuat (2026)"),
            ("48213", "Kode acak 5 digit penanda nomor urut permohonan (unik per permohonan)"),
            ("8213", "4 digit terakhir nomor telepon/HP client pemohon, ditambahkan di akhir kode"),
        ],
    ),
    dict(
        file="04_struktur_kode_dokumen_permohonan.png",
        gambar_no="III.25",
        title="Struktur Kode Dokumen Permohonan",
        top_segments=[
            ("id dokumen", ["X", "X", "X"]),
            ("nomor urut dokumen", ["9", "9", "9", "9"]),
        ],
        bottom_segments=[
            ("kode dokumen", ["D", "O", "C"]),
            ("nomor dokumen ke-1", ["0", "0", "0", "1"]),
        ],
        keterangan=[
            ("DOC", "Kode yang menunjukkan dokumen permohonan (application document)"),
            ("0001", "Kode yang menunjukkan nomor urut dokumen ke 1"),
        ],
    ),
    dict(
        file="05_struktur_kode_riwayat_pelacakan.png",
        gambar_no="III.26",
        title="Struktur Kode Riwayat Pelacakan",
        top_segments=[
            ("id riwayat", ["X", "X", "X"]),
            ("nomor urut riwayat", ["9", "9", "9", "9"]),
        ],
        bottom_segments=[
            ("kode riwayat", ["T", "R", "K"]),
            ("nomor riwayat ke-1", ["0", "0", "0", "1"]),
        ],
        keterangan=[
            ("TRK", "Kode yang menunjukkan riwayat pelacakan (tracking history) permohonan"),
            ("0001", "Kode yang menunjukkan nomor urut riwayat ke 1"),
        ],
    ),
]

for spec in DIAGRAMS:
    out = os.path.join(OUT_DIR, spec["file"])
    render_kode(out, spec["gambar_no"], spec["title"], spec["top_segments"],
                spec["bottom_segments"], spec["keterangan"])
    print("saved", out)
