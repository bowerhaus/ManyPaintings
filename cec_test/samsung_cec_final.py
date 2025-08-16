#!/usr/bin/env python3
"""
Samsung TV CEC Control - Final Working Version
Tested with Samsung TV via Anynet+ on /dev/cec0
"""
import subprocess
import sys
import time

class SamsungTVControl:
    def __init__(self):
        self.device = "/dev/cec0"
        self.initialized = self.initialize()
    
    def initialize(self):
        """Initialize as playback device"""
        try:
            # Set as playback device
            cmd = ['cec-ctl', '-d', self.device, '--playback']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=2)
            if result.returncode == 0:
                print("✅ CEC initialized as playback device")
                return True
            else:
                print("⚠️  CEC initialization warning")
                return False
        except Exception as e:
            print(f"⚠️  Init error: {e}")
            return False
    
    def power_on(self):
        """Turn TV ON - confirmed working"""
        print("Sending power ON command...")
        cmd = ['cec-ctl', '-d', self.device, '--image-view-on', '--to', '0']
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
            if result.returncode == 0:
                print("✅ Power ON sent to Samsung TV")
                return True
            else:
                print("❌ Power ON failed")
                return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def power_off(self):
        """Turn TV OFF (standby) - confirmed working"""
        print("Sending standby command...")
        cmd = ['cec-ctl', '-d', self.device, '--standby', '--to', '0']
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
            if result.returncode == 0:
                print("✅ Standby sent to Samsung TV")
                return True
            else:
                print("❌ Standby failed")
                return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def test_connection(self):
        """Test if CEC connection is working"""
        print("Testing CEC connection...")
        cmd = ['cec-ctl', '-d', self.device]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=2)
            if result.returncode == 0 and 'vc4_hdmi' in result.stdout:
                # Check for Samsung in the output
                if 'Samsung' in result.stdout or '0x0000f0' in result.stdout:
                    print("✅ Connected to Samsung TV via Anynet+")
                else:
                    print("✅ CEC device found (TV vendor not detected)")
                return True
            else:
                print("❌ No CEC connection")
                return False
        except Exception as e:
            print(f"❌ Connection test failed: {e}")
            return False

def main():
    """Simple command-line interface"""
    tv = SamsungTVControl()
    
    # Test connection first
    if not tv.test_connection():
        print("\n⚠️  CEC may not be working properly")
        print("Make sure:")
        print("  1. TV is connected via HDMI")
        print("  2. Anynet+ is enabled on Samsung TV")
        print("  3. Using correct HDMI port")
        return
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        if command == "on":
            tv.power_on()
        elif command == "off":
            tv.power_off()
        elif command == "test":
            tv.test_connection()
        else:
            print("Usage: python3 samsung_cec_final.py [on|off|test]")
    else:
        # Interactive mode
        print("\n=== Samsung TV Control (Anynet+) ===")
        print("Commands: on, off, test, quit")
        
        while True:
            command = input("\nCommand: ").strip().lower()
            
            if command == "on":
                tv.power_on()
            elif command == "off":
                tv.power_off()
            elif command == "test":
                tv.test_connection()
            elif command in ["quit", "exit", "q"]:
                print("Goodbye!")
                break
            else:
                print("Unknown command. Use: on, off, test, quit")

if __name__ == "__main__":
    main()