#!/usr/bin/env python3
import subprocess
import sys

def test_cec_device(device="/dev/cec0"):
    print(f"\n=== Testing CEC on {device} ===\n")
    
    # 1. Check device info
    print("1. Getting device info...")
    result = subprocess.run(
        ['cec-ctl', '-d', device],
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        print("   ✓ Device accessible")
        print(f"   Output: {result.stdout[:200]}...")
    else:
        print(f"   ✗ Error: {result.stderr}")
        return False
    
    # 2. Scan CEC bus
    print("\n2. Scanning CEC bus...")
    result = subprocess.run(
        ['cec-ctl', '-d', device, '-S'],
        capture_output=True,
        text=True,
        timeout=3
    )
    print(f"   Devices found: {result.stdout[:300]}...")
    
    # 3. Try to get TV power status
    print("\n3. Checking TV power status...")
    result = subprocess.run(
        ['cec-ctl', '-d', device, '--give-device-power-status', '--to', '0'],
        capture_output=True,
        text=True,
        timeout=3
    )
    if 'power' in result.stdout.lower() or 'pwr' in result.stdout.lower():
        print(f"   Response received: {result.stdout[:200]}")
    else:
        print(f"   No clear power status response")
    
    return True

if __name__ == "__main__":
    # Test both devices
    for device in ["/dev/cec0", "/dev/cec1"]:
        try:
            test_cec_device(device)
        except Exception as e:
            print(f"Error testing {device}: {e}")
    
    print("\n=== Quick test complete ===")
    print("\nTo control TV power, run the interactive app:")
    print("  python3 cec_test_app.py")