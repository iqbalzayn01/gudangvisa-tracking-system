import { createI18n } from "vue-i18n";

const messages = {
  en: {
    nav: {
      services: "Services",
      faq: "FAQ",
      about: "About",
      contact: "Contact CS",
    },
    hero: {
      title: "Track Your Document",
      subtitle:
        "Enter your tracking code to see the current status and full history of your immigration document.",
      placeholder: "Enter tracking code (e.g. GVI-1712345678)",
      button: "Track",
      searching: "searching...",
    },
    services: {
      title: "Our Premium Services",
      subtitle:
        "We provide fast, reliable, and transparent immigration document processing services.",
      visa: {
        title: "Visa Application",
        desc: "Processing tourist, business, and social visas with clear tracking from start to completion.",
      },
      kitas: {
        title: "KITAS / KITAP",
        desc: "Temporary and permanent stay permit management for foreign workers, spouses, or investors.",
      },
      passport: {
        title: "Passport Services",
        desc: "Assisting in new passport registration, renewals, and handling damaged or lost passports.",
      },
    },
    faq: {
      title: "Frequently Asked Questions",
      subtitle:
        "Got questions? We have answers. If you cannot find what you are looking for, contact our CS.",
      q1: {
        q: "How do I track my immigration document?",
        a: "Simply enter your unique tracking code (e.g., GVI-1712345678) into the search box on the home page and click 'Track'.",
      },
      q2: {
        q: "What types of documents can be processed here?",
        a: "We handle tourist/business Visas, Temporary Stay Permits (KITAS), Permanent Stay Permits (KITAP), and Indonesian Passport management.",
      },
      q3: {
        q: "How long does the document tracking link stay active?",
        a: "The tracking system operates in real-time. Your tracking link remains active until your document process is completely finalized and collected.",
      },
    },
    about: {
      title: "About Us",
      subtitle:
        "Your Day 1 agency for all your vacation and business needs in Bali.",
      description1:
        "Gudang Visa Indonesia was established in 2023 and located in Bali. We are managed by professional and experienced people in their own field to provide our clients with the best service for obtaining Visa, KITAS, Flight tickets, and setting up your own business with our legal team support.",
      description2:
        "We prioritize transparency, clear communication, and outstanding customer service to build long-term relationships with our clients. Last but not least, we have competitive prices compared to other agencies in Bali.",
      vision: "Our Vision",
      vision_text:
        "Becoming a professional company that provides the best services with accuracy in fast and precise timing.",
      mission: "Our Mission",
      mission_text:
        "Providing the best solution and ideas for every needs of clients.",
      why_us: "Why Choose Us?",
      trusted: "Trusted Company",
      trusted_desc:
        "We are a trusted company that has clear and transparent legality.",
      price: "Best Price",
      price_desc: "We offer the best and most competitive prices in Bali.",
      fast: "Fast & Responsive",
      fast_desc:
        "Clear communication and prompt response for all your inquiries.",
    },
    footer: {
      rights: "All rights reserved.",
      company: {
        title: "Navigation",
      },
      services: {
        title: "Services",
        track: "Check Document Status",
        guide: "Guide Visa",
        express: "Express Services",
      },
    },
  },
  id: {
    nav: {
      services: "Layanan",
      faq: "Pertanyaan Umum",
      about: "Tentang Kami",
      contact: "Hubungi CS",
    },
    hero: {
      title: "Lacak Dokumen Anda",
      subtitle:
        "Masukkan kode pelacakan Anda untuk melihat status saat ini dan riwayat lengkap dokumen imigrasi Anda.",
      placeholder: "Masukkan kode pelacakan (contoh: GVI-1712345678)",
      button: "Lacak",
      searching: "mencari...",
    },
    services: {
      title: "Layanan Utama Kami",
      subtitle:
        "Kami menyediakan jasa pengurusan dokumen imigrasi yang cepat, andal, dan transparan.",
      visa: {
        title: "Pengurusan Visa",
        desc: "Proses visa turis, bisnis, dan sosial dengan pelacakan transparan dari awal hingga selesai.",
      },
      kitas: {
        title: "KITAS / KITAP",
        desc: "Pengurusan izin tinggal terbatas dan tetap untuk tenaga kerja asing, penyatuan keluarga, atau investor.",
      },
      passport: {
        title: "Layanan Paspor",
        desc: "Membantu pembuatan paspor baru, perpanjangan masa berlaku, serta penanganan paspor rusak atau hilang.",
      },
    },
    faq: {
      title: "Pertanyaan Umum (FAQ)",
      subtitle:
        "Punya pertanyaan? Kami punya jawabannya. Jika Anda tidak menemukan apa yang Anda cari, hubungi CS kami.",
      q1: {
        q: "Bagaimana cara melacak dokumen imigrasi saya?",
        a: "Cukup masukkan kode pelacakan unik Anda (contoh: GVI-1712345678) ke dalam kotak pencarian di halaman utama lalu klik 'Lacak'.",
      },
      q2: {
        q: "Jenis dokumen apa saja yang bisa diproses di sini?",
        a: "Kami melayani pengurusan Visa turis/bisnis, Izin Tinggal Terbatas (KITAS), Izin Tinggal Tetap (KITAP), dan manajemen Paspor Indonesia.",
      },
      q3: {
        q: "Berapa lama tautan pelacakan dokumen tetap aktif?",
        a: "Sistem pelacakan ini bekerja secara real-time. Tautan pelacakan Anda akan terus aktif sampai proses dokumen Anda sepenuhnya selesai dan diambil.",
      },
    },
    about: {
      title: "Tentang Kami",
      subtitle:
        "Agensi utama Anda untuk semua kebutuhan liburan dan bisnis di Bali.",
      description1:
        "Gudang Visa Indonesia didirikan pada tahun 2023 dan berlokasi di Bali. Kami dikelola oleh tenaga profesional dan berpengalaman di bidangnya untuk memberikan pelayanan terbaik dalam pengurusan Visa, KITAS, Tiket Pesawat, hingga pendirian bisnis Anda dengan dukungan tim hukum kami.",
      description2:
        "Kami memprioritaskan transparansi, komunikasi yang jelas, dan layanan pelanggan yang luar biasa untuk membangun hubungan jangka panjang dengan klien. Kami juga menawarkan harga yang sangat kompetitif dibanding agensi lain di Bali.",
      vision: "Visi Kami",
      vision_text:
        "Menjadi perusahaan profesional yang menyediakan layanan terbaik dengan akurasi dalam waktu yang cepat dan tepat.",
      mission: "Misi Kami",
      mission_text:
        "Memberikan solusi dan ide terbaik untuk setiap kebutuhan dan permasalahan klien.",
      why_us: "Mengapa Memilih Kami?",
      trusted: "Perusahaan Terpercaya",
      trusted_desc:
        "Kami adalah perusahaan terpercaya yang memiliki legalitas hukum yang jelas.",
      price: "Harga Terbaik",
      price_desc:
        "Kami menawarkan harga terbaik yang sangat kompetitif di pasar Bali.",
      fast: "Respon Cepat",
      fast_desc:
        "Komunikasi yang transparan dan respon kilat untuk setiap kebutuhan Anda.",
    },
    footer: {
      rights: "Hak cipta dilindungi undang-undang.",
      company: {
        title: "Navigasi",
      },
      services: {
        title: "Layanan",
        track: "Cek Status Dokumen",
        guide: "Panduan Visa",
        express: "Layanan Ekspres",
      },
    },
  },
};

const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages,
});

export default i18n;
