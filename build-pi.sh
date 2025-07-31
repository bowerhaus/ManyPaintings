#!/bin/bash
# ManyPaintings Raspberry Pi Build Script
# Builds executable using PyInstaller on Raspberry Pi

set -e  # Exit on any error

echo "======================================"
echo "ManyPaintings Raspberry Pi Build Script"
echo "======================================"

# Check if we're actually on a Raspberry Pi
if [ ! -f /proc/cpuinfo ] || ! grep -q "BCM" /proc/cpuinfo; then
    echo "WARNING: This doesn't appear to be a Raspberry Pi"
    echo "The executable may not work correctly on actual Pi hardware"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Build cancelled"
        exit 1
    fi
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Install with: sudo apt update && sudo apt install python3 python3-pip python3-venv"
    exit 1
fi

echo "Python found:"
python3 --version

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to create virtual environment"
        echo "Try: sudo apt install python3-venv"
        exit 1
    fi
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to activate virtual environment"
    exit 1
fi

# Upgrade pip
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install requirements"
    echo "You may need to install system dependencies:"
    echo "sudo apt update"
    echo "sudo apt install python3-dev libjpeg-dev zlib1g-dev libfreetype6-dev"
    exit 1
fi

# Install PyInstaller
echo "Installing PyInstaller..."
pip install pyinstaller
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install PyInstaller"
    exit 1
fi

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf build dist
rm -f ManyPaintings-RaspberryPi

# Build executable
echo "Building Raspberry Pi executable..."
echo "This may take several minutes on a Raspberry Pi..."
pyinstaller raspberry-pi.spec --clean --noconfirm
if [ $? -ne 0 ]; then
    echo "ERROR: PyInstaller build failed"
    exit 1
fi

# Move executable to root directory
if [ -f "dist/ManyPaintings-RaspberryPi" ]; then
    mv "dist/ManyPaintings-RaspberryPi" "ManyPaintings-RaspberryPi"
    chmod +x "ManyPaintings-RaspberryPi"
    
    echo
    echo "======================================"
    echo "BUILD SUCCESSFUL!"
    echo "======================================"
    echo
    echo "Executable created: ManyPaintings-RaspberryPi"
    echo "File size:"
    ls -lh "ManyPaintings-RaspberryPi" | awk '{print $5, $9}'
    echo
    echo "Architecture:"
    file "ManyPaintings-RaspberryPi"
    echo
    echo "You can now run: ./ManyPaintings-RaspberryPi"
    echo "Or copy this file to other Raspberry Pi systems"
else
    echo "ERROR: Executable not found in dist directory"
    exit 1
fi

# Clean up build directories
echo "Cleaning up build files..."
rm -rf build dist

# Create desktop entry for easier launching
DESKTOP_FILE="$HOME/Desktop/ManyPaintings.desktop"
echo "Creating desktop launcher..."

cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=ManyPaintings
Comment=Generative Art Display
Exec=$(pwd)/ManyPaintings-RaspberryPi
Icon=applications-graphics
Terminal=false
Categories=Graphics;Art;
EOF

chmod +x "$DESKTOP_FILE"

echo
echo "Desktop launcher created: $DESKTOP_FILE"
echo "You can now double-click the desktop icon to launch ManyPaintings"
echo
echo "Build complete!"