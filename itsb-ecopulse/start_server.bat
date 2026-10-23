@echo off
title ITSB EcoPulse - Platform Kampus Berkelanjutan
color 0A
echo ======================================================================
echo    ITSB EcoPulse - Institut Teknologi Sains Bandung (Kampus Deltamas)
echo    Memulai Server Backend Telemetri IoT & Frontend...
echo ======================================================================
echo.

cd /d "%~dp0"

:: Pastikan dependensi terpasang
python -m pip install -q -r requirements.txt

:: Buka browser secara otomatis
start http://127.0.0.1:8000

:: Jalankan backend server
python run.py

pause
