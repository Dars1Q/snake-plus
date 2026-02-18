@echo off
title Snake+ Launcher
echo ========================================
echo   Snake+ Game Launcher
echo ========================================
echo.

REM Kill any existing processes
echo Cleaning up...
taskkill /F /IM "node.exe" 2>nul
taskkill /F /IM "http-server*" 2>nul
timeout /t 2 /nobreak >nul

REM Start backend server
echo [1/3] Starting backend server (port 3000)...
cd /d "%~dp0server"
start "" cmd /c "node server.js"
timeout /t 3 /nobreak >nul

REM Start frontend
echo [2/3] Starting frontend (port 8080)...
cd /d "%~dp0"
start "" cmd /c "npx --yes http-server -p 8080 -o index.html"
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Opening game...
start http://localhost:8080

echo.
echo ========================================
echo   DONE!
echo   Frontend: http://localhost:8080
echo   Backend:  http://localhost:3000
echo ========================================
echo.
echo Windows will close this window in 5 seconds...
timeout /t 5 /nobreak >nul
