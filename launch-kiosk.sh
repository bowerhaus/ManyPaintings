#!/bin/bash

echo "==============================================="
echo "ManyPaintings - Full Screen Kiosk Mode"
echo "==============================================="
echo ""
echo "Starting application in full screen kiosk mode..."
echo ""

# Force external access for ARM/Raspberry Pi devices
export FORCE_EXTERNAL_ACCESS=1

# Run the Python launcher which will start Flask and open browser in kiosk mode
python3 launcher.py