#!/bin/bash

echo "==============================================="
echo "ManyPaintings - Normal Mode (Full Screen)"
echo "==============================================="
echo ""
echo "Starting application in normal browser mode with full screen..."
echo "Press F11 to toggle full screen mode"
echo "Press Alt+F4 or close the browser to exit"
echo ""

# Force external access for ARM/Raspberry Pi devices
export FORCE_EXTERNAL_ACCESS=1

# Run the Python launcher in normal-fullscreen mode
python3 launcher.py normal-fullscreen