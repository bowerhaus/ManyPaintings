#!/usr/bin/env python3
"""
Debug test script for ManyPaintings application.
Use this to test if the application is working correctly.
"""

import sys
import traceback
from app import create_app

def test_configuration():
    """Test configuration loading."""
    print("=== Testing Configuration ===")
    try:
        from config import get_config
        config = get_config('development')
        print(f"[OK] Configuration loaded successfully")
        print(f"  - Max layers: {config.MAX_CONCURRENT_LAYERS}")
        print(f"  - Animation FPS: {config.ANIMATION_FPS}")
        print(f"  - Rotation enabled: {config.ROTATION_ENABLED}")
        return True
    except Exception as e:
        print(f"[ERROR] Configuration error: {e}")
        traceback.print_exc()
        return False

def test_app_creation():
    """Test Flask app creation."""
    print("\n=== Testing App Creation ===")
    try:
        app = create_app()
        print(f"[OK] Flask app created successfully")
        print(f"  - Debug mode: {app.debug}")
        print(f"  - Secret key set: {bool(app.config.get('SECRET_KEY'))}")
        return app
    except Exception as e:
        print(f"[ERROR] App creation error: {e}")
        traceback.print_exc()
        return None

def test_routes(app):
    """Test application routes."""
    print("\n=== Testing Routes ===")
    if not app:
        print("[ERROR] Cannot test routes - app creation failed")
        return False
    
    try:
        with app.test_client() as client:
            # Test health endpoint
            response = client.get('/health')
            if response.status_code == 200:
                print(f"[OK] /health endpoint: {response.get_json()}")
            else:
                print(f"[ERROR] /health endpoint failed: {response.status_code}")
                return False
            
            # Test images API
            response = client.get('/api/images')
            if response.status_code == 200:
                data = response.get_json()
                print(f"[OK] /api/images endpoint: {data.get('total_count', 0)} images")
            else:
                print(f"[ERROR] /api/images endpoint failed: {response.status_code}")
                return False
            
            # Test main page
            response = client.get('/')
            if response.status_code == 200:
                print(f"[OK] / endpoint: HTML page rendered successfully")
            else:
                print(f"[ERROR] / endpoint failed: {response.status_code}")
                return False
            
            # Test kiosk page
            response = client.get('/kiosk')
            if response.status_code == 200:
                print(f"[OK] /kiosk endpoint: HTML page rendered successfully")
            else:
                print(f"[ERROR] /kiosk endpoint failed: {response.status_code}")
                return False
                
        return True
    except Exception as e:
        print(f"[ERROR] Route testing error: {e}")
        traceback.print_exc()
        return False

def main():
    """Run all tests."""
    print("ManyPaintings Application Debug Test")
    print("=====================================")
    
    # Run tests
    config_ok = test_configuration()
    app = test_app_creation()
    routes_ok = test_routes(app)
    
    # Summary
    print("\n=== Test Summary ===")
    if config_ok and app and routes_ok:
        print("[OK] All tests passed! The application should be working correctly.")
        print("\nTo start the server:")
        print("  python app.py")
        print("\nThen visit:")
        print("  http://127.0.0.1:5000/        (Main interface)")
        print("  http://127.0.0.1:5000/kiosk   (Kiosk mode)")
        print("  http://127.0.0.1:5000/health  (Health check)")
        return 0
    else:
        print("[ERROR] Some tests failed. Check the errors above.")
        return 1

if __name__ == '__main__':
    sys.exit(main())