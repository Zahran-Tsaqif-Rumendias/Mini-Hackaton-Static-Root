"""
ITSB EcoPulse - Application Server Runner
Launches the FastAPI backend and serves the frontend on http://127.0.0.1:8000
"""

import uvicorn
import os
import sys

# Ensure backend directory is in python path
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    print("=" * 70)
    print("[ITSB EcoPulse] Kampus Berkelanjutan Institut Teknologi Sains Bandung")
    print("   Lokasi    : Kota Deltamas, Cikarang Pusat, Kabupaten Bekasi")
    print("   Akses Web : http://127.0.0.1:8000")
    print("   API Docs  : http://127.0.0.1:8000/docs")
    print("=" * 70)
    port = 8000
    try:
        uvicorn.run("main:app", host="127.0.0.1", port=port, reload=False)
    except OSError as e:
        if getattr(e, "winerror", None) == 10048 or "10048" in str(e):
            print(f"\n[PERINGATAN] Port {port} sedang digunakan oleh proses lain.")
            port = 8001
            print(f"   Beralih otomatis ke Port Alternatif : http://127.0.0.1:{port}")
            uvicorn.run("main:app", host="127.0.0.1", port=port, reload=False)
        else:
            raise
