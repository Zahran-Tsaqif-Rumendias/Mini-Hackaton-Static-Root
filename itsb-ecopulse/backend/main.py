"""
ITSB EcoPulse - Master Backend API Server
FastAPI + SQLite Full-Stack Application for Institut Teknologi Sains Bandung
"""

import os
import random
import datetime
import uuid      
from typing import Optional, List
from fastapi import FastAPI, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from database import get_db_connection, init_db
from seed_data import seed_all

# Initialize DB & Seed on startup
init_db()
seed_all()

app = FastAPI(
    title="ITSB EcoPulse API",
    description="Platform Pemantauan Lingkungan & Keberlanjutan Kampus Hijau Institut Teknologi Sains Bandung",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- PYDANTIC SCHEMAS -----------------

class WasteDepositRequest(BaseModel):
    student_id: str = Field(..., example="12220014")
    student_name: str = Field(..., example="Aditya Pratama")
    department: str = Field(..., example="Teknologi Pengolahan Sawit")
    waste_type: str = Field(..., example="Plastik/PET")
    weight_kg: float = Field(..., gt=0, example=2.5)
    location: str = Field(..., example="Drop Point Gedung Utama Rektorat")


class RewardRedemptionRequest(BaseModel):
    reward_id: int
    student_id: str
    student_name: str


class VolunteerRegistrationRequest(BaseModel):
    initiative_id: Optional[int] = None
    full_name: str
    email: str
    role_department: str


class CarbonCalculationRequest(BaseModel):
    user_role: str = Field(..., example="Mahasiswa")
    commute_distance_km: float = Field(..., ge=0, example=15.0)
    transport_mode: str = Field(..., example="Shuttle Bus Kampus Deltamas")
    electricity_hours: float = Field(..., ge=0, example=4.0)


class EcoReportRequest(BaseModel):
    title: str = Field(..., min_length=5, example="Pipa Wastafel Bocor di Lantai 1 Gedung Rektorat")
    location: str = Field(..., min_length=3, example="Gedung Utama Rektorat, Toilet Lantai 1")
    category: str = Field(..., example="Kebocoran Air")
    description: str = Field(..., min_length=10, example="Kran wastafel nomor 1 terus meneteskan air bersih dengan debit sedang.")
    reporter_name: str = Field(..., min_length=2, example="Fajar Hidayat")
    reporter_contact: Optional[str] = "fajar@students.itsb.ac.id"
    priority: Optional[str] = "Sedang"
    photo_url: Optional[str] = None
    photo_data: Optional[str] = None


# ----------------- FR-01: TELEMETRY ENDPOINTS -----------------

@app.get("/api/telemetry/latest")
def get_latest_telemetry():
    """Retrieve the latest real-time environmental telemetry for ITSB Deltamas Campus."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM telemetry_history 
        ORDER BY timestamp DESC, id DESC 
        LIMIT 1
    """)
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="No telemetry records found")

    # Dynamic microscopic fluctuations simulating authentic high-frequency IoT sensors
    now = datetime.datetime.now()
    jitter_solar = max(5.0, round(row["solar_kw"] + random.uniform(-1.5, 1.5), 1))
    jitter_load = max(40.0, round(row["campus_power_load_kw"] + random.uniform(-1.0, 1.0), 1))
    grid_indep = min(100.0, round((jitter_solar / jitter_load) * 100, 1))

    jitter_aqi = max(25, min(75, int(row["aqi"] + random.choice([-1, 0, 1]))))
    jitter_pm25 = max(4.0, round(row["pm25"] + random.uniform(-0.35, 0.35), 1))
    jitter_water = int(row["water_harvested_liters"] + random.choice([-3, 0, 3, 6]))
    jitter_total_solar = round(row["solar_total_kwh"] + random.uniform(0.02, 0.06), 1)
    jitter_co2 = round(row["co2_saved_kg"] + random.uniform(0.03, 0.09), 1)
    trees_equiv = round(jitter_co2 / 0.06, 0)

    # Determine ISPU standard categorization
    if jitter_aqi <= 50:
        aqi_status = "Baik (Sehat - Hijau)"
        aqi_pill = "pill-good"
    elif jitter_aqi <= 100:
        aqi_status = "Sedang (Biru)"
        aqi_pill = "pill-moderate"
    else:
        aqi_status = "Tidak Sehat (Kuning)"
        aqi_pill = "pill-alert"

    return {
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
        "iso_timestamp": now.isoformat(),
        "campus_location": "Institut Teknologi Sains Bandung - Kampus Kota Deltamas, Cikarang Pusat",
        "station_name": "Stasiun IoT & Telemetri Terpadu ITSB Deltamas",
        "live_status": "ONLINE_STREAMING",
        "active_nodes": 4,
        "sampling_rate_sec": 3,
        "solar": {
            "current_kw": jitter_solar,
            "today_total_kwh": jitter_total_solar,
            "pv_capacity_kwp": 120.0,
            "status": "Optimal (Photovoltaic Online)"
        },
        "air_quality": {
            "aqi": jitter_aqi,
            "pm25": jitter_pm25,
            "status": aqi_status,
            "pill_class": aqi_pill,
            "benchmark": "Standar Indeks Standar Pencemar Udara (ISPU) & WHO"
        },
        "carbon": {
            "co2_saved_today_kg": jitter_co2,
            "equivalent_trees_planted": trees_equiv
        },
        "water": {
            "rainwater_cistern_liters": jitter_water,
            "cistern_capacity_liters": 10000.0,
            "recycled_greywater_usage_pct": 74.5,
            "harvesting_status": "Aktif (Filter Bioretensi Normal)"
        },
        "grid": {
            "campus_power_load_kw": jitter_load,
            "grid_independence_pct": grid_indep
        }
    }


@app.get("/api/telemetry/history")
def get_telemetry_history():
    """Retrieve telemetry historical 24-point cycle for interactive SVG solar vs load chart."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT timestamp, solar_kw, solar_total_kwh, aqi, pm25, campus_power_load_kw 
        FROM telemetry_history 
        ORDER BY id ASC 
        LIMIT 24
    """)
    rows = cursor.fetchall()
    conn.close()

    # Base authentic daytime curve for Deltamas campus solar generation & building load
    base_curve = [
        {"time": "06:00", "solar_kw": 8.5, "load_kw": 62.0, "aqi": 38, "pm25": 8.2},
        {"time": "07:00", "solar_kw": 18.2, "load_kw": 74.5, "aqi": 40, "pm25": 8.9},
        {"time": "08:00", "solar_kw": 34.0, "load_kw": 82.0, "aqi": 43, "pm25": 9.5},
        {"time": "09:00", "solar_kw": 58.5, "load_kw": 86.0, "aqi": 45, "pm25": 10.1},
        {"time": "10:00", "solar_kw": 78.4, "load_kw": 89.5, "aqi": 47, "pm25": 10.8},
        {"time": "11:00", "solar_kw": 92.1, "load_kw": 91.0, "aqi": 46, "pm25": 10.4},
        {"time": "12:00", "solar_kw": 98.6, "load_kw": 88.0, "aqi": 44, "pm25": 9.8},
        {"time": "13:00", "solar_kw": 94.2, "load_kw": 92.5, "aqi": 42, "pm25": 9.4},
        {"time": "14:00", "solar_kw": 82.8, "load_kw": 90.0, "aqi": 41, "pm25": 9.2},
        {"time": "15:00", "solar_kw": 64.0, "load_kw": 87.5, "aqi": 40, "pm25": 9.0},
        {"time": "16:00", "solar_kw": 41.5, "load_kw": 84.0, "aqi": 39, "pm25": 8.7},
        {"time": "17:00", "solar_kw": 19.8, "load_kw": 78.0, "aqi": 38, "pm25": 8.5},
        {"time": "18:00", "solar_kw": 6.2, "load_kw": 71.0, "aqi": 39, "pm25": 8.6},
    ]

    # Incorporate subtle micro-variations for live realism
    now = datetime.datetime.now()
    cur_solar = max(5.0, round(76.2 + random.uniform(-1.5, 1.5), 1))
    cur_load = round(85.0 + random.uniform(-1.0, 1.0), 1)

    chart_points = []
    for item in base_curve:
        chart_points.append({
            "time": item["time"],
            "solar_kw": round(item["solar_kw"] + random.uniform(-0.8, 0.8), 1),
            "load_kw": round(item["load_kw"] + random.uniform(-0.6, 0.6), 1),
            "aqi": item["aqi"],
            "pm25": item["pm25"]
        })

    # Add the live instantaneous point
    chart_points.append({
        "time": "Sekarang",
        "is_live": True,
        "solar_kw": cur_solar,
        "load_kw": cur_load,
        "aqi": 41,
        "pm25": 9.8
    })

    return {
        "status": "success",
        "points": chart_points,
        "history": chart_points,
        "current_timestamp": now.strftime("%Y-%m-%d %H:%M:%S")
    }


# ----------------- FR-02: WASTE & REWARDS ENDPOINTS -----------------

@app.get("/api/waste/stats")
def get_waste_stats():
    """Retrieve campus aggregate waste stats, recycling ratios, and eco-points."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT SUM(weight_kg), SUM(points_earned), COUNT(*) FROM waste_logs")
    total_weight, total_points, count_deposits = cursor.fetchone()
    total_weight = round(total_weight or 0.0, 1)
    total_points = total_points or 0

    cursor.execute("""
        SELECT waste_type, SUM(weight_kg) as weight 
        FROM waste_logs 
        GROUP BY waste_type
    """)
    type_breakdown = {row["waste_type"]: round(row["weight"], 1) for row in cursor.fetchall()}

    conn.close()

    return {
        "total_waste_kg": total_weight,
        "total_points_distributed": total_points,
        "total_transactions": count_deposits,
        "recycling_efficiency_pct": 86.4,
        "compost_organic_kg": type_breakdown.get("Organik", 0.0),
        "plastics_pet_kg": type_breakdown.get("Plastik/PET", 0.0),
        "paper_carton_kg": type_breakdown.get("Kertas/Karton", 0.0),
        "e_waste_kg": type_breakdown.get("E-Waste", 0.0),
        "metals_kg": type_breakdown.get("Logam/Kaleng", 0.0)
    }


@app.get("/api/waste/logs")
def get_recent_waste_logs():
    """Retrieve latest waste deposit logs."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM waste_logs 
        ORDER BY id DESC 
        LIMIT 10
    """)
    rows = cursor.fetchall()
    conn.close()
    return {"logs": [dict(r) for r in rows]}


@app.post("/api/waste/deposit")
def submit_waste_deposit(deposit: WasteDepositRequest):
    """Submit a student/staff waste deposit, calculate eco-points, and log transaction."""
    # Point multipliers per kg
    multipliers = {
        "Plastik/PET": 50,
        "Kertas/Karton": 50,
        "Organik": 20,
        "E-Waste": 200,
        "Logam/Kaleng": 100
    }
    multiplier = multipliers.get(deposit.waste_type, 30)
    points_earned = int(deposit.weight_kg * multiplier)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO waste_logs 
        (student_id, student_name, department, waste_type, weight_kg, points_earned, location)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        deposit.student_id,
        deposit.student_name,
        deposit.department,
        deposit.waste_type,
        deposit.weight_kg,
        points_earned,
        deposit.location
    ))
    conn.commit()
    deposit_id = cursor.lastrowid
    conn.close()

    return {
        "message": "Setoran sampah berhasil dicatat di Bank Sampah ITSB!",
        "deposit_id": deposit_id,
        "points_earned": points_earned,
        "student_name": deposit.student_name,
        "waste_type": deposit.waste_type,
        "weight_kg": deposit.weight_kg
    }


@app.get("/api/waste/leaderboard")
def get_green_leaderboard():
    """Top student champions sorting by accumulated eco points."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT student_id, student_name, department, 
               SUM(points_earned) as total_points, 
               SUM(weight_kg) as total_weight 
        FROM waste_logs 
        GROUP BY student_id 
        ORDER BY total_points DESC 
        LIMIT 5
    """)
    rows = cursor.fetchall()
    conn.close()
    return {"leaderboard": [dict(r) for r in rows]}


@app.get("/api/rewards")
def get_rewards():
    """List eco rewards available for points redemption."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM eco_rewards WHERE stock > 0 ORDER BY points_required ASC")
    rows = cursor.fetchall()
    conn.close()
    return {"rewards": [dict(r) for r in rows]}


@app.post("/api/rewards/redeem")
def redeem_reward(req: RewardRedemptionRequest):
    """Redeem eco points for green merchandise."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM eco_rewards WHERE id = ?", (req.reward_id,))
    reward = cursor.fetchone()

    if not reward:
        conn.close()
        raise HTTPException(status_code=404, detail="Katalog reward tidak ditemukan.")

    if reward["stock"] <= 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Stok reward ini sedang habis.")

    # Decrement stock and record redemption
    cursor.execute("UPDATE eco_rewards SET stock = stock - 1 WHERE id = ?", (req.reward_id,))
    cursor.execute("""
        INSERT INTO rewards_redemptions (reward_id, student_id, student_name)
        VALUES (?, ?, ?)
    """, (req.reward_id, req.student_id, req.student_name))
    conn.commit()
    conn.close()

    return {
        "message": f"Selamat {req.student_name}! Kamu berhasil menukarkan {reward['points_required']} Eco-Points dengan '{reward['title']}'.",
        "reward_title": reward["title"],
        "points_deducted": reward["points_required"],
        "redemption_code": f"ITSB-REWARD-{random.randint(10000, 99999)}"
    }


# ----------------- FR-03: GREEN INITIATIVES -----------------

@app.get("/api/initiatives")
def get_green_initiatives():
    """List all green initiatives and volunteer progress."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM green_initiatives ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()

    initiatives = []
    for r in rows:
        pct = min(100, int((r["current_value"] / r["target_value"]) * 100)) if r["target_value"] > 0 else 0
        initiatives.append({
            "id": r["id"],
            "title": r["title"],
            "category": r["category"],
            "description": r["description"],
            "target_value": r["target_value"],
            "current_value": r["current_value"],
            "metric_unit": r["metric_unit"],
            "percentage": pct,
            "date_scheduled": r["date_scheduled"],
            "location": r["location"],
            "organizer": r["organizer"],
            "status": r["status"]
        })

    return {"initiatives": initiatives}


@app.post("/api/initiatives/{initiative_id}/volunteer")
def register_volunteer(initiative_id: int, reg: VolunteerRegistrationRequest):
    """Register volunteer for campus sustainability campaigns."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM green_initiatives WHERE id = ?", (initiative_id,))
    init_item = cursor.fetchone()

    if not init_item:
        conn.close()
        raise HTTPException(status_code=404, detail="Inisiatif kampus tidak ditemukan.")

    cursor.execute("""
        INSERT INTO initiative_volunteers (initiative_id, full_name, email, role_department)
        VALUES (?, ?, ?, ?)
    """, (initiative_id, reg.full_name, reg.email, reg.role_department))

    # Increment current_value if tracking participants
    if "Peserta" in init_item["metric_unit"] or "Civitas" in init_item["metric_unit"]:
        cursor.execute("UPDATE green_initiatives SET current_value = current_value + 1 WHERE id = ?", (initiative_id,))

    conn.commit()
    conn.close()

    return {
        "message": f"Terima kasih {reg.full_name}! Pendaftaran Anda sebagai Relawan Hijau untuk '{init_item['title']}' telah dikonfirmasi.",
        "initiative_title": init_item["title"],
        "location": init_item["location"],
        "date_scheduled": init_item["date_scheduled"]
    }


# ----------------- FR-04: CARBON FOOTPRINT CALCULATOR -----------------

@app.post("/api/carbon/calculate")
def calculate_carbon_footprint(req: CarbonCalculationRequest):
    """
    Calculate daily commute & electricity carbon footprint based on IPCC/KLHK factors.
    Returns emission in kg CO2e, equivalent trees needed for annual offsetting, and certificate code.
    """
    # Emission factor (kg CO2e per passenger-km)
    emission_factors = {
        "Sepeda / Jalan Kaki": 0.0,
        "Shuttle Bus Kampus Deltamas": 0.045,
        "Motor Listrik (EV)": 0.035,
        "KRL Commuterline + Feeder": 0.030,
        "Sepeda Motor Bensin": 0.105,
        "Mobil Pribadi Bensin": 0.192,
        "Carpool Mobil (3+ Penumpang)": 0.065
    }

    factor = emission_factors.get(req.transport_mode, 0.09)
    # 2 ways daily commute
    commute_emission = req.commute_distance_km * factor * 2.0
    
    # Campus lab/ac electricity assumption: ~0.35 kWh/hour per person share * 0.85 kg CO2/kWh
    electricity_emission = req.electricity_hours * 0.35 * 0.85

    total_daily_emission = round(commute_emission + electricity_emission, 2)
    
    # Offsetting: 1 mature tree absorbs ~22 kg CO2 per year (~0.06 kg/day)
    trees_needed = round(total_daily_emission / 0.06, 1)

    cert_code = f"ITSB-PLEDGE-{random.randint(1000, 9999)}"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO carbon_calculations 
        (user_role, commute_distance_km, transport_mode, electricity_hours, total_emission_kg, trees_needed, certificate_code)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        req.user_role,
        req.commute_distance_km,
        req.transport_mode,
        req.electricity_hours,
        total_daily_emission,
        trees_needed,
        cert_code
    ))
    conn.commit()
    conn.close()

    # Carbon grade
    if total_daily_emission < 1.0:
        grade = "A+ (Pelopor Net-Zero Civitas ITSB)"
        grade_desc = "Jejak karbon Anda sangat rendah! Gaya mobilitas dan konsumsi energi Anda menjadi teladan kampus hijau."
    elif total_daily_emission < 3.0:
        grade = "A (Ramah Lingkungan & Bertanggung Jawab)"
        grade_desc = "Jejak karbon Anda terkendali dengan baik. Pertahankan penggunaan shuttle kampus dan efisiensi listrik lab."
    elif total_daily_emission < 6.0:
        grade = "B (Moderat - Potensi Optimasi)"
        grade_desc = "Tingkat emisi Anda rata-rata. Pertimbangkan beralih ke Shuttle Bus Deltamas atau carpooling mingguan."
    else:
        grade = "C (Tinggi - Disarankan Mitigasi)"
        grade_desc = "Emisi Anda cukup signifikan. Mari berkontribusi melalui penanaman pohon di Arboretum ITSB untuk menetralkannya."

    return {
        "certificate_code": cert_code,
        "user_role": req.user_role,
        "total_daily_emission_kg": total_daily_emission,
        "commute_emission_kg": round(commute_emission, 2),
        "electricity_emission_kg": round(electricity_emission, 2),
        "trees_needed_annual": trees_needed,
        "carbon_grade": grade,
        "recommendation": grade_desc,
        "institution": "Institut Teknologi Sains Bandung (ITSB) - Deltamas, Cikarang"
    }


# ----------------- FR-05: ECO-AUDIT REPORTING (LAPOR KAMPUS) -----------------

@app.get("/api/reports")
def get_eco_reports(category: Optional[str] = None, status_filter: Optional[str] = None):
    """Retrieve all campus facility eco reports with optional filters."""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM eco_reports WHERE 1=1"
    params = []

    if category:
        query += " AND category = ?"
        params.append(category)

    if status_filter:
        query += " AND status = ?"
        params.append(status_filter)

    query += " ORDER BY id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return {"reports": [dict(r) for r in rows]}


@app.post("/api/reports")
def submit_eco_report(report: EcoReportRequest):
    """Submit a campus facility environmental incident or leak report."""
    ticket_num = f"ITSB-ECO-{random.randint(2000, 8999)}"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO eco_reports 
        (ticket_number, title, location, category, description, reporter_name, reporter_contact, priority, status, photo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Diajukan', ?)
    """, (
        ticket_num,
        report.title,
        report.location,
        report.category,
        report.description,
        report.reporter_name,
        report.reporter_contact,
        report.priority,
        report.photo_url
    ))
    conn.commit()
    conn.close()

    return {
        "message": "Laporan Anda telah berhasil dicatat. Tim Estate Management ITSB akan segera menindaklanjuti.",
        "ticket_number": ticket_num,
        "title": report.title,
        "status": "Diajukan",
        "location": report.location,
        "photo_url": report.photo_url
    }


@app.post("/api/reports/upload-photo")
async def upload_report_photo(file: UploadFile = File(...)):
    """Upload photo evidence for eco report (JPG, PNG, WEBP)."""
    valid_content_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in valid_content_types:
        raise HTTPException(status_code=400, detail="Format file harus berupa gambar (JPG atau PNG)")

    uploads_dir = os.path.join(STATIC_DIR, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    unique_filename = f"report_{uuid.uuid4().hex[:10]}{ext}"
    file_path = os.path.join(uploads_dir, unique_filename)

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ukuran foto maksimal 5 MB")

    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "photo_url": f"/uploads/{unique_filename}",
        "filename": unique_filename
    }


@app.get("/api/reports/{ticket_number}")
def get_report_detail(ticket_number: str):
    """Get single report status and tracking pipeline."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM eco_reports WHERE ticket_number = ?", (ticket_number,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Tiket laporan tidak ditemukan.")

    return {"report": dict(row)}


STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))

if os.path.isdir(STATIC_DIR):
    # Mount sub-folders at top-level paths so that relative URLs in index.html
    # (e.g. "css/style.css", "js/app.js", "assets/images/...", "uploads/...") resolve correctly
    # when the page is served from the root route "/".
    for folder in ["css", "js", "assets", "uploads"]:
        folder_path = os.path.join(STATIC_DIR, folder)
        os.makedirs(folder_path, exist_ok=True)
        app.mount(f"/{folder}", StaticFiles(directory=folder_path), name=folder)
    # Also mount the full static dir for direct /static/... access
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def serve_spa():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse({"status": "ITSB EcoPulse API Operational", "docs": "/docs"})


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "ITSB EcoPulse",
        "campus": "Institut Teknologi Sains Bandung (ITSB)",
        "location": "Kota Deltamas, Cikarang Pusat, Kab. Bekasi",
        "timestamp": datetime.datetime.now().isoformat()
    }
