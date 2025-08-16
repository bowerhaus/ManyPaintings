#!/usr/bin/env python3
"""
CEC Remote Control Event Monitor
Receives and displays remote control button presses from TV
"""
import subprocess
import sys
import signal
import re

# Map CEC key codes to readable names
KEY_MAP = {
    '0x00': 'Select/OK',
    '0x01': 'Up',
    '0x02': 'Down',
    '0x03': 'Left', 
    '0x04': 'Right',
    '0x0d': 'Back/Return',
    '0x20': '0',
    '0x21': '1',
    '0x22': '2',
    '0x23': '3',
    '0x24': '4',
    '0x25': '5',
    '0x26': '6',
    '0x27': '7',
    '0x28': '8',
    '0x29': '9',
    '0x44': 'Play',
    '0x45': 'Stop',
    '0x46': 'Pause',
    '0x48': 'Rewind',
    '0x49': 'Fast Forward',
    '0x4b': 'Previous',
    '0x4c': 'Next',
    '0x71': 'Blue',
    '0x72': 'Red',
    '0x73': 'Green',
    '0x74': 'Yellow',
    '0x91': 'Menu',
}

def signal_handler(sig, frame):
    print('\n\n✋ Stopped monitoring remote control')
    sys.exit(0)

def monitor_remote(device="/dev/cec1"):
    """Monitor CEC for remote control events"""
    print(f"🎮 Monitoring TV remote control on {device}")
    print("Press TV remote buttons to see events")
    print("Press Ctrl+C to stop\n")
    
    # Register signal handler for clean exit
    signal.signal(signal.SIGINT, signal_handler)
    
    # Monitor mode - wait for remote control events
    cmd = ['cec-ctl', '-d', device, '-M']
    
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        
        # Process output line by line
        for line in iter(process.stdout.readline, ''):
            if not line:
                break
            
            line = line.strip()
            
            # Look for User Control Pressed messages
            if 'User Control Pressed' in line or 'user-control-pressed' in line.lower():
                # Extract key code
                key_match = re.search(r'key:\s*([0-9a-fx]+)', line, re.IGNORECASE)
                if key_match:
                    key_code = key_match.group(1)
                    key_name = KEY_MAP.get(key_code, f'Unknown ({key_code})')
                    print(f"📱 Button pressed: {key_name}")
                else:
                    # Try alternative format
                    ui_match = re.search(r'ui-cmd:\s*([0-9a-fx]+)', line, re.IGNORECASE)
                    if ui_match:
                        key_code = ui_match.group(1)
                        key_name = KEY_MAP.get(key_code, f'Unknown ({key_code})')
                        print(f"📱 Button pressed: {key_name}")
                    else:
                        print(f"📱 Remote event: {line}")
            
            # Look for User Control Released messages
            elif 'User Control Released' in line or 'user-control-released' in line.lower():
                print(f"📱 Button released")
            
            # Show other CEC events in debug mode
            elif '--debug' in sys.argv:
                print(f"[DEBUG] {line}")
        
        process.wait()
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    
    return True

def main():
    print("=== CEC Remote Control Monitor ===\n")
    
    # Check both devices
    devices = ["/dev/cec1", "/dev/cec0"]
    
    for device in devices:
        # First check if device is accessible
        try:
            result = subprocess.run(
                ['cec-ctl', '-d', device],
                capture_output=True,
                text=True,
                timeout=2
            )
            if result.returncode == 0:
                print(f"✅ Found CEC device: {device}")
                
                # Set as playback device to receive remote events
                print(f"   Setting up as playback device...")
                subprocess.run(
                    ['cec-ctl', '-d', device, '--playback'],
                    capture_output=True,
                    timeout=2
                )
                
                # Start monitoring
                monitor_remote(device)
                break
        except:
            print(f"❌ {device} not accessible")
            continue
    else:
        print("\n❌ No working CEC devices found")
        print("Make sure CEC is enabled in /boot/config.txt")

if __name__ == "__main__":
    main()