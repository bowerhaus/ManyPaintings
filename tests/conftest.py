"""
Shared test fixtures and utilities for ManyPaintings test suite.
"""

import os
import json
import tempfile
import pytest
import glob
from pathlib import Path
from unittest.mock import patch

# Import the Flask app
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from config import config


@pytest.fixture
def app():
    """Create a Flask app configured for testing."""
    app = create_app('testing')
    
    # Override config for testing
    app.config.update({
        'TESTING': True,
        'WTF_CSRF_ENABLED': False,
        'SECRET_KEY': 'test-secret-key',
        'SERVER_NAME': 'localhost.localdomain'
    })
    
    return app


@pytest.fixture
def client(app):
    """Create a test client for the Flask app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create a test runner for the Flask app."""
    return app.test_cli_runner()


@pytest.fixture
def temp_image_dir():
    """Create a temporary directory for test images."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield temp_dir


@pytest.fixture
def temp_favorites_file():
    """Create a temporary favorites.json file for testing."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump({}, f)
        temp_file = f.name
    
    yield temp_file
    
    # Cleanup
    try:
        os.unlink(temp_file)
    except OSError:
        pass


@pytest.fixture
def sample_image_data():
    """Provide sample image data for testing."""
    # Create a simple 1x1 PNG in bytes
    return b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'


@pytest.fixture
def sample_config():
    """Provide sample configuration data for testing."""
    return {
        "animation_timing": {
            "fadeInMinSec": 1,
            "fadeInMaxSec": 3,
            "minHoldTimeSec": 2,
            "maxHoldTimeSec": 5,
            "fadeOutMinSec": 3,
            "fadeOutMaxSec": 8
        },
        "pattern_behavior": {
            "initial_pattern_code": None,
            "timing_mode": "random"
        },
        "transformations": {
            "best_fit_scaling": {"enabled": True},
            "scale": {"enabled": True, "min_factor": 0.8, "max_factor": 1.2},
            "rotation": {"enabled": True, "max_degrees": 30},
            "translation": {"minimum_visible_percent": 60},
            "color_shift": {"enabled": True, "probability": 0.3}
        },
        "matte_border": {"enabled": True, "aspect_ratio": "16:9"},
        "audio": {"enabled": True, "volume": 0.5},
        "layout_mode": "rule_of_thirds"
    }


@pytest.fixture
def sample_favorite():
    """Provide sample favorite data for testing."""
    return {
        "id": "test-favorite-123",
        "created_at": "2025-08-13T10:00:00.000Z",
        "state": {
            "layers": [
                {
                    "imageId": "test-image",
                    "opacity": 0.8,
                    "transformations": {
                        "rotation": 15,
                        "scale": 1.1,
                        "translateX": 10,
                        "translateY": -5,
                        "hueShift": 30
                    },
                    "animationPhase": "hold"
                }
            ],
            "backgroundColor": "black"
        },
        "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9AAAAAElFTkSuQmCC"
    }


@pytest.fixture
def mock_image_manager():
    """Mock the ImageManager for testing."""
    with patch('utils.image_manager.ImageManager') as mock:
        mock.return_value.get_image_catalog.return_value = {
            'images': [
                {
                    'id': 'test-image',
                    'filename': 'test.png',
                    'url': '/static/images/test.png',
                    'size': 1024,
                    'dimensions': {'width': 100, 'height': 100}
                }
            ]
        }
        yield mock


def pytest_sessionfinish(session, exitstatus):
    """Cleanup test files after all tests complete."""
    cleanup_test_files()


def cleanup_test_files():
    """Remove test files from static/images directory."""
    static_images_dir = Path(__file__).parent.parent / "static" / "images"
    
    if not static_images_dir.exists():
        return
    
    # List of test file patterns to clean up
    test_patterns = [
        "test*.png",
        "test*.jpg", 
        "test*.jpeg",
        "workflow*.png",
        "delete*.png",
        "metadata*.png"
    ]
    
    removed_files = []
    for pattern in test_patterns:
        for test_file in static_images_dir.glob(pattern):
            try:
                test_file.unlink()
                removed_files.append(test_file.name)
            except OSError:
                pass  # File might already be removed or in use
    
    if removed_files:
        print(f"\n[CLEANUP] Removed test files: {', '.join(removed_files)}")