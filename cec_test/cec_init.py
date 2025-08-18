#!/usr/bin/env python3
"""
Initialize CEC properly as a playback device
This is often required before TVs will respond to commands
"""
import subprocess
import time

def init_cec_as_playback(device="/dev/cec1"):
    """Initialize CEC adapter as playback device"""
    print(f"🔧 Initializing {device} as Playback Device\n")
    
    # Step 1: Clear any existing logical address
    print("1. Clearing logical addresses...")
    cmd = ['cec-ctl', '-d', device, '-C']
    subprocess.run(cmd, capture_output=True)
    time.sleep(1)
    
    # Step 2: Configure as playback device
    print("2. Configuring as Playback Device...")
    cmd = ['cec-ctl', '-d', device, '--playback', '-S']
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print("   ✓ Configured as playback device")
        # Parse the output for logical address
        for line in result.stdout.split('\n'):
            if 'Logical Address' in line:
                print(f"   {line.strip()}")
    else:
        print(f"   ✗ Configuration failed")
        return False
    
    time.sleep(1)
    
    # Step 3: Report physical address
    print("3. Reporting physical address...")
    cmd = ['cec-ctl', '-d', device, '--report-physical-addr']
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print("   ✓ Physical address reported")
    
    # Step 4: Set OSD name
    print("4. Setting OSD name...")
    cmd = ['cec-ctl', '-d', device, '--set-osd-name=RaspberryPi']
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print("   ✓ OSD name set")
    
    print("\n✅ Initialization complete!")
    return True

def test_after_init(device="/dev/cec1"):
    """Test power commands after initialization"""
    print("\n🧪 Testing power control after initialization...\n")
    
    # Test power off
    print("Sending Standby command...")
    cmd = ['cec-ctl', '-d', device, '--standby', '--to', '0']
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print("✓ Standby command sent successfully")
        return True
    else:
        print("✗ Standby command failed")
        return False

def main():
    device = "/dev/cec1"
    
    # Initialize CEC
    if init_cec_as_playback(device):
        # Wait a moment for TV to recognize the device
        print("\nWaiting 2 seconds for TV to recognize device...")
        time.sleep(2)
        
        # Test power control
        test_after_init(device)
        
        print("\n" + "="*50)
        print("CEC is now initialized. You can test with:")
        print("  python3 power_test.py off")
        print("  python3 power_test.py on")
        print("  python3 remote_test.py")
    else:
        print("\n❌ Initialization failed")

if __name__ == "__main__":
    main()