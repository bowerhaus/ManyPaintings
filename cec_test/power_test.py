#!/usr/bin/env python3
"""
Simple CEC TV Power Control Test
Run with: python3 power_test.py [on|off|status]
"""
import sys
import subprocess
import time

def send_cec_command(device, command_args):
    """Send a CEC command and return the result"""
    cmd = ['cec-ctl', '-d', device] + command_args
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def power_on(device="/dev/cec0"):
    """Turn TV on"""
    print(f"Sending power ON to TV via {device}...")
    
    # Try Image View On command
    success, stdout, stderr = send_cec_command(device, ['--image-view-on', '--to', '0'])
    if success:
        print("✓ Power ON command sent (Image View On)")
        return True
    
    # Try Active Source as fallback
    print("  Trying Active Source command...")
    success, stdout, stderr = send_cec_command(device, ['--active-source'])
    if success:
        print("✓ Active Source command sent")
        return True
    
    print(f"✗ Failed to send power on: {stderr}")
    return False

def power_off(device="/dev/cec0"):
    """Turn TV off (standby)"""
    print(f"Sending STANDBY to TV via {device}...")
    
    success, stdout, stderr = send_cec_command(device, ['--standby', '--to', '0'])
    if success:
        print("✓ Standby command sent")
        return True
    
    print(f"✗ Failed to send standby: {stderr}")
    return False

def power_status(device="/dev/cec0"):
    """Check TV power status"""
    print(f"Checking TV power status via {device}...")
    
    success, stdout, stderr = send_cec_command(device, ['--give-device-power-status', '--to', '0'])
    if success and stdout:
        # Try to parse status from output
        output_lower = stdout.lower()
        if 'on' in output_lower and 'standby' not in output_lower:
            print("📺 TV appears to be ON")
        elif 'standby' in output_lower:
            print("💤 TV appears to be in STANDBY")
        else:
            print(f"❓ Status unclear. Raw output:\n{stdout[:500]}")
    else:
        print(f"✗ Could not get status: {stderr if stderr else 'No response'}")
    
    return success

def main():
    # Check which device to use (try cec1 first as it's often the active HDMI port)
    devices_to_try = ["/dev/cec1", "/dev/cec0"]
    
    if len(sys.argv) < 2:
        print("Usage: python3 power_test.py [on|off|status]")
        print("\nExamples:")
        print("  python3 power_test.py on      # Turn TV on")
        print("  python3 power_test.py off     # Turn TV off")
        print("  python3 power_test.py status  # Check power status")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    # Try each device
    for device in devices_to_try:
        print(f"\n--- Trying {device} ---")
        
        if command == "on":
            if power_on(device):
                print(f"\n✅ Success with {device}")
                break
        elif command == "off":
            if power_off(device):
                print(f"\n✅ Success with {device}")
                break
        elif command == "status":
            if power_status(device):
                break
        else:
            print(f"Unknown command: {command}")
            print("Use: on, off, or status")
            sys.exit(1)
        
        print(f"  No success with {device}, trying next...")
    
    print("\n--- Test Complete ---")

if __name__ == "__main__":
    main()