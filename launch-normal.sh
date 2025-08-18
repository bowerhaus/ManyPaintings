#!/bin/bash

echo "==============================================="
echo "ManyPaintings - Normal Mode (Windowed)"
echo "==============================================="
echo ""
echo "Starting application in normal browser mode..."
echo "Press F11 to enter full screen mode"
echo "Press Ctrl+C in this window or close the browser to exit"
echo ""

# Force external access for ARM/Raspberry Pi devices
export FORCE_EXTERNAL_ACCESS=1

# Run the Python launcher in normal mode
python3 launcher.py normal