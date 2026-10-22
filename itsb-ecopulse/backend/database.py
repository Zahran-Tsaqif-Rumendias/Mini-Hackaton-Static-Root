"""
ITSB EcoPulse - Database Layer & Schema Definition
SQLite implementation with full schema for 5 Functional Requirements
"""

import sqlite3
import os
from datetime import datetime
from typing import Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(__file__), "ecopulse.db")


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Telemetry History (FR-01)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telemetry_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        solar_kw REAL NOT NULL,
        solar_total_kwh REAL NOT NULL,
        aqi INTEGER NOT NULL,
        pm25 REAL NOT NULL,
        co2_saved_kg REAL NOT NULL,
        water_harvested_liters REAL NOT NULL,
        campus_power_load_kw REAL NOT NULL,
        grid_independence_pct REAL NOT NULL
    );
    """)

    # 2. Waste Logs (FR-02)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS waste_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        department TEXT NOT NULL,
        waste_type TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        points_earned INTEGER NOT NULL,
        location TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Eco Rewards Catalog (FR-02)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS eco_rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        points_required INTEGER NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        stock INTEGER NOT NULL,
        badge TEXT NOT NULL
    );
    """)

    # 4. Rewards Redemptions (FR-02)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rewards_redemptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reward_id INTEGER NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'Completed',
        FOREIGN KEY (reward_id) REFERENCES eco_rewards(id)
    );
    """)

    # 5. Green Initiatives (FR-03)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS green_initiatives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        target_value INTEGER NOT NULL,
        current_value INTEGER NOT NULL,
        metric_unit TEXT NOT NULL,
        date_scheduled TEXT NOT NULL,
        location TEXT NOT NULL,
        organizer TEXT NOT NULL,
        status TEXT DEFAULT 'Aktif'
    );
    """)

    # 6. Initiative Volunteers (FR-03)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS initiative_volunteers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        initiative_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        role_department TEXT NOT NULL,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (initiative_id) REFERENCES green_initiatives(id)
    );
    """)

    # 7. Eco Reports / Lapor Kampus (FR-05)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS eco_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_number TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        reporter_name TEXT NOT NULL,
        reporter_contact TEXT,
        status TEXT DEFAULT 'Diajukan',
        priority TEXT DEFAULT 'Sedang',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolution_notes TEXT
    );
    """)

    # 8. Carbon Footprint Logs (FR-04)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS carbon_calculations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_role TEXT NOT NULL,
        commute_distance_km REAL NOT NULL,
        transport_mode TEXT NOT NULL,
        electricity_hours REAL NOT NULL,
        total_emission_kg REAL NOT NULL,
        trees_needed REAL NOT NULL,
        certificate_code TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print("Database schema successfully initialized.")
