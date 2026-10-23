"""
ITSB EcoPulse - Realistic Seed Data
Populates authentic contextual records for Institut Teknologi Sains Bandung (Deltamas, Cikarang)
"""

from database import get_db_connection, init_db
import datetime


def seed_all():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if already seeded
    cursor.execute("SELECT COUNT(*) FROM telemetry_history")
    if cursor.fetchone()[0] > 0:
        print("Database already contains records. Skipping seed.")
        conn.close()
        return

    print("Seeding initial data for ITSB EcoPulse...")

    # 1. Seed Telemetry History (Latest + Hourly for realistic charts)
    now = datetime.datetime.now()
    telemetry_samples = [
        # (offset_hours, solar_kw, solar_total, aqi, pm25, co2_saved, water_liters, load_kw, indep_pct)
        (-6, 12.4, 210.5, 42, 10.2, 142.1, 4120.0, 78.5, 15.8),
        (-5, 28.6, 239.1, 44, 11.0, 161.4, 4120.0, 82.0, 34.8),
        (-4, 54.2, 293.3, 46, 11.5, 198.0, 4150.0, 86.4, 62.7),
        (-3, 82.5, 375.8, 48, 12.1, 253.6, 4200.0, 89.2, 92.5),
        (-2, 96.8, 472.6, 45, 11.2, 318.9, 4200.0, 91.0, 106.4),
        (-1, 89.4, 562.0, 43, 10.8, 379.3, 4250.0, 88.6, 100.9),
        (0, 76.2, 638.2, 41, 9.8, 430.7, 4320.0, 85.0, 89.6),
    ]

    for offset, sol_kw, sol_tot, aqi_val, pm_val, co2_val, water_val, load_val, ind_val in telemetry_samples:
        time_point = (now + datetime.timedelta(hours=offset)).strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            INSERT INTO telemetry_history 
            (timestamp, solar_kw, solar_total_kwh, aqi, pm25, co2_saved_kg, water_harvested_liters, campus_power_load_kw, grid_independence_pct)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (time_point, sol_kw, sol_tot, aqi_val, pm_val, co2_val, water_val, load_val, ind_val))

    # 2. Seed Waste Logs (FR-02)
    waste_records = [
        ("12220014", "Aditya Pratama", "Teknologi Pengolahan Sawit", "Plastik/PET", 3.4, 170, "Drop Point Gedung Utama Rektorat", (now - datetime.timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")),
        ("12220028", "Siti Nurhaliza", "Teknik Sipil & Bangunan Hijau", "Kertas/Karton", 5.2, 260, "Bank Sampah Lab Terpadu", (now - datetime.timedelta(hours=4)).strftime("%Y-%m-%d %H:%M:%S")),
        ("12220005", "Rifky Alamsyah", "Teknik Informatika", "E-Waste", 1.8, 360, "Drop Point IT & Computing Center", (now - datetime.timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S")),
        ("12220033", "Dewi Anggraini", "Desain Produk", "Organik", 8.5, 170, "Pojok Pengomposan Kantin Sehat ITSB", (now - datetime.timedelta(hours=8)).strftime("%Y-%m-%d %H:%M:%S")),
        ("12220042", "Fajar Hidayat", "Teknologi Pulp & Kertas", "Kertas/Karton", 6.0, 300, "Drop Point Gedung Perpustakaan", (now - datetime.timedelta(hours=10)).strftime("%Y-%m-%d %H:%M:%S")),
        ("12220019", "Nabila Rahma", "Teknologi Pengolahan Sawit", "Plastik/PET", 4.1, 205, "Drop Point Gedung Utama Rektorat", (now - datetime.timedelta(hours=12)).strftime("%Y-%m-%d %H:%M:%S")),
        ("12220011", "Bayu Wicaksono", "Teknik Pertambangan", "Logam/Kaleng", 2.9, 290, "Bank Sampah Plaza Sains", (now - datetime.timedelta(hours=15)).strftime("%Y-%m-%d %H:%M:%S")),
    ]

    for st_id, st_name, dept, w_type, weight, pts, loc, ts in waste_records:
        cursor.execute("""
            INSERT INTO waste_logs 
            (student_id, student_name, department, waste_type, weight_kg, points_earned, location, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (st_id, st_name, dept, w_type, weight, pts, loc, ts))

    # 3. Seed Eco Rewards Catalog (FR-02)
    rewards = [
        ("Tumbler Stainless Steel ITSB Eco-Campus", 500, "Merchandise", "Tumbler insulasi termal dengan logo grafir resmi ITSB Green Campus, mengurangi botol plastik sekali pakai.", 35, "Tumbler"),
        ("Voucher Kantin Sehat Kampus Rp 25.000", 250, "Konsumsi", "Voucher belanja menu gizi seimbang di pujasera & kantin ramah lingkungan kampus ITSB Deltamas.", 80, "Voucher"),
        ("Eco Solar Power Bank 10.000mAh", 1200, "Elektronik", "Power bank bertenaga sel surya portabel ramah lingkungan untuk pengisian daya gawai mobile di kampus.", 15, "PowerBank"),
        ("Bibit Pohon Tabebuya Emas Arboretum ITSB", 300, "Penghijauan", "Bibit siap tanam bersertifikasi untuk program adopsi ruang terbuka hijau di sekitar kampus Deltamas.", 50, "BibitPohon"),
        ("Tote Bag Serat Katun Daur Ulang", 200, "Merchandise", "Tas jinjing kanvas organik bersertifikasi ramah lingkungan hasil olahan limbah serat tekstil.", 65, "ToteBag"),
    ]

    for title, pts, cat, desc, stock, badge in rewards:
        cursor.execute("""
            INSERT INTO eco_rewards (title, points_required, category, description, stock, badge)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (title, pts, cat, desc, stock, badge))

    # 4. Seed Green Initiatives (FR-03)
    initiatives = [
        (
            "Car-Free Campus & Green Commute Day",
            "Transportasi Hijau",
            "Hari bebas kendaraan bermotor berbahan bakar fosil di lingkar dalam kampus ITSB Deltamas. Civitas didorong bersepeda, berjalan kaki, atau menggunakan shuttle listrik.",
            150,
            128,
            "Civitas Peserta",
            "Jumat, 24 Oktober 2026",
            "Kawasan Gerbang Utama & Plaza Rektorat ITSB",
            "BEM ITSB & Divisi Keberlanjutan Kampus",
            "Aktif"
        ),
        (
            "Penanaman 500 Pohon Peneduh & Konservasi Danau Retensi",
            "Reboisasi Kampus",
            "Aksi penanaman pohon trembesi, tabebuya, dan vetiver di tepian danau retensi air hujan kampus ITSB Kota Deltamas untuk menjaga keanekaragaman hayati dan resapan air.",
            500,
            380,
            "Bibit Ditanam",
            "Sabtu, 1 November 2026",
            "Arboretum & Eco-Retention Lake Deltamas",
            "Himpunan Mahasiswa Teknologi Pengelolaan Sawit (HMPTS)", 
            "Aktif"
        ),
        (
            "Program Kantin Nol Sampah (Zero Food-Waste) & Kompos Terpadu",
            "Pengelolaan Sampah",
            "Gerakan pengolahan sisa makanan kantin menjadi kompos organik cair dan padat menggunakan biopori serta komposter komunal untuk taman kampus.",
            1000,
            740,
            "Kg Sampah Terolah",
            "Berjalan Sepanjang Semester",
            "Pojok Kompos & Kebun Percobaan Pertanian ITSB",
            "Pusat Riset Industri Hijau & Pengelola Kantin",
            "Aktif"
        ),
        (
            "Audit Energi Mandiri Laboratorium & Efisiensi AC",
            "Konservasi Energi",
            "Inspeksi dan kampanye setel suhu AC ideal 24-25°C serta pemadaman instrumen lab standby untuk menekan beban listrik kampus.",
            100,
            85,
            "% Target Efisiensi",
            "Senin - Jumat, Jam Operasional",
            "Gedung Lab Terpadu Sains & Teknologi",
            "Tim Duta Energi Bersih Mahasiswa ITSB",
            "Aktif"
        )
    ]

    for title, cat, desc, t_val, c_val, unit, d_sched, loc, org, status in initiatives:
        cursor.execute("""
            INSERT INTO green_initiatives 
            (title, category, description, target_value, current_value, metric_unit, date_scheduled, location, organizer, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (title, cat, desc, t_val, c_val, unit, d_sched, loc, org, status))

    # 5. Seed Eco Reports (FR-05)
    reports = [
        (
            "ITSB-ECO-1001",
            "Kebocoran Kran Air di Toilet Pria Lantai 2 Gedung Rektorat",
            "Gedung Utama Rektorat, Lantai 2",
            "Kebocoran Air",
            "Kran wastafel nomor 2 terus meneteskan air bersih dengan debit cukup deras sejak pagi hari. Berpotensi membuang puluhan liter air bersih per jam.",
            "Ahmad Fauzi (Dosen Arsitektur)",
            "ahmad.fauzi@itsb.ac.id",
            "Selesai",
            "Tinggi",
            (now - datetime.timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S"),
            (now - datetime.timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
            "Pipa sambungan fleksibel dan seal karet kran telah diganti oleh teknisi Sarana Prasarana ITSB. Aliran air kini normal tanpa rembesan."
        ),
        (
            "ITSB-ECO-1002",
            "AC Menyala di Ruang Kelas 304 Saat Tidak Ada Perkuliahan",
            "Gedung Perkuliahan Terpadu, Ruang 304",
            "Pemborosan Energi",
            "Dua unit AC split dan lampu penerangan ruang kelas 304 tetap menyala penuh meskipun sesi kuliah selesai pukul 12.00 WIB.",
            "Cindy Claudia (Mahasiswa Sains Data)",
            "cindy.c@students.itsb.ac.id",
            "Sedang Dikerjakan",
            "Sedang",
            (now - datetime.timedelta(hours=5)).strftime("%Y-%m-%d %H:%M:%S"),
            (now - datetime.timedelta(hours=3)).strftime("%Y-%m-%d %H:%M:%S"),
            "Petugas sekuriti kampus telah mematikan unit pendingin dan tim IT sedang mengintegrasikan sensor PIR smart-switch terjadwal."
        ),
        (
            "ITSB-ECO-1003",
            "Tempat Sampah Anorganik Penuh di Dekat Selasar Kantin Sehat",
            "Selasar Luar Kantin Sehat Kampus",
            "Tumpukan Sampah",
            "Tempat sampah khusus botol plastik dan kemasan tetra-pak sudah melebihi kapasitas sehingga sebagian berserakan di sekitar bangku taman.",
            "Rian Mahendra (Mahasiswa Desain Produk)",
            "rian.m@students.itsb.ac.id",
            "Diverifikasi",
            "Sedang",
            (now - datetime.timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S"),
            (now - datetime.timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S"),
            "Laporan telah diverifikasi koordinator kebersihan lingkungan. Tim pengangkutan sedang menuju lokasi untuk memindahkan ke Bank Sampah Utama."
        ),
        (
            "ITSB-ECO-1004",
            "Sensor Otomatis Lampu Koridor Laboratorium Komputer Tidak Merespons",
            "Lab Komputer Sains Terpadu, Lantai Dasar",
            "Kerusakan Fasilitas Hijau",
            "Sensor peredup cahaya otomatis di koridor utama lab menyala 100% di siang hari bolong meski cahaya matahari melalui void gedung sangat cukup.",
            "Dimas Satria (Laboran)",
            "dimas.lab@itsb.ac.id",
            "Diajukan",
            "Rendah",
            (now - datetime.timedelta(minutes=45)).strftime("%Y-%m-%d %H:%M:%S"),
            (now - datetime.timedelta(minutes=45)).strftime("%Y-%m-%d %H:%M:%S"),
            "Menunggu penjadwalan kalibrasi sensor lux oleh tim teknisi kelistrikan kampus."
        )
    ]

    for t_num, title, loc, cat, desc, r_name, r_contact, st, pr, c_at, u_at, res_notes in reports:
        cursor.execute("""
            INSERT INTO eco_reports 
            (ticket_number, title, location, category, description, reporter_name, reporter_contact, status, priority, created_at, updated_at, resolution_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (t_num, title, loc, cat, desc, r_name, r_contact, st, pr, c_at, u_at, res_notes))

    # 6. Seed Carbon Calculation Log (FR-04)
    cursor.execute("""
        INSERT INTO carbon_calculations 
        (user_role, commute_distance_km, transport_mode, electricity_hours, total_emission_kg, trees_needed, certificate_code, created_at)
        VALUES ('Mahasiswa', 18.5, 'Shuttle Bus Kampus Deltamas', 4.0, 1.42, 0.08, 'ITSB-PLEDGE-9841', ?)
    """, ((now - datetime.timedelta(hours=3)).strftime("%Y-%m-%d %H:%M:%S"),))

    conn.commit()
    conn.close()
    print("Seed data successfully populated!")


if __name__ == "__main__":
    seed_all()
