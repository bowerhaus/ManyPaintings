#!/usr/bin/env python3
"""
Samsung TV Remote Control Monitor
Monitors CEC for remote control button presses
"""
import subprocess
import sys
import signal
import re
import time

# Button code mappings for Samsung remotes
BUTTON_CODES = {
    'Select': 'OK/Select',
    'Up': 'Up Arrow',
    'Down': 'Down Arrow', 
    'Left': 'Left Arrow',
    'Right': 'Right Arrow',
    'Exit': 'Back/Exit',
    'Play': 'Play',
    'Pause': 'Pause',
    'Stop': 'Stop',
    'F1': 'Red',
    'F2': 'Green',
    'F3': 'Yellow',
    'F4': 'Blue',
}

class RemoteMonitor:
    def __init__(self):
        self.device = "/dev/cec0"
        self.running = False
        
    def start(self):
        """Start monitoring remote control"""
        print("🎮 Samsung TV Remote Monitor")
        print("=" * 40)
        print("Press buttons on your Samsung TV remote")
        print("Press Ctrl+C to stop")
        print("=" * 40 + "\n")
        
        # Set up as playback device first
        subprocess.run(
            ['cec-ctl', '-d', self.device, '--playback'],
            capture_output=True
        )
        time.sleep(1)
        
        # Start monitoring
        cmd = ['cec-ctl', '-d', self.device, '--monitor-all']
        
        try:
            self.running = True
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            
            print("Waiting for remote control input...\n")
            
            while True:
                line = process.stdout.readline()
                if not line and process.poll() is not None:
                    break
                if not self.running:
                    break
                    
                line = line.strip()
                if not line:
                    continue
                
                # Look for various CEC message formats
                if any(keyword in line.lower() for keyword in 
                       ['user control', 'user-control', 'ui command', 'ui-command']):
                    
                    # Try to extract button info
                    button = self.parse_button(line)
                    if button:
                        timestamp = time.strftime("%H:%M:%S")
                        print(f"[{timestamp}] 🔘 {button}")
                
                # Show raw message in verbose mode
                if '--verbose' in sys.argv:
                    print(f"  RAW: {line}")
                    
        except KeyboardInterrupt:
            print("\n\n✋ Stopped monitoring")
        finally:
            self.running = False
            if process:
                process.terminate()
    
    def parse_button(self, line):
        """Parse button from CEC message"""
        # Look for button names
        for code, name in BUTTON_CODES.items():
            if code in line:
                return name
        
        # Look for hex codes
        hex_match = re.search(r'0x[0-9a-f]{2}', line, re.IGNORECASE)
        if hex_match:
            return f"Button code: {hex_match.group()}"
        
        # Look for "Pressed" or "Released"  
        if 'pressed' in line.lower():
            return "Button pressed (unknown)"
        elif 'released' in line.lower():
            return "Button released"
        
        return None

def main():
    monitor = RemoteMonitor()
    
    # Add signal handler for clean exit
    def signal_handler(sig, frame):
        monitor.running = False
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    # Start monitoring
    monitor.start()

if __name__ == "__main__":
    main()