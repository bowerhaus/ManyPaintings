#!/usr/bin/env python3
"""
ManyPaintings Launcher
Starts Flask server and launches browser in kiosk mode
Cross-platform support for Windows and Raspberry Pi
"""

import os
import sys
import time
import platform
import threading
import subprocess
import webbrowser
from pathlib import Path

try:
    import requests
except ImportError:
    # Fallback if requests is not available
    requests = None

# Always import urllib for fallback
import urllib.request
import urllib.error

def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller"""
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    
    return os.path.join(base_path, relative_path)

def is_windows():
    """Check if running on Windows"""
    return platform.system() == "Windows"

def is_raspberry_pi():
    """Check if running on Raspberry Pi or ARM Linux device"""
    # Method 0: Environment variable override
    if os.environ.get('FORCE_EXTERNAL_ACCESS') == '1':
        return True
    
    try:
        # Check multiple methods to detect Raspberry Pi
        
        # Method 1: Check for BCM in cpuinfo (older models)
        with open('/proc/cpuinfo', 'r') as f:
            cpuinfo = f.read()
            if 'BCM' in cpuinfo:
                return True
        
        # Method 2: Check for Raspberry Pi in model file
        try:
            with open('/proc/device-tree/model', 'r') as f:
                if 'raspberry pi' in f.read().lower():
                    return True
        except:
            pass
        
        # Method 3: Check OS release for Raspbian/Raspberry Pi OS
        try:
            with open('/etc/os-release', 'r') as f:
                os_info = f.read().lower()
                if 'raspbian' in os_info or 'raspberry' in os_info:
                    return True
        except:
            pass
        
        # Method 4: Check if running on ARM Linux (likely embedded device)
        # This covers Raspberry Pi and other ARM boards
        if platform.system() == 'Linux' and platform.machine().startswith('aarch'):
            return True
            
        return False
    except:
        return False

def find_chrome_executable():
    """Find Chrome/Chromium executable path (prioritizing Chrome over Edge)"""
    if is_windows():
        # Windows Chrome paths (Chrome first, Edge as fallback)
        chrome_paths = [
            os.path.expandvars(r"%PROGRAMFILES%\Google\Chrome\Application\chrome.exe"),
            os.path.expandvars(r"%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe"),
            os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
            # Edge as fallback only
            os.path.expandvars(r"%PROGRAMFILES%\Microsoft\Edge\Application\msedge.exe"),
            os.path.expandvars(r"%PROGRAMFILES(X86)%\Microsoft\Edge\Application\msedge.exe"),
        ]
    else:
        # Linux/Raspberry Pi paths (Chrome/Chromium priority)
        chrome_paths = [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium-browser",
            "/usr/bin/chromium",
            "/snap/bin/chromium",
        ]
    
    for path in chrome_paths:
        if os.path.exists(path):
            print(f"Found browser: {path}")
            return path
    
    return None

def launch_browser_kiosk(url, port=5000):
    """Launch browser in kiosk mode"""
    chrome_path = find_chrome_executable()
    
    if chrome_path:
        if is_windows():
            # Windows Chrome/Edge flags
            cmd = [
                chrome_path,
                f"--app={url}",
                "--kiosk",
                "--hide-cursor",
                "--disable-restore-session-state",
                "--disable-session-crashed-bubble",
                "--disable-infobars",
                "--no-first-run",
                "--disable-default-apps",
                f"--user-data-dir={get_resource_path('chrome_data')}"
            ]
        else:
            # Raspberry Pi Chromium flags
            cmd = [
                chrome_path,
                f"--app={url}",
                "--kiosk",
                "--window-position=0,0",
                "--disable-restore-session-state",
                "--disable-session-crashed-bubble",
                "--disable-infobars",
                "--no-first-run",
                "--disable-default-apps",
                "--disable-gpu-process-crash-limit",
                "--enable-features=VaapiVideoDecoder",
                "--disable-web-security",
                "--disable-features=VizDisplayCompositor",
                f"--user-data-dir={get_resource_path('chrome_data')}"
            ]
        
        print(f"Launching browser: {chrome_path}")
        return subprocess.Popen(cmd)
    else:
        # Fallback to default browser
        print("Chrome/Chromium not found, using default browser")
        webbrowser.open(url)
        return None

def launch_browser_normal(url, port=5000):
    """Launch browser in normal mode"""
    chrome_path = find_chrome_executable()
    
    if chrome_path:
        if is_windows():
            # Windows Chrome/Edge flags for normal mode
            cmd = [
                chrome_path,
                url,
                "--disable-restore-session-state",
                "--no-first-run",
                f"--user-data-dir={get_resource_path('chrome_data')}"
            ]
        else:
            # Raspberry Pi Chromium flags for normal mode
            cmd = [
                chrome_path,
                url,
                "--window-position=0,0",
                "--disable-restore-session-state",
                "--no-first-run",
                "--disable-gpu-process-crash-limit",
                "--enable-features=VaapiVideoDecoder",
                f"--user-data-dir={get_resource_path('chrome_data')}"
            ]
        
        print(f"Launching browser: {chrome_path}")
        return subprocess.Popen(cmd)
    else:
        # Fallback to default browser
        print("Chrome/Chromium not found, using default browser")
        webbrowser.open(url)
        return None

def launch_browser_normal_fullscreen(url, port=5000):
    """Launch browser in normal mode with full screen (F11)"""
    chrome_path = find_chrome_executable()
    
    if chrome_path:
        if is_windows():
            # Windows Chrome/Edge flags for normal mode with full screen
            cmd = [
                chrome_path,
                url,
                "--start-fullscreen",  # Start in full screen mode
                "--disable-restore-session-state",
                "--no-first-run",
                f"--user-data-dir={get_resource_path('chrome_data')}"
            ]
        else:
            # Raspberry Pi Chromium flags for normal mode with full screen
            cmd = [
                chrome_path,
                url,
                "--start-fullscreen",  # Start in full screen mode
                "--window-position=0,0",
                "--disable-restore-session-state",
                "--no-first-run",
                "--disable-gpu-process-crash-limit",
                "--enable-features=VaapiVideoDecoder",
                f"--user-data-dir={get_resource_path('chrome_data')}"
            ]
        
        print(f"Launching browser in full screen mode: {chrome_path}")
        return subprocess.Popen(cmd)
    else:
        # Fallback to default browser
        print("Chrome/Chromium not found, using default browser")
        webbrowser.open(url)
        return None

def launch_browser_kiosk_windowed(url, port=5000):
    """Launch browser in kiosk app mode (windowed, not fullscreen)"""
    chrome_path = find_chrome_executable()
    
    if chrome_path:
        if is_windows():
            # Windows Chrome/Edge flags for app mode (windowed kiosk)
            cmd = [
                chrome_path,
                f"--app={url}",
                "--disable-restore-session-state",
                "--disable-session-crashed-bubble",
                "--disable-infobars",
                "--no-first-run",
                "--disable-default-apps",
                f"--user-data-dir={get_resource_path('chrome_data')}"
            ]
        else:
            # Raspberry Pi Chromium flags for app mode (windowed kiosk)
            cmd = [
                chrome_path,
                f"--app={url}",
                "--window-position=0,0",
                "--disable-restore-session-state",
                "--disable-session-crashed-bubble",
                "--disable-infobars",
                "--no-first-run",
                "--disable-default-apps",
                "--disable-gpu-process-crash-limit",
                "--enable-features=VaapiVideoDecoder",
                f"--user-data-dir={get_resource_path('chrome_data')}"
            ]
        
        print(f"Launching browser in app mode: {chrome_path}")
        return subprocess.Popen(cmd)
    else:
        # Fallback to default browser
        print("Chrome/Chromium not found, using default browser")
        webbrowser.open(url)
        return None

def wait_for_server(host="127.0.0.1", port=5000, timeout=30):
    """Wait for Flask server to be ready"""
    url = f"http://{host}:{port}/health"
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            if requests:
                response = requests.get(url, timeout=1)
                if response.status_code == 200:
                    print(f"Server ready at {url}")
                    return True
            else:
                # Fallback using urllib
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req, timeout=1) as response:
                    if response.getcode() == 200:
                        print(f"Server ready at {url}")
                        return True
        except Exception:
            pass
        time.sleep(0.5)
    
    print(f"Server failed to start within {timeout} seconds")
    return False

def run_flask_server():
    """Run Flask server in background thread"""
    try:
        # Change to the correct directory
        resource_path = get_resource_path('.')
        print(f"Changing directory to: {resource_path}")
        os.chdir(resource_path)
        
        # Set environment for the appropriate platform
        if is_raspberry_pi():
            os.environ['FLASK_CONFIG'] = 'raspberry_pi'
            host = '0.0.0.0'  # Bind to all interfaces for external access
            print("Using Raspberry Pi configuration (external access enabled)")
        else:
            os.environ['FLASK_CONFIG'] = 'production'
            host = '127.0.0.1'  # Keep localhost for Windows/dev
            print("Using production configuration")
        
        # Import and run Flask app
        sys.path.insert(0, resource_path)
        print("Importing Flask app...")
        from app import create_app
        
        print("Creating Flask app instance...")
        app = create_app()
        port = int(os.environ.get('FLASK_PORT', 5000))
        
        print(f"Starting Flask server on {host}:{port}")
        print(f"Current working directory: {os.getcwd()}")
        print(f"Python path: {sys.path[:3]}...")  # Show first 3 entries
        
        app.run(host=host, port=port, debug=False, use_reloader=False, threaded=True)
    except Exception as e:
        print(f"ERROR in Flask server startup: {e}")
        import traceback
        traceback.print_exc()

def set_display_resolution_1080p():
    """Set display resolution to 1080p on Raspberry Pi"""
    try:
        # Set DISPLAY environment variable if not set
        if 'DISPLAY' not in os.environ:
            os.environ['DISPLAY'] = ':0'
        
        # First, get the connected display name
        result = subprocess.run(['xrandr'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            # Parse output to find connected display
            for line in result.stdout.split('\n'):
                if ' connected' in line:
                    display_name = line.split()[0]
                    print(f"Found display: {display_name}")
                    
                    # Set resolution to 1080p
                    cmd = ['xrandr', '--output', display_name, '--mode', '1920x1080']
                    result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
                    
                    if result.returncode == 0:
                        print(f"Successfully set {display_name} to 1920x1080")
                        return True
                    else:
                        # Try to set it without specifying mode (will use preferred 1080p mode)
                        cmd = ['xrandr', '--output', display_name, '--preferred']
                        result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
                        if result.returncode == 0:
                            print(f"Set {display_name} to preferred resolution")
                        else:
                            print(f"Could not set resolution: {result.stderr}")
                    break
        else:
            print(f"xrandr not available or no X display: {result.stderr}")
    except Exception as e:
        print(f"Could not change display resolution: {e}")
    return False

def main(mode="kiosk"):
    """Main launcher function
    
    Args:
        mode: Launch mode - 'kiosk', 'normal', 'normal-fullscreen'
    """
    print("=" * 50)
    print("ManyPaintings - Generative Art Display")
    print("=" * 50)
    
    # Detect platform
    system = platform.system()
    if is_raspberry_pi():
        print("Platform: Raspberry Pi")
        # Note: Using native display resolution (no forced resolution change)
    elif is_windows():
        print("Platform: Windows")
    else:
        print(f"Platform: {system}")
    
    # Start Flask server in background thread
    flask_thread = threading.Thread(target=run_flask_server, daemon=True)
    flask_thread.start()
    
    # Wait for server to be ready
    port = int(os.environ.get('FLASK_PORT', 5000))
    
    # Always check on localhost for server readiness
    if not wait_for_server("127.0.0.1", port):
        print("Failed to start Flask server. Exiting.")
        sys.exit(1)
    
    # Determine URL and launch mode
    if mode == "kiosk":
        url = f"http://127.0.0.1:{port}/kiosk"
        print(f"Opening kiosk mode (full screen): {url}")
    else:
        url = f"http://127.0.0.1:{port}"
        if mode == "normal-fullscreen":
            print(f"Opening normal mode (full screen): {url}")
        else:
            print(f"Opening normal mode: {url}")
    
    # Show external access info for Raspberry Pi
    if is_raspberry_pi():
        import socket
        try:
            # Get actual network IP address (not loopback)
            # Method 1: Connect to external server to get local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(1)
            try:
                # Connect to Google DNS to get local IP
                s.connect(("8.8.8.8", 80))
                local_ip = s.getsockname()[0]
                s.close()
            except:
                # Fallback: Try to get from hostname
                hostname = socket.gethostname()
                local_ip = socket.gethostbyname(hostname)
            
            # Filter out loopback addresses
            if local_ip.startswith("127."):
                # Try alternative method using ip command
                import subprocess
                try:
                    result = subprocess.run(["hostname", "-I"], capture_output=True, text=True, timeout=2)
                    ips = result.stdout.strip().split()
                    # Get first non-loopback IPv4 address (skip IPv6)
                    for ip in ips:
                        if not ip.startswith("127.") and "." in ip and ":" not in ip:
                            local_ip = ip
                            break
                except:
                    pass
            
            print(f"\nExternal access available at:")
            print(f"  http://{local_ip}:{port}")
            print(f"  http://{local_ip}:{port}/kiosk (kiosk mode)")
            print(f"  http://{local_ip}:{port}/remote (iPhone remote control)")
        except Exception as e:
            print(f"\nServer is accessible from external devices on port {port}")
            print(f"(Could not detect IP: {e})")
    
    # Launch browser based on mode
    if mode == "kiosk":
        browser_process = launch_browser_kiosk(url, port)
    elif mode == "normal-fullscreen":
        browser_process = launch_browser_normal_fullscreen(url, port)
    else:
        browser_process = launch_browser_normal(url, port)
    
    try:
        if browser_process:
            # Wait for browser to close
            print("Browser launched. Press Ctrl+C to exit or close the browser window.")
            browser_process.wait()
        else:
            # Fallback - keep server running
            print("Server running. Press Ctrl+C to exit.")
            while True:
                time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        if browser_process:
            try:
                browser_process.terminate()
            except:
                pass
        print("Goodbye!")

if __name__ == "__main__":
    import sys
    # Check for command line argument
    if len(sys.argv) > 1:
        mode = sys.argv[1]
        if mode not in ["kiosk", "normal", "normal-fullscreen"]:
            print(f"Invalid mode: {mode}")
            print("Valid modes: kiosk, normal, normal-fullscreen")
            sys.exit(1)
        main(mode)
    else:
        main("kiosk")  # Default to kiosk mode