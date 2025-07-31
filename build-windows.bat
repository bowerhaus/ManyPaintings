@echo off
REM ManyPaintings Windows Build Script
REM Builds executable using PyInstaller

echo ======================================
echo ManyPaintings Windows Build Script
echo ======================================

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9+ and try again
    pause
    exit /b 1
)

echo Python found: 
python --version

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

REM Install/upgrade requirements
echo Installing requirements...
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install requirements
    pause
    exit /b 1
)

REM Install PyInstaller if not present
echo Installing PyInstaller...
pip install pyinstaller
if errorlevel 1 (
    echo ERROR: Failed to install PyInstaller
    pause
    exit /b 1
)

REM Clean previous builds
echo Cleaning previous builds...
if exist "build" rmdir /s /q "build"
if exist "dist" rmdir /s /q "dist"
if exist "ManyPaintings-Windows.exe" del "ManyPaintings-Windows.exe"

REM Build executable
echo Building Windows executable...
pyinstaller windows.spec --clean --noconfirm
if errorlevel 1 (
    echo ERROR: PyInstaller build failed
    pause
    exit /b 1
)

REM Move executable to root directory
if exist "dist\ManyPaintings-Windows.exe" (
    move "dist\ManyPaintings-Windows.exe" "ManyPaintings-Windows.exe"
    echo.
    echo ======================================
    echo BUILD SUCCESSFUL!
    echo ======================================
    echo.
    echo Executable created: ManyPaintings-Windows.exe
    echo File size:
    dir "ManyPaintings-Windows.exe" | find "ManyPaintings-Windows.exe"
    echo.
    echo You can now distribute this single executable file.
    echo Double-click to run ManyPaintings in kiosk mode.
) else (
    echo ERROR: Executable not found in dist directory
    pause
    exit /b 1
)

REM Clean up build directories
echo Cleaning up build files...
if exist "build" rmdir /s /q "build"
if exist "dist" rmdir /s /q "dist"

echo.
echo Build complete! Press any key to exit.
pause >nul