@echo off
title Snake+ Quick Start
color 0A

echo.
echo ========================================
echo         SNAKE+ GAME LAUNCHER
echo ========================================
echo.

REM Clean up old processes
echo [1/4] Cleaning up old processes...
taskkill /F /IM "node.exe" 2>nul
taskkill /F /IM "http-server*" 2>nul
timeout /t 2 /nobreak >nul

REM Start backend server
echo [2/4] Starting backend server (port 3000)...
cd /d "%~dp0server"
start "" cmd /c "node server.js"
timeout /t 3 /nobreak >nul

REM Check if server started
echo [3/4] Checking server status...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo     ✓ Backend server is running
) else (
    echo     ✗ Backend server failed to start
    echo     Check server folder for errors
)

REM Start frontend
echo [4/4] Starting frontend (port 8080)...
cd /d "%~dp0"
start "" cmd /c "npx --yes http-server -p 8080 -o index.html"
timeout /t 3 /nobreak >nul

REM Open browser with correct URL
start http://127.0.0.1:8080/

echo.
echo ========================================
echo           GAME IS RUNNING!
echo ========================================
echo.
echo   Frontend: http://127.0.0.1:8080
echo   Backend:  http://127.0.0.1:3000
echo.
echo   If browser didn't open automatically:
echo   Open: http://127.0.0.1:8080
echo.
echo ========================================
echo.
echo Press any key to exit...
pause >nul
