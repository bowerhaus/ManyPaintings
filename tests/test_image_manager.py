"""
Tests for ImageManager utility class.
"""

import pytest
import json
import tempfile
import os
from pathlib import Path
from unittest.mock import patch, MagicMock
from PIL import Image

# Import the ImageManager
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.image_manager import ImageManager


class TestImageManager:
    """Test ImageManager functionality."""
    
    @pytest.fixture
    def temp_image_dir(self):
        """Create temporary directory with test images."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create a simple test image
            test_image_path = Path(temp_dir) / "test1.png"
            img = Image.new('RGB', (100, 100), color='red')
            img.save(test_image_path)
            
            # Create another test image
            test_image2_path = Path(temp_dir) / "test2.jpg"
            img2 = Image.new('RGB', (200, 150), color='blue')
            img2.save(test_image2_path)
            
            # Create a JSON config file
            config_path = Path(temp_dir) / "test1.json"
            with open(config_path, 'w') as f:
                json.dump({
                    "transformations": {
                        "scale": {"min_factor": 1.5, "max_factor": 2.0}
                    }
                }, f)
            
            yield temp_dir
    
    def test_initialization(self, temp_image_dir):
        """Test ImageManager initialization."""
        manager = ImageManager(temp_image_dir)
        assert str(manager.image_directory) == str(Path(temp_image_dir))
        assert manager.base_config == {}
    
    def test_initialization_with_base_config(self, temp_image_dir, sample_config):
        """Test ImageManager initialization with base config."""
        manager = ImageManager(temp_image_dir, base_config=sample_config)
        assert manager.base_config == sample_config
    
    def test_get_image_catalog(self, temp_image_dir):
        """Test getting image catalog."""
        manager = ImageManager(temp_image_dir)
        catalog = manager.get_image_catalog()
        
        assert 'images' in catalog
        assert len(catalog['images']) == 2
        
        # Check image details
        images = {img['filename']: img for img in catalog['images']}
        
        assert 'test1.png' in images
        assert 'test2.jpg' in images
        
        test1 = images['test1.png']
        assert test1['width'] == 100
        assert test1['height'] == 100
        assert test1['size'] > 0
        assert 'id' in test1
        assert test1['path'].endswith('test1.png')
    
    def test_validate_image_valid(self, temp_image_dir):
        """Test image validation with valid image."""
        manager = ImageManager(temp_image_dir)
        test_path = Path(temp_image_dir) / "test1.png"
        assert manager.validate_image(test_path) is True
    
    def test_validate_image_nonexistent(self, temp_image_dir):
        """Test image validation with nonexistent file."""
        manager = ImageManager(temp_image_dir)
        test_path = Path(temp_image_dir) / "nonexistent.png"
        assert manager.validate_image(test_path) is False
    
    @patch('PIL.Image.open')
    def test_validate_image_corrupted(self, mock_open, temp_image_dir):
        """Test image validation with corrupted image."""
        mock_open.side_effect = Exception("Corrupted image")
        
        manager = ImageManager(temp_image_dir)
        test_path = Path(temp_image_dir) / "test1.png"
        assert manager.validate_image(test_path) is False
    
    def test_get_image_info(self, temp_image_dir):
        """Test getting image info."""
        manager = ImageManager(temp_image_dir)
        test_path = Path(temp_image_dir) / "test1.png"
        
        info = manager._get_image_info(test_path)
        
        assert info['filename'] == 'test1.png'
        assert info['width'] == 100
        assert info['height'] == 100
        assert info['size'] > 0
        assert 'id' in info
        assert info['path'].endswith('test1.png')
    
    def test_load_per_image_config(self, temp_image_dir):
        """Test loading per-image configuration."""
        manager = ImageManager(temp_image_dir)
        test_path = Path(temp_image_dir) / "test1.png"
        
        config = manager._load_image_config(test_path)
        
        # Should have the config from test1.json
        assert 'transformations' in config
        assert config['transformations']['scale']['min_factor'] == 1.5
        assert config['transformations']['scale']['max_factor'] == 2.0
    
    def test_load_per_image_config_missing(self, temp_image_dir):
        """Test loading config when JSON file doesn't exist."""
        manager = ImageManager(temp_image_dir)
        test_path = Path(temp_image_dir) / "test2.jpg"  # No JSON config for this
        
        config = manager._load_image_config(test_path)
        
        # Should return empty dict
        assert config == {}
    
    def test_merge_configs(self, temp_image_dir, sample_config):
        """Test configuration merging."""
        manager = ImageManager(temp_image_dir, base_config=sample_config)
        
        per_image_config = {
            "transformations": {
                "scale": {"min_factor": 1.5},
                "rotation": {"max_degrees": 45}
            }
        }
        
        merged = manager._deep_merge_config(sample_config, per_image_config)
        
        # Should merge properly
        assert merged['transformations']['scale']['min_factor'] == 1.5  # From per-image
        assert merged['transformations']['scale']['max_factor'] == 1.2  # From base
        assert merged['transformations']['rotation']['max_degrees'] == 45  # From per-image
        assert merged['matte_border'] == sample_config['matte_border']  # From base only
    
    def test_get_supported_extensions(self, temp_image_dir):
        """Test getting supported file extensions."""
        manager = ImageManager(temp_image_dir)
        extensions = manager.supported_formats
        
        expected_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
        assert extensions == expected_extensions
    
    def test_catalog_with_unsupported_files(self):
        """Test catalog ignores unsupported files."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create unsupported file
            text_file = Path(temp_dir) / "readme.txt"
            text_file.write_text("This is not an image")
            
            # Create supported image
            img_file = Path(temp_dir) / "test.png"
            img = Image.new('RGB', (50, 50), color='green')
            img.save(img_file)
            
            manager = ImageManager(temp_dir)
            catalog = manager.get_image_catalog()
            
            assert len(catalog['images']) == 1
            assert catalog['images'][0]['filename'] == 'test.png'
    
    def test_empty_directory(self):
        """Test catalog with empty directory."""
        with tempfile.TemporaryDirectory() as temp_dir:
            manager = ImageManager(temp_dir)
            catalog = manager.get_image_catalog()
            
            assert catalog['images'] == []
    
    @patch('pathlib.Path.exists')
    def test_nonexistent_directory(self, mock_exists):
        """Test handling of nonexistent directory."""
        mock_exists.return_value = False
        
        manager = ImageManager('/nonexistent/path')
        catalog = manager.get_image_catalog()
        
        assert catalog['images'] == []


class TestImageManagerIntegration:
    """Integration tests for ImageManager."""
    
    def test_full_workflow(self):
        """Test complete workflow with real files."""
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Create test image
            img_path = temp_path / "workflow_test.png"
            img = Image.new('RGBA', (300, 200), color=(255, 0, 0, 128))
            img.save(img_path)
            
            # Create config
            config_path = temp_path / "workflow_test.json"
            config_data = {
                "animation_timing": {"fadeInMinSec": 5, "fadeInMaxSec": 10},
                "transformations": {"rotation": {"max_degrees": 90}}
            }
            with open(config_path, 'w') as f:
                json.dump(config_data, f)
            
            # Test workflow
            base_config = {"matte_border": {"enabled": True}}
            manager = ImageManager(str(temp_path), base_config=base_config)
            
            # Validate image
            assert manager.validate_image(img_path)
            
            # Get catalog
            catalog = manager.get_image_catalog()
            assert len(catalog['images']) == 1
            
            image_info = catalog['images'][0]
            assert image_info['filename'] == 'workflow_test.png'
            assert image_info['width'] == 300
            assert image_info['height'] == 200
            
            # Check per-image config (not merged with base config)
            image_config = image_info['config']
            assert image_config['animation_timing']['fadeInMinSec'] == 5
            assert image_config['transformations']['rotation']['max_degrees'] == 90
            # The matte_border config is not merged into per-image config


if __name__ == '__main__':
    pytest.main([__file__])