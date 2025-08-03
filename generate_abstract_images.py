#!/usr/bin/env python3
"""
Abstract Art Image Generator for ManyPaintings
Generates 10 new abstract art images suitable for layering using advanced generative techniques
"""

import os
import math
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
from pathlib import Path

# Set random seed for reproducible results
random.seed(42)
np.random.seed(42)

# Output directory
OUTPUT_DIR = Path("static/images")

# Image settings
IMAGE_SIZE = (1000, 1000)
BACKGROUND_COLOR = (255, 255, 255, 0)  # Transparent background

def create_noise_field(size, scale=0.1, octaves=4):
    """Generate Perlin-like noise for organic textures"""
    width, height = size
    noise = np.zeros((height, width))
    
    for octave in range(octaves):
        freq = 2 ** octave
        amp = 1 / (2 ** octave)
        
        # Simple noise generation
        x_coords = np.linspace(0, scale * freq, width)
        y_coords = np.linspace(0, scale * freq, height)
        X, Y = np.meshgrid(x_coords, y_coords)
        
        # Generate smooth noise using sine waves
        octave_noise = amp * (np.sin(X) * np.cos(Y) + np.sin(X * 1.7) * np.sin(Y * 1.3))
        noise += octave_noise
    
    return noise

def create_generative_spiral(size, center, color, turns=3, noise_factor=0.3):
    """Create an organic spiral using mathematical generation"""
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = center
    max_radius = min(cx, cy, size[0] - cx, size[1] - cy) * 0.7
    
    # Generate spiral points with organic variation
    points = []
    num_points = turns * 120
    
    for i in range(num_points):
        t = i / num_points
        angle = t * turns * 2 * math.pi
        
        # Add organic variation using noise
        noise_x = math.sin(t * 8) * noise_factor * max_radius * 0.1
        noise_y = math.cos(t * 6) * noise_factor * max_radius * 0.1
        
        radius = max_radius * t * (1 + 0.3 * math.sin(t * 4))
        
        x = cx + radius * math.cos(angle) + noise_x
        y = cy + radius * math.sin(angle) + noise_y
        
        # Varying thickness
        thickness = int(25 * (1 - t * 0.7) + 5)
        points.append((x, y, thickness))
    
    # Draw the spiral with varying thickness
    for i in range(len(points) - 1):
        x1, y1, t1 = points[i]
        x2, y2, t2 = points[i + 1]
        
        # Use average thickness
        thickness = (t1 + t2) // 2
        draw.line([(x1, y1), (x2, y2)], fill=color, width=max(1, thickness))
    
    return img

def create_fluid_dynamics(size, color_palette, complexity=0.7):
    """Create fluid-like patterns using mathematical simulation"""
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    width, height = size
    
    # Create flow field
    flow_field = create_noise_field(size, scale=0.02, octaves=3)
    
    # Simulate multiple fluid particles
    num_particles = int(500 * complexity)
    
    for _ in range(num_particles):
        # Random starting position
        x = random.uniform(0, width)
        y = random.uniform(0, height)
        
        # Random color from palette
        color = random.choice(color_palette)
        alpha = random.randint(60, 180)
        color_with_alpha = (*color, alpha)
        
        # Trace particle path through flow field
        path = []
        for step in range(200):
            if 0 <= x < width and 0 <= y < height:
                # Sample flow field
                fx = int(x * flow_field.shape[1] / width)
                fy = int(y * flow_field.shape[0] / height)
                
                if 0 <= fx < flow_field.shape[1] and 0 <= fy < flow_field.shape[0]:
                    flow_val = flow_field[fy, fx]
                    
                    # Update position based on flow
                    angle = flow_val * 2 * math.pi
                    speed = 2.0
                    
                    x += speed * math.cos(angle)
                    y += speed * math.sin(angle)
                    
                    path.append((int(x), int(y)))
                else:
                    break
            else:
                break
        
        # Draw particle trail
        if len(path) > 1:
            draw = ImageDraw.Draw(img)
            thickness = random.randint(3, 12)
            for i in range(len(path) - 1):
                draw.line([path[i], path[i + 1]], fill=color_with_alpha, width=thickness)
    
    return img

def create_fractal_tree(size, color, depth=8, angle_variance=0.3):
    """Generate fractal tree-like structures"""
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    width, height = size
    
    def draw_branch(x1, y1, x2, y2, depth, thickness):
        if depth <= 0 or thickness < 1:
            return
        
        # Draw current branch
        draw.line([(x1, y1), (x2, y2)], fill=color, width=max(1, int(thickness)))
        
        # Calculate branch direction and length
        dx = x2 - x1
        dy = y2 - y1
        length = math.sqrt(dx*dx + dy*dy)
        
        if length < 10:
            return
        
        # Branch angle
        base_angle = math.atan2(dy, dx)
        
        # Create sub-branches
        num_branches = random.randint(2, 4)
        for i in range(num_branches):
            # Random angle variation
            angle_offset = (random.random() - 0.5) * angle_variance * math.pi
            new_angle = base_angle + angle_offset
            
            # Branch length reduction
            new_length = length * random.uniform(0.6, 0.8)
            new_thickness = thickness * 0.7
            
            # Calculate new endpoint
            new_x = x2 + new_length * math.cos(new_angle)
            new_y = y2 + new_length * math.sin(new_angle)
            
            # Recursive call
            draw_branch(x2, y2, new_x, new_y, depth - 1, new_thickness)
    
    # Start with multiple root branches
    num_roots = random.randint(2, 5)
    for _ in range(num_roots):
        start_x = random.uniform(width * 0.2, width * 0.8)
        start_y = random.uniform(height * 0.7, height * 0.9)
        
        initial_angle = random.uniform(-math.pi/3, -2*math.pi/3)  # Upward bias
        initial_length = random.uniform(80, 150)
        
        end_x = start_x + initial_length * math.cos(initial_angle)
        end_y = start_y + initial_length * math.sin(initial_angle)
        
        draw_branch(start_x, start_y, end_x, end_y, depth, 20)
    
    return img

def create_cellular_automata(size, color_palette, generations=50):
    """Generate patterns using cellular automata"""
    width, height = size
    
    # Initialize random grid
    grid = np.random.choice([0, 1], size=(height//4, width//4), p=[0.6, 0.4])
    
    # Evolve the cellular automata
    for _ in range(generations):
        new_grid = np.zeros_like(grid)
        
        for i in range(1, grid.shape[0] - 1):
            for j in range(1, grid.shape[1] - 1):
                # Count neighbors
                neighbors = np.sum(grid[i-1:i+2, j-1:j+2]) - grid[i, j]
                
                # Conway's Game of Life rules (modified)
                if grid[i, j] == 1:  # Alive
                    if neighbors in [2, 3]:
                        new_grid[i, j] = 1
                else:  # Dead
                    if neighbors == 3:
                        new_grid[i, j] = 1
        
        grid = new_grid
    
    # Convert to image
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    
    # Scale up the grid and add color
    scale_x = width // grid.shape[1]
    scale_y = height // grid.shape[0]
    
    draw = ImageDraw.Draw(img)
    
    for i in range(grid.shape[0]):
        for j in range(grid.shape[1]):
            if grid[i, j] == 1:
                color = random.choice(color_palette)
                alpha = random.randint(120, 220)
                color_with_alpha = (*color, alpha)
                
                x1 = j * scale_x
                y1 = i * scale_y
                x2 = x1 + scale_x
                y2 = y1 + scale_y
                
                draw.rectangle([x1, y1, x2, y2], fill=color_with_alpha)
    
    return img

def create_wave_interference(size, color, num_sources=5):
    """Create wave interference patterns"""
    width, height = size
    
    # Create wave sources
    sources = []
    for _ in range(num_sources):
        x = random.uniform(0, width)
        y = random.uniform(0, height)
        frequency = random.uniform(0.01, 0.03)
        amplitude = random.uniform(0.5, 1.0)
        phase = random.uniform(0, 2 * math.pi)
        sources.append((x, y, frequency, amplitude, phase))
    
    # Generate wave field
    wave_field = np.zeros((height, width))
    
    for y in range(height):
        for x in range(width):
            wave_sum = 0
            for sx, sy, freq, amp, phase in sources:
                distance = math.sqrt((x - sx)**2 + (y - sy)**2)
                wave = amp * math.sin(freq * distance + phase)
                wave_sum += wave
            
            wave_field[y, x] = wave_sum
    
    # Normalize and convert to image
    wave_field = (wave_field - wave_field.min()) / (wave_field.max() - wave_field.min())
    
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    pixels = img.load()
    
    for y in range(height):
        for x in range(width):
            intensity = wave_field[y, x]
            if intensity > 0.3:  # Threshold for visibility
                alpha = int(255 * min(intensity, 1.0))
                pixels[x, y] = (*color, alpha)
    
    return img


def generate_color_palette():
    """Generate a harmonious color palette"""
    palettes = [
        # Rich blues
        [(30, 60, 114), (45, 90, 160), (70, 130, 180), (100, 149, 237)],
        # Deep greens
        [(27, 79, 65), (34, 99, 85), (50, 130, 110), (70, 160, 140)],
        # Warm earth tones
        [(101, 67, 33), (139, 90, 43), (160, 120, 70), (180, 150, 100)],
        # Purple/magenta spectrum
        [(75, 0, 100), (120, 20, 140), (150, 60, 180), (180, 120, 220)],
        # Orange/coral variations
        [(180, 60, 20), (210, 90, 40), (240, 120, 70), (255, 150, 100)],
        # Sophisticated grays
        [(60, 60, 70), (90, 90, 100), (120, 120, 130), (150, 150, 160)],
    ]
    return random.choice(palettes)

def generate_abstract_image(filename, style='mixed'):
    """Generate a single abstract image using advanced generative techniques"""
    # Get color palette
    palette = generate_color_palette()
    main_color = random.choice(palette)
    
    if style == 'generative_spiral':
        center = (IMAGE_SIZE[0] // 2, IMAGE_SIZE[1] // 2)
        img = create_generative_spiral(IMAGE_SIZE, center, main_color, 
                                     turns=random.randint(2, 5), 
                                     noise_factor=random.uniform(0.2, 0.6))
    
    elif style == 'fluid_dynamics':
        img = create_fluid_dynamics(IMAGE_SIZE, palette, complexity=random.uniform(0.5, 1.0))
    
    elif style == 'fractal_tree':
        img = create_fractal_tree(IMAGE_SIZE, main_color, 
                                depth=random.randint(6, 10),
                                angle_variance=random.uniform(0.2, 0.5))
    
    elif style == 'cellular_automata':
        img = create_cellular_automata(IMAGE_SIZE, palette, generations=random.randint(30, 80))
    
    elif style == 'wave_interference':
        img = create_wave_interference(IMAGE_SIZE, main_color, num_sources=random.randint(3, 8))
    
    elif style == 'mixed':
        # Combine multiple generative techniques
        base_style = random.choice(['fluid_dynamics', 'fractal_tree', 'cellular_automata'])
        
        if base_style == 'fluid_dynamics':
            img = create_fluid_dynamics(IMAGE_SIZE, palette, complexity=0.6)
        elif base_style == 'fractal_tree':
            img = create_fractal_tree(IMAGE_SIZE, main_color, depth=7, angle_variance=0.4)
        else:  # cellular_automata
            img = create_cellular_automata(IMAGE_SIZE, palette, generations=50)
        
        # Sometimes overlay with another technique
        if random.random() < 0.3:
            overlay_style = random.choice(['generative_spiral', 'wave_interference'])
            secondary_color = random.choice(palette)
            
            if overlay_style == 'generative_spiral':
                center = (IMAGE_SIZE[0] // 2, IMAGE_SIZE[1] // 2)
                overlay = create_generative_spiral(IMAGE_SIZE, center, secondary_color, turns=2, noise_factor=0.3)
            else:
                overlay = create_wave_interference(IMAGE_SIZE, secondary_color, num_sources=4)
            
            # Blend overlay with base image
            img = Image.alpha_composite(img, overlay)
    
    # Apply post-processing effects
    if random.random() < 0.3:
        img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 2.0)))
    
    if random.random() < 0.2:
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(random.uniform(1.1, 1.4))
    
    # Save the image
    output_path = OUTPUT_DIR / filename
    img.save(output_path, 'PNG')
    print(f"Generated: {filename}")

def main():
    """Generate 10 sophisticated abstract art images using advanced techniques"""
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    # Define image specifications with advanced generative styles
    images_to_generate = [
        ("fluid_flow_1.png", "fluid_dynamics"),
        ("organic_spiral.png", "generative_spiral"),
        ("fractal_branches.png", "fractal_tree"),
        ("cellular_life.png", "cellular_automata"),
        ("wave_patterns.png", "wave_interference"),
        ("generative_mix_1.png", "mixed"),
        ("generative_mix_2.png", "mixed"),
        ("dynamic_flow.png", "fluid_dynamics"),
        ("complex_spiral.png", "generative_spiral"),
        ("evolving_forms.png", "cellular_automata"),
    ]
    
    print("Generating 10 sophisticated abstract art images...")
    print("Using advanced generative techniques:")
    print("- Fluid dynamics simulation")
    print("- Generative spirals with organic variation")
    print("- Fractal tree structures")
    print("- Cellular automata evolution")
    print("- Wave interference patterns")
    print("=" * 60)
    
    for filename, style in images_to_generate:
        generate_abstract_image(filename, style)
    
    print("=" * 60)
    print(f"Successfully generated {len(images_to_generate)} sophisticated images in {OUTPUT_DIR}")
    print("\nThese images feature:")
    print("- Mathematical precision and organic beauty")
    print("- Rich color palettes suitable for layering")
    print("- Transparency and alpha blending optimized for overlaying")
    print("- Complex patterns that work well with hue shifting")
    print("\nImages are ready for use in the ManyPaintings application!")

if __name__ == "__main__":
    main()