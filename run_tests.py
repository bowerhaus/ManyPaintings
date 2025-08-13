#!/usr/bin/env python3
"""
Test runner script for ManyPaintings project.
Provides different test execution options.
"""

import sys
import subprocess
import argparse


def run_command(cmd):
    """Run a command and return the result."""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)
    
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(description='Run ManyPaintings tests')
    parser.add_argument('--backend', action='store_true', help='Run backend tests only')
    parser.add_argument('--e2e', action='store_true', help='Run E2E tests only')  
    parser.add_argument('--coverage', action='store_true', help='Run with coverage reporting')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--fast', action='store_true', help='Skip slow tests')
    parser.add_argument('--headed', action='store_true', help='Run E2E tests in headed mode (show browser)')
    
    args = parser.parse_args()
    
    # Base pytest command
    base_cmd = ['python', '-m', 'pytest']
    
    if args.verbose:
        base_cmd.append('-v')
    
    if args.fast:
        base_cmd.extend(['-m', 'not slow'])
    
    success = True
    
    if args.backend:
        print("=== Running Backend Tests ===")
        cmd = base_cmd + ['tests/test_app.py', 'tests/test_config.py', 'tests/test_image_manager.py']
        if args.coverage:
            cmd.extend(['--cov=.', '--cov-report=html', '--cov-report=term'])
        success &= run_command(cmd)
    
    elif args.e2e:
        print("=== Running E2E Tests ===")
        cmd = base_cmd + ['tests/e2e/']
        if args.headed:
            cmd.append('--headed')
        success &= run_command(cmd)
    
    else:
        # Run all tests
        print("=== Running All Tests ===")
        
        print("\n--- Backend Tests ---")
        cmd = base_cmd + ['tests/test_app.py', 'tests/test_config.py', 'tests/test_image_manager.py']
        if args.coverage:
            cmd.extend(['--cov=.', '--cov-report=html', '--cov-report=term-missing'])
        success &= run_command(cmd)
        
        print("\n--- E2E Tests ---")  
        cmd = base_cmd + ['tests/e2e/']
        if args.headed:
            cmd.append('--headed')
        success &= run_command(cmd)
    
    if success:
        print("\nAll tests passed!")
        return 0
    else:
        print("\nSome tests failed!")
        return 1


if __name__ == '__main__':
    sys.exit(main())