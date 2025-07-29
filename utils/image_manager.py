import os
import hashlib
from pathlib import Path
from PIL import Image

class ImageManager:
    def __init__(self, image_directory):
        self.image_directory = Path(image_directory)
        self.supported_formats = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
        self._image_cache = {}
    
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
        
        return {
            'id': image_id,
            'filename': image_path.name,
            'path': f"/static/images/{image_path.name}",
            'size': stat.st_size,
            'width': width,
            'height': height,
            'modified': int(stat.st_mtime)
        }
    
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