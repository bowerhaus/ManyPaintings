#!/bin/bash

echo "==============================================="
echo "ManyPaintings - Server with External Access"
echo "==============================================="
echo ""
echo "Starting Flask server with external access enabled..."
echo "The server will be accessible from other devices on your network."
echo ""

# Set environment for Raspberry Pi with external access
export FLASK_CONFIG=raspberry_pi

# Get IP address (filter out IPv6 and get first IPv4)
IP=$(hostname -I | tr ' ' '\n' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | grep -v '^127\.' | head -1)

# Fallback if hostname -I doesn't work well
if [ -z "$IP" ] || [[ "$IP" == 127.* ]]; then
    # Try ip addr command
    IP=$(ip addr show | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | cut -d'/' -f1 | head -1)
fi

# Final fallback
if [ -z "$IP" ]; then
    IP="YOUR_PI_IP_ADDRESS"
fi

echo "Server will be accessible at:"
echo "  Main display: http://$IP:5000"
echo "  Kiosk mode: http://$IP:5000/kiosk"
echo "  iPhone Remote: http://$IP:5000/remote"
echo ""

# Run Flask app directly with external binding
python3 -c "
import sys
sys.path.insert(0, '.')
from app import create_app

app = create_app('raspberry_pi')
print('Starting server on 0.0.0.0:5000 (accessible from all network interfaces)')
app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False, threaded=True)
"