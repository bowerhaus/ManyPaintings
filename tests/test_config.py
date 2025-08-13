"""
Tests for configuration system.
"""

import pytest
import json
import tempfile
import os
import time
from pathlib import Path
from unittest.mock import patch, MagicMock

# Import config classes
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config, DevelopmentConfig, ProductionConfig, RaspberryPiConfig, TestingConfig, load_config_from_json


class TestConfigLoading:
    """Test configuration loading functionality."""
    
    @pytest.fixture
    def sample_config_file(self):
        """Create a temporary config file."""
        config_data = {
            "flask": {
                "debug": True,
                "secret_key": "test-secret",
                "host": "0.0.0.0",
                "port": 8080
            },
            "application": {
                "image_directory": "test/images",
                "max_concurrent_images": 15,
                "enable_caching": False
            },
            "animation_timing": {
                "fade_in_min_sec": 1.0,
                "fade_in_max_sec": 3.0,
                "min_hold_time_sec": 2.0,
                "max_hold_time_sec": 8.0
            },
            "transformations": {
                "rotation": {
                    "enabled": True,
                    "max_degrees": 45
                },
                "scale": {
                    "enabled": False,
                    "min_factor": 0.5,
                    "max_factor": 2.0
                }
            },
            "matte_border": {
                "enabled": True,
                "border_percent": 15,
                "color": "#FFFFFF"
            },
            "environments": {
                "development": {
                    "flask": {
                        "debug": True
                    }
                },
                "production": {
                    "flask": {
                        "debug": False
                    },
                    "application": {
                        "enable_caching": True
                    }
                }
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_data, f)
            temp_file = f.name
        
        yield temp_file
        
        # Cleanup
        try:
            os.unlink(temp_file)
        except OSError:
            pass
    
    @patch('config.os.path.join')
    def test_load_config_from_json(self, mock_join, sample_config_file):
        """Test loading configuration from JSON file."""
        mock_join.return_value = sample_config_file
        
        config = load_config_from_json('development')
        
        assert config['flask']['debug'] is True
        assert config['flask']['port'] == 8080
        assert config['application']['image_directory'] == 'test/images'
        assert config['animation_timing']['fade_in_min_sec'] == 1.0
        assert config['transformations']['rotation']['enabled'] is True
        assert config['matte_border']['enabled'] is True
    
    @patch('config.os.path.join')
    def test_load_config_production_overrides(self, mock_join, sample_config_file):
        """Test production environment overrides."""
        mock_join.return_value = sample_config_file
        
        config = load_config_from_json('production')
        
        # Should have production overrides
        assert config['flask']['debug'] is False  # Overridden
        assert config['application']['enable_caching'] is True  # Overridden
        # But keep base values for non-overridden settings
        assert config['flask']['port'] == 8080  # From base
        assert config['transformations']['rotation']['enabled'] is True  # From base
    
    def test_load_config_missing_file(self):
        """Test handling of missing config file."""
        with pytest.raises(RuntimeError, match="Configuration file not found"):
            with patch('config.os.path.join', return_value='/nonexistent/config.json'):
                load_config_from_json()
    
    def test_load_config_invalid_json(self):
        """Test handling of invalid JSON."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write('invalid json {')
            temp_file = f.name
        
        try:
            with patch('config.os.path.join', return_value=temp_file):
                with pytest.raises(RuntimeError, match="Invalid JSON"):
                    load_config_from_json()
        finally:
            os.unlink(temp_file)


class TestConfigClass:
    """Test Config class functionality."""
    
    @pytest.fixture
    def sample_config_file(self):
        """Create a temporary config file."""
        config_data = {
            "flask": {
                "debug": True,
                "secret_key": "test-secret",
                "host": "0.0.0.0",
                "port": 8080
            },
            "application": {
                "image_directory": "test/images",
                "max_concurrent_images": 15,
                "enable_caching": False
            },
            "animation_timing": {
                "fade_in_min_sec": 1.0,
                "fade_in_max_sec": 3.0,
                "min_hold_time_sec": 2.0,
                "max_hold_time_sec": 8.0
            },
            "transformations": {
                "rotation": {
                    "enabled": True,
                    "max_degrees": 45
                },
                "scale": {
                    "enabled": False,
                    "min_factor": 0.5,
                    "max_factor": 2.0
                }
            },
            "matte_border": {
                "enabled": True,
                "border_percent": 15,
                "color": "#FFFFFF"
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_data, f)
            temp_file = f.name
        
        yield temp_file
        
        # Cleanup
        try:
            os.unlink(temp_file)
        except OSError:
            pass
    
    @pytest.fixture
    def mock_config_file(self, sample_config_file):
        """Mock config file path."""
        def mock_load_config(config_name='development'):
            with open(sample_config_file, 'r') as f:
                return json.load(f)
        
        with patch('config.load_config_from_json', side_effect=mock_load_config):
            yield sample_config_file
    
    def test_config_initialization(self, mock_config_file):
        """Test Config class initialization."""
        config = Config('development')
        
        assert config._config_name == 'development'
        assert config.DEBUG is True
        assert config.FLASK_PORT == 8080
        assert config.IMAGE_DIRECTORY == 'test/images'
        assert config.ROTATION_ENABLED is True
        assert config.MATTE_BORDER_ENABLED is True
    
    def test_config_flask_settings(self, mock_config_file):
        """Test Flask-specific configuration settings."""
        config = Config('development')
        
        assert config.SECRET_KEY == 'test-secret'
        assert config.FLASK_HOST == '0.0.0.0'
        assert config.FLASK_PORT == 8080
        assert config.DEBUG is True
    
    def test_config_application_settings(self, mock_config_file):
        """Test application-specific settings."""
        config = Config('development')
        
        assert config.IMAGE_DIRECTORY == 'test/images'
        assert config.MAX_CONCURRENT_IMAGES == 15
        assert config.ENABLE_CACHING is False
    
    def test_config_animation_settings(self, mock_config_file):
        """Test animation timing settings."""
        config = Config('development')
        
        assert config.FADE_IN_MIN_SEC == 1.0
        assert config.FADE_IN_MAX_SEC == 3.0
        assert config.MIN_HOLD_TIME_SEC == 2.0
        assert config.MAX_HOLD_TIME_SEC == 8.0
    
    def test_config_transformation_settings(self, mock_config_file):
        """Test transformation settings."""
        config = Config('development')
        
        assert config.ROTATION_ENABLED is True
        assert config.ROTATION_MAX_DEGREES == 45
        assert config.SCALE_ENABLED is False
        assert config.SCALE_MIN_FACTOR == 0.5
        assert config.SCALE_MAX_FACTOR == 2.0
    
    def test_config_matte_border_settings(self, mock_config_file):
        """Test matte border settings."""
        config = Config('development')
        
        assert config.MATTE_BORDER_ENABLED is True
        assert config.MATTE_BORDER_BORDER_PERCENT == 15
        assert config.MATTE_BORDER_COLOR == '#FFFFFF'
    
    @patch('config.os.path.getmtime')
    def test_config_hot_reload(self, mock_getmtime, mock_config_file):
        """Test configuration hot reload functionality."""
        # Initial config
        config = Config('development')
        initial_debug = config.DEBUG
        
        # Simulate file change
        mock_getmtime.return_value = time.time() + 100
        
        # Mock the reload to change a setting
        new_config_data = {"flask": {"debug": False}}
        with patch('config.load_config_from_json', return_value={"flask": {"debug": False}}):
            with patch.object(config, '_load_configuration') as mock_load:
                result = config.check_and_reload()
                assert result is True
                mock_load.assert_called_once()
    
    @patch('config.os.path.getmtime')
    def test_config_no_reload_needed(self, mock_getmtime, mock_config_file):
        """Test when no reload is needed."""
        config = Config('development')
        
        # Same modification time
        mock_getmtime.return_value = config._last_modified
        
        result = config.check_and_reload()
        assert result is False
    
    def test_config_reload_error_handling(self, mock_config_file):
        """Test error handling in config reload."""
        config = Config('development')
        
        with patch('config.os.path.getmtime', side_effect=OSError("File error")):
            # Should not raise exception, just return False
            result = config.check_and_reload()
            assert result is False


class TestSpecificConfigs:
    """Test specific configuration classes."""
    
    @patch('config.load_config_from_json')
    def test_development_config(self, mock_load):
        """Test DevelopmentConfig."""
        mock_load.return_value = {
            'flask': {'debug': True},
            'application': {},
            'animation_timing': {},
            'layer_management': {},
            'transformations': {},
            'color_remapping': {},
            'performance': {},
            'audio': {},
            'canvas_drop_shadow': {},
            'matte_border': {}
        }
        
        config = DevelopmentConfig()
        assert config._config_name == 'development'
        mock_load.assert_called_with('development')
    
    @patch('config.load_config_from_json')
    def test_production_config(self, mock_load):
        """Test ProductionConfig."""
        mock_load.return_value = {
            'flask': {'debug': False},
            'application': {},
            'animation_timing': {},
            'layer_management': {},
            'transformations': {},
            'color_remapping': {},
            'performance': {},
            'audio': {},
            'canvas_drop_shadow': {},
            'matte_border': {}
        }
        
        config = ProductionConfig()
        assert config._config_name == 'production'
        mock_load.assert_called_with('production')
    
    @patch('config.load_config_from_json')
    def test_raspberry_pi_config(self, mock_load):
        """Test RaspberryPiConfig."""
        mock_load.return_value = {
            'flask': {},
            'application': {},
            'animation_timing': {},
            'layer_management': {},
            'transformations': {},
            'color_remapping': {},
            'performance': {},
            'audio': {},
            'canvas_drop_shadow': {},
            'matte_border': {}
        }
        
        config = RaspberryPiConfig()
        assert config._config_name == 'raspberry_pi'
        mock_load.assert_called_with('raspberry_pi')
    
    @patch('config.load_config_from_json')
    def test_testing_config(self, mock_load):
        """Test TestingConfig."""
        mock_load.return_value = {
            'flask': {},
            'application': {},
            'animation_timing': {},
            'layer_management': {},
            'transformations': {},
            'color_remapping': {},
            'performance': {},
            'audio': {},
            'canvas_drop_shadow': {},
            'matte_border': {}
        }
        
        config = TestingConfig()
        assert config._config_name == 'development'  # Uses development as base
        assert config.TESTING is True
        assert config.WTF_CSRF_ENABLED is False
        assert config.SECRET_KEY == 'test-secret-key'
        assert config.IMAGE_DIRECTORY == 'tests/fixtures/test_images'


class TestConfigDefaults:
    """Test configuration default values."""
    
    @patch('config.load_config_from_json')
    def test_default_values(self, mock_load):
        """Test that default values are applied when config sections are empty."""
        # Empty config
        mock_load.return_value = {
            'flask': {},
            'application': {},
            'animation_timing': {},
            'layer_management': {},
            'transformations': {},
            'color_remapping': {},
            'performance': {},
            'audio': {},
            'canvas_drop_shadow': {},
            'matte_border': {}
        }
        
        config = Config('development')
        
        # Check defaults are applied
        assert config.DEBUG is True  # Default Flask debug
        assert config.SECRET_KEY == 'dev-secret-key'  # Default secret
        assert config.FLASK_HOST == '127.0.0.1'  # Default host
        assert config.FLASK_PORT == 5000  # Default port
        assert config.IMAGE_DIRECTORY == 'static/images'  # Default image dir
        assert config.FADE_IN_MIN_SEC == 2.0  # Default animation timing
        assert config.ROTATION_ENABLED is True  # Default rotation
        assert config.MATTE_BORDER_ENABLED is False  # Default matte border


if __name__ == '__main__':
    pytest.main([__file__])