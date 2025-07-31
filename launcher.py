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
    import urllib.request
    import urllib.error
    requests = None

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
    """Check if running on Raspberry Pi"""
    try:
        with open('/proc/cpuinfo', 'r') as f:
            return 'BCM' in f.read()
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
                "--disable-restore-session-state",
                "--disable-session-crashed-bubble",
                "--disable-infobars",
                "--no-first-run",
                "--disable-default-apps",
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
        except (Exception, urllib.error.URLError):
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
            host = '127.0.0.1'  # Use localhost for launcher
            print("Using Raspberry Pi configuration")
        else:
            os.environ['FLASK_CONFIG'] = 'production'
            host = '127.0.0.1'
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

def main():
    """Main launcher function"""
    print("=" * 50)
    print("ManyPaintings - Generative Art Display")
    print("=" * 50)
    
    # Detect platform
    system = platform.system()
    if is_raspberry_pi():
        print("Platform: Raspberry Pi")
    elif is_windows():
        print("Platform: Windows")
    else:
        print(f"Platform: {system}")
    
    # Start Flask server in background thread
    flask_thread = threading.Thread(target=run_flask_server, daemon=True)
    flask_thread.start()
    
    # Wait for server to be ready
    host = "127.0.0.1"
    port = int(os.environ.get('FLASK_PORT', 5000))
    
    if not wait_for_server(host, port):
        print("Failed to start Flask server. Exiting.")
        sys.exit(1)
    
    # Launch browser in kiosk mode (app mode, not fullscreen)
    kiosk_url = f"http://{host}:{port}/kiosk"
    print(f"Opening kiosk mode: {kiosk_url}")
    
    browser_process = launch_browser_kiosk_windowed(kiosk_url, port)
    
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
    main()