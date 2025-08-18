#!/usr/bin/env python3
"""
Final CEC Control Module for Samsung TV
Confirmed working with /dev/cec0
Enhanced remote control detection for Back, OK, and cursor keys
"""
import subprocess
import time
import sys
import re

class SamsungCECControl:
    def __init__(self, device="/dev/cec0"):
        self.device = device
        self.tv_address = "0"  # TV is always address 0
        
        # Button mappings for Samsung TV remote control
        self.button_codes = {
            'Select': 'OK',
            'Up': 'UP',  
            'Down': 'DOWN',
            'Left': 'LEFT',
            'Right': 'RIGHT',
            'Exit': 'BACK',
            'Return': 'BACK',  # Alternative Back button name
            'Play': 'PLAY',
            'Pause': 'PAUSE',
            'Stop': 'STOP'
        }
        
        print(f"Samsung CEC Control initialized on {device}")
    
    def power_on(self):
        """Turn Samsung TV on using reliable TEXT_VIEW_ON method"""
        # Initialize as playback device first
        init_cmd = ['cec-ctl', '-d', self.device, '--playback']
        subprocess.run(init_cmd, capture_output=True)
        
        # Use TEXT_VIEW_ON - most reliable for Samsung Frame TV (67% success, 100% with retry)
        cmd = ['cec-ctl', '-d', self.device, '-t', self.tv_address, '--text-view-on']
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
            if result.returncode == 0:
                print("✅ TV wake command sent (TEXT_VIEW_ON)")
                # Try second command for better reliability (100% success rate)
                time.sleep(0.1)
                subprocess.run(cmd, capture_output=True, text=True, timeout=3)
                return True
            else:
                print(f"❌ Power ON failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def power_off(self):
        """Turn Samsung TV off (standby) - WARNING: CEC cannot turn off Samsung Frame TV"""
        print("⚠️  WARNING: Samsung Frame TV ignores ALL CEC power-off commands")
        print("   CEC cannot turn off this TV. Use TV remote or other method.")
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
    
    def monitor_remote(self, callback=None, focus_navigation=True):
        """Monitor Samsung TV remote control with enhanced button detection
        
        Args:
            callback: Function to call with button events (button_name, pressed/released)
            focus_navigation: If True, only report navigation buttons (Back, OK, arrows)
        """
        print("🎮 Monitoring Samsung TV remote...")
        if focus_navigation:
            print("📱 Focusing on: BACK, OK, UP, DOWN, LEFT, RIGHT")
        print("Press Ctrl+C to stop\n")
        
        # Initialize as playback device to receive remote events
        init_cmd = ['cec-ctl', '-d', self.device, '--playback']
        subprocess.run(init_cmd, capture_output=True)
        time.sleep(1)
        
        cmd = ['cec-ctl', '-d', self.device, '--monitor-all']
        
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            
            for line in iter(process.stdout.readline, ''):
                if not line:
                    break
                
                line = line.strip()
                if not line:
                    continue
                
                # Look for button events
                if any(keyword in line.lower() for keyword in 
                       ['user control', 'user-control', 'ui command', 'ui-command']):
                    
                    button_info = self._parse_button_event(line)
                    if button_info:
                        button_name, event_type = button_info
                        
                        # Filter for navigation buttons if requested
                        if focus_navigation:
                            nav_buttons = ['OK', 'BACK', 'UP', 'DOWN', 'LEFT', 'RIGHT']
                            if button_name not in nav_buttons:
                                continue
                        
                        if callback:
                            callback(button_name, event_type)
                        else:
                            timestamp = time.strftime("%H:%M:%S")
                            print(f"[{timestamp}] 🔘 {button_name} {event_type}")
        
        except KeyboardInterrupt:
            print("\n✋ Stopped monitoring remote")
        except Exception as e:
            print(f"❌ Error: {e}")
        finally:
            if process:
                process.terminate()
    
    def _parse_button_event(self, line):
        """Parse button event from CEC message line
        
        Returns:
            tuple: (button_name, event_type) or None if not parsed
        """
        # Determine if it's pressed or released
        event_type = "RELEASED"
        if 'pressed' in line.lower():
            event_type = "PRESSED"
        
        # Look for known button names in the line
        for cec_name, button_name in self.button_codes.items():
            if cec_name in line:
                return (button_name, event_type)
        
        # Look for hex codes as fallback
        hex_match = re.search(r'0x[0-9a-f]{2}', line, re.IGNORECASE)
        if hex_match:
            hex_code = hex_match.group()
            # Map common hex codes for Samsung remotes
            hex_map = {
                '0x00': 'OK',
                '0x01': 'UP',
                '0x02': 'DOWN', 
                '0x03': 'LEFT',
                '0x04': 'RIGHT',
                '0x0d': 'BACK'
            }
            button_name = hex_map.get(hex_code, f'UNKNOWN_{hex_code}')
            return (button_name, event_type)
        
        return None
    
    def start_navigation_monitoring(self, navigation_callback):
        """Convenience method for ManyPaintings app integration
        
        Args:
            navigation_callback: Function that receives (button_name, event_type)
                                button_name: 'OK', 'BACK', 'UP', 'DOWN', 'LEFT', 'RIGHT'
                                event_type: 'PRESSED' or 'RELEASED'
        """
        print("🎨 Starting navigation monitoring for ManyPaintings...")
        self.monitor_remote(callback=navigation_callback, focus_navigation=True)

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
        elif command == "nav":
            # Test navigation monitoring
            def nav_handler(button, event):
                print(f"🎮 Navigation: {button} {event}")
            control.start_navigation_monitoring(nav_handler)
        else:
            print("Unknown command. Use: on, off, status, remote, or nav")
    else:
        # Interactive menu
        while True:
            print("\n=== Samsung TV CEC Control ===")
            print("1. Turn TV ON")
            print("2. Turn TV OFF (Warning: Not supported)")
            print("3. Check Status")
            print("4. Monitor Remote (All buttons)")
            print("5. Monitor Navigation (Back, OK, Arrows)")
            print("6. Exit")
            
            choice = input("\nChoice: ").strip()
            
            if choice == "1":
                control.power_on()
            elif choice == "2":
                control.power_off()
            elif choice == "3":
                status = control.get_power_status()
                print(f"TV Status: {status}")
            elif choice == "4":
                control.monitor_remote(focus_navigation=False)
            elif choice == "5":
                def nav_handler(button, event):
                    print(f"🎮 Navigation: {button} {event}")
                control.start_navigation_monitoring(nav_handler)
            elif choice == "6":
                break

if __name__ == "__main__":
    main()