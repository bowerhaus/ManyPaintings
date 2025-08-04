# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Flask-based generative art application inspired by Brian Eno's "77 Million Paintings." The application creates continuously changing, non-repeating visual experiences by layering and animating predefined abstract images. It's designed to run on both Raspberry Pi and Windows systems.

## Development Commands

### Running the Application
```bash
# Start Flask development server
python app.py

# Production deployment with Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Environment Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Access Points
- Main application: `http://localhost:5000`
- Kiosk mode: `http://localhost:5000/kiosk`

## Architecture

### Core Components
The application follows a browser-centric Flask web application structure:

- **Flask Backend**: Minimal server providing image endpoints and configuration
- **Frontend**: JavaScript-heavy client handling all animations and visual logic
- **Image Assets**: Large collection (potentially 1000+) of abstract art images
- **Audio System**: Background ambient audio with MP3 playback and controls
- **Pattern Generation**: Deterministic sequences based on random seeds
- **Kiosk Mode**: Full-screen immersive experience

### Client-Server Architecture
**Design Principle**: Minimize server contact, maximize client-side processing

- **Server Responsibilities**:
  - Serve static image files on-demand
  - Provide image metadata/catalog endpoints
  - Handle initial page load and configuration
  - Generate pattern seeds and codes

- **Client Responsibilities**:
  - All animation logic and timing
  - Image loading and caching management
  - Layer composition and effects
  - Audio playback and volume control
  - State management for current pattern
  - Performance optimization for smooth animations

### Performance Requirements
- **Scalability**: Handle 1000+ images efficiently with lazy loading
- **Browser Performance**: 30+ FPS on Raspberry Pi 4B (2GB+ RAM)
- **Memory Management**: Load images on-demand, cache strategically
- **Network Efficiency**: Minimize server requests during animation
- **Smooth Transitions**: Client-side animation without server dependency

### Image Loading Strategy
- **On-Demand Loading**: Images loaded only when needed for current/upcoming animations
- **Intelligent Preloading**: Predict and preload next images based on pattern sequence
- **Memory Management**: Unload unused images to prevent memory bloat
- **Caching Strategy**: Browser cache optimization for frequently used images
- **Progressive Loading**: Start animations while images still loading in background

### Audio System Architecture
- **Background Ambient Audio**: Continuous MP3 playback for immersive experience
- **Browser Autoplay Compliance**: Graceful fallback when autoplay is blocked
- **User Interaction Detection**: Automatic audio start after first user interaction
- **Volume Control**: Real-time volume adjustment (0-100%) with persistent settings
- **Loop Management**: Seamless audio looping for continuous experience
- **Manual Controls**: Toggle play/pause with visual feedback

### Technology Stack
- **Backend**: Python 3.9+ with Flask
- **Frontend**: HTML, CSS, JavaScript
- **Image Processing**: Pillow (PIL) for future dynamic generation
- **Deployment**: Flask development server or Gunicorn for production

## File Structure (Current)
```
ManyPaintings/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies  
├── config.json           # Main configuration file
├── config.example.json   # Configuration template
├── config/               # Configuration system
│   └── __init__.py       # JSON config loader
├── static/
│   ├── css/style.css     # Complete styling with animations
│   ├── js/main.js        # Full animation engine with deterministic patterns
│   ├── audio/            # Audio assets
│   │   └── *.mp3         # Background ambient audio files
│   └── images/           # Art image assets (17 images)
│       └── *.json        # Optional per-image configuration files
├── templates/
│   ├── base.html         # Base template
│   ├── index.html        # Main application interface
│   └── kiosk.html        # Kiosk mode
└── utils/
    ├── __init__.py
    └── image_manager.py   # Image discovery and metadata management
```

## Configuration Management

### JSON Configuration System
The application uses a JSON-based configuration system with environment-specific overrides:

**Main Configuration**: `config.json`
```json
{
  "flask": { 
    "secret_key": "dev-secret-key-change-in-production",
    "debug": true, 
    "host": "127.0.0.1", 
    "port": 5000 
  },
  "application": {
    "image_directory": "static/images",
    "max_concurrent_images": 10,
    "preload_buffer_size": 5,
    "animation_fps": 30,
    "pattern_seed": "auto",
    "initial_pattern_code": null,
    "enable_caching": true,
    "cache_max_age": 3600,
    "lazy_loading": true
  },
  "animation_timing": {
    "fade_in_min_sec": 15.0,
    "fade_in_max_sec": 60.0,
    "fade_out_min_sec": 15.0,
    "fade_out_max_sec": 60.0,
    "min_hold_time_sec": 5.0,
    "max_hold_time_sec": 120.0,
    "layer_spawn_interval_sec": 4.0
  },
  "layer_management": { 
    "max_concurrent_layers": 4,
    "max_opacity": 1.0,
    "min_opacity": 0.7
  },
  "transformations": {
    "rotation": {
      "enabled": true,
      "min_degrees": -60,
      "max_degrees": 60
    },
    "scale": {
      "enabled": true,
      "min_factor": 0.75,
      "max_factor": 1.5
    },
    "translation": {
      "enabled": true,
      "minimum_visible_percent": 60
    },
    "best_fit_scaling": {
      "enabled": true
    }
  },
  "color_remapping": {
    "enabled": true,
    "probability": 0.3,
    "hue_shift_range": {
      "min_degrees": 0,
      "max_degrees": 360
    }
  },
  "performance": {
    "animation_quality": "high",
    "preload_transform_cache": true
  },
  "audio": {
    "enabled": true,
    "file_path": "static/audio/Ethereal Strokes Loop.mp3",
    "volume": 0.5,
    "loop": true,
    "autoplay": false
  },
  "matte_border": {
    "enabled": true,
    "border_percent": 10,
    "color": "#F8F8F8",
    "style": "medium",
    "image_area": {
      "aspect_ratio": "1:1"
    }
  },
  "environments": {
    "development": { /* dev overrides */ },
    "production": { /* prod overrides */ },
    "raspberry_pi": { /* pi overrides */ }
  }
}
```

**Per-Image Configuration**: `static/images/[image_name].json`
```json
{
  "animation_timing": {
    "fade_in_min_sec": 15.0,
    "fade_in_max_sec": 60.0,
    "max_hold_time_sec": 120.0
  },
  "transformations": {
    "rotation": { "enabled": false },
    "scale": { "min_factor": 0.75, "max_factor": 1.5 }
  },
  "layer_management": {
    "max_opacity": 0.7,
    "min_opacity": 0.5
  },
  "color_remapping": {
    "enabled": true,
    "probability": 0.8
  }
}
```

### Configuration Loading
- Environment selection via `FLASK_CONFIG` environment variable
- JSON config loader in `config/__init__.py`
- Deep merge of base config with environment overrides
- Per-image configs override base settings for specific images
- **Hot Reload Support**: Configuration changes detected automatically on browser refresh

### Deployment Configurations
- **Development**: Debug enabled, verbose logging, hot reload
- **Production**: Optimized caching, minimal logging, security headers
- **Raspberry Pi**: Memory-optimized settings, lower resource usage

## Development Notes

### Frontend Styling Architecture
**IMPORTANT**: This project uses **Tailwind CSS** with custom overrides for styling.

- **Primary Stylesheet**: `static/css/tailwind-overrides.css` (loaded in base.html)
- **Template Integration**: HTML templates use mix of Tailwind classes and custom CSS classes

**When making style changes:**
1. **ALWAYS check `tailwind-overrides.css` first** - this is the active stylesheet
2. Look for existing CSS classes before creating new ones
3. Templates may use Tailwind classes that need to be replaced with custom CSS classes
4. Key custom classes include:
   - `.bottom-controls-trigger` / `.bottom-overlay-panel` - control panel system
   - `.control-btn` / `.quick-actions` / `.controls-grid` - UI controls
   - `.image-layer` / `.matte-border` - image display system
   - White background mode overrides with `body.white-background` prefix

**Control Panel System:**
- Uses content-based auto-sizing instead of fixed viewport heights
- Solid white background with gradient fade for visibility
- Large trigger areas (50vh+ desktop, 70vh mobile) for accessibility
- Responsive design with proper content spacing

## Current Implementation Status

### Completed Components ✅
- **Flask Application**: Full app factory pattern with config loading
- **API Endpoints**: Complete REST API with `/api/images`, `/api/config`, `/api/pattern/<seed>`
- **Animation Engine**: JavaScript-based animation system with deterministic patterns
- **Audio System**: MP3 background audio with volume control and browser autoplay handling
- **Configuration System**: JSON-based config with per-image overrides and hot reload support
- **Image Management**: Discovery, metadata extraction, and intelligent preloading
- **Pattern System**: Deterministic sequences with initial pattern code support and equitable distribution
- **Weighted Random Selection**: Balanced image distribution that allows natural clustering while ensuring fairness
- **UI Controls**: Real-time speed, layer, audio, and background controls
- **Duplicate Prevention**: No image appears on multiple layers simultaneously

### Key Features Implemented
1. **Deterministic Pattern System**: Same pattern code produces identical visual sequences
2. **Per-Image Configuration**: JSON metadata files override settings per image
3. **Seeded Random System**: All animations use deterministic random for repeatability
4. **Real-time Controls**: Speed (0.1x-20x), layers (1-8), audio volume/toggle, background toggle
5. **Audio Integration**: Background ambient music with autoplay fallback and manual controls
6. **Opacity Control**: Configurable min/max opacity ranges for layered images
7. **Memory Management**: Dynamic layer cleanup and intelligent preloading
8. **Clean Startup**: No loading popups, immediate animation start
9. **Configuration Hot Reload**: Config changes take effect on browser refresh without server restart
10. **Fullscreen Consistency**: Image positioning remains consistent between windowed and fullscreen modes
11. **Color Remapping System**: Random hue shifting for dynamic color variation

### Architecture Highlights
- **Browser-Centric**: Minimal server contact, all animations client-side
- **Deterministic**: Same inputs always produce same visual outputs
- **Configurable**: Per-image timing and transformation overrides
- **Performance-Optimized**: 30+ FPS targeting with responsive controls
- **Modular Design**: Separate managers for images, animation, patterns, audio, and UI

### JavaScript Architecture Modules

#### ImageManager
- **Purpose**: Image loading, caching, and memory management
- **Key Features**: Lazy loading, intelligent preloading, memory cleanup
- **API**: `loadImage()`, `preloadImages()`, `cleanupMemory()`

#### AnimationEngine
- **Purpose**: Layer management and smooth transitions
- **Key Features**: Deterministic animations, seeded random, transformation cache
- **API**: `showImage()`, `hideImage()`, `updateExistingLayerSpeeds()`

#### PatternManager
- **Purpose**: Deterministic sequence generation and management
- **Key Features**: Seeded pattern generation, sequence management, preloading
- **API**: `generateNewPattern()`, `startPatternSequence()`

#### Weighted Random Distribution System
- **Purpose**: Intelligent image selection that balances natural randomness with equitable distribution
- **Core Philosophy**: Maintain the organic, unpredictable feel of true randomness while ensuring all images get fair representation over time

##### Key Features
- **Weighted Random Selection**: Dynamic probability adjustment based on usage history
- **Usage Tracking**: Per-pattern monitoring of how frequently each image appears
- **Natural Clustering**: Allows consecutive appearances and natural clustering patterns
- **Deterministic Reproduction**: Same pattern seed produces identical sequences
- **Real-time Adaptation**: Weights adjust throughout pattern sequences for continuous balance

##### Technical Implementation
- **Base Weight System**: Each image starts with weight of 1.0
- **Usage Bias Calculation**: 
  - Tracks usage count for each image within current pattern sequence
  - Calculates average usage across all images
  - Applies bias multiplier to images below average usage
  - Current bias strength: 0.5x (less-used images get up to +0.5 bonus weight)
- **Proper Randomization**: Uses Fisher-Yates shuffle algorithm instead of biased `sort()` methods
- **Seeded Randomness**: All randomization uses pattern-seeded generators for deterministic reproduction

##### Distribution Algorithm
1. **Initialize**: Start pattern with equal weights (1.0) for all images
2. **Track Usage**: Count selections for each image during pattern sequence
3. **Calculate Bias**: Compare individual usage to pattern average
4. **Apply Weights**: Boost probability for under-represented images
5. **Select**: Use weighted random selection for next image choice
6. **Update**: Increment usage counter and recalculate for next selection
7. **Reset**: Begin fresh tracking when new pattern starts

##### Mathematical Model
```
final_weight = base_weight + (bias_strength * usage_deficit)
where:
  base_weight = 1.0 (constant)
  bias_strength = 0.5 (configurable)
  usage_deficit = max(0, average_usage - current_usage)
```

##### Benefits Over Previous Systems
- **Natural Feel**: Images can appear consecutively or cluster naturally (no artificial constraints)
- **Long-term Fairness**: Less-used images gradually get higher selection probability
- **Elimination of Bias**: Fixed previous `sort(() => 0.5 - Math.random())` which created statistical bias
- **Pattern Consistency**: Same pattern code always produces identical sequences
- **Flexible Configuration**: Bias strength can be adjusted (currently 0.5x multiplier)
- **Performance Optimized**: Efficient calculations suitable for real-time animation

##### Previous Issues Resolved
- **Biased Shuffle Fixed**: Replaced statistically biased `sort(() => 0.5 - Math.random())` with Fisher-Yates shuffle
- **Rigid Cycles Removed**: Eliminated cycle-based approach that prevented natural consecutive appearances  
- **Gentle Bias Added**: Implemented usage-based weighting without eliminating randomness
- **Deterministic Seeding**: Ensured all randomization uses pattern seeds for reproducible results

##### Configuration Options
- **Bias Strength**: Adjustable multiplier for usage-based weighting (default: 0.5)
- **Tracking Window**: Per-pattern vs. global usage tracking (currently per-pattern)
- **Weight Calculation**: Linear vs. exponential bias curves (currently linear)

##### Performance Characteristics
- **Memory Overhead**: Minimal - tracks simple usage counters per image
- **CPU Impact**: Negligible - simple arithmetic operations during selection
- **Scalability**: Efficient with large image collections (1000+ images)
- **Real-time Updates**: Suitable for live animation without performance impact

#### AudioManager
- **Purpose**: Background audio playback and control
- **Key Features**: Browser autoplay handling, volume control, loop management
- **API**: `play()`, `pause()`, `setVolume()`, `toggle()`

#### UI Manager
- **Purpose**: User interface and interaction handling
- **Key Features**: Control panels, keyboard shortcuts, responsive design
- **API**: `togglePlayPause()`, `updateAnimationSpeed()`, `toggleAudio()`

### Enhanced Image Transformation System ✅ RECENT IMPROVEMENT

The application now features an advanced **Grid-Based Spatial Positioning System** that provides superior image distribution and visual balance compared to traditional random positioning.

#### Core Problem Solved
Traditional random positioning can create visual clustering where multiple images appear in the same area while leaving other regions sparse. The new system ensures balanced spatial distribution while maintaining natural, organic positioning.

#### Grid-Based Positioning Architecture
- **Virtual Grid**: 4×3 grid system (12 zones total) covering the entire canvas
- **Density Tracking**: Real-time monitoring of image count per grid zone
- **Weighted Selection**: Less-populated zones receive higher selection probability
- **Smooth Distribution**: Natural-feeling positioning that avoids rigid geometric layouts

#### Technical Implementation

##### Zone Management System
```javascript
// 4x3 grid for optimal canvas coverage
const gridCols = 4; // Horizontal zones
const gridRows = 3; // Vertical zones
const totalZones = 12; // Full coverage zones

// Each zone tracks current image density
zoneDensity: new Map() // Format: "row-col" -> count
```

##### Dynamic Weight Calculation
```javascript
// Higher weight for zones with lower density
const weight = Math.max(0.1, 1.0 - (currentDensity * 0.2));

// Weight ranges:
// - Empty zones: 1.0 (full weight)
// - 1 image: 0.8 weight
// - 2 images: 0.6 weight  
// - 3 images: 0.4 weight
// - 4+ images: 0.2 weight (minimum 0.1)
```

##### Position Calculation Process
1. **Zone Selection**: Use weighted random to select optimal grid zone
2. **Zone Bounds**: Calculate zone boundaries within translation ranges
3. **Random Position**: Generate random position within selected zone
4. **Density Update**: Increment zone density counter for tracking
5. **Coverage Tracking**: Monitor zones covered by scaled/rotated images

#### Advanced Features

##### Multi-Zone Coverage Detection
```javascript
calculateImageZoneCoverage(centerX, centerY, imageWidth, imageHeight, scale, rotation)
```
- Calculates which zones an image actually covers after transformations
- Accounts for rotation creating larger bounding boxes
- Updates density for all covered zones, not just center zone
- Ensures accurate density tracking for complex transformations

##### Automatic Density Management
- **Layer Creation**: Increments density for all zones covered by new images
- **Layer Removal**: Decrements density when images fade out or are removed
- **Real-time Updates**: Density tracking updates continuously during animation
- **Memory Cleanup**: Zone density cleaned up when layers are destroyed

#### Configuration Integration
```json
"transformations": {
  "translation": {
    "enabled": true,
    "minimum_visible_percent": 60  // Ensures at least 60% of each image remains visible
  },
  "best_fit_scaling": {
    "enabled": true  // Pre-scales images to fit within image area before transformations
  }
}
```

#### Performance Characteristics
- **Computational Overhead**: Minimal - simple zone calculations and lookups
- **Memory Usage**: Lightweight Map structure for zone density tracking
- **Scalability**: Efficient with any number of concurrent layers
- **Deterministic**: Seeded random ensures reproducible positioning with pattern codes

#### Visual Impact Benefits
- **Balanced Coverage**: Images distribute evenly across entire canvas over time
- **Natural Clustering**: Some clustering still occurs naturally but is not excessive
- **Reduced Dead Zones**: Eliminates large empty areas that could occur with pure random
- **Visual Variety**: Each pattern provides diverse spatial compositions
- **Professional Appearance**: More gallery-like presentation with thoughtful image placement

#### Compatibility with Existing Systems
- **Deterministic Patterns**: Works seamlessly with pattern seed system
- **Transformation Cache**: Grid positions cached along with other transformations
- **Favorites System**: Saved favorites reproduce exact grid-based positions
- **Real-time Controls**: Speed multiplier and layer controls work with grid system
- **Fullscreen Mode**: Grid positioning scales properly across different viewport sizes

### Best Fit Scaling System ✅ CONFIGURABLE FEATURE

The application includes a **configurable best fit scaling system** that automatically sizes images to fit within the designated image area before applying transformations.

#### Purpose and Function
- **Automatic Sizing**: Scales images to fit entirely within the image area (matte border or viewport)
- **Aspect Ratio Preservation**: Maintains original image aspect ratios during scaling
- **Pre-Transformation Step**: Applied before rotation, scale, and translation transformations
- **Consistent Presentation**: Ensures all images have appropriate base sizing regardless of original dimensions

#### Technical Implementation
```javascript
applyBestFitScaling(imgElement, originalImg, imageArea) {
  // Calculate scale factors for both dimensions
  const scaleX = imageArea.width / originalWidth;
  const scaleY = imageArea.height / originalHeight;
  
  // Use smaller scale factor to ensure complete containment
  const bestFitScale = Math.min(scaleX, scaleY);
  
  // Apply scaling and center positioning
  imgElement.style.width = `${originalWidth * bestFitScale}px`;
  imgElement.style.height = `${originalHeight * bestFitScale}px`;
}
```

#### Configuration Options
```json
"transformations": {
  "best_fit_scaling": {
    "enabled": true  // Enable/disable automatic best fit scaling
  }
}
```

#### Behavioral Modes
- **Enabled (default)**: Images automatically scaled to fit within image area, then transformations applied
- **Disabled**: Images use original dimensions, transformations applied directly to original size

#### Benefits When Enabled
- **Consistent Scaling**: All images start with appropriate base size relative to display area
- **Professional Presentation**: Images properly sized for their display context
- **Transformation Compatibility**: Provides consistent base for subsequent scale transformations
- **Matte Border Integration**: Works seamlessly with matte border system for gallery-like presentation

#### Benefits When Disabled
- **Original Dimensions**: Images retain their native pixel dimensions
- **Transformation Control**: Full control over image sizing through scale transformations only
- **Performance**: Minor performance improvement by skipping pre-scaling calculations
- **Specific Use Cases**: Useful when original image sizes are specifically designed for the application

#### Integration with Transformation Pipeline
1. **Image Loading**: Original image loaded and positioned
2. **Best Fit Scaling**: *(Optional)* Pre-scale to fit image area
3. **Scale Transformation**: Random scale factor applied (if enabled)
4. **Rotation Transformation**: Random rotation applied (if enabled)  
5. **Translation**: Grid-based positioning applied (if enabled)
6. **Color Remapping**: Hue shift applied (if enabled)

#### Performance Characteristics
- **Computational Overhead**: Minimal - simple math calculations
- **Memory Impact**: Negligible - no additional image storage
- **Rendering Performance**: May improve consistency of GPU texture operations
- **Deterministic**: Scaling calculations are deterministic and cached

### VS Code Integration
The project is configured for VS Code development with:
- Launch configurations for debugging
- Task definitions for common operations
- Recommended extensions for Python/Flask development
- Workspace settings for optimal development experience

## Development Guidance

## API Endpoints

### Current API Implementation
1. **`GET /`** - Main application interface
2. **`GET /kiosk`** - Full-screen kiosk mode
3. **`GET /health`** - Health check endpoint
4. **`GET /api/images`** - Image catalog with metadata and per-image configs
5. **`GET /api/config`** - Application configuration including initial pattern code
6. **`GET /api/pattern/<seed>`** - Deterministic pattern generation from seed
7. **`POST /api/favorites`** - Save current pattern as favorite
8. **`GET /api/favorites/<favorite_id>`** - Load specific favorite pattern
9. **`DELETE /api/favorites/<favorite_id>`** - Delete specific favorite pattern

### API Usage Examples
```bash
# Get image catalog
curl http://localhost:5000/api/images

# Get application config
curl http://localhost:5000/api/config

# Generate deterministic pattern
curl http://localhost:5000/api/pattern/MP-2024-001

# Health check
curl http://localhost:5000/health

# Save favorite pattern
curl -X POST http://localhost:5000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{"pattern_seed": "MP-2024-001", "name": "My Favorite Pattern"}'

# Load favorite pattern
curl http://localhost:5000/api/favorites/fav_123456

# Delete favorite pattern
curl -X DELETE http://localhost:5000/api/favorites/fav_123456
```

### Configuration Hot Reload
- **Edit Config**: Modify `config.json` with any changes
- **Apply Changes**: Refresh browser (F5 or Ctrl+R) to reload configuration
- **No Server Restart**: Changes take effect immediately without restarting Flask
- **Thread-Safe**: Multiple requests can safely trigger config reloads
- **Automatic Detection**: File modification timestamps automatically detected

### Testing Guidelines
- **Server Startup**: Don't start the server yourself when testing. Ask the developer to do it

## UI Controls & Interaction

### Main Controls (Always Visible)
Located in the top-right corner:
- **⏸️ Play/Pause Button**: Toggle animation playback (Spacebar)
- **🔄 New Pattern Button**: Generate new random pattern (N key)
- **🔇/🔊 Audio Toggle**: Toggle background audio playback (A key)

### Onscreen Controls (Mouse-Activated)
Appear at bottom center when mouse hovers over the bottom area:

#### Speed Control
- **Slider Range**: 0.1x to 20.0x speed multiplier
- **Default**: 1.0x (normal speed)
- **Real-time**: Affects both new and existing layer animations
- **Use Case**: Slow motion (0.1x-0.5x) or time-lapse (2x-20x) effects

#### Layer Control
- **Slider Range**: 1 to 8 concurrent layers
- **Default**: 4 layers
- **Dynamic**: Excess layers are immediately removed when reduced
- **Performance**: Lower values improve performance on slower devices

#### Audio Control
- **Volume Slider**: 0% to 100% volume control
- **Toggle Button**: Play/pause audio with visual feedback (🔊/🔇)
- **Real-time**: Volume changes applied immediately
- **Browser Policy**: Respects autoplay restrictions with fallback

#### Background Control
- **Toggle Button**: Switch between black and white backgrounds
- **Persistent**: Setting saved to localStorage
- **Visual Feedback**: ⚫⚪ icon indicates current state

#### Pattern Display
- **Current Pattern Code**: Shows active deterministic pattern seed
- **Read-only**: Updates when new patterns are generated
- **Format**: Alphanumeric seed string for pattern reproducibility

### Keyboard Shortcuts
- **Spacebar**: Play/Pause animations
- **N**: Generate new pattern
- **B**: Toggle background (black/white)
- **A**: Toggle audio playback

### Responsive Design
- **Desktop**: Full control panel with all features
- **Tablet (1200px-768px)**: Slightly condensed layout
- **Mobile (< 768px)**: Compact layout with control wrapping

## Color Remapping System

### Overview
The color remapping system provides dynamic color variation by randomly applying hue shifts to images during animation. This feature adds visual diversity while maintaining deterministic behavior for pattern reproducibility.

### Technical Implementation
- **Method**: CSS `hue-rotate()` filter for optimal performance (GPU-accelerated)
- **Range**: 0-360 degree hue rotation for full color spectrum coverage
- **Application**: Per-image appearance with configurable probability
- **Deterministic**: Uses seeded random generation to ensure pattern reproducibility

### Configuration Options
```json
"color_remapping": {
  "enabled": true,           // Enable/disable color remapping system
  "probability": 0.3,        // Chance of hue shift per image appearance (0.0-1.0)
  "hue_shift_range": {
    "min_degrees": 0,        // Minimum hue shift (0-360)
    "max_degrees": 360       // Maximum hue shift (0-360)
  }
}
```

### Per-Image Overrides
Individual images can override global settings using JSON configuration files:

**Example**: `static/images/blue_dog.json`
```json
{
  "color_remapping": {
    "enabled": true,         // Override global enabled setting
    "probability": 0.8       // Higher probability than global (0.3)
  }
}
```

### Performance Characteristics
- **GPU Acceleration**: Uses CSS filters for hardware-accelerated processing
- **Zero Memory Overhead**: No pixel manipulation or canvas operations
- **Deterministic Caching**: Transformations cached with existing system
- **Raspberry Pi Compatible**: Maintains 30+ FPS target on low-power devices

### Visual Effects
- **Subtle Variations**: Natural color shifts that preserve image character
- **Dynamic Range**: Full spectrum hue rotation (red→orange→yellow→green→blue→purple→red)
- **Probabilistic Application**: Not every image gets color-shifted, maintaining visual balance
- **Pattern Consistency**: Same pattern seed produces identical color sequences

### Configuration Examples
- **Conservative**: `probability: 0.2` - Occasional color variations
- **Moderate**: `probability: 0.3` - Default balanced setting  
- **Aggressive**: `probability: 0.7` - Frequent color transformations
- **Disabled**: `enabled: false` - Turn off color remapping entirely

## Matte Border System

### Overview
The matte border system provides sophisticated image framing with configurable borders, 3D beveling effects, and aspect ratio control. This system enhances the gallery-like presentation of images with professional matting effects.

### Configuration Options
```json
"matte_border": {
  "enabled": true,           // Enable/disable matte border system
  "border_percent": 10,      // Border width as percentage of container (5-25)
  "color": "#F8F8F8",        // Matte border color (hex, rgb, or named colors)
  "style": "medium",         // Border style: "light", "medium", "heavy"
  "image_area": {
    "aspect_ratio": "1:1"    // Image area aspect ratio ("1:1", "4:3", "16:9", "auto")
  }
}
```

### Border Styles
- **Light**: Subtle shadow effects, minimal 3D depth
- **Medium**: Balanced beveling with moderate shadow depth (default)
- **Heavy**: Pronounced 3D effects with deep shadows and highlights

### Aspect Ratio Options
- **"1:1"**: Square image area (default)
- **"4:3"**: Traditional photo aspect ratio
- **"16:9"**: Widescreen aspect ratio
- **"auto"**: Maintains original image proportions

### Visual Effects
- **3D Beveling**: CSS-based bevel effects create depth illusion
- **Drop Shadows**: Configurable shadow depth based on style
- **Clipping**: Images automatically clipped to fit within matte area
- **Scaling**: Best-fit scaling maintains aspect ratios within defined area

### Performance Characteristics
- **CSS-Only Implementation**: No JavaScript processing overhead
- **GPU Acceleration**: Hardware-accelerated CSS transforms and filters
- **Responsive Design**: Scales proportionally with container size
- **Memory Efficient**: No additional image processing or canvas operations

### Integration with Animation System
- **Transform Compatibility**: Works seamlessly with rotation, scale, and translation
- **Layer Support**: Each layer can have independent matte styling
- **Color Remapping**: Hue shifts apply to images within matte frames
- **Opacity Control**: Matte borders respect layer opacity settings

## Audio Configuration

### Audio File Requirements
- **Format**: MP3 files recommended for broad browser support
- **Location**: Place audio files in `static/audio/` directory
- **Naming**: Use descriptive filenames (spaces allowed)
- **Size**: Optimize for web delivery while maintaining quality

### Audio Configuration Options
```json
"audio": {
  "enabled": true,                    // Enable/disable audio system
  "file_path": "static/audio/ambient.mp3",  // Path to audio file
  "volume": 0.5,                     // Default volume (0.0-1.0)
  "loop": true,                      // Enable seamless looping
  "autoplay": true                   // Attempt autoplay on load
}
```

### Browser Autoplay Handling
- **Autoplay Attempt**: Tries to start audio automatically on page load
- **Fallback Strategy**: Waits for user interaction if autoplay blocked
- **User Interaction**: Any click, keypress, or touch activates audio
- **Visual Feedback**: Audio button shows current playback state

## Favorites System

### Overview
The favorites system allows users to save and reload specific pattern configurations for future viewing. Each favorite captures the complete state needed to reproduce a visual experience.

### Recent Fixes and Improvements ✅
- **Opacity Capture Fix**: Fixed favorites saving to capture current animated opacity values using `getComputedStyle()` instead of just CSS property values. This ensures favorites save the exact opacity of layers during fade-in/fade-out transitions.
- **UI Polish**: Removed "successfully" from all toast messages for cleaner feedback
- **ESC Key Support**: Added ESC key functionality to close the favorites modal for better UX

### Features
- **Save Current Pattern**: Capture the current animation state as a favorite
- **Load Saved Patterns**: Restore previously saved favorites with identical visual reproduction
- **Delete Favorites**: Remove unwanted saved patterns
- **Persistent Storage**: Favorites saved to `favorites.json` file on server

### API Endpoints

#### Save Favorite: `POST /api/favorites`
```json
{
  "pattern_seed": "MP-2024-001",
  "name": "My Favorite Pattern",
  "description": "Optional description",
  "metadata": {
    "created_by": "user",
    "tags": ["abstract", "colorful"]
  }
}
```

**Response**: Returns generated `favorite_id` for future reference

#### Load Favorite: `GET /api/favorites/<favorite_id>`
**Response**: Returns complete pattern data needed to recreate the visual experience
```json
{
  "favorite_id": "fav_123456",
  "pattern_seed": "MP-2024-001", 
  "name": "My Favorite Pattern",
  "created_at": "2024-07-31T10:30:00Z",
  "description": "Optional description",
  "metadata": { /* user metadata */ }
}
```

#### Delete Favorite: `DELETE /api/favorites/<favorite_id>`
**Response**: Confirmation of deletion

### Storage Format
Favorites are stored in `favorites.json` with this structure:
```json
{
  "fav_123456": {
    "favorite_id": "fav_123456",
    "pattern_seed": "MP-2024-001",
    "name": "My Favorite Pattern", 
    "created_at": "2024-07-31T10:30:00Z",
    "description": "Optional description",
    "metadata": { /* additional user data */ }
  }
}
```

### Integration Notes
- **Thread-Safe**: Multiple concurrent requests handled safely
- **Error Handling**: Graceful fallbacks for missing files or invalid IDs
- **Deterministic Playback**: Saved patterns reproduce identically using the same seed system
- **No UI Integration**: API-only feature requiring custom frontend implementation

## Build System & Deployment

### Executable Build Support
The project includes complete build automation for creating standalone executables:

#### Build Scripts
- **`build-windows.bat`** - Windows executable builder using PyInstaller
- **`build-pi.sh`** - Raspberry Pi executable builder (must run on Pi hardware)
- **`BUILD-INSTRUCTIONS.md`** - Complete build documentation with troubleshooting

#### Build Features
- **Standalone Executables** - No Python installation required on target systems
- **Platform Detection** - Automatic Windows vs Raspberry Pi configuration
- **Browser Integration** - Launches in app mode with Chrome/Chromium priority
- **VS Code Integration** - Build tasks and launch configurations included

#### Output Files
- **Windows**: `ManyPaintings-Windows.exe` (~50-100MB)
- **Raspberry Pi**: `ManyPaintings-RaspberryPi` (~80-150MB)

#### Launcher Features
- **Multiple Launch Modes**: App mode (default), full kiosk, normal browser window
- **Health Monitoring**: Waits for Flask server startup before launching browser
- **Graceful Shutdown**: Clean termination when browser closes
- **Debug Output**: Comprehensive logging for troubleshooting

### VS Code Development Integration
- **Launch Configurations**: Python debugging, Flask development, Pi-optimized settings
- **Build Tasks**: Automated executable building, dependency installation
- **Debug Support**: Breakpoint support in launcher script for troubleshooting

## Developer Instructions

- **IMPORTANT**: Don't start the app yourself, ask me to do it.