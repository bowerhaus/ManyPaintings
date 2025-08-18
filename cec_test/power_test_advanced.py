#!/usr/bin/env python3
"""
Advanced CEC TV Power Control Test
Tries multiple methods to control TV power
"""
import sys
import subprocess
import time

def send_raw_cec(device, opcode, params=""):
    """Send raw CEC message"""
    # Format: cec-ctl -d /dev/cec1 -t 0 -S "opcode:params"
    cmd = ['cec-ctl', '-d', device, '-t', '0', '-S']
    if params:
        cmd.append(f"{opcode}:{params}")
    else:
        cmd.append(opcode)
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def try_all_power_off_methods(device="/dev/cec1"):
    """Try multiple methods to turn TV off"""
    print(f"\n🔍 Testing all power OFF methods on {device}\n")
    
    methods_tried = []
    
    # Method 1: Standard Standby
    print("1. Standard Standby command...")
    success, out, err = send_raw_cec(device, "0x36")
    methods_tried.append(("Standby (0x36)", success))
    if success:
        print("   ✓ Sent")
    else:
        print(f"   ✗ Failed: {err}")
    time.sleep(1)
    
    # Method 2: System Standby (broadcast)
    print("2. System Standby (broadcast to all)...")
    cmd = ['cec-ctl', '-d', device, '--standby']
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
        success = result.returncode == 0
        methods_tried.append(("System Standby", success))
        if success:
            print("   ✓ Sent")
        else:
            print(f"   ✗ Failed")
    except:
        methods_tried.append(("System Standby", False))
        print("   ✗ Failed")
    time.sleep(1)
    
    # Method 3: Inactive Source
    print("3. Inactive Source command...")
    cmd = ['cec-ctl', '-d', device, '--inactive-source']
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
        success = result.returncode == 0
        methods_tried.append(("Inactive Source", success))
        if success:
            print("   ✓ Sent")
        else:
            print(f"   ✗ Failed")
    except:
        methods_tried.append(("Inactive Source", False))
        print("   ✗ Failed")
    
    # Summary
    print("\n📊 Summary:")
    for method, success in methods_tried:
        status = "✓" if success else "✗"
        print(f"   {status} {method}")
    
    return any(s for _, s in methods_tried)

def try_all_power_on_methods(device="/dev/cec1"):
    """Try multiple methods to turn TV on"""
    print(f"\n🔍 Testing all power ON methods on {device}\n")
    
    methods_tried = []
    
    # Method 1: Image View On
    print("1. Image View On command...")
    success, out, err = send_raw_cec(device, "0x04")
    methods_tried.append(("Image View On (0x04)", success))
    if success:
        print("   ✓ Sent")
    else:
        print(f"   ✗ Failed: {err}")
    time.sleep(1)
    
    # Method 2: Text View On
    print("2. Text View On command...")
    success, out, err = send_raw_cec(device, "0x0D")
    methods_tried.append(("Text View On (0x0D)", success))
    if success:
        print("   ✓ Sent")
    else:
        print(f"   ✗ Failed: {err}")
    time.sleep(1)
    
    # Method 3: Active Source
    print("3. Active Source command...")
    cmd = ['cec-ctl', '-d', device, '--active-source']
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
        success = result.returncode == 0
        methods_tried.append(("Active Source", success))
        if success:
            print("   ✓ Sent")
        else:
            print(f"   ✗ Failed")
    except:
        methods_tried.append(("Active Source", False))
        print("   ✗ Failed")
    time.sleep(1)
    
    # Method 4: Set Stream Path
    print("4. Set Stream Path command...")
    cmd = ['cec-ctl', '-d', device, '--set-stream-path=1.0.0.0']
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
        success = result.returncode == 0
        methods_tried.append(("Set Stream Path", success))
        if success:
            print("   ✓ Sent")
        else:
            print(f"   ✗ Failed")
    except:
        methods_tried.append(("Set Stream Path", False))
        print("   ✗ Failed")
    
    # Summary
    print("\n📊 Summary:")
    for method, success in methods_tried:
        status = "✓" if success else "✗"
        print(f"   {status} {method}")
    
    return any(s for _, s in methods_tried)

def check_tv_info(device="/dev/cec1"):
    """Get detailed TV information"""
    print(f"\n📺 Checking TV information on {device}...\n")
    
    # Get physical address
    print("Physical Address:")
    cmd = ['cec-ctl', '-d', device]
    result = subprocess.run(cmd, capture_output=True, text=True)
    for line in result.stdout.split('\n'):
        if 'Physical Address' in line:
            print(f"  {line.strip()}")
    
    # Try to get vendor info
    print("\nRequesting TV vendor info...")
    cmd = ['cec-ctl', '-d', device, '--give-device-vendor-id', '--to', '0']
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
    if result.returncode == 0:
        print(f"  Response: {result.stdout[:200]}")
    
    # Get OSD name
    print("\nRequesting TV OSD name...")
    cmd = ['cec-ctl', '-d', device, '--give-osd-name', '--to', '0']
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
    if result.returncode == 0:
        print(f"  Response: {result.stdout[:200]}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 power_test_advanced.py [on|off|info]")
        print("\nCommands:")
        print("  on   - Try all methods to turn TV on")
        print("  off  - Try all methods to turn TV off")
        print("  info - Get TV information")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    device = "/dev/cec1"  # Use cec1 as it seems to be the active one
    
    if command == "off":
        try_all_power_off_methods(device)
    elif command == "on":
        try_all_power_on_methods(device)
    elif command == "info":
        check_tv_info(device)
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()