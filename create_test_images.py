#!/usr/bin/env python3
"""
Create sample test images for the test suite.
"""

from PIL import Image, ImageDraw
import os
from pathlib import Path


def create_test_images():
    """Create sample test images."""
    test_dir = Path("tests/fixtures/test_images")
    test_dir.mkdir(parents=True, exist_ok=True)
    
    # Create a red square
    img1 = Image.new('RGB', (100, 100), color='red')
    img1.save(test_dir / "test_red.png")
    
    # Create a blue circle
    img2 = Image.new('RGBA', (150, 150), color=(0, 0, 0, 0))
    draw2 = ImageDraw.Draw(img2)
    draw2.ellipse([25, 25, 125, 125], fill='blue')
    img2.save(test_dir / "test_blue_circle.png")
    
    # Create a green gradient
    img3 = Image.new('RGB', (200, 100), color='white')
    draw3 = ImageDraw.Draw(img3)
    for x in range(200):
        color = int((x / 200) * 255)
        draw3.line([(x, 0), (x, 100)], fill=(0, color, 0))
    img3.save(test_dir / "test_green_gradient.jpg")
    
    # Create a simple pattern
    img4 = Image.new('RGBA', (80, 80), color=(255, 255, 255, 128))
    draw4 = ImageDraw.Draw(img4)
    for i in range(0, 80, 10):
        draw4.line([(i, 0), (i, 80)], fill='black', width=2)
        draw4.line([(0, i), (80, i)], fill='black', width=2)
    img4.save(test_dir / "test_pattern.png")
    
    print(f"Created test images in {test_dir}")
    
    # Create a corresponding JSON config for one image
    config_path = test_dir / "test_red.json"
    config_data = {
        "transformations": {
            "scale": {"min_factor": 1.2, "max_factor": 1.8},
            "rotation": {"max_degrees": 45}
        },
        "animation_timing": {
            "fadeInMinSec": 2,
            "fadeInMaxSec": 4
        }
    }
    
    import json
    with open(config_path, 'w') as f:
        json.dump(config_data, f, indent=2)
    
    print(f"Created test config: {config_path}")


if __name__ == '__main__':
    create_test_images()