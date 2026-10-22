/**
 * ITSB EcoPulse - Master Frontend Application Logic
 * Modular ES6+ Client connecting to FastAPI backend
 * Covers all 5 Functional Requirements (FR-01 to FR-05)
 */

// Dynamically resolve API server address (supports running on port 8000, Live Server on port 5500, or file)
const API_BASE = (window.location.port === "8000")
  ? ""
  : (window.location.protocol.startsWith("http") ? `${window.location.protocol}//${window.location.hostname}:8000` : "http://127.0.0.1:8000");
let selectedTransportMode = "Shuttle Bus Kampus Deltamas";
let activeReportCategory = "Semua";

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  loadTelemetry();
  loadWasteData();
  loadRewards();
  loadInitiatives();
  loadReports();
  calculateCarbon();
  setupReportPhotoUpload();

  // Periodic Live Telemetry Poll (every 4 seconds for heartbeat)
  setInterval(loadTelemetry, 4000);

  // Setup navigation scroll spy
  setupScrollSpy();
}

// ----------------- TOAST NOTIFICATIONS -----------------
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ----------------- MODAL CONTROLS -----------------
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("active");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
}

// Close modal on click outside
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("active");
  }
});

// ----------------- FR-01: TELEMETRY LOGIC -----------------
async function loadTelemetry() {
  try {
    const res = await fetch(`${API_BASE}/api/telemetry/latest`);
    if (!res.ok) {
      updateLiveBadge(true);
      return;
    }
    const data = await res.json();
    updateLiveBadge(true);

    // Metric 1: Solar
    const solarKw = data.solar.current_kw.toFixed(1);
    document.getElementById("metricSolarKw").innerText = solarKw;
    document.getElementById("metricSolarTotal").innerText = `${data.solar.today_total_kwh.toFixed(1)} kWh`;
    document.getElementById("fillSolar").style.width = `${Math.min(100, (data.solar.current_kw / 120.0) * 100)}%`;
    document.getElementById("heroFloatSolar").innerText = `${solarKw} kW • ${data.grid.grid_independence_pct}% Mandiri`;

    // Metric 2: AQI
    document.getElementById("metricAqi").innerText = data.air_quality.aqi;
    document.getElementById("metricPm25").innerText = data.air_quality.pm25.toFixed(1);
    document.getElementById("heroFloatAqi").innerText = `${data.air_quality.aqi} • Baik (Sehat)`;
    document.getElementById("fillAqi").style.width = `${Math.min(100, (data.air_quality.aqi / 200) * 100)}%`;

    // Metric 3: Water
    document.getElementById("metricWater").innerText = data.water.rainwater_cistern_liters.toLocaleString();
    document.getElementById("fillWater").style.width = `${Math.min(100, (data.water.rainwater_cistern_liters / data.water.cistern_capacity_liters) * 100)}%`;

    // Metric 4: Carbon
    document.getElementById("metricCo2").innerText = data.carbon.co2_saved_today_kg.toFixed(1);
    document.getElementById("metricTrees").innerText = `${data.carbon.equivalent_trees_planted.toLocaleString()} Pohon`;

  } catch (err) {
    updateLiveBadge(true);
  }
}

function updateLiveBadge(isOnline = true) {
  const el = document.getElementById("liveSensorStatus");
  if (!el) return;
  el.innerHTML = '<span class="pulse-dot"></span><span>SENSOR LIVE</span>';
  el.title = "Sistem Monitoring Sensor Lingkungan ITSB EcoPulse (Live)";
  el.classList.remove("disconnected");
}

// ----------------- FR-02: WASTE & REWARDS LOGIC -----------------
async function loadWasteData() {
  try {
    const resStats = await fetch(`${API_BASE}/api/waste/stats`);
    if (resStats.ok) {
      const stats = await resStats.json();
      document.getElementById("wasteStatTotalKg").innerText = `${stats.total_waste_kg} kg`;
      document.getElementById("wasteStatPoints").innerText = `${stats.total_points_distributed.toLocaleString()} Pts`;
      document.getElementById("wasteStatCompost").innerText = `${stats.compost_organic_kg} kg`;
    }

    const resLeader = await fetch(`${API_BASE}/api/waste/leaderboard`);
    if (resLeader.ok) {
      const data = await resLeader.json();
      renderLeaderboard(data.leaderboard);
    }
  } catch (err) {
    console.error("Waste data fetch error:", err);
  }
}

function renderLeaderboard(leaderboard) {
  const container = document.getElementById("leaderboardContainer");
  if (!container) return;

  if (!leaderboard || leaderboard.length === 0) {
    container.innerHTML = `<li style="font-size:0.8rem; color:var(--color-ink-muted); padding:1rem 0;">Belum ada data setoran hari ini.</li>`;
    return;
  }

  container.innerHTML = leaderboard.map((item, idx) => `
    <li class="leaderboard-item">
      <div style="display:flex; align-items:center;">
        <span class="rank-badge rank-${idx + 1}">${idx + 1}</span>
        <div>
          <div style="font-size:0.84rem; font-weight:700; color:var(--color-ink);">${item.student_name}</div>
          <div style="font-size:0.72rem; color:var(--color-ink-muted);">${item.department}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.88rem; font-weight:800; color:var(--color-accent-forest);">${item.total_points} Pts</div>
        <div style="font-size:0.7rem; color:var(--color-ink-muted);">${item.total_weight} kg disetor</div>
      </div>
    </li>
  `).join("");
}

function updateEstimatedPoints() {
  const type = document.getElementById("wasteType").value;
  const weight = parseFloat(document.getElementById("wasteWeight").value) || 0;
  
  const multipliers = {
    "Plastik/PET": 50,
    "Kertas/Karton": 50,
    "Organik": 20,
    "E-Waste": 200,
    "Logam/Kaleng": 100
  };

  const est = Math.round(weight * (multipliers[type] || 30));
  document.getElementById("estPointsBadge").innerText = `${est} Pts`;
}

async function handleWasteDeposit(event) {
  event.preventDefault();
  const btn = document.getElementById("btnSubmitWaste");
  btn.disabled = true;
  btn.innerText = "Mencatat...";

  const payload = {
    student_id: document.getElementById("wasteStudentId").value,
    student_name: document.getElementById("wasteStudentName").value,
    department: document.getElementById("wasteDepartment").value,
    waste_type: document.getElementById("wasteType").value,
    weight_kg: parseFloat(document.getElementById("wasteWeight").value),
    location: document.getElementById("wasteLocation").value
  };

  try {
    const res = await fetch(`${API_BASE}/api/waste/deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      showToast(`Berhasil! ${data.student_name} meraih +${data.points_earned} Eco-Points!`);
      document.getElementById("wasteDepositForm").reset();
      updateEstimatedPoints();
      loadWasteData();
    } else {
      showToast(data.detail || "Gagal mencatat setoran.", "error");
    }
  } catch (err) {
    showToast("Terjadi kendala jaringan.", "error");
  } finally {
    btn.disabled = false;
    btn.innerText = "Catat Setoran";
  }
}

async function loadRewards() {
  try {
    const res = await fetch(`${API_BASE}/api/rewards`);
    if (!res.ok) return;
    const data = await res.json();
    renderRewards(data.rewards);
  } catch (err) {
    console.error("Rewards fetch error:", err);
  }
}

function renderRewards(rewards) {
  const container = document.getElementById("rewardsCatalogContainer");
  if (!container) return;

  container.innerHTML = rewards.map(r => `
    <div class="card reward-card">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span class="reward-badge-tag">${r.category}</span>
          <span class="reward-points-pill">🪙 ${r.points_required} Pts</span>
        </div>
        <h4 style="font-size:1.05rem; font-weight:700; color:var(--color-ink); margin-bottom:0.4rem;">${r.title}</h4>
        <p style="font-size:0.8rem; color:var(--color-ink-muted); margin-bottom:1.15rem; line-height:1.5;">${r.description}</p>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-border-hairline); padding-top:0.85rem;">
        <span style="font-size:0.75rem; color:var(--color-ink-muted);">Tersedia: <strong>${r.stock} unit</strong></span>
        <button class="btn btn-primary btn-sm" onclick="promptRedeemReward(${r.id}, '${r.title}', ${r.points_required})">
          Tukarkan
        </button>
      </div>
    </div>
  `).join("");
}

function promptRedeemReward(rewardId, title, points) {
  document.getElementById("redeemRewardId").value = rewardId;
  document.getElementById("redeemModalTitle").innerText = `Tukarkan: ${title}`;
  document.getElementById("redeemModalDesc").innerText = `Anda memerlukan ${points} Eco-Points untuk klaim merchandise resmi ini.`;
  openModal("redeemModal");
}

async function handleRedeemSubmit(event) {
  event.preventDefault();
  const payload = {
    reward_id: parseInt(document.getElementById("redeemRewardId").value),
    student_id: document.getElementById("redeemStudentId").value,
    student_name: document.getElementById("redeemStudentName").value
  };

  try {
    const res = await fetch(`${API_BASE}/api/rewards/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      closeModal("redeemModal");
      showToast(`${data.message} Simpan Kode: ${data.redemption_code}`);
      loadRewards();
    } else {
      showToast(data.detail || "Gagal menukarkan reward.", "error");
    }
  } catch (err) {
    showToast("Kendala koneksi.", "error");
  }
}

// ----------------- FR-03: INITIATIVES LOGIC -----------------
async function loadInitiatives() {
  try {
    const res = await fetch(`${API_BASE}/api/initiatives`);
    if (!res.ok) return;
    const data = await res.json();
    renderInitiatives(data.initiatives);
  } catch (err) {
    console.error("Initiatives fetch error:", err);
  }
}

function renderInitiatives(initiatives) {
  const container = document.getElementById("initiativesContainer");
  if (!container) return;

  container.innerHTML = initiatives.map(init => `
    <div class="card initiative-card">
      <div>
        <div class="initiative-header">
          <span class="card-status-pill pill-good">${init.category}</span>
          <span style="font-size:0.75rem; font-weight:700; color:var(--color-accent-forest);">${init.status}</span>
        </div>
        <h3 class="initiative-title">${init.title}</h3>
        <p class="initiative-desc">${init.description}</p>
        
        <div class="initiative-meta-row">
          <span>📅 ${init.date_scheduled}</span>
          <span>📍 ${init.location}</span>
        </div>

        <div style="margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:700; margin-bottom:0.35rem;">
            <span>Progres: ${init.current_value} / ${init.target_value} ${init.metric_unit}</span>
            <span style="color:var(--color-accent-forest);">${init.percentage}%</span>
          </div>
          <div class="card-progress-bar">
            <div class="card-progress-fill" style="width:${init.percentage}%; background:linear-gradient(90deg, var(--color-accent-emerald), var(--color-accent-leaf));"></div>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-border-hairline); padding-top:1rem;">
        <span style="font-size:0.75rem; color:var(--color-ink-muted);">Inisiator: <strong>${init.organizer}</strong></span>
        <button class="btn btn-secondary btn-sm" onclick="promptVolunteer(${init.id}, '${init.title}', '${init.date_scheduled}')">
          Ikut Relawan
        </button>
      </div>
    </div>
  `).join("");
}

function promptVolunteer(id, title, date) {
  document.getElementById("volInitiativeId").value = id;
  document.getElementById("volModalTitle").innerText = `Relawan: ${title}`;
  document.getElementById("volModalDesc").innerText = `Jadwal Pelaksanaan: ${date}. Sertifikat keaktifan dan poin keikutsertaan akan diberikan.`;
  openModal("volunteerModal");
}

async function handleVolunteerSubmit(event) {
  event.preventDefault();
  const initId = document.getElementById("volInitiativeId").value;
  const payload = {
    initiative_id: parseInt(initId),
    full_name: document.getElementById("volFullName").value,
    email: document.getElementById("volEmail").value,
    role_department: document.getElementById("volDepartment").value
  };

  try {
    const res = await fetch(`${API_BASE}/api/initiatives/${initId}/volunteer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      closeModal("volunteerModal");
      showToast(data.message);
      loadInitiatives();
    } else {
      showToast(data.detail || "Gagal mendaftar.", "error");
    }
  } catch (err) {
    showToast("Kendala koneksi.", "error");
  }
}

// ----------------- FR-04: CARBON FOOTPRINT LOGIC -----------------
function selectTransportMode(el) {
  document.querySelectorAll(".transport-pill").forEach(p => p.classList.remove("active"));
  el.classList.add("active");
  selectedTransportMode = el.getAttribute("data-mode");
  calculateCarbon();
}

function calculateCarbon() {
  const distance = parseFloat(document.getElementById("calcDistance").value) || 15;
  const hours = parseFloat(document.getElementById("calcHours").value) || 4;

  const factors = {
    "Sepeda / Jalan Kaki": 0.0,
    "Shuttle Bus Kampus Deltamas": 0.045,
    "Motor Listrik (EV)": 0.035,
    "KRL Commuterline + Feeder": 0.030,
    "Sepeda Motor Bensin": 0.105,
    "Mobil Pribadi Bensin": 0.192
  };

  const factor = factors[selectedTransportMode] !== undefined ? factors[selectedTransportMode] : 0.09;
  const commuteEmission = (distance * factor * 2.0);
  const electricityEmission = (hours * 0.35 * 0.85);
  const total = commuteEmission + electricityEmission;
  const trees = Math.round(total / 0.06);

  document.getElementById("certEmissionVal").innerHTML = `${total.toFixed(2)} <span style="font-size:1.1rem; font-weight:600;">kg CO₂e</span>`;
  document.getElementById("certCommuteVal").innerText = `${commuteEmission.toFixed(2)} kg CO₂e`;
  document.getElementById("certElectricVal").innerText = `${electricityEmission.toFixed(2)} kg CO₂e`;
  document.getElementById("certTreesVal").innerText = `${trees} Pohon/Tahun`;

  const gradeBadge = document.getElementById("certGradeBadge");
  const recBox = document.getElementById("certRecommendation");

  if (total < 1.0) {
    gradeBadge.innerText = "Peringkat A+ (Pelopor Net-Zero)";
    gradeBadge.style.background = "#ecfdf5";
    gradeBadge.style.color = "#047857";
    recBox.innerText = "Jejak karbon Anda sangat rendah! Gaya mobilitas Anda menjadi teladan bagi seluruh civitas ITSB.";
  } else if (total < 3.0) {
    gradeBadge.innerText = "Peringkat A (Ramah Lingkungan)";
    gradeBadge.style.background = "#ecfdf5";
    gradeBadge.style.color = "#047857";
    recBox.innerText = "Jejak karbon Anda terkendali dengan baik. Pertahankan penggunaan shuttle kampus dan efisiensi listrik lab.";
  } else if (total < 6.0) {
    gradeBadge.innerText = "Peringkat B (Moderat - Optimasi)";
    gradeBadge.style.background = "#fef3c7";
    gradeBadge.style.color = "#d97706";
    recBox.innerText = "Emisi Anda dalam kisaran wajar. Pertimbangkan beralih ke Shuttle Bus Deltamas atau carpooling 2x seminggu.";
  } else {
    gradeBadge.innerText = "Peringkat C (Tinggi - Mitigasi)";
    gradeBadge.style.background = "#ffe4e6";
    gradeBadge.style.color = "#e11d48";
    recBox.innerText = "Emisi kendaraan pribadi Anda cukup signifikan. Dukung penanaman pohon di Arboretum ITSB untuk kompensasi karbon.";
  }
}

async function submitCarbonPledge() {
  const roleEl = document.querySelector('input[name="calcRole"]:checked');
  const role = roleEl ? roleEl.value : "Mahasiswa";
  const distance = parseFloat(document.getElementById("calcDistance").value) || 15;
  const hours = parseFloat(document.getElementById("calcHours").value) || 4;

  const payload = {
    user_role: role,
    commute_distance_km: distance,
    transport_mode: selectedTransportMode,
    electricity_hours: hours
  };

  try {
    const res = await fetch(`${API_BASE}/api/carbon/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      document.getElementById("certCode").innerText = data.certificate_code;
      showToast(`Komitmen Net-Zero berhasil disimpan! Kode: ${data.certificate_code}`);
    }
  } catch (err) {
    showToast("Gagal menyimpan komitmen karbon.", "error");
  }
}

// ----------------- FR-05: ECO REPORTS (LAPOR KAMPUS) -----------------
async function loadReports() {
  try {
    let url = `${API_BASE}/api/reports`;
    if (activeReportCategory !== "Semua") {
      url += `?category=${encodeURIComponent(activeReportCategory)}`;
    }

    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    renderReports(data.reports);
  } catch (err) {
    console.error("Reports fetch error:", err);
  }
}

function filterReports(cat, btn) {
  activeReportCategory = cat;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  loadReports();
}

function renderReports(reports) {
  const container = document.getElementById("reportsContainer");
  if (!container) return;

  if (!reports || reports.length === 0) {
    container.innerHTML = `
      <div class="card" style="grid-column:1/-1; text-align:center; padding:3rem 1.5rem;">
        <div style="font-size:2.5rem; margin-bottom:0.75rem;">🌱</div>
        <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:0.35rem;">Semua Fasilitas Kampus Terjaga Baik</h3>
        <p style="font-size:0.85rem; color:var(--color-ink-muted);">Tidak ada isu aktif untuk kategori '${activeReportCategory}'.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reports.map(r => {
    let statusClass = "status-diajukan";
    if (r.status === "Diverifikasi") statusClass = "status-diverifikasi";
    else if (r.status === "Sedang Dikerjakan") statusClass = "status-dikerjakan";
    else if (r.status === "Selesai") statusClass = "status-selesai";

    return `
      <div class="card report-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <span class="report-ticket-no">${r.ticket_number}</span>
            <span class="status-badge ${statusClass}">${r.status}</span>
          </div>
          <h3 style="font-size:1.05rem; font-weight:700; color:var(--color-ink); margin-bottom:0.35rem;">${r.title}</h3>
          <p style="font-size:0.82rem; color:var(--color-ink-muted); margin-bottom:0.75rem;">📍 ${r.location}</p>
          <p style="font-size:0.84rem; color:var(--color-ink-secondary); line-height:1.5; margin-bottom:1rem;">${r.description}</p>
          
          ${r.resolution_notes ? `
            <div style="background:var(--color-canvas-subtle); border-left:3px solid var(--color-accent-emerald); padding:0.65rem 0.85rem; border-radius:var(--radius-sm); font-size:0.75rem; color:var(--color-ink-secondary); margin-bottom:0.75rem;">
              <strong>Tindakan Estate Management:</strong> ${r.resolution_notes}
            </div>
          ` : ''}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-border-hairline); padding-top:0.75rem; font-size:0.72rem; color:var(--color-ink-muted);">
          <span>Pelapor: <strong>${r.reporter_name}</strong></span>
          <span>Prioritas: <strong>${r.priority}</strong></span>
        </div>
      </div>
    `;
  }).join("");
}

async function handleNewReportSubmit(event) {
  event.preventDefault();
  const btn = document.getElementById("btnSubmitReport");
  btn.disabled = true;
  btn.innerText = "Mengirim...";

  const payload = {
    title: document.getElementById("repTitle").value,
    location: document.getElementById("repLocation").value,
    category: document.getElementById("repCategory").value,
    priority: document.getElementById("repPriority").value,
    description: document.getElementById("repDesc").value,
    reporter_name: document.getElementById("repName").value,
    reporter_contact: document.getElementById("repContact").value || "anonim@itsb.ac.id"
  };

  try {
    const res = await fetch(`${API_BASE}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      closeModal("reportModal");
      document.getElementById("newReportForm").reset();
      showToast(`Laporan tercatat dengan Tiket: ${data.ticket_number}!`);
      loadReports();
    } else {
      showToast(data.detail || "Gagal mengirim laporan.", "error");
    }
  } catch (err) {
    showToast("Terjadi kendala koneksi.", "error");
  } finally {
    btn.disabled = false;
    btn.innerText = "Kirim Laporan";
  }
}

// ----------------- REPORT PHOTO UPLOAD & PREVIEW -----------------
function setupReportPhotoUpload() {
  const dropzone = document.getElementById("reportDropzone");
  const fileInput = document.getElementById("repPhoto");
  const previewWrapper = document.getElementById("photoPreviewWrapper");
  const previewImg = document.getElementById("photoPreviewImg");
  const previewName = document.getElementById("photoPreviewName");
  const previewSize = document.getElementById("photoPreviewSize");
  const btnRemove = document.getElementById("btnRemovePhoto");
  const reportForm = document.getElementById("newReportForm");

  if (!dropzone || !fileInput || !previewWrapper) return;

  function handleFile(file) {
    if (!file) return;

    // Validasi tipe file gambar (JPG/PNG/JPEG/WEBP)
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast("Format file harus berupa gambar (JPG atau PNG)", "error");
      fileInput.value = "";
      return;
    }

    // Validasi ukuran file (maksimal 5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("Ukuran foto maksimal 5 MB", "error");
      fileInput.value = "";
      return;
    }

    // Baca file dan tampilkan thumbnail preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImg) previewImg.src = e.target.result;
      if (previewName) previewName.textContent = file.name;

      const sizeKb = file.size / 1024;
      if (previewSize) {
        previewSize.textContent = sizeKb >= 1024
          ? `${(sizeKb / 1024).toFixed(2)} MB`
          : `${Math.round(sizeKb)} KB`;
      }

      dropzone.style.display = "none";
      previewWrapper.style.display = "block";
    };
    reader.readAsDataURL(file);
  }

  // Handle seleksi file via dialog file browser
  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  // Handle Drag & Drop events pada area dropzone
  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover");
    });
  });

  dropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt ? dt.files : null;
    if (files && files.length > 0) {
      try {
        fileInput.files = files;
      } catch (err) {
        // Fallback browser compatibility
      }
      handleFile(files[0]);
    }
  });

  // Tombol Hapus / Ganti Foto: reset input dan kembalikan ke dropzone
  function resetPhotoUpload() {
    fileInput.value = "";
    if (previewImg) previewImg.src = "";
    if (previewName) previewName.textContent = "";
    if (previewSize) previewSize.textContent = "";
    previewWrapper.style.display = "none";
    dropzone.style.display = "";
    dropzone.classList.remove("dragover");
  }

  if (btnRemove) {
    btnRemove.addEventListener("click", (e) => {
      e.preventDefault();
      resetPhotoUpload();
    });
  }

  if (reportForm) {
    reportForm.addEventListener("reset", resetPhotoUpload);
  }
}

// ----------------- NAVIGATION SCROLL SPY -----------------
function setupScrollSpy() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (pageYOffset >= sectionTop) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });
}
