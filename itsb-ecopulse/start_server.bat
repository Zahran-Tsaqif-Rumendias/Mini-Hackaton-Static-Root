@echo off
title ITSB EcoPulse - Platform Kampus Berkelanjutan
color 0A
echo ======================================================================
echo    ITSB EcoPulse - Institut Teknologi Sains Bandung (Kampus Deltamas)
echo    Memulai Server Backend Telemetri IoT dan Frontend...
echo ======================================================================
echo.

cd /d "%~dp0"

:: Deteksi ketersediaan py launcher atau python biasa
where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set PY_EXE=py
) else (
    set PY_EXE=python
)

:: Bersihkan proses gantung di port 8000 jika ada
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Pastikan dependensi terpasang
%PY_EXE% -m pip install -q -r requirements.txt

:: Buka browser secara otomatis
start http://127.0.0.1:8000

:: Jalankan backend server
%PY_EXE% run.py

pause
