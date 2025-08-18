#!/usr/bin/env python3
"""
Alternative CEC Remote Detection using Linux Input Events
Tests if Samsung TV remote buttons come through as evdev input events
"""
import evdev
import time
import sys
import select

def list_input_devices():
    """List all available input devices"""
    print("Available input devices:")
    devices = [evdev.InputDevice(path) for path in evdev.list_devices()]
    
    for device in devices:
        print(f"  {device.path}: {device.name}")
        if 'hdmi' in device.name.lower() or 'cec' in device.name.lower():
            print(f"    *** HDMI/CEC device detected ***")
            print(f"    Capabilities: {device.capabilities()}")
    
    return devices

def monitor_hdmi_devices(timeout_seconds=30):
    """Monitor HDMI devices for CEC remote button events"""
    devices = [evdev.InputDevice(path) for path in evdev.list_devices()]
    hdmi_devices = [dev for dev in devices if 'hdmi' in dev.name.lower()]
    
    if not hdmi_devices:
        print("No HDMI devices found!")
        return
    
    print(f"Monitoring {len(hdmi_devices)} HDMI devices for {timeout_seconds} seconds:")
    for dev in hdmi_devices:
        print(f"  - {dev.path}: {dev.name}")
    
    print("\nPress buttons on Samsung TV remote...")
    print("Press Ctrl+C to stop early\n")
    
    # Create device map for select()
    device_map = {dev.fd: dev for dev in hdmi_devices}
    
    start_time = time.time()
    
    try:
        while time.time() - start_time < timeout_seconds:
            # Use select to wait for events with 1 second timeout
            ready, _, _ = select.select(device_map.keys(), [], [], 1.0)
            
            if ready:
                for fd in ready:
                    device = device_map[fd]
                    try:
                        for event in device.read():
                            timestamp = time.strftime("%H:%M:%S")
                            print(f"[{timestamp}] {device.name}: {event}")
                            
                            # Decode common key events
                            if event.type == evdev.ecodes.EV_KEY:
                                key_name = evdev.ecodes.KEY.get(event.code, f"KEY_{event.code}")
                                state = "PRESSED" if event.value == 1 else "RELEASED" if event.value == 0 else f"REPEAT({event.value})"
                                print(f"  -> KEY EVENT: {key_name} {state}")
                    
                    except BlockingIOError:
                        # No events available
                        pass
                    except OSError as e:
                        print(f"Error reading from {device.name}: {e}")
            else:
                # Timeout - show we're still waiting
                elapsed = int(time.time() - start_time)
                remaining = timeout_seconds - elapsed
                print(f"Waiting for input... ({remaining}s remaining)", end='\r')
    
    except KeyboardInterrupt:
        print("\nStopped by user")
    
    # Close devices
    for device in hdmi_devices:
        device.close()

def monitor_all_devices(timeout_seconds=15):
    """Monitor ALL input devices for any activity"""
    devices = [evdev.InputDevice(path) for path in evdev.list_devices()]
    
    print(f"Monitoring ALL {len(devices)} input devices for {timeout_seconds} seconds:")
    for dev in devices:
        print(f"  - {dev.path}: {dev.name}")
    
    print("\nPress buttons on Samsung TV remote...")
    print("Any input activity will be shown\n")
    
    # Create device map for select()
    device_map = {dev.fd: dev for dev in devices}
    
    start_time = time.time()
    
    try:
        while time.time() - start_time < timeout_seconds:
            # Use select to wait for events with 1 second timeout
            ready, _, _ = select.select(device_map.keys(), [], [], 1.0)
            
            if ready:
                for fd in ready:
                    device = device_map[fd]
                    try:
                        for event in device.read():
                            timestamp = time.strftime("%H:%M:%S")
                            print(f"[{timestamp}] {device.name} ({device.path}): {event}")
                            
                            # Decode common key events
                            if event.type == evdev.ecodes.EV_KEY:
                                key_name = evdev.ecodes.KEY.get(event.code, f"KEY_{event.code}")
                                state = "PRESSED" if event.value == 1 else "RELEASED" if event.value == 0 else f"REPEAT({event.value})"
                                print(f"  -> KEY EVENT: {key_name} {state}")
                    
                    except BlockingIOError:
                        # No events available
                        pass
                    except OSError as e:
                        print(f"Error reading from {device.name}: {e}")
            else:
                # Timeout - show we're still waiting
                elapsed = int(time.time() - start_time)
                remaining = timeout_seconds - elapsed
                if remaining > 0:
                    print(f"Waiting for input... ({remaining}s remaining)", end='\r')
    
    except KeyboardInterrupt:
        print("\nStopped by user")
    
    # Close devices
    for device in devices:
        device.close()

def main():
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "list":
            list_input_devices()
        elif command == "hdmi":
            monitor_hdmi_devices()
        elif command == "all":
            monitor_all_devices()
        else:
            print("Usage: python evdev_remote_test.py [list|hdmi|all]")
            print("  list: Show all input devices")
            print("  hdmi: Monitor only HDMI devices")
            print("  all:  Monitor all input devices")
    else:
        print("=== Linux Input Event CEC Remote Test ===")
        print()
        
        # First show available devices
        list_input_devices()
        print()
        
        # Then test HDMI devices specifically
        try:
            monitor_hdmi_devices(30)
        except Exception as e:
            print(f"Error monitoring HDMI devices: {e}")
            print("Trying to monitor all devices instead...")
            monitor_all_devices(15)

if __name__ == "__main__":
    try:
        main()
    except ImportError:
        print("Error: evdev module not found. Install with: pip install evdev")
        sys.exit(1)