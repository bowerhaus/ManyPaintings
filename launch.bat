@echo off
echo ===============================================
echo ManyPaintings - Launcher Menu
echo ===============================================
echo.
echo Select launch mode:
echo   1. Kiosk Mode (Full Screen, no browser UI)
echo   2. Normal Mode (Full Screen with browser UI)
echo   3. Normal Mode (Windowed)
echo   4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    python launcher.py kiosk
) else if "%choice%"=="2" (
    python launcher.py normal-fullscreen
) else if "%choice%"=="3" (
    python launcher.py normal
) else if "%choice%"=="4" (
    echo Exiting...
    exit /b
) else (
    echo Invalid choice. Please run again.
)

pause