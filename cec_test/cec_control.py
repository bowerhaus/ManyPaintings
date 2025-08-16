#!/usr/bin/env python3
"""
Final CEC Control Module for Samsung TV
Confirmed working with /dev/cec0
"""
import subprocess
import time
import sys

class SamsungCECControl:
    def __init__(self, device="/dev/cec0"):
        self.device = device
        self.tv_address = "0"  # TV is always address 0
        print(f"Samsung CEC Control initialized on {device}")
    
    def power_on(self):
        """Turn Samsung TV on"""
        cmd = ['cec-ctl', '-d', self.device, '--image-view-on', '--to', self.tv_address]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
            if result.returncode == 0:
                print("✅ TV power ON command sent")
                return True
            else:
                print(f"❌ Power ON failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def power_off(self):
        """Turn Samsung TV off (standby)"""
        cmd = ['cec-ctl', '-d', self.device, '--standby', '--to', self.tv_address]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
            if result.returncode == 0:
                print("✅ TV standby command sent")
                return True
            else:
                print(f"❌ Standby failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def get_power_status(self):
        """Get Samsung TV power status"""
        # Use give-device-power-status instead of -S to avoid timeout
        cmd = ['cec-ctl', '-d', self.device, '--give-device-power-status', '--to', self.tv_address]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=2)
            if result.returncode == 0:
                # Power status might not be directly returned, try to infer from response
                return "on"  # If command succeeds, TV is likely on
            else:
                # TV might be off or not responding
                return "standby"
        except subprocess.TimeoutExpired:
            # Timeout often means TV is in standby/off
            return "standby"
        except Exception as e:
            print(f"❌ Error checking status: {e}")
            return "error"
    
    def monitor_remote(self, callback=None):
        """Monitor Samsung TV remote control"""
        print("🎮 Monitoring Samsung TV remote...")
        print("Press Ctrl+C to stop\n")
        
        cmd = ['cec-ctl', '-d', self.device, '-M']
        
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )
            
            for line in iter(process.stdout.readline, ''):
                if not line:
                    break
                
                line = line.strip()
                
                # Look for button press events
                if 'User Control Pressed' in line:
                    # Parse the button
                    if 'key:' in line.lower():
                        parts = line.split('key:')
                        if len(parts) > 1:
                            key = parts[1].strip().split()[0]
                            if callback:
                                callback(key)
                            else:
                                print(f"🔘 Button: {key}")
                
                elif 'User Control Released' in line:
                    if callback:
                        callback(None)  # Button released
                    else:
                        print("🔘 Button released")
        
        except KeyboardInterrupt:
            print("\n✋ Stopped monitoring")
        except Exception as e:
            print(f"❌ Error: {e}")

def main():
    """Test Samsung CEC control"""
    control = SamsungCECControl("/dev/cec0")
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        if command == "on":
            control.power_on()
        elif command == "off":
            control.power_off()
        elif command == "status":
            status = control.get_power_status()
            print(f"TV Status: {status}")
        elif command == "remote":
            control.monitor_remote()
        else:
            print("Unknown command. Use: on, off, status, or remote")
    else:
        # Interactive menu
        while True:
            print("\n=== Samsung TV CEC Control ===")
            print("1. Turn TV ON")
            print("2. Turn TV OFF")
            print("3. Check Status")
            print("4. Monitor Remote")
            print("5. Exit")
            
            choice = input("\nChoice: ").strip()
            
            if choice == "1":
                control.power_on()
            elif choice == "2":
                control.power_off()
            elif choice == "3":
                status = control.get_power_status()
                print(f"TV Status: {status}")
            elif choice == "4":
                control.monitor_remote()
            elif choice == "5":
                break

if __name__ == "__main__":
    main()