#!/bin/bash

echo "==============================================="
echo "ManyPaintings - Kill Kiosk for Debugging"
echo "==============================================="

# Stop the systemd service first
echo "Stopping systemd service..."
sudo systemctl stop manypaintings-kiosk.service
if [ $? -eq 0 ]; then
    echo "✓ Systemd service stopped"
else
    echo "⚠ Systemd service may not be running"
fi

# Kill Chrome/Chromium processes
echo "Killing Chrome/Chromium processes..."
CHROME_PIDS=$(pgrep -f "chromium-browser\|chrome")
if [ -n "$CHROME_PIDS" ]; then
    pkill -f "chromium-browser"
    pkill -f "chrome"
    echo "✓ Chrome/Chromium processes killed"
else
    echo "⚠ No Chrome/Chromium processes found"
fi

# Kill Python Flask processes
echo "Killing Python Flask processes..."
PYTHON_PIDS=$(pgrep -f "python.*launcher.py\|python.*app.py")
if [ -n "$PYTHON_PIDS" ]; then
    pkill -f "python.*launcher.py"
    pkill -f "python.*app.py"
    echo "✓ Python Flask processes killed"
else
    echo "⚠ No Python Flask processes found"
fi

# Wait a moment for processes to terminate
sleep 2

# Check if any processes are still running
REMAINING=$(pgrep -f "ManyPaintings\|launcher.py\|chromium.*localhost")
if [ -n "$REMAINING" ]; then
    echo "⚠ Some processes may still be running:"
    ps aux | grep -E "ManyPaintings|launcher.py|chromium.*localhost" | grep -v grep
    echo "Use 'kill -9 <PID>' if needed"
else
    echo "✓ All ManyPaintings processes terminated"
fi

echo "==============================================="
echo "Kiosk stopped for debugging"
echo "To restart: sudo systemctl start manypaintings-kiosk.service"
echo "Or just reboot the system"
echo "==============================================="