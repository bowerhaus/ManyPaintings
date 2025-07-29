import os
import json
import hashlib
from pathlib import Path
from PIL import Image

class ImageManager:
    def __init__(self, image_directory, base_config=None):
        self.image_directory = Path(image_directory)
        self.supported_formats = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
        self._image_cache = {}
        self.base_config = base_config or {}
    
    def discover_images(self):
        """Discover all supported images in the directory."""
        images = []
        
        if not self.image_directory.exists():
            return images
        
        for image_path in self.image_directory.iterdir():
            if image_path.suffix.lower() in self.supported_formats:
                try:
                    image_info = self._get_image_info(image_path)
                    images.append(image_info)
                except Exception as e:
                    print(f"Error processing {image_path}: {e}")
                    continue
        
        return sorted(images, key=lambda x: x['filename'])
    
    def _get_image_info(self, image_path):
        """Extract metadata from an image file."""
        # Generate unique ID from filename
        image_id = hashlib.md5(image_path.name.encode()).hexdigest()[:8]
        
        # Get basic file info
        stat = image_path.stat()
        
        # Try to get image dimensions
        width, height = None, None
        try:
            with Image.open(image_path) as img:
                width, height = img.size
        except Exception:
            pass
        
        # Load per-image config overrides
        config_overrides = self._load_image_config(image_path)
        
        return {
            'id': image_id,
            'filename': image_path.name,
            'path': f"/static/images/{image_path.name}",
            'size': stat.st_size,
            'width': width,
            'height': height,
            'modified': int(stat.st_mtime),
            'config': self._make_json_serializable(config_overrides)
        }
    
    def _load_image_config(self, image_path):
        """Load per-image config overrides from JSON file."""
        # Generate config file path (same name as image but with .json extension)
        config_path = image_path.with_suffix('.json')
        
        if not config_path.exists():
            return {}
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
            
            # Only return the override data, not merged with base config
            # This keeps the response smaller and more focused
            return config_data
            
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading config for {image_path.name}: {e}")
            return {}
    
    def _deep_merge_config(self, base, override):
        """Deep merge configuration dictionaries."""
        if not isinstance(base, dict) or not isinstance(override, dict):
            return override
        
        result = base.copy()
        
        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge_config(result[key], value)
            else:
                result[key] = value
        
        return result
    
    def _make_json_serializable(self, obj):
        """Convert non-serializable objects to serializable equivalents."""
        if isinstance(obj, dict):
            return {key: self._make_json_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._make_json_serializable(item) for item in obj]
        elif hasattr(obj, '__dict__'):
            # Convert objects with __dict__ to dictionaries
            return self._make_json_serializable(obj.__dict__)
        elif hasattr(obj, 'total_seconds'):
            # Convert timedelta to seconds (float)
            return obj.total_seconds()
        elif hasattr(obj, 'isoformat'):
            # Convert datetime to ISO string
            return obj.isoformat()
        elif isinstance(obj, bytes):
            # Convert bytes to string
            return obj.decode('utf-8', errors='ignore')
        else:
            # For other types, try to convert to string as fallback
            try:
                # Test if it's already JSON serializable
                import json
                json.dumps(obj)
                return obj
            except (TypeError, ValueError):
                return str(obj)
    
    def get_image_catalog(self):
        """Get complete image catalog with metadata."""
        images = self.discover_images()
        
        return {
            'images': images,
            'total_count': len(images),
            'supported_formats': list(self.supported_formats),
            'directory': str(self.image_directory)
        }
    
    def validate_image(self, image_path):
        """Validate that an image file is readable."""
        try:
            with Image.open(image_path) as img:
                img.verify()
            return True
        except Exception:
            return False