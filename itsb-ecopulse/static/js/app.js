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
  initTheme();
  initApp();
});

function initApp() {
  loadTelemetry();
  loadTelemetryHistory();
  loadWasteData();
  loadRewards();
  loadInitiatives();
  loadReports();
  calculateCarbon();
  setupReportPhotoUpload();

  // Periodic Live Telemetry Poll (every 3 seconds for heartbeat)
  setInterval(loadTelemetry, 3000);

  // Refresh historical 24h curve periodically
  setInterval(loadTelemetryHistory, 15000);

  // Setup navigation scroll spy
  setupScrollSpy();
}

// ----------------- THEME / DARK MODE TOGGLE -----------------
const THEME_STORAGE_KEY = "ecopulse-theme";

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark) ? "dark" : "light";

  applyTheme(initialTheme);

  const toggleBtn = document.getElementById("themeToggleBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isCurrentlyDark = document.body.classList.contains("dark-mode");
      const nextTheme = isCurrentlyDark ? "light" : "dark";
      applyTheme(nextTheme);
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      showToast(
        nextTheme === "dark" ? "Mode Gelap diaktifkan" : "Mode Terang diaktifkan",
        "info",
        2500,
        "Tema Tampilan"
      );
    });
  }

  // Follow system theme changes if user has not explicitly set a preference
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
      applyTheme(e.matches ? "dark" : "light");
    }
  });
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  if (isDark) {
    document.body.classList.add("dark-mode");
    document.documentElement.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
    document.documentElement.classList.remove("dark-mode");
  }

  const toggleBtn = document.getElementById("themeToggleBtn");
  if (toggleBtn) {
    toggleBtn.setAttribute("aria-label", isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap");
    toggleBtn.setAttribute("title", isDark ? "Beralih ke Mode Terang (Light)" : "Beralih ke Mode Gelap (Dark)");
  }
}

// ----------------- TOAST NOTIFICATIONS SYSTEM -----------------
function showToast(message, type = "success", duration = 3500, title = null) {
  if (typeof message === "object" && message !== null) {
    const opts = message;
    message = opts.message || "";
    type = opts.type || "success";
    duration = opts.duration !== undefined ? opts.duration : 3500;
    title = opts.title || null;
  }

  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.id = "toastContainer";
    document.body.appendChild(container);
  }

  const icons = {
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>`,
    error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>`,
    info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>`,
    warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>`
  };

  const defaultTitles = {
    success: "Berhasil",
    error: "Terjadi Kendala",
    info: "Informasi",
    warning: "Peringatan"
  };

  const toastType = icons[type] ? type : "success";
  const iconSvg = icons[toastType];
  const displayTitle = title !== null ? title : defaultTitles[toastType];

  const toast = document.createElement("div");
  toast.className = `toast toast-${toastType}`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");

  toast.innerHTML = `
    <div class="toast-icon">
      ${iconSvg}
    </div>
    <div class="toast-content">
      ${displayTitle ? `<div class="toast-title">${displayTitle}</div>` : ""}
      <div class="toast-message">${message}</div>
    </div>
    <button type="button" class="toast-close" aria-label="Tutup notifikasi" title="Tutup">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <div class="toast-progress">
      <div class="toast-progress-bar"></div>
    </div>
  `;

  container.appendChild(toast);

  const progressBar = toast.querySelector(".toast-progress-bar");
  const closeBtn = toast.querySelector(".toast-close");

  let isDismissed = false;
  let remainingTime = duration;
  let startTime = Date.now();
  let timerId = null;
  let progressAnimation = null;

  function dismiss() {
    if (isDismissed) return;
    isDismissed = true;
    clearTimeout(timerId);
    if (progressAnimation) progressAnimation.cancel();
    toast.classList.add("toast-hiding");
    setTimeout(() => {
      toast.remove();
    }, 320);
  }

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dismiss();
  });

  if (duration > 0) {
    if (progressBar && typeof progressBar.animate === "function") {
      progressAnimation = progressBar.animate(
        [{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }],
        { duration: duration, easing: "linear", fill: "forwards" }
      );
    }

    const startTimer = (ms) => {
      startTime = Date.now();
      timerId = setTimeout(dismiss, ms);
    };

    startTimer(remainingTime);

    // Pause timer on hover
    toast.addEventListener("mouseenter", () => {
      clearTimeout(timerId);
      const elapsed = Date.now() - startTime;
      remainingTime = Math.max(0, remainingTime - elapsed);
      if (progressAnimation && progressAnimation.playState === "running") {
        progressAnimation.pause();
      }
    });

    // Resume timer on mouse leave
    toast.addEventListener("mouseleave", () => {
      if (remainingTime > 0 && !isDismissed) {
        startTime = Date.now();
        timerId = setTimeout(dismiss, remainingTime);
        if (progressAnimation && progressAnimation.playState === "paused") {
          progressAnimation.play();
        }
      }
    });
  }

  return toast;
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
    if (e.target.id === "redeemModal") {
      closeRedeemModal();
    } else {
      e.target.classList.remove("active");
    }
  }
});

// ----------------- FR-01: TELEMETRY LOGIC & LIVE SENSOR ENGINE -----------------

let currentChartPoints = [];
let localTelemetrySimState = {
  solarBase: 76.2,
  solarTotal: 638.2,
  loadBase: 85.0,
  aqiBase: 41,
  pm25Base: 9.8,
  waterBase: 4320,
  co2Base: 430.7,
  treesBase: 7178
};

function triggerTickEffect(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove("metric-tick-pulse");
  void el.offsetWidth; // Force CSS reflow
  el.classList.add("metric-tick-pulse");
}

async function loadTelemetry() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${API_BASE}/api/telemetry/latest`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      applyTelemetryData(data, true);
      return;
    }
  } catch (err) {
    // If backend connection fails, seamlessly run realistic IoT Live Engine
    // so user's experience is NEVER offline or broken!
  }

  // Fallback to high-precision realistic client-side IoT streaming
  applySimulatedTelemetry();
}

function applyTelemetryData(data, isLiveBackend = true) {
  updateLiveBadge(true, isLiveBackend);

  // Metric 1: Solar
  const solarKw = data.solar.current_kw.toFixed(1);
  const elSolar = document.getElementById("metricSolarKw");
  if (elSolar && elSolar.innerText !== solarKw) {
    elSolar.innerText = solarKw;
    triggerTickEffect("metricSolarKw");
  }
  const elSolarTot = document.getElementById("metricSolarTotal");
  if (elSolarTot) elSolarTot.innerText = `${data.solar.today_total_kwh.toFixed(1)} kWh`;

  const fillSolar = document.getElementById("fillSolar");
  if (fillSolar) fillSolar.style.width = `${Math.min(100, (data.solar.current_kw / 120.0) * 100)}%`;

  const heroSolar = document.getElementById("heroFloatSolar");
  if (heroSolar) heroSolar.innerText = `${solarKw} kW • ${data.grid.grid_independence_pct}% Mandiri`;

  // Metric 2: AQI
  const elAqi = document.getElementById("metricAqi");
  if (elAqi && elAqi.innerText !== String(data.air_quality.aqi)) {
    elAqi.innerText = data.air_quality.aqi;
    triggerTickEffect("metricAqi");
  }

  const elPm25 = document.getElementById("metricPm25");
  if (elPm25 && elPm25.innerText !== data.air_quality.pm25.toFixed(1)) {
    elPm25.innerText = data.air_quality.pm25.toFixed(1);
    triggerTickEffect("metricPm25");
  }

  const heroAqi = document.getElementById("heroFloatAqi");
  if (heroAqi) heroAqi.innerText = `${data.air_quality.aqi} • ${data.air_quality.status.split(' ')[0]}`;

  const fillAqi = document.getElementById("fillAqi");
  if (fillAqi) fillAqi.style.width = `${Math.min(100, (data.air_quality.aqi / 200) * 100)}%`;

  const aqiLabel = document.getElementById("metricAqiLabel");
  if (aqiLabel) aqiLabel.innerText = data.air_quality.status;

  // Metric 3: Water
  const elWater = document.getElementById("metricWater");
  if (elWater) {
    const formattedWater = Math.round(data.water.rainwater_cistern_liters).toLocaleString();
    if (elWater.innerText !== formattedWater) {
      elWater.innerText = formattedWater;
      triggerTickEffect("metricWater");
    }
  }

  const fillWater = document.getElementById("fillWater");
  if (fillWater) {
    fillWater.style.width = `${Math.min(100, (data.water.rainwater_cistern_liters / data.water.cistern_capacity_liters) * 100)}%`;
  }

  // Metric 4: Carbon
  const elCo2 = document.getElementById("metricCo2");
  if (elCo2) {
    const co2Val = data.carbon.co2_saved_today_kg.toFixed(1);
    if (elCo2.innerText !== co2Val) {
      elCo2.innerText = co2Val;
      triggerTickEffect("metricCo2");
    }
  }

  const elTrees = document.getElementById("metricTrees");
  if (elTrees) elTrees.innerText = `${data.carbon.equivalent_trees_planted.toLocaleString()} Pohon`;

  // Update Status Strip & Live Clock
  const statusBadge = document.getElementById("telemetryStatusBadge");
  if (statusBadge) {
    statusBadge.innerText = isLiveBackend
      ? "STREAMING AKTIF (4/4 NODE ONLINE - KAMPUS DELTAMAS)"
      : "STREAMING AKTIF (SIMULASI IOT KAMPUS DELTAMAS)";
  }

  const syncTime = document.getElementById("telemetrySyncTime");
  if (syncTime) {
    const now = new Date();
    syncTime.innerText = `${now.toTimeString().split(" ")[0]} WIB (Live)`;
  }

  // Dynamically update the live point on the SVG chart
  updateChartLivePoint(data.solar.current_kw, data.grid.campus_power_load_kw);
}

function applySimulatedTelemetry() {
  // Realistic physical delta jitter
  localTelemetrySimState.solarBase = Math.max(5.0, Math.round((localTelemetrySimState.solarBase + (Math.random() * 2 - 1)) * 10) / 10);
  localTelemetrySimState.loadBase = Math.max(40.0, Math.round((localTelemetrySimState.loadBase + (Math.random() * 1.6 - 0.8)) * 10) / 10);
  localTelemetrySimState.solarTotal = Math.round((localTelemetrySimState.solarTotal + 0.03) * 10) / 10;
  localTelemetrySimState.co2Base = Math.round((localTelemetrySimState.co2Base + 0.04) * 10) / 10;
  localTelemetrySimState.treesBase = Math.round(localTelemetrySimState.co2Base / 0.06);
  localTelemetrySimState.aqiBase = Math.max(25, Math.min(65, localTelemetrySimState.aqiBase + (Math.random() > 0.5 ? 1 : -1)));
  localTelemetrySimState.pm25Base = Math.max(4.0, Math.round((localTelemetrySimState.pm25Base + (Math.random() * 0.4 - 0.2)) * 10) / 10);
  localTelemetrySimState.waterBase = localTelemetrySimState.waterBase + (Math.random() > 0.5 ? 2 : -1);

  const gridIndep = Math.min(100.0, Math.round((localTelemetrySimState.solarBase / localTelemetrySimState.loadBase) * 1000) / 10);

  const simData = {
    timestamp: new Date().toISOString(),
    solar: {
      current_kw: localTelemetrySimState.solarBase,
      today_total_kwh: localTelemetrySimState.solarTotal,
      pv_capacity_kwp: 120.0
    },
    air_quality: {
      aqi: localTelemetrySimState.aqiBase,
      pm25: localTelemetrySimState.pm25Base,
      status: localTelemetrySimState.aqiBase <= 50 ? "Baik (Sehat - Hijau)" : "Sedang (Biru)"
    },
    carbon: {
      co2_saved_today_kg: localTelemetrySimState.co2Base,
      equivalent_trees_planted: localTelemetrySimState.treesBase
    },
    water: {
      rainwater_cistern_liters: localTelemetrySimState.waterBase,
      cistern_capacity_liters: 10000.0
    },
    grid: {
      campus_power_load_kw: localTelemetrySimState.loadBase,
      grid_independence_pct: gridIndep
    }
  };

  applyTelemetryData(simData, false);
}

function updateLiveBadge(isOnline, isBackend = true) {
  const el = document.getElementById("liveSensorStatus");
  if (!el) return;
  if (isOnline) {
    if (isBackend) {
      el.innerHTML = '<span class="pulse-dot"></span><span>SENSOR LIVE</span>';
      el.title = "Terhubung langsung ke Backend FastAPI ITSB EcoPulse (Live Stream)";
      el.classList.remove("disconnected");
    } else {
      el.innerHTML = '<span class="pulse-dot"></span><span>SENSOR LIVE (IoT Sim)</span>';
      el.title = "Mode Simulasi IoT Sensor Aktif (Jalankan py run.py untuk integrasi database penuh)";
      el.classList.remove("disconnected");
    }
  } else {
    el.innerHTML = '<span class="pulse-dot" style="background:#f59e0b; box-shadow:0 0 0 rgba(245,158,11,0.5);"></span><span>OFFLINE (JALANKAN py run.py)</span>';
    el.title = "Backend belum dijalankan. Jalankan `py run.py` di terminal.";
  }
}

// ----------------- INTERACTIVE SVG TELEMETRY CHART -----------------

async function loadTelemetryHistory() {
  try {
    const res = await fetch(`${API_BASE}/api/telemetry/history`);
    if (res.ok) {
      const data = await res.json();
      if (data.points && Array.isArray(data.points) && data.points.length > 0) {
        currentChartPoints = data.points;
        renderTelemetryChart(currentChartPoints);
        return;
      }
    }
  } catch (err) {
    // If offline, use realistic 24h daytime base curve
  }

  if (!currentChartPoints || currentChartPoints.length === 0) {
    currentChartPoints = [
      { time: "06:00", solar_kw: 8.5, load_kw: 62.0 },
      { time: "08:00", solar_kw: 34.0, load_kw: 82.0 },
      { time: "10:00", solar_kw: 78.4, load_kw: 89.5 },
      { time: "12:00", solar_kw: 98.6, load_kw: 88.0 },
      { time: "14:00", solar_kw: 82.8, load_kw: 90.0 },
      { time: "16:00", solar_kw: 41.5, load_kw: 84.0 },
      { time: "18:00", solar_kw: 6.2, load_kw: 71.0 },
      { time: "Sekarang", is_live: true, solar_kw: 76.2, load_kw: 85.0 }
    ];
  }
  renderTelemetryChart(currentChartPoints);
}

function updateChartLivePoint(solarKw, loadKw) {
  if (!currentChartPoints || currentChartPoints.length === 0) return;
  const lastIdx = currentChartPoints.length - 1;
  currentChartPoints[lastIdx].solar_kw = solarKw;
  currentChartPoints[lastIdx].load_kw = loadKw;
  renderTelemetryChart(currentChartPoints);
}

function renderTelemetryChart(points) {
  if (!points || points.length < 2) return;

  const xStart = 50;
  const xEnd = 880;
  const yBase = 190;
  const yMaxVal = 100;
  const yHeightRange = 150; // from 190 (0kW) to 40 (100kW)

  function getY(kw) {
    const clamped = Math.max(0, Math.min(115, kw));
    return yBase - (clamped / yMaxVal) * yHeightRange;
  }

  const coords = points.map((p, i) => {
    const x = xStart + (i / (points.length - 1)) * (xEnd - xStart);
    const solarY = getY(p.solar_kw);
    const loadY = getY(p.load_kw);
    return { x, solarY, loadY, point: p };
  });

  // Direct smooth Bezier for stability
  let directSolarD = `M ${coords[0].x},${coords[0].solarY}`;
  let directLoadD = `M ${coords[0].x},${coords[0].loadY}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const midX = (p0.x + p1.x) / 2;
    directSolarD += ` C ${midX},${p0.solarY} ${midX},${p1.solarY} ${p1.x},${p1.solarY}`;
    directLoadD += ` C ${midX},${p0.loadY} ${midX},${p1.loadY} ${p1.x},${p1.loadY}`;
  }

  // Area polygons (close down to yBase = 190)
  const solarAreaPoints = `${coords[0].x},${yBase} ` +
    coords.map(c => `${c.x.toFixed(1)},${c.solarY.toFixed(1)}`).join(" ") +
    ` ${coords[coords.length - 1].x},${yBase}`;

  const loadAreaPoints = `${coords[0].x},${yBase} ` +
    coords.map(c => `${c.x.toFixed(1)},${c.loadY.toFixed(1)}`).join(" ") +
    ` ${coords[coords.length - 1].x},${yBase}`;

  const svgSolarLine = document.getElementById("svgSolarLine");
  const svgLoadLine = document.getElementById("svgLoadLine");
  const svgSolarArea = document.getElementById("svgSolarArea");
  const svgLoadArea = document.getElementById("svgLoadArea");

  if (svgSolarLine) svgSolarLine.setAttribute("d", directSolarD);
  if (svgLoadLine) svgLoadLine.setAttribute("d", directLoadD);
  if (svgSolarArea) svgSolarArea.setAttribute("points", solarAreaPoints);
  if (svgLoadArea) svgLoadArea.setAttribute("points", loadAreaPoints);

  // Render Interactive Dots Layer
  const group = document.getElementById("svgDynamicChartGroup");
  const tooltip = document.getElementById("chartTooltip");
  const wrapper = document.getElementById("svgChartWrapper");

  if (group && wrapper && tooltip) {
    let dotsHtml = "";
    coords.forEach((c, idx) => {
      const isLive = c.point.is_live;
      // Solar dot
      dotsHtml += `
        <circle class="chart-hover-dot" cx="${c.x.toFixed(1)}" cy="${c.solarY.toFixed(1)}" r="${isLive ? 5.5 : 4}" 
          fill="#d97706" stroke="#ffffff" stroke-width="2" data-idx="${idx}" data-type="solar"/>
      `;
      // Load dot
      dotsHtml += `
        <circle class="chart-hover-dot" cx="${c.x.toFixed(1)}" cy="${c.loadY.toFixed(1)}" r="${isLive ? 5.5 : 4}" 
          fill="#0284c7" stroke="#ffffff" stroke-width="2" data-idx="${idx}" data-type="load"/>
      `;

      if (isLive) {
        // Pulsing ring for live point
        dotsHtml += `
          <circle cx="${c.x.toFixed(1)}" cy="${c.solarY.toFixed(1)}" r="10" fill="none" stroke="#d97706" stroke-width="1.5" opacity="0.6">
            <animate attributeName="r" from="4" to="14" dur="1.8s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.8" to="0" dur="1.8s" repeatCount="indefinite"/>
          </circle>
        `;
      }
    });

    group.innerHTML = dotsHtml;

    // Attach hover listener to wrapper for tooltips
    group.querySelectorAll(".chart-hover-dot").forEach(circle => {
      circle.addEventListener("mouseenter", (e) => {
        const idx = parseInt(circle.getAttribute("data-idx"), 10);
        const item = coords[idx];
        if (!item) return;

        const p = item.point;
        const surplus = p.solar_kw - p.load_kw;
        const statusText = surplus >= 0
          ? `<span style="color:#10b981; font-weight:700;">⚡ Mandiri (+${surplus.toFixed(1)} kW Surplus)</span>`
          : `<span style="color:#0284c7; font-weight:700;">🔌 Impor PLN (${Math.abs(surplus).toFixed(1)} kW Defisit)</span>`;

        tooltip.innerHTML = `
          <div style="font-weight:700; color:#f59e0b; margin-bottom:3px; display:flex; align-items:center; gap:6px;">
            <span>⏱️ ${p.time}</span>
            ${p.is_live ? '<span style="background:#10b981; color:#fff; font-size:0.65rem; padding:1px 5px; border-radius:10px;">LIVE</span>' : ''}
          </div>
          <div style="margin-bottom:2px;">☀️ Produksi Surya: <strong>${p.solar_kw.toFixed(1)} kW</strong></div>
          <div style="margin-bottom:2px;">🏢 Beban Listrik: <strong>${p.load_kw.toFixed(1)} kW</strong></div>
          <div style="font-size:0.72rem; margin-top:4px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.15);">
            ${statusText}
          </div>
        `;

        const wrapperRect = wrapper.getBoundingClientRect();
        const clientX = e.clientX - wrapperRect.left;
        const clientY = e.clientY - wrapperRect.top;

        tooltip.style.left = `${clientX}px`;
        tooltip.style.top = `${clientY}px`;
        tooltip.classList.add("active");
      });

      circle.addEventListener("mouseleave", () => {
        tooltip.classList.remove("active");
      });
    });
  }
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

// ----------------- FR-02: REWARDS CATALOGUE & QR VOUCHER LOGIC -----------------
const DEFAULT_ECO_REWARDS = [
  {
    id: 1,
    title: "Tote Bag Serat Katun Daur Ulang",
    points_required: 200,
    category: "Merchandise",
    description: "Tas jinjing kanvas organik bersertifikasi ramah lingkungan hasil olahan limbah serat tekstil.",
    stock: 65,
    badge: "ToteBag",
    icon: "👜"
  },
  {
    id: 2,
    title: "Voucher Kantin Sehat Kampus Rp 25.000",
    points_required: 250,
    category: "Konsumsi",
    description: "Voucher belanja menu gizi seimbang di pujasera & kantin ramah lingkungan kampus ITSB Deltamas.",
    stock: 80,
    badge: "Voucher",
    icon: "🎟️"
  },
  {
    id: 3,
    title: "Bibit Pohon Tabebuya Emas Arboretum ITSB",
    points_required: 300,
    category: "Penghijauan",
    description: "Bibit siap tanam bersertifikasi untuk program adopsi ruang terbuka hijau di sekitar kampus Deltamas.",
    stock: 50,
    badge: "BibitPohon",
    icon: "🌱"
  },
  {
    id: 4,
    title: "Tumbler Stainless Steel ITSB Eco-Campus",
    points_required: 500,
    category: "Merchandise",
    description: "Tumbler insulasi termal dengan logo grafir resmi ITSB Green Campus, mengurangi botol plastik sekali pakai.",
    stock: 35,
    badge: "Tumbler",
    icon: "🍶"
  },
  {
    id: 5,
    title: "Eco Solar Power Bank 10.000mAh",
    points_required: 1200,
    category: "Elektronik",
    description: "Power bank bertenaga sel surya portabel ramah lingkungan untuk pengisian daya gawai mobile di kampus.",
    stock: 15,
    badge: "PowerBank",
    icon: "🔋"
  }
];

let currentEcoRewards = [...DEFAULT_ECO_REWARDS];

async function loadRewards() {
  try {
    const res = await fetch(`${API_BASE}/api/rewards`);
    if (res.ok) {
      const data = await res.json();
      if (data.rewards && Array.isArray(data.rewards) && data.rewards.length > 0) {
        const iconMap = {
          "ToteBag": "👜",
          "Voucher": "🎟️",
          "BibitPohon": "🌱",
          "Tumbler": "🍶",
          "PowerBank": "🔋"
        };
        currentEcoRewards = data.rewards.map(item => ({
          ...item,
          icon: iconMap[item.badge] || "🎁"
        }));
      }
    }
  } catch (err) {
    console.warn("Backend API rewards offline, memuat katalog lokal default ITSB:", err);
  }
  renderRewards(currentEcoRewards);
}

function renderRewards(rewards) {
  const container = document.getElementById("rewardsCatalogContainer");
  if (!container) return;

  container.innerHTML = rewards.map(r => `
    <div class="card reward-card" id="rewardCard-${r.id}">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span class="reward-badge-tag">${r.icon || "🎁"} ${r.category}</span>
          <span class="reward-points-pill">🪙 ${r.points_required} Pts</span>
        </div>
        <h4 style="font-size:1.05rem; font-weight:700; color:var(--color-ink); margin-bottom:0.4rem;">${r.title}</h4>
        <p style="font-size:0.8rem; color:var(--color-ink-muted); margin-bottom:1.15rem; line-height:1.5;">${r.description}</p>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-border-hairline); padding-top:0.85rem;">
        <span style="font-size:0.75rem; color:var(--color-ink-muted);">
          Tersedia: <strong id="rewardStockVal-${r.id}" class="reward-stock-number">${r.stock} unit</strong>
        </span>
        <button class="btn btn-primary btn-sm ${r.stock <= 0 ? 'btn-disabled' : ''}" 
                id="btnRedeem-${r.id}"
                ${r.stock <= 0 ? 'disabled' : ''}
                onclick="promptRedeemReward(${r.id})">
          ${r.stock <= 0 ? 'Stok Habis' : 'Tukarkan'}
        </button>
      </div>
    </div>
  `).join("");
}

function promptRedeemReward(rewardId) {
  const item = currentEcoRewards.find(r => r.id === rewardId);
  if (!item) return;

  // Populate Step 1 (Konfirmasi Penukaran)
  document.getElementById("redeemRewardId").value = item.id;
  document.getElementById("redeemRewardPoints").value = item.points_required;
  document.getElementById("redeemRewardTitle").value = item.title;

  document.getElementById("redeemModalTitle").innerText = "Konfirmasi Penukaran Eco-Reward";
  document.getElementById("redeemItemName").innerText = item.title;
  document.getElementById("redeemItemPoints").innerText = `🪙 ${item.points_required} Pts`;
  document.getElementById("redeemItemBadge").innerText = `${item.icon || "🎁"} ${item.category}`;
  document.getElementById("redeemItemDesc").innerText = item.description;
  document.getElementById("redeemItemStock").innerHTML = `Tersedia: <strong>${item.stock} unit</strong>`;

  // Ensure Step 1 is visible and Step 2 is hidden
  const confirmStep = document.getElementById("redeemConfirmStep");
  const successStep = document.getElementById("redeemSuccessStep");
  if (confirmStep) confirmStep.style.display = "block";
  if (successStep) successStep.style.display = "none";

  const btnConfirm = document.getElementById("btnConfirmRedeem");
  if (btnConfirm) {
    btnConfirm.disabled = item.stock <= 0;
    btnConfirm.innerHTML = item.stock <= 0 ? "Stok Habis" : "<span>Konfirmasi & Terbitkan Voucher</span>";
  }

  openModal("redeemModal");
}

async function handleRedeemSubmit(event) {
  event.preventDefault();

  const rewardId = parseInt(document.getElementById("redeemRewardId").value);
  const studentId = document.getElementById("redeemStudentId").value.trim() || "12220014";
  const studentName = document.getElementById("redeemStudentName").value.trim() || "Aditya Pratama";
  const points = parseInt(document.getElementById("redeemRewardPoints").value) || 0;
  const title = document.getElementById("redeemRewardTitle").value || "";

  const btnConfirm = document.getElementById("btnConfirmRedeem");
  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.innerText = "Menerbitkan E-Voucher...";
  }

  // 1. Generate unique random claim code (ITSB-REWARD-XXXXX)
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  let finalVoucherCode = `ITSB-REWARD-${randomSuffix}`;

  // 2. Attempt backend redemption if available
  try {
    const res = await fetch(`${API_BASE}/api/rewards/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reward_id: rewardId,
        student_id: studentId,
        student_name: studentName
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.redemption_code) {
        finalVoucherCode = data.redemption_code;
      }
    }
  } catch (err) {
    console.warn("Backend offline, memproses voucher digital secara offline/client-side:", err);
  }

  // 3. Dynamically decrement stock on the card by 1 unit
  const targetReward = currentEcoRewards.find(r => r.id === rewardId);
  if (targetReward && targetReward.stock > 0) {
    targetReward.stock -= 1;

    // Update DOM stock counter on the card
    const stockEl = document.getElementById(`rewardStockVal-${rewardId}`);
    if (stockEl) {
      stockEl.innerText = `${targetReward.stock} unit`;
      stockEl.classList.add("stock-badge-updated");
      setTimeout(() => stockEl.classList.remove("stock-badge-updated"), 900);
    }

    // Disable button if stock reaches 0
    if (targetReward.stock <= 0) {
      const btn = document.getElementById(`btnRedeem-${rewardId}`);
      if (btn) {
        btn.disabled = true;
        btn.classList.add("btn-disabled");
        btn.innerText = "Stok Habis";
      }
    }
  }

  // 4. Construct Public QR Server URL as specified:
  // https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=ITSB-REWARD-[kode unik acak]
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(finalVoucherCode)}`;

  // 5. Populate Step 2 (E-Voucher Berhasil Diterbitkan)
  document.getElementById("voucherRewardTitle").innerText = title || targetReward?.title || "Eco-Reward ITSB";
  document.getElementById("voucherPointsBadge").innerText = `🪙 ${points || targetReward?.points_required || 0} Eco-Points Telah Dipotong`;
  document.getElementById("voucherItemBadge").innerText = targetReward?.category ? `${targetReward.icon || "🎁"} ${targetReward.category}` : "Eco-Reward";
  document.getElementById("voucherClaimCode").innerText = finalVoucherCode;
  document.getElementById("voucherRecipientName").innerText = studentName;
  document.getElementById("voucherRecipientId").innerText = studentId;

  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  document.getElementById("voucherIssuedAt").innerText = `${dateStr}, ${timeStr} WIB`;

  // Set QR Code Image
  const qrImg = document.getElementById("voucherQrImage");
  if (qrImg) {
    qrImg.src = qrUrl;
  }

  // 6. Transition view from Step 1 to Step 2
  const confirmStep = document.getElementById("redeemConfirmStep");
  const successStep = document.getElementById("redeemSuccessStep");
  if (confirmStep) confirmStep.style.display = "none";
  if (successStep) successStep.style.display = "block";

  showToast(`E-Voucher berhasil diterbitkan! Simpan Kode: ${finalVoucherCode}`, "success");

  // Restore button state
  if (btnConfirm) {
    btnConfirm.disabled = false;
    btnConfirm.innerHTML = "<span>Konfirmasi & Terbitkan Voucher</span>";
  }
}

function closeRedeemModal() {
  closeModal("redeemModal");
  setTimeout(() => {
    const confirmStep = document.getElementById("redeemConfirmStep");
    const successStep = document.getElementById("redeemSuccessStep");
    if (confirmStep) confirmStep.style.display = "block";
    if (successStep) successStep.style.display = "none";
  }, 300);
}

function printVoucher() {
  window.print();
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

  const photoPreviewImg = document.getElementById("photoPreviewImg");
  const photoData = (photoPreviewImg && photoPreviewImg.src && photoPreviewImg.src.startsWith("data:image"))
    ? photoPreviewImg.src
    : null;

  const payload = {
    title: document.getElementById("repTitle").value,
    location: document.getElementById("repLocation").value,
    category: document.getElementById("repCategory").value,
    priority: document.getElementById("repPriority").value,
    description: document.getElementById("repDesc").value,
    reporter_name: document.getElementById("repName").value,
    reporter_contact: document.getElementById("repContact").value || "anonim@itsb.ac.id",
    photo_data: photoData
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

// ----------------- REPORT PHOTO UPLOAD & PREVIEW -----------------
function setupReportPhotoUpload() {
  const dropzone = document.getElementById("reportDropzone");
  const fileInput = document.getElementById("repPhoto");
  const previewWrapper = document.getElementById("photoPreviewWrapper");
  const previewImg = document.getElementById("photoPreviewImg");
  const previewName = document.getElementById("photoPreviewName");
  const previewSize = document.getElementById("photoPreviewSize");
  const removeBtn = document.getElementById("btnRemovePhoto");

  if (!dropzone || !fileInput) return;

  function handleFile(file) {
    if (!file) return;

    if (!file.type.match("image.*")) {
      showToast("Hanya file gambar (JPG/PNG) yang diperbolehkan.", "error");
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran foto maksimal adalah 5MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImg) previewImg.src = e.target.result;
      if (previewName) previewName.innerText = file.name;
      if (previewSize) previewSize.innerText = `${(file.size / 1024).toFixed(1)} KB`;
      if (previewWrapper) previewWrapper.style.display = "block";
      if (dropzone) dropzone.style.display = "none";
    };
    reader.readAsDataURL(file);
  }

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  // Drag and drop events
  ["dragenter", "dragover"].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("dragover");
    }, false);
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover");
    }, false);
  });

  dropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files[0]) {
      fileInput.files = dt.files;
      handleFile(dt.files[0]);
    }
  });

  function resetPhotoUpload() {
    fileInput.value = "";
    if (previewImg) previewImg.src = "";
    if (previewWrapper) previewWrapper.style.display = "none";
    if (dropzone) dropzone.style.display = "block";
  }

  if (removeBtn) {
    removeBtn.addEventListener("click", resetPhotoUpload);
  }

  const reportForm = document.getElementById("newReportForm") || document.getElementById("ecoReportForm");
  if (reportForm) {
    reportForm.addEventListener("reset", resetPhotoUpload);
  }
}
