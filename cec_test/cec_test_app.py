#!/usr/bin/env python3
import sys
import time
import subprocess
import re


class CECController:
    def __init__(self, device="/dev/cec0"):
        self.device = device
        print(f"Using CEC device: {device}")
        
        # Test if device is accessible
        try:
            result = subprocess.run(
                ['cec-ctl', '-d', device],
                capture_output=True,
                text=True,
                timeout=2
            )
            if result.returncode == 0:
                print("CEC device initialized successfully")
                # Extract physical address
                match = re.search(r'Physical Address\s*:\s*([\d.]+)', result.stdout)
                if match:
                    print(f"Physical address: {match.group(1)}")
            else:
                print(f"Warning: CEC device may not be fully accessible: {result.stderr}")
        except Exception as e:
            print(f"Error initializing CEC: {e}")
    
    def power_on_tv(self):
        """Turn the TV on using Image View On command"""
        try:
            print("Sending power on command...")
            # Image View On (0x04) - wakes up the TV
            result = subprocess.run(
                ['cec-ctl', '-d', self.device, '--image-view-on', '--to', '0'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                print("TV power on command sent successfully")
                return True
            else:
                print(f"Power on failed: {result.stderr}")
                # Try alternative: Active Source command
                print("Trying alternative: Active Source command...")
                result = subprocess.run(
                    ['cec-ctl', '-d', self.device, '--active-source'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    print("Active source command sent")
                    return True
                return False
        except subprocess.TimeoutExpired:
            print("Power on command timed out")
            return False
        except Exception as e:
            print(f"Error sending power on: {e}")
            return False
    
    def power_off_tv(self):
        """Turn the TV off (standby)"""
        try:
            print("Sending standby command...")
            # Standby (0x36) - puts TV into standby
            result = subprocess.run(
                ['cec-ctl', '-d', self.device, '--standby', '--to', '0'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                print("TV standby command sent successfully")
                return True
            else:
                print(f"Standby failed: {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            print("Standby command timed out")
            return False
        except Exception as e:
            print(f"Error sending standby: {e}")
            return False
    
    def get_power_status(self):
        """Check TV power status"""
        try:
            print("Checking TV power status...")
            # Give Device Power Status (0x8f) - requests power status
            result = subprocess.run(
                ['cec-ctl', '-d', self.device, '--give-device-power-status', '--to', '0'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                output = result.stdout.lower()
                # Parse the response for power status
                if 'power status: on' in output or 'pwr-status: on' in output:
                    print("TV is ON")
                    return "on"
                elif 'power status: standby' in output or 'pwr-status: standby' in output:
                    print("TV is in STANDBY")
                    return "standby"
                elif 'power status: in transition standby to on' in output:
                    print("TV is transitioning from STANDBY to ON")
                    return "transitioning_on"
                elif 'power status: in transition on to standby' in output:
                    print("TV is transitioning from ON to STANDBY")
                    return "transitioning_off"
                else:
                    # Try to extract any power status info
                    if 'on' in output and 'standby' not in output:
                        print("TV appears to be ON")
                        return "on"
                    elif 'standby' in output:
                        print("TV appears to be in STANDBY")
                        return "standby"
                    else:
                        print(f"Could not determine power status from output")
                        return "unknown"
            else:
                print(f"Failed to get power status: {result.stderr}")
                return "error"
        except subprocess.TimeoutExpired:
            print("Power status check timed out (TV might be off)")
            return "timeout"
        except Exception as e:
            print(f"Error checking power status: {e}")
            return "error"
    
    def scan_cec_devices(self):
        """Scan for all CEC devices on the bus"""
        try:
            print("Scanning CEC bus for devices...")
            result = subprocess.run(
                ['cec-ctl', '-d', self.device, '--tv', '--poll-all'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                print("CEC scan output:")
                print(result.stdout)
                return result.stdout
            else:
                print(f"Scan failed: {result.stderr}")
                return None
        except Exception as e:
            print(f"Error scanning: {e}")
            return None


def main():
    print("=== CEC TV Power Control Test ===")
    print()
    
    # Check if both CEC devices exist and let user choose
    devices = []
    for i in range(2):
        device = f"/dev/cec{i}"
        try:
            result = subprocess.run(['ls', device], capture_output=True)
            if result.returncode == 0:
                devices.append(device)
        except:
            pass
    
    if not devices:
        print("ERROR: No CEC devices found!")
        print("Make sure CEC is enabled in /boot/config.txt")
        return
    
    chosen_device = devices[0]  # Default to first device
    if len(devices) > 1:
        print(f"Found {len(devices)} CEC devices:")
        for i, dev in enumerate(devices):
            print(f"  {i+1}. {dev}")
        choice = input(f"Choose device (1-{len(devices)}) [default: 1]: ").strip()
        if choice and choice.isdigit() and 1 <= int(choice) <= len(devices):
            chosen_device = devices[int(choice) - 1]
    
    controller = CECController(chosen_device)
    
    while True:
        print("\nOptions:")
        print("1. Turn TV ON")
        print("2. Turn TV OFF (Standby)")
        print("3. Check TV Power Status")
        print("4. Scan CEC Bus")
        print("5. Exit")
        
        choice = input("\nEnter choice (1-5): ").strip()
        
        if choice == "1":
            controller.power_on_tv()
        elif choice == "2":
            controller.power_off_tv()
        elif choice == "3":
            controller.get_power_status()
        elif choice == "4":
            controller.scan_cec_devices()
        elif choice == "5":
            print("Exiting...")
            break
        else:
            print("Invalid choice. Please enter 1-5.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(0)