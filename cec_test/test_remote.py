#!/usr/bin/env python3
"""
Simple CEC Remote Test - Just shows raw CEC messages
"""
import subprocess
import sys

def test_remote():
    print("=== CEC Remote Test ===")
    print("This will show ALL CEC messages")
    print("Press TV remote buttons to test")
    print("Press Ctrl+C to stop\n")
    
    # First initialize as playback device
    print("Initializing CEC...")
    subprocess.run(['cec-ctl', '-d', '/dev/cec0', '--playback'], capture_output=True)
    
    # Monitor with simple output
    print("Starting monitor...\n")
    cmd = ['cec-ctl', '-d', '/dev/cec0', '-M']
    
    try:
        # Run the monitor command directly - don't capture output
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\n\nStopped")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_remote()