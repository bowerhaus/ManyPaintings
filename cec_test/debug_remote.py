#!/usr/bin/env python3
"""
CEC Remote Button Detection Debug Script
Tests multiple approaches to detect Samsung TV remote button presses
"""
import subprocess
import time
import sys
import threading
import select

def test_monitor_all():
    """Test cec-ctl --monitor-all approach"""
    print("=== Testing cec-ctl --monitor-all ===")
    print("Press some buttons on the Samsung TV remote...")
    print("Press Ctrl+C to stop")
    
    cmd = ['cec-ctl', '-d', '/dev/cec0', '--monitor-all']
    
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        timeout_counter = 0
        while timeout_counter < 30:  # 30 second timeout
            ready, _, _ = select.select([process.stdout], [], [], 1.0)
            
            if ready:
                line = process.stdout.readline()
                if line:
                    print(f"RAW: {line.strip()}")
                    timeout_counter = 0  # Reset timeout on activity
                else:
                    break
            else:
                timeout_counter += 1
                print(f"Waiting for input... ({timeout_counter}/30)")
    
    except KeyboardInterrupt:
        print("\nStopped by user")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if process:
            process.terminate()

def test_monitor_regular():
    """Test cec-ctl --monitor approach"""
    print("\n=== Testing cec-ctl --monitor ===")
    print("Press some buttons on the Samsung TV remote...")
    print("Press Ctrl+C to stop")
    
    cmd = ['cec-ctl', '-d', '/dev/cec0', '--monitor']
    
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        timeout_counter = 0
        while timeout_counter < 30:  # 30 second timeout
            ready, _, _ = select.select([process.stdout], [], [], 1.0)
            
            if ready:
                line = process.stdout.readline()
                if line:
                    print(f"MONITOR: {line.strip()}")
                    timeout_counter = 0  # Reset timeout on activity
                else:
                    break
            else:
                timeout_counter += 1
                print(f"Waiting for input... ({timeout_counter}/30)")
    
    except KeyboardInterrupt:
        print("\nStopped by user")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if process:
            process.terminate()

def test_with_playback_init():
    """Test with explicit playback device initialization"""
    print("\n=== Testing with playback device initialization ===")
    
    # Initialize as playback device
    init_cmd = ['cec-ctl', '-d', '/dev/cec0', '--playback']
    result = subprocess.run(init_cmd, capture_output=True, text=True)
    print(f"Playback init result: {result.returncode}")
    if result.stdout:
        print(f"STDOUT: {result.stdout}")
    if result.stderr:
        print(f"STDERR: {result.stderr}")
    
    time.sleep(2)  # Give it time to initialize
    
    print("Now monitoring with playback device active...")
    print("Press some buttons on the Samsung TV remote...")
    
    cmd = ['cec-ctl', '-d', '/dev/cec0', '--monitor-all', '--verbose']
    
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        timeout_counter = 0
        while timeout_counter < 30:  # 30 second timeout
            ready, _, _ = select.select([process.stdout], [], [], 1.0)
            
            if ready:
                line = process.stdout.readline()
                if line:
                    print(f"PLAYBACK: {line.strip()}")
                    timeout_counter = 0  # Reset timeout on activity
                else:
                    break
            else:
                timeout_counter += 1
                print(f"Waiting for input... ({timeout_counter}/30)")
    
    except KeyboardInterrupt:
        print("\nStopped by user")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if process:
            process.terminate()

def test_raw_monitoring():
    """Test with raw output and different timeout settings"""
    print("\n=== Testing raw monitoring with extended timeout ===")
    
    cmd = ['cec-ctl', '-d', '/dev/cec0', '--monitor-all', '--show-raw', '--timeout', '5000']
    
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        print("Raw monitoring active. Press buttons on Samsung TV remote...")
        
        timeout_counter = 0
        while timeout_counter < 30:  # 30 second timeout
            ready, _, _ = select.select([process.stdout], [], [], 1.0)
            
            if ready:
                line = process.stdout.readline()
                if line:
                    print(f"RAW_EXT: {line.strip()}")
                    timeout_counter = 0  # Reset timeout on activity
                else:
                    break
            else:
                timeout_counter += 1
                print(f"Waiting for input... ({timeout_counter}/30)")
    
    except KeyboardInterrupt:
        print("\nStopped by user")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if process:
            process.terminate()

def check_cec_status():
    """Check current CEC status and configuration"""
    print("=== CEC Status Check ===")
    
    # Check logical addresses
    cmd = ['cec-ctl', '-d', '/dev/cec0', '--logical-addresses']
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(f"Logical addresses: {result.stdout.strip()}")
    
    # Check topology
    cmd = ['cec-ctl', '-d', '/dev/cec0', '--show-topology']
    result = subprocess.run(cmd, capture_output=True, text=True)
    print("Current topology:")
    for line in result.stdout.split('\n'):
        if 'System Information' in line or 'Power Status' in line or 'Topology:' in line or '0.0.0.0:' in line or '3.0.0.0:' in line:
            print(f"  {line}")
    
    # Test if we can send a poll to the TV
    print("\nTesting poll to TV...")
    cmd = ['cec-ctl', '-d', '/dev/cec0', '--to', '0', '--poll']
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
    print(f"Poll result: {result.returncode}")
    if result.stdout:
        print(f"Poll output: {result.stdout.strip()}")

def main():
    if len(sys.argv) > 1:
        test_type = sys.argv[1].lower()
        
        if test_type == "status":
            check_cec_status()
        elif test_type == "monitor":
            test_monitor_regular()
        elif test_type == "all":
            test_monitor_all()
        elif test_type == "playback":
            test_with_playback_init()
        elif test_type == "raw":
            test_raw_monitoring()
        else:
            print("Usage: python debug_remote.py [status|monitor|all|playback|raw]")
    else:
        print("CEC Remote Debug Script")
        print("======================")
        
        check_cec_status()
        
        print("\nTesting different monitoring approaches...")
        print("Each test will run for 30 seconds or until you press Ctrl+C")
        
        # Run tests in sequence
        tests = [
            test_monitor_all,
            test_monitor_regular, 
            test_with_playback_init,
            test_raw_monitoring
        ]
        
        for i, test_func in enumerate(tests, 1):
            print(f"\n--- Test {i}/{len(tests)} ---")
            try:
                test_func()
            except KeyboardInterrupt:
                choice = input("\nContinue to next test? (y/n): ").lower()
                if choice != 'y':
                    break
            
            if i < len(tests):
                input("\nPress Enter to continue to next test...")

if __name__ == "__main__":
    main()