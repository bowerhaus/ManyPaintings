#!/bin/bash

echo "==============================================="
echo "ManyPaintings - Launcher Menu"
echo "==============================================="
echo ""
echo "Select launch mode:"
echo "  1. Kiosk Mode (Full Screen, no browser UI)"
echo "  2. Normal Mode (Full Screen with browser UI)"
echo "  3. Normal Mode (Windowed)"
echo "  4. Exit"
echo ""
read -p "Enter your choice (1-4): " choice

# Force external access for ARM/Raspberry Pi devices
export FORCE_EXTERNAL_ACCESS=1

case $choice in
    1)
        python3 launcher.py kiosk
        ;;
    2)
        python3 launcher.py normal-fullscreen
        ;;
    3)
        python3 launcher.py normal
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Please run again."
        ;;
esac