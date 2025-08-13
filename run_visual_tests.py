#!/usr/bin/env python3
"""
Script to run visual tests on Windows only.
This script provides options for running visual tests and managing baseline images.
"""

import sys
import os
import subprocess
import argparse
from pathlib import Path


def main():
    """Main function for running visual tests."""
    parser = argparse.ArgumentParser(description='Run visual tests for ManyPaintings UI')
    parser.add_argument('--clean-screenshots', action='store_true',
                       help='Clean screenshot directory before running tests')
    parser.add_argument('--test-filter', type=str,
                       help='Filter which tests to run (e.g., "gallery" or "favorites")')
    parser.add_argument('--browser', type=str, default='chromium',
                       choices=['chromium', 'firefox', 'webkit'],
                       help='Browser to use for testing')
    parser.add_argument('--headed', action='store_true',
                       help='Run tests in headed mode (show browser window)')
    parser.add_argument('--slow-mo', type=int, default=0,
                       help='Slow down operations by N milliseconds')
    
    args = parser.parse_args()
    
    # Check if running on Windows
    if sys.platform != "win32":
        print("❌ Visual tests only run on Windows platform")
        print("   Current platform:", sys.platform)
        return 1
    
    # Check if Playwright is installed
    try:
        import playwright
    except ImportError:
        print("❌ Playwright not installed. Install with: pip install playwright")
        return 1
    
    # Build pytest command
    cmd = [
        sys.executable, "-m", "pytest",
        "tests/e2e/test_visual_appearance_windows.py",
        "-v",
        f"--browser={args.browser}",
        "-m", "visual"
    ]
    
    # Add test filter if specified
    if args.test_filter:
        cmd.extend(["-k", args.test_filter])
    
    # Add browser options
    browser_args = []
    if args.headed:
        browser_args.append("--headed")
    if args.slow_mo > 0:
        browser_args.extend(["--slowmo", str(args.slow_mo)])
    
    if browser_args:
        cmd.append(f"--browser-args={' '.join(browser_args)}")
    
    # Handle screenshot cleanup
    if args.clean_screenshots:
        print("🧹 Cleaning screenshot directory...")
        import shutil
        screenshot_dir = Path("test-results/visual")
        if screenshot_dir.exists():
            shutil.rmtree(screenshot_dir)
        screenshot_dir.mkdir(parents=True, exist_ok=True)
    
    print("📸 Running visual documentation tests...")
    print("🚀 Running command:", " ".join(cmd))
    print("🌐 Browser:", args.browser)
    print("💻 Platform:", sys.platform)
    print()
    
    # Run the tests
    try:
        result = subprocess.run(cmd, cwd=Path(__file__).parent)
        
        if result.returncode == 0:
            print("\n✅ Visual tests completed successfully!")
            print("📁 Screenshots saved to test-results/visual/")
            print("🔍 Review screenshots to verify UI appearance")
        else:
            print(f"\n❌ Visual tests failed (exit code: {result.returncode})")
            print("💡 Tips:")
            print("   - Run with --headed to see what's happening in the browser")
            print("   - Check test-results/visual/ directory for captured screenshots")
            print("   - Use --clean-screenshots to start with fresh screenshot directory")
        
        return result.returncode
        
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 130
    except Exception as e:
        print(f"\n💥 Error running tests: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())