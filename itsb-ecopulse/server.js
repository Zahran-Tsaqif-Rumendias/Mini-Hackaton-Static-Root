/**
 * ITSB EcoPulse - Node.js Application Server
 * Serves the static SPA and provides full REST API endpoints
 * Matches 100% with the FastAPI schema & database specs
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const STATIC_DIR = path.join(__dirname, 'static');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// In-memory data store for live state
const db = {
  telemetry: {
    solarBase: 76.2,
    solarTotal: 638.2,
    loadBase: 85.0,
    aqiBase: 41,
    pm25Base: 9.8,
    waterBase: 4320.0,
    co2Base: 430.7,
    treesBase: 7178
  },
  wasteStats: {
    total_waste_kg: 84.7,
    total_points_distributed: 14850,
    compost_organic_kg: 24.5,
    recycling_efficiency_pct: 88.5
  },
  individualLeaderboard: [
    { student_id: "12220005", student_name: "Rifky Alamsyah", department: "Teknik Informatika", total_points: 360, total_weight: 1.8 },
    { student_id: "12220042", student_name: "Fajar Hidayat", department: "Teknologi Pulp & Kertas", total_points: 300, total_weight: 6.0 },
    { student_id: "12220011", student_name: "Bayu Wicaksono", department: "Teknik Pertambangan", total_points: 290, total_weight: 2.9 },
    { student_id: "12220028", student_name: "Siti Nurhaliza", department: "Teknik Sipil", total_points: 260, total_weight: 5.2 },
    { student_id: "12220019", student_name: "Nabila Rahma", department: "Teknologi Pengelolaan Sawit", total_points: 205, total_weight: 4.1 }
  ],
  prodiLeaderboard: [
    { prodi_name: "Teknik Informatika", total_points: 2450, total_weight: 48.5, contributor_count: 24 },
    { prodi_name: "Teknik Metalurgi", total_points: 1980, total_weight: 39.2, contributor_count: 19 },
    { prodi_name: "Bisnis Digital", total_points: 1620, total_weight: 32.0, contributor_count: 16 },
    { prodi_name: "Teknik Pertambangan", total_points: 1400, total_weight: 28.4, contributor_count: 14 },
    { prodi_name: "Teknik Sipil", total_points: 1150, total_weight: 23.0, contributor_count: 11 }
  ],
  rewards: [
    { id: 1, title: "Tote Bag Serat Katun Daur Ulang", points_required: 200, category: "Merchandise", description: "Tas jinjing kanvas organik bersertifikasi ramah lingkungan hasil olahan limbah serat tekstil.", stock: 65, badge: "ToteBag" },
    { id: 2, title: "Voucher Kantin Sehat Kampus Rp 25.000", points_required: 250, category: "Konsumsi", description: "Voucher belanja menu gizi seimbang di pujasera & kantin ramah lingkungan kampus ITSB Deltamas.", stock: 80, badge: "Voucher" },
    { id: 3, title: "Bibit Pohon Tabebuya Emas Arboretum ITSB", points_required: 300, category: "Penghijauan", description: "Bibit siap tanam bersertifikasi untuk program adopsi ruang terbuka hijau di sekitar kampus Deltamas.", stock: 50, badge: "BibitPohon" },
    { id: 4, title: "Tumbler Stainless Steel ITSB Eco-Campus", points_required: 500, category: "Merchandise", description: "Tumbler insulasi termal dengan logo grafir resmi ITSB Green Campus, mengurangi botol plastik sekali pakai.", stock: 35, badge: "Tumbler" },
    { id: 5, title: "Eco Solar Power Bank 10.000mAh", points_required: 1200, category: "Elektronik", description: "Power bank bertenaga sel surya portabel ramah lingkungan untuk pengisian daya gawai mobile di kampus.", stock: 15, badge: "PowerBank" }
  ],
  initiatives: [
    {
      id: 1, title: "Car-Free Campus & Green Commute Day", category: "Transportasi Hijau",
      description: "Hari bebas kendaraan bermotor berbahan bakar fosil di lingkar dalam kampus ITSB Deltamas. Civitas didorong bersepeda, berjalan kaki, atau menggunakan shuttle listrik.",
      target_value: 150, current_value: 128, metric_unit: "Civitas Peserta", percentage: 85,
      date_scheduled: "Jumat, 24 Oktober 2026", location: "Kawasan Gerbang Utama & Plaza Rektorat ITSB",
      organizer: "BEM ITSB & Divisi Keberlanjutan Kampus", status: "Aktif"
    },
    {
      id: 2, title: "Penanaman 500 Pohon Peneduh & Konservasi Danau Retensi", category: "Reboisasi Kampus",
      description: "Aksi penanaman pohon trembesi, tabebuya, dan vetiver di tepian danau retensi air hujan kampus ITSB Kota Deltamas untuk menjaga keanekaragaman hayati dan resapan air.",
      target_value: 500, current_value: 380, metric_unit: "Bibit Ditanam", percentage: 76,
      date_scheduled: "Sabtu, 1 November 2026", location: "Arboretum & Eco-Retention Lake Deltamas",
      organizer: "Himpunan Mahasiswa Teknologi Pengelolaan Sawit (HMPTS)", status: "Aktif"
    },
    {
      id: 3, title: "Program Kantin Nol Sampah (Zero Food-Waste) & Kompos Terpadu", category: "Pengelolaan Sampah",
      description: "Gerakan pengolahan sisa makanan kantin menjadi kompos organik cair dan padat menggunakan biopori serta komposter komunal untuk taman kampus.",
      target_value: 1000, current_value: 740, metric_unit: "Kg Sampah Terolah", percentage: 74,
      date_scheduled: "Berjalan Sepanjang Semester", location: "Pojok Kompos & Kebun Percobaan Pertanian ITSB",
      organizer: "Pusat Riset Industri Hijau & Pengelola Kantin", status: "Aktif"
    },
    {
      id: 4, title: "Audit Energi Mandiri Laboratorium & Efisiensi AC", category: "Konservasi Energi",
      description: "Inspeksi dan kampanye setel suhu AC ideal 24-25°C serta pemadaman instrumen lab standby untuk menekan beban listrik kampus.",
      target_value: 100, current_value: 85, metric_unit: "% Target Efisiensi", percentage: 85,
      date_scheduled: "Senin - Jumat, Jam Operasional", location: "Gedung Lab Terpadu Sains & Teknologi",
      organizer: "Tim Duta Energi Bersih Mahasiswa ITSB", status: "Aktif"
    }
  ],
  reports: [
    {
      ticket_number: "ITSB-ECO-1001", title: "Kebocoran Pipa Saluran Air Taman Belakang Lab Kimia",
      location: "Gedung Laboratorium Terpadu, Sisi Timur", category: "Kebocoran Air",
      description: "Pipa suplai air penyiram tanaman hias tampak mengalami keretakan pada sambungan elbow sehingga air terus menetes deras ke trotoar.",
      reporter_name: "Ahmad Fauzi (Teknik Sipil)", priority: "Tinggi", status: "Sedang Dikerjakan",
      resolution_notes: "Petugas sarana dan prasarana kampus telah menutup katup utama dan sedang mengganti segel fitting pipa PVC."
    },
    {
      ticket_number: "ITSB-ECO-1002", title: "Unit AC Menyala Sepanjang Malam di Ruang Kelas R.304",
      location: "Gedung Kuliah Bersama, Lantai 3", category: "Pemborosan Energi",
      description: "Pendingin ruangan (AC) sentral tetap menyala pada suhu 18°C di luar jam operasional perkuliahan saat ruangan dalam kondisi terkunci.",
      reporter_name: "Nurul Hidayati (Bisnis Digital)", priority: "Sedang", status: "Selesai",
      resolution_notes: "Security malam telah mematikan unit AC dan sistem otomasi jadwal daya timer ruangan telah di-reset ulang."
    },
    {
      ticket_number: "ITSB-ECO-1003", title: "Tempat Sampah Organik Penuh Dekat Kantin Utama",
      location: "Pujasera Kantin Sehat Kampus ITSB", category: "Tumpukan Sampah",
      description: "Volume sisa makanan saat jam istirahat makan siang melebihi kapasitas tempat sampah pilah dan mulai menarik lalat.",
      reporter_name: "Kevin Pratama (Teknik Informatika)", priority: "Tinggi", status: "Diverifikasi",
      resolution_notes: "Laporan telah diverifikasi koordinator kebersihan lingkungan. Tim pengangkutan sedang menuju lokasi."
    },
    {
      ticket_number: "ITSB-ECO-1004", title: "Sensor Otomatis Lampu Koridor Laboratorium Komputer Tidak Merespons",
      location: "Lab Komputer Sains Terpadu, Lantai Dasar", category: "Kerusakan Fasilitas Hijau",
      description: "Sensor peredup cahaya otomatis di koridor utama lab menyala 100% di siang hari bolong meski cahaya matahari melalui void gedung sangat cukup.",
      reporter_name: "Dimas Satria (Laboran)", priority: "Rendah", status: "Diajukan",
      resolution_notes: null
    }
  ]
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // ----------------- API ROUTING -----------------
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/health') {
      return sendJson(res, 200, {
        status: "healthy",
        app: "ITSB EcoPulse",
        campus: "Institut Teknologi Sains Bandung (ITSB)",
        location: "Kota Deltamas, Cikarang Pusat, Kab. Bekasi",
        timestamp: new Date().toISOString()
      });
    }

    if (pathname === '/api/telemetry/latest') {
      // Small jitter for real-time live heartbeat
      db.telemetry.solarBase = Math.max(5.0, Math.round((db.telemetry.solarBase + (Math.random() * 2 - 1)) * 10) / 10);
      db.telemetry.loadBase = Math.max(40.0, Math.round((db.telemetry.loadBase + (Math.random() * 1.6 - 0.8)) * 10) / 10);
      db.telemetry.solarTotal = Math.round((db.telemetry.solarTotal + 0.03) * 10) / 10;
      db.telemetry.co2Base = Math.round((db.telemetry.co2Base + 0.04) * 10) / 10;
      db.telemetry.treesBase = Math.round(db.telemetry.co2Base / 0.06);

      const gridIndep = Math.min(100.0, Math.round((db.telemetry.solarBase / db.telemetry.loadBase) * 1000) / 10);

      return sendJson(res, 200, {
        timestamp: new Date().toISOString(),
        solar: {
          current_kw: db.telemetry.solarBase,
          today_total_kwh: db.telemetry.solarTotal,
          pv_capacity_kwp: 120.0
        },
        air_quality: {
          aqi: db.telemetry.aqiBase,
          pm25: db.telemetry.pm25Base,
          status: db.telemetry.aqiBase <= 50 ? "Baik (Sehat - Hijau)" : "Sedang (Biru)"
        },
        carbon: {
          co2_saved_today_kg: db.telemetry.co2Base,
          equivalent_trees_planted: db.telemetry.treesBase
        },
        water: {
          rainwater_cistern_liters: db.telemetry.waterBase,
          cistern_capacity_liters: 10000.0
        },
        grid: {
          campus_power_load_kw: db.telemetry.loadBase,
          grid_independence_pct: gridIndep
        }
      });
    }

    if (pathname === '/api/telemetry/history') {
      return sendJson(res, 200, {
        points: [
          { time: "06:00", solar_kw: 8.5, load_kw: 62.0 },
          { time: "08:00", solar_kw: 34.0, load_kw: 82.0 },
          { time: "10:00", solar_kw: 78.4, load_kw: 89.5 },
          { time: "12:00", solar_kw: 98.6, load_kw: 88.0 },
          { time: "14:00", solar_kw: 82.8, load_kw: 90.0 },
          { time: "16:00", solar_kw: 41.5, load_kw: 84.0 },
          { time: "18:00", solar_kw: 6.2, load_kw: 71.0 },
          { time: "Sekarang", is_live: true, solar_kw: db.telemetry.solarBase, load_kw: db.telemetry.loadBase }
        ]
      });
    }

    if (pathname === '/api/waste/stats') {
      return sendJson(res, 200, db.wasteStats);
    }

    if (pathname === '/api/waste/leaderboard') {
      return sendJson(res, 200, { leaderboard: db.individualLeaderboard });
    }

    if (pathname === '/api/waste/leaderboard/prodi') {
      return sendJson(res, 200, { leaderboard: db.prodiLeaderboard });
    }

    if (pathname === '/api/waste/deposit' && req.method === 'POST') {
      const payload = await parseBody(req);
      const pointsMultiplier = {
        "Plastik/PET": 50,
        "Kertas/Karton": 50,
        "Organik": 20,
        "E-Waste": 200,
        "Logam/Kaleng": 100
      };
      const pts = Math.round((payload.weight_kg || 1) * (pointsMultiplier[payload.waste_type] || 50));
      
      // Update individual
      const existingStudent = db.individualLeaderboard.find(s => s.student_id === payload.student_id);
      if (existingStudent) {
        existingStudent.total_points += pts;
        existingStudent.total_weight = +(existingStudent.total_weight + (payload.weight_kg || 1)).toFixed(1);
      } else {
        db.individualLeaderboard.push({
          student_id: payload.student_id,
          student_name: payload.student_name,
          department: payload.department,
          total_points: pts,
          total_weight: +(payload.weight_kg || 1).toFixed(1)
        });
      }
      db.individualLeaderboard.sort((a, b) => b.total_points - a.total_points);

      // Update prodi
      const normDept = (payload.department || "Teknik Informatika").replace(" & Bangunan Hijau", "").trim();
      const existingProdi = db.prodiLeaderboard.find(p => p.prodi_name.toLowerCase().includes(normDept.toLowerCase()));
      if (existingProdi) {
        existingProdi.total_points += pts;
        existingProdi.total_weight = +(existingProdi.total_weight + (payload.weight_kg || 1)).toFixed(1);
        existingProdi.contributor_count += 1;
      }
      db.prodiLeaderboard.sort((a, b) => b.total_points - a.total_points);

      db.wasteStats.total_waste_kg = +(db.wasteStats.total_waste_kg + (payload.weight_kg || 1)).toFixed(1);
      db.wasteStats.total_points_distributed += pts;

      return sendJson(res, 200, {
        points_earned: pts,
        student_name: payload.student_name,
        waste_type: payload.waste_type,
        weight_kg: payload.weight_kg
      });
    }

    if (pathname === '/api/rewards') {
      return sendJson(res, 200, { rewards: db.rewards });
    }

    if (pathname === '/api/rewards/redeem' && req.method === 'POST') {
      const payload = await parseBody(req);
      const reward = db.rewards.find(r => r.id === payload.reward_id);
      if (reward && reward.stock > 0) {
        reward.stock -= 1;
      }
      const code = `ITSB-REWARD-${Math.floor(10000 + Math.random() * 90000)}`;
      return sendJson(res, 200, {
        redemption_code: code,
        message: "Penukaran berhasil dicatat."
      });
    }

    if (pathname === '/api/initiatives') {
      return sendJson(res, 200, { initiatives: db.initiatives });
    }

    if (pathname.startsWith('/api/initiatives/') && pathname.endsWith('/join') && req.method === 'POST') {
      return sendJson(res, 200, { message: "Pendaftaran relawan berhasil." });
    }

    if (pathname === '/api/reports' && req.method === 'GET') {
      const cat = parsedUrl.query.category;
      const list = (cat && cat !== 'Semua') ? db.reports.filter(r => r.category === cat) : db.reports;
      return sendJson(res, 200, { reports: list });
    }

    if (pathname === '/api/reports' && req.method === 'POST') {
      const payload = await parseBody(req);
      const ticket = `ITSB-ECO-${Math.floor(1005 + Math.random() * 8990)}`;
      db.reports.unshift({
        ticket_number: ticket,
        title: payload.title,
        location: payload.location,
        category: payload.category,
        priority: payload.priority,
        description: payload.description,
        reporter_name: payload.reporter_name,
        status: "Diajukan",
        resolution_notes: null
      });
      return sendJson(res, 200, { ticket_number: ticket, message: "Laporan berhasil dicatat." });
    }

    return sendJson(res, 404, { detail: "Endpoint tidak ditemukan." });
  }

  // ----------------- STATIC FILE SERVING -----------------
  let filePath = path.join(STATIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Normalize path security check
  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403);
    res.end('Akses Ditolak');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA
      filePath = path.join(STATIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('='.repeat(70));
  console.log('[ITSB EcoPulse] Server Aktif Berjalan');
  console.log('  Lokasi Kampus : Institut Teknologi Sains Bandung, Kota Deltamas Cikarang');
  console.log(`  Akses Aplikasi: http://127.0.0.1:${PORT}`);
  console.log(`  API Base      : http://127.0.0.1:${PORT}/api/health`);
  console.log('='.repeat(70));
});
