@echo off
echo ========================================================
echo Starting MindBridge Services...
echo ========================================================

echo Starting Backend API (Port 8000)...
start "MindBridge Backend" cmd /k "call venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

echo Starting Frontend UI (Vite Dev Server)...
start "MindBridge Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Frontend should be available at http://localhost:5173
echo Backend API should be available at http://localhost:8000
echo.
pause
