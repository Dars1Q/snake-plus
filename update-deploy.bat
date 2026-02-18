@echo off
title Deploy Snake+ to GitHub Pages
color 0A

echo.
echo ========================================
echo   Snake+ Deploy to GitHub Pages
echo ========================================
echo.

REM Copy files to deploy folder
echo [1/3] Copying files to deploy folder...

copy /Y "index.html" "deploy\index.html" >nul
copy /Y "styles.css" "deploy\styles.css" >nul

if not exist "deploy\src" mkdir "deploy\src"
copy /Y "src\*.js" "deploy\src\" >nul

echo     ✓ Files copied

REM Git commit and push
echo [2/3] Committing changes...
cd deploy
git add .
git commit -m "Auto-deploy: %date% %time%"
if %errorlevel% neq 0 (
    echo     ✗ No changes to commit or git not configured
    cd ..
    goto :skip_push
)

echo     ✓ Changes committed

echo [3/3] Pushing to GitHub...
git push --force
if %errorlevel% neq 0 (
    echo     ✗ Push failed - check git configuration
    cd ..
    goto :end
)

cd ..
:skip_push
echo     ✓ Pushed to GitHub

echo.
echo ========================================
echo   Deploy complete!
echo   Wait 1-2 minutes, then check:
echo   https://dars1q.github.io/snake-plus/
echo ========================================
echo.

:end
pause
