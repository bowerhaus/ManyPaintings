# ManyPaintings Executable Build Instructions

This document explains how to build standalone executables for ManyPaintings on Windows and Raspberry Pi.

## Overview

The ManyPaintings application can be packaged into standalone executables that:
- Start a Flask server in the background
- Automatically launch a browser to display the art
- Include all dependencies and assets
- Work without requiring Python installation

## Prerequisites

### Windows
- **Python 3.9+** - Download from [python.org](https://python.org), check "Add to PATH" during installation
- **Google Chrome** - Recommended browser (launcher prioritizes Chrome over Edge)
- **Git** (optional) - For cloning repository from [git-scm.com](https://git-scm.com)

**System Requirements:**
- Windows 10/11
- 4GB+ RAM recommended
- 500MB free disk space for build process

### Raspberry Pi
- **Raspberry Pi 4B+** - Minimum 2GB RAM, 4GB+ recommended
- **Raspberry Pi OS** - 32-bit or 64-bit, latest version
- **Development packages** - Required for building (see installation steps below)
- **Chromium browser** - For display (`sudo apt install chromium-browser`)

**System Requirements:**
- Pi 4B+ (earlier versions not recommended)
- 8GB+ SD card (Class 10 or better)
- Internet connection for package installation

## Build Process

### Windows Executable

#### Option 1: Automated Build Script
```bash
# Run the automated build script
build-windows.bat
```

This script will:
1. Create/activate virtual environment
2. Install dependencies
3. Install PyInstaller
4. Build the executable
5. Clean up build files

#### Option 2: Manual Build
```bash
# Install dependencies
pip install -r requirements.txt
pip install pyinstaller

# Build executable
pyinstaller windows.spec --clean --noconfirm

# Executable will be in dist/ManyPaintings-Windows.exe
```

### Raspberry Pi Executable

**IMPORTANT:** Raspberry Pi executables must be built ON actual Raspberry Pi hardware due to ARM architecture requirements.

#### Prerequisites Installation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential development tools
sudo apt install -y python3 python3-pip python3-venv python3-dev

# Install image processing libraries (required for Pillow)
sudo apt install -y libjpeg-dev zlib1g-dev libfreetype6-dev

# Install browser for display
sudo apt install -y chromium-browser

# Optional: Git for cloning
sudo apt install -y git
```

#### Option 1: Automated Build Script
```bash
# Make script executable (if needed)
chmod +x build-pi.sh

# Run the build script ON the Raspberry Pi
./build-pi.sh
```

This script will:
1. **Hardware Check** - Verifies you're on actual Pi hardware
2. **Environment Setup** - Creates/activates virtual environment  
3. **Dependency Installation** - Installs Python packages and system libraries
4. **ARM Build** - Compiles executable for ARM architecture
5. **Desktop Integration** - Creates desktop launcher icon
6. **Cleanup** - Removes build files to save space

#### Option 2: Manual Build
```bash
# On Raspberry Pi only - verify hardware first
grep "BCM" /proc/cpuinfo

# Create environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install pyinstaller

# Build executable (may take 5-15 minutes on Pi)
pyinstaller raspberry-pi.spec --clean --noconfirm

# Set permissions
chmod +x dist/ManyPaintings-RaspberryPi

# Move to root directory
mv dist/ManyPaintings-RaspberryPi ./
```

## VS Code Integration

### Launch Configurations (`.vscode/launch.json`)

1. **Python: Launcher Script** - Debug the launcher script directly with development config
2. **Flask: Many Paintings (Development)** - Standard Flask development server
3. **Flask: Many Paintings (Raspberry Pi Config)** - Pi-optimized settings

### Build Tasks (`.vscode/tasks.json`)

Available via Ctrl+Shift+P → "Tasks: Run Task":
- **Build Windows Executable** - Runs `build-windows.bat`
- **Build Raspberry Pi Executable** - Runs `build-pi.sh` (Pi only)
- **Install Dependencies** - Installs `requirements.txt`

### Usage

1. **Open VS Code** in the project directory
2. **Run and Debug** (Ctrl+Shift+D) or **Terminal** → **Run Task**
3. **Select configuration** and press F5
4. **View output** in integrated terminal

### Debugging Executables

To debug issues with executables:
1. Use **"Python: Launcher Script"** configuration
2. Set breakpoints in `launcher.py`
3. Step through server startup and browser launch
4. Check console output for detailed error messages

## File Structure

### Build Files
- `launcher.py` - Universal launcher script with platform detection
- `windows.spec` - PyInstaller configuration for Windows
- `raspberry-pi.spec` - PyInstaller configuration for Raspberry Pi
- `build-windows.bat` - Windows build automation script
- `build-pi.sh` - Raspberry Pi build automation script

### Output Files
- `dist/ManyPaintings-Windows.exe` - Windows executable
- `dist/ManyPaintings-RaspberryPi` - Raspberry Pi executable

## Launcher Features

The launcher script (`launcher.py`) provides:

### Platform Detection
- **Automatic Detection** - Windows vs Raspberry Pi identification
- **Configuration Selection** - Uses appropriate environment settings
- **Performance Optimization** - Platform-specific optimizations

### Browser Integration
- **App Mode** - Clean, borderless browser window (current default)
- **Chrome Priority** - Prefers Chrome over Edge on Windows
- **Fallback Support** - Uses default browser if Chrome/Chromium unavailable
- **Isolated Profile** - Custom user data directory prevents conflicts

### Launch Modes
```python
# Current: App mode (windowed kiosk)
browser_process = launch_browser_kiosk_windowed(kiosk_url, port)

# Available: Full kiosk mode (uncomment to use)
# browser_process = launch_browser_kiosk(kiosk_url, port)

# Available: Normal browser window
# browser_process = launch_browser_normal(normal_url, port)
```

### Server Management
- **Background Threading** - Flask server runs in daemon thread
- **Health Monitoring** - Waits for server ready before browser launch
- **Graceful Shutdown** - Terminates cleanly when browser closes
- **Detailed Logging** - Comprehensive debug output

### Error Handling & Diagnostics
- **Startup Diagnostics** - Shows resource paths, config selection, browser detection
- **Fallback Mechanisms** - Multiple browser paths, urllib fallback for requests
- **Exception Handling** - Catches and reports server startup errors
- **Debug Mode** - Verbose output for troubleshooting

## Configuration

The executable uses these Flask configurations:
- Windows: `production` environment
- Raspberry Pi: `raspberry_pi` environment (optimized settings)

Settings are loaded from `config.json` with environment-specific overrides.

## Troubleshooting

### Windows Issues

**Build Fails**: 
- Ensure Python 3.9+ is installed
- Check that all dependencies install correctly
- Try running `build-windows.bat` as Administrator

**Executable Doesn't Start**:
- Check console output for error messages
- Verify all static files are included
- Test with `Python: Launcher Script` configuration first

### Raspberry Pi Issues

**Build Fails**:
```bash
# Install system dependencies
sudo apt update
sudo apt install python3-dev libjpeg-dev zlib1g-dev libfreetype6-dev
```

**Executable Doesn't Start**:
- Ensure you built on actual Raspberry Pi hardware
- Check that Chromium is installed: `sudo apt install chromium-browser`
- Verify executable permissions: `chmod +x ManyPaintings-RaspberryPi`

### Common Issues

**Server Won't Start**:
- Port 5000 may be in use by another application
- Check firewall settings
- Review debug output in console

**Browser Won't Connect**:
- Server may not have started successfully
- Check the debug output for Flask startup errors
- Try manually opening `http://localhost:5000` in browser

**Missing Assets**:
- Ensure `static/images/` contains art files
- Verify `config.json` exists
- Check that templates are included

## Distribution

### Windows
Distribute the single file: `ManyPaintings-Windows.exe`
- No Python installation required on target machines
- All dependencies bundled
- Double-click to run

### Raspberry Pi
Distribute: `ManyPaintings-RaspberryPi`
- Must be built on Raspberry Pi architecture
- Copy to other Raspberry Pi systems
- Make executable: `chmod +x ManyPaintings-RaspberryPi`
- Run with: `./ManyPaintings-RaspberryPi`

## Performance Notes

### Windows
- Executable size: ~50-100MB (includes Python runtime)
- Startup time: 3-5 seconds
- Memory usage: ~100-200MB

### Raspberry Pi
- Executable size: ~80-150MB
- Startup time: 5-10 seconds on Pi 4
- Memory usage: ~150-300MB
- Optimized settings reduce resource usage

## Development

To modify the launcher behavior:
1. Edit `launcher.py`
2. Test with `Python: Launcher Script` configuration
3. Rebuild executable with build scripts
4. Test final executable

For kiosk mode, change in `launcher.py`:
```python
# Change this line:
browser_process = launch_browser_normal(normal_url, port)
# To this:
browser_process = launch_browser_kiosk(kiosk_url, port)
```