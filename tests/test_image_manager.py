"""
Consolidated tests for ImageManager utility class.
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


class TestImageManagerCore:
    """Comprehensive tests for ImageManager core functionality."""
    
    @pytest.fixture
    def temp_image_dir(self):
        """Create temporary directory with test images and configs."""
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
    
    def test_initialization_and_configuration(self, temp_image_dir, sample_config):
        """Test ImageManager initialization with and without base config."""
        # Test 1: Basic initialization
        manager = ImageManager(temp_image_dir)
        assert str(manager.image_directory) == str(Path(temp_image_dir))
        assert manager.base_config == {}
        
        # Test 2: Initialization with base config
        manager_with_config = ImageManager(temp_image_dir, base_config=sample_config)
        assert manager_with_config.base_config == sample_config
        
        # Test 3: Supported file extensions
        extensions = manager.supported_formats
        expected_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
        assert extensions == expected_extensions
        
        print("[SUCCESS] ImageManager initialization: Basic setup, config handling, file extensions tested")
    
    def test_image_validation_comprehensive(self, temp_image_dir):
        """Test comprehensive image validation scenarios."""
        manager = ImageManager(temp_image_dir)
        
        # Test 1: Valid image validation
        test_path = Path(temp_image_dir) / "test1.png"
        assert manager.validate_image(test_path) is True
        
        # Test 2: Non-existent image validation
        nonexistent_path = Path(temp_image_dir) / "nonexistent.png"
        assert manager.validate_image(nonexistent_path) is False
        
        # Test 3: Corrupted image validation using mock
        with patch('PIL.Image.open') as mock_open:
            mock_open.side_effect = Exception("Corrupted image")
            assert manager.validate_image(test_path) is False
        
        # Test 4: Get image info
        info = manager._get_image_info(test_path)
        assert info['filename'] == 'test1.png'
        assert info['width'] == 100
        assert info['height'] == 100
        assert info['size'] > 0
        assert 'id' in info
        assert info['path'].endswith('test1.png')
        
        print("[SUCCESS] Image validation: Valid images, non-existent files, corrupted images, metadata extraction tested")
    
    def test_catalog_and_configuration_management(self, temp_image_dir, sample_config):
        """Test image catalog generation and configuration management."""
        manager = ImageManager(temp_image_dir, base_config=sample_config)
        
        # Test 1: Get image catalog
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
        
        # Test 2: Per-image configuration loading
        test_path = Path(temp_image_dir) / "test1.png"
        config = manager._load_image_config(test_path)
        assert 'transformations' in config
        assert config['transformations']['scale']['min_factor'] == 1.5
        assert config['transformations']['scale']['max_factor'] == 2.0
        
        # Test 3: Missing config file handling
        test_path2 = Path(temp_image_dir) / "test2.jpg"  # No JSON config for this
        config2 = manager._load_image_config(test_path2)
        assert config2 == {}
        
        # Test 4: Configuration merging
        per_image_config = {
            "transformations": {
                "scale": {"min_factor": 1.5},
                "rotation": {"max_degrees": 45}
            }
        }
        merged = manager._deep_merge_config(sample_config, per_image_config)
        assert merged['transformations']['scale']['min_factor'] == 1.5  # From per-image
        assert merged['transformations']['scale']['max_factor'] == 1.2  # From base
        assert merged['transformations']['rotation']['max_degrees'] == 45  # From per-image
        assert merged['matte_border'] == sample_config['matte_border']  # From base only
        
        print(f"[SUCCESS] Catalog and config management: {len(catalog['images'])} images cataloged, config merging, missing file handling tested")
    
    def test_edge_cases_and_error_handling(self):
        """Test edge cases and error handling scenarios."""
        # Test 1: Empty directory
        with tempfile.TemporaryDirectory() as temp_dir:
            manager = ImageManager(temp_dir)
            catalog = manager.get_image_catalog()
            assert catalog['images'] == []
        
        # Test 2: Directory with unsupported files
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
        
        # Test 3: Non-existent directory
        with patch('pathlib.Path.exists') as mock_exists:
            mock_exists.return_value = False
            manager = ImageManager('/nonexistent/path')
            catalog = manager.get_image_catalog()
            assert catalog['images'] == []
        
        print("[SUCCESS] Edge cases: Empty directories, unsupported files, non-existent paths tested")


class TestImageManagerIntegration:
    """Integration tests for complete ImageManager workflows."""
    
    def test_complete_workflow_integration(self):
        """Test complete ImageManager workflow with real files and configurations."""
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
            
            # Test complete workflow
            base_config = {"matte_border": {"enabled": True}}
            manager = ImageManager(str(temp_path), base_config=base_config)
            
            # Test 1: Image validation
            assert manager.validate_image(img_path)
            
            # Test 2: Catalog generation
            catalog = manager.get_image_catalog()
            assert len(catalog['images']) == 1
            
            image_info = catalog['images'][0]
            assert image_info['filename'] == 'workflow_test.png'
            assert image_info['width'] == 300
            assert image_info['height'] == 200
            
            # Test 3: Per-image configuration loading (not merged with base config)
            image_config = image_info['config']
            assert image_config['animation_timing']['fadeInMinSec'] == 5
            assert image_config['transformations']['rotation']['max_degrees'] == 90
            # The matte_border config is not merged into per-image config
            
            print(f"[SUCCESS] Complete workflow integration: Image validation, catalog generation, config management tested")


if __name__ == '__main__':
    pytest.main([__file__])