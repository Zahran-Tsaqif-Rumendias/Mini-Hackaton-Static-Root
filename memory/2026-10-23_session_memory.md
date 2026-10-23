# 🧠 Session Memory — 23 Oktober 2026

**Project:** ITSB EcoPulse (Institut Teknologi Sains Bandung — Kota Deltamas)  
**Corpus / Repo:** Zahran-Tsaqif-Rumendias / `Mini-Hackaton-Static-Root`  
**Current Active Branch:** `feat/voucher-qr-rewards`  
**Compiled Date:** 23 Oktober 2026  

---

## 📌 Ringkasan Eksekutif Sesi Hari Ini
Pada sesi hari ini, serangkaian tugas penting berhasil diselesaikan yang berfokus pada:
1. **Resolusi Konflik Git Merge:** Mengatasi konflik merge "both added" pada 3 file utama frontend.
2. **Audit Kualitas & Bug-Fixing Keseluruhan Codebase:** Menelusuri seluruh file backend (FastAPI/SQLite) dan frontend (HTML, CSS, JS) untuk mendeteksi kelemahan, glitch visual, dan potensi error jaringan.
3. **Pembersihan File Sampah / Binary Cache:** Menghapus artefak `__pycache__/*.pyc` yang sempat ter-track dalam riwayat git.
4. **Pencatatan Rencana Kerja Berikutnya:** Instruksi penggabungan branch `feat/upload-foto-laporan` dengan branch `main`.

---

## 🛠️ Riwayat Permintaan & Tindakan Terperinci

### 1. Permintaan: *"fix all error conflict"*
- **Status:** Selesai & Terverifikasi
- **Masalah:** Terjadi konflik git (kedua branch menambahkan file yang sama) pada:
  - `itsb-ecopulse/static/index.html`
  - `itsb-ecopulse/static/css/style.css`
  - `itsb-ecopulse/static/js/app.js`
- **Solusi:** 
  - Mempertahankan versi branch aktif (`feat/voucher-qr-rewards`) yang telah memuat implementasi lengkap QR e-voucher, sistem penukaran hadiah, telemetri IoT, dan modal dialog terintegrasi.
  - Memverifikasi tidak ada marker konflik tersisa (`<<<<<<<`, `=======`, `>>>>>>>`).
  - Menghapus staging conflict pada file binary `backend/__pycache__/*.pyc`.

---

### 2. Permintaan: *"coba cek semua codingan apakah masih ada yang error. keseluruhan ya, dan kalau misal ada yang masih error dan masih ada yang janggal silahkan fix lagi"*
- **Status:** Selesai & Terverifikasi (6 Bug Diperbaiki)

#### Temuan Audit & Perbaikan yang Diterapkan:
1. **CSS Missing Custom Properties (`style.css`):**
   - **Bug:** Token `--shadow-dropdown` dan `--shadow-sm` digunakan di elemen `.hero-float-card`, `.toast`, dan `.telemetry-live-strip`, namun belum didefinisikan di `:root`. Akibatnya browser me-render `box-shadow: none`.
   - **Fix:** Menambahkan token elevasi `--shadow-dropdown` dan `--shadow-sm` secara presisi ke `:root` design token.

2. **Resiliensi Data Offline - FR-03 Green Initiatives (`app.js`):**
   - **Bug:** Fungsi `loadInitiatives()` tidak memiliki fallback data offline. Jika backend FastAPI belum dijalankan atau offline, section inisiatif menjadi kosong melompong (blank state).
   - **Fix:** Menambahkan `DEFAULT_INITIATIVES` dengan data kontekstual realistis ITSB Deltamas dan fallback otomatis saat fetch gagal.

3. **Resiliensi Data Offline - FR-05 Campus Eco-Reporting (`app.js`):**
   - **Bug:** Fungsi `loadReports()` juga tidak memiliki fallback data lokal, sehingga kartu tiket laporan fasilitas kampus kosong saat offline.
   - **Fix:** Menambahkan `DEFAULT_REPORTS` dan logika pemfilteran lokal per kategori laporan.

4. **Kalkulasi Emisi Karbon Seed Data (`backend/seed_data.py`):**
   - **Bug:** Nilai `trees_needed` tercatat `0.08` untuk jejak karbon `1.42 kg CO₂e`. Berdasarkan rumus konversi arboretum kampus (`total_emission / 0.06`), nilai yang benar adalah sekitar `23.7` pohon/tahun.
   - **Fix:** Memperbaiki nilai bibit pohon menjadi `23.7`.

5. **Urutan Mounting Static Files FastAPI (`backend/main.py`):**
   - **Bug:** `app.mount("/static", ...)` dipasang sebelum sub-folder `css`, `js`, `assets`. Hal ini berisiko menimbulkan route collision pada beberapa versi FastAPI/Starlette ketika SPA me-request file secara relatif dari `/`.
   - **Fix:** Memperbaiki urutan mounting: folder modular (`/css`, `/js`, `/assets`) di-mount terlebih dahulu, dilanjutkan dengan `/static`.

6. **Verifikasi Sintaks:**
   - Semua modul Python (`main.py`, `database.py`, `seed_data.py`) telah di-compile via `py_compile` dengan hasil **0 error (syntax OK)**.
   - Audit seluruh variabel CSS (33 token) menghasilkan status **"All CSS vars properly defined"**.
   - Scan regex memastikan **0 conflict markers** pada seluruh file proyek.

---

### 3. Permintaan Terkini: *"Tolong fetch origin, pindah ke branch feat/upload-foto-laporan..."*
*(Permintaan ini sempat tertunda akibat interupsi limit API dari provider luar)*
- **Instruksi Lengkap:**
  1. `git fetch origin`
  2. Beralih ke branch remote `origin/feat/upload-foto-laporan` (nama lokal: `feat/upload-foto-laporan`).
  3. Merge branch `main` ke dalamnya.
  4. Hapus folder `__pycache__` beserta file `.pyc` yang konflik dan pastikan `__pycache__/` ada di `.gitignore`.
  5. Analisis dan gabungkan kode backend & frontend (`main.py`, `database.py`, `seed_data.py`, `index.html`, `app.js`, dll.) agar **fitur upload foto laporan tetap berfungsi** tanpa menghilangkan kode mutakhir di `main`.

---

## 🗂️ Peta File & Arsitektur Sistem Saat Ini

| File | Peran Utama | Status Terkini |
|------|-------------|----------------|
| `itsb-ecopulse/backend/main.py` | FastAPI master REST API & SPA static server | ✅ Bersih, route mount optimal |
| `itsb-ecopulse/backend/database.py` | Skema SQLite 8 tabel sistem EcoPulse | ✅ Stabil |
| `itsb-ecopulse/backend/seed_data.py` | Seeder data realistis kampus ITSB Deltamas | ✅ Nilai jejak pohon terkalibrasi |
| `itsb-ecopulse/static/index.html` | SPA master layout (FR-01 s/d FR-05) + Modal QR Voucher | ✅ Bebas konflik |
| `itsb-ecopulse/static/css/style.css` | Design system 60-30-10, Plus Jakarta Sans, Light Mode | ✅ Semua token terdefinisi |
| `itsb-ecopulse/static/js/app.js` | Logika telemetri IoT, bank sampah, kalkulator karbon, voucher | ✅ Dual-mode (online + offline fallback) |
| `.gitignore` | Ignored files & folders | ✅ Mencakup `__pycache__/` dan `*.py[cod]` |

---

## 🚀 Panduan Melanjutkan Pekerjaan (Next Step Checklist)
Saat siap mengeksekusi integrasi branch `feat/upload-foto-laporan`:
1. [ ] Simpan / commit perubahan lokal di `feat/voucher-qr-rewards` atau switch ke branch target:
   ```bash
   git add -A
   git commit -m "fix: resolve shadow tokens, offline fallbacks, and static mounting"
   ```
2. [ ] Checkout branch upload foto:
   ```bash
   git checkout -B feat/upload-foto-laporan origin/feat/upload-foto-laporan
   ```
3. [ ] Lakukan merge dari `main`:
   ```bash
   git merge main
   ```
4. [ ] Gabungkan skema upload foto (endpoint `/api/reports/upload` atau `photo_url` di tabel `eco_reports`) dengan arsitektur terbaru.
5. [ ] Pastikan upload foto tersimpan di `static/uploads/` atau format base64/URL statis yang aman.
