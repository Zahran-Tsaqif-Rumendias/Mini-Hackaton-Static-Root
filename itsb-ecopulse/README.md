# 🌿 ITSB EcoPulse — Platform Full-Stack Kampus Berkelanjutan & Ekosistem Hijau
**Institusi:** Institut Teknologi Sains Bandung (ITSB)  
**Lokasi Kampus:** Kawasan Kota Deltamas, Cikarang Pusat, Kabupaten Bekasi, Jawa Barat  
**Visi Utama:** *"Eco-Industry Oriented University"* pelopor efisiensi energi, arsitektur hijau (*green building*), dan sirkularitas kampus.

---

## 🚀 Akses Cepat Aplikasi
- **Aplikasi Web Utama:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Dokumentasi Interaktif API (Swagger UI):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative Redoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🏛️ Arsitektur Teknologi (Full-Stack)
- **Backend Core:** Python 3.14 + FastAPI (Asynchronous REST API, CORS Middleware, Static File Mounting).
- **Database:** SQLite3 terstruktur dengan relasi foreign key dan data awal realistis (*seeded data*) berkonteks Institut Teknologi Sains Bandung.
- **Frontend Design System:**
  - Semantic HTML5 & Modern Vanilla CSS3.
  - Skema Warna 60-30-10 (*Light Mode Default*): Kanvas bersih botani (`#F8FAF8`), garis batas berpresisi tinggi (`#E2EBE5`), teks tinta slate (`#0D1F17`), dan aksen zamrud kampus hijau (`#059669` / `#10B981`).
  - Tipografi Disiplin: **Plus Jakarta Sans** (Google Fonts).
  - Aset Fotorealistis Google Imagen: Foto arsitektural kampus ITSB Deltamas dengan rooftop solar panel dan mahasiswa teknik.
  - Bespoke Parametric SVG: Grafik kurva generasi surya harian, meter AQI, diagram donat komposisi sampah 3R, dan segel sertifikat digital.
  - 4-State UI: Loading Skeleton Shimmer, Pesan Error Informatif, Empty State ramah pengguna, dan Transisi Sukses Dinamis.

---

## 📌 5 Modul Fungsional Utama (Strict 1:1 FR-Screen Mapping)

### 1. FR-01: Kokpit Telemetri Lingkungan & Energi Kampus (`#telemetry`)
- **Fitur:** Pemantauan real-time sensor IoT kampus ITSB Deltamas.
  - Daya Solar PV Rooftop (kW & akumulasi kWh harian terhadap kapasitas 120 kWp).
  - Indeks Kualitas Udara (AQI & PM2.5) stasiun Cikarang Deltamas.
  - Tandon Pemanenan Air Hujan (*Rainwater Harvesting*) 10.000 L & rasio pemanfaatan air daur ulang 74.5%.
  - Reduksi Emisi Karbon (kg CO₂e terhindar hari ini) & ekuivalensi pohon tertanam.
- **Kurva Interaktif SVG:** Grafik visual fluktuasi produksi daya surya vs beban listrik aktif kampus 24 jam terakhir.

### 2. FR-02: Bank Sampah Sirkular & Eco-Rewards Civitas (`#waste`)
- **Fitur:** Pencatatan sirkularitas sampah kampus dari sumbernya.
  - Neraca massa sampah (Organik, Plastik PET, Kertas/Karton, E-Waste Lab, Logam/Kaleng).
  - Formulir Setor Sampah Digital dengan kalkulasi poin otomatis (+50 Pts/kg plastik, +200 Pts/kg e-waste, dll.).
  - Papan Peringkat (*Leaderboard*) Top Eco-Champions mahasiswa ITSB.
  - Katalog Penukaran Eco-Rewards (Tumbler Stainless Steel ITSB, Voucher Kantin Sehat, Solar Power Bank, Bibit Pohon Tabebuya).

### 3. FR-03: Gerakan Inisiatif & Komunitas Hijau Kampus (`#initiatives`)
- **Fitur:** Hub partisipasi civitas dalam aksi nyata pelestarian lingkungan:
  - *Car-Free Campus & Green Commute Day Deltamas*
  - *Penanaman 500 Pohon di Arboretum & Danau Retensi ITSB*
  - *Program Kantin Nol Sampah (Zero Food-Waste) & Kompos Terpadu*
  - *Audit Mandiri Efisiensi Energi Laboratorium*
- Tombol dan modal pendaftaran relawan hijau langsung terintegrasi ke database.

### 4. FR-04: Kalkulator Jejak Karbon Komuter Kampus (`#calculator`)
- **Fitur:** Alat ukur mandiri jejak karbon harian berdasarkan jarak tempuh ke kampus Deltamas, moda transportasi (Shuttle Bus, Sepeda, Motor Listrik, KRL, Kendaraan Pribadi), dan konsumsi listrik.
- **Output:** Total emisi harian (kg CO₂e), peringkat keberlanjutan (Peringkat A+, A, B, C), jumlah pohon kompensasi tahunan, serta penerbitan **E-Certificate Komitmen Green Civitas ITSB** dengan kode unik verifikasi.

### 5. FR-05: Lapor Kampus — Audit & Pengaduan Fasilitas Lingkungan (`#reports`)
- **Fitur:** Kanal aspirasi dan audit fasilitas kampus yang bocor atau boros energi:
  - Filter kategori: Kebocoran Air, Pemborosan Energi, Tumpukan Sampah, Kerusakan Fasilitas Hijau.
  - Formulir pengaduan interaktif dengan penerbitan nomor tiket unik (`ITSB-ECO-XXXX`).
  - Pipa status transparan: *Diajukan* ➔ *Diverifikasi* ➔ *Sedang Dikerjakan* ➔ *Selesai* beserta catatan tindakan dari Tim Estate Management ITSB.

---

## 🛠️ Cara Menjalankan Aplikasi

1. **Jalankan Server:**
   ```powershell
   cd c:\Users\LENOVO\Documents\Hackaton\itsb-ecopulse
   py run.py
   ```
2. **Buka Browser:**
   Akses `http://127.0.0.1:8000` di Google Chrome / Microsoft Edge.
