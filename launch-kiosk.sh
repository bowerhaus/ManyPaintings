#!/bin/bash

echo "==============================================="
echo "ManyPaintings - Kiosk Mode"
echo "==============================================="

# Force external access for ARM/Raspberry Pi devices
export FORCE_EXTERNAL_ACCESS=1

# Launch in kiosk mode
python3 launcher.py kiosk