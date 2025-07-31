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
  "flask": { "debug": true, "host": "127.0.0.1", "port": 5000 },
  "application": {
    "image_directory": "static/images",
    "max_concurrent_images": 10,
    "preload_buffer_size": 5,
    "animation_fps": 30,
    "pattern_seed": "auto",
    "initial_pattern_code": "MP-2024-001",
    "enable_caching": true,
    "cache_max_age": 3600,
    "lazy_loading": true
  },
  "animation_timing": { /* timing parameters */ },
  "layer_management": { 
    "max_concurrent_layers": 4,
    "max_opacity": 1.0,
    "min_opacity": 0.7
  },
  "transformations": { /* transformation settings */ },
  "color_remapping": {
    "enabled": true,
    "probability": 0.3,
    "hue_shift_range": {
      "min_degrees": 0,
      "max_degrees": 360
    }
  },
  "audio": {
    "enabled": true,
    "file_path": "static/audio/Ethereal Strokes Loop.mp3",
    "volume": 0.5,
    "loop": true,
    "autoplay": true
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
    "fade_in_min_sec": 30.0,
    "max_hold_time_sec": 180.0
  },
  "transformations": {
    "rotation": { "enabled": false },
    "scale": { "min_factor": 0.8, "max_factor": 1.5 }
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

#### Random Distribution System
- **Purpose**: Equitable image selection with natural randomness
- **Key Features**: Weighted random selection, usage tracking, allows consecutive appearances
- **Algorithm**: 
  - Tracks usage count for each image within pattern sequence
  - Calculates dynamic weights based on usage (less-used images get bonus weight)
  - Base weight of 1.0 with up to +0.5 bonus for below-average usage images
  - Uses proper Fisher-Yates shuffle instead of biased `sort()` method
  - Maintains seeded randomness for deterministic pattern reproduction
- **Benefits**:
  - **Natural Feel**: Images can appear consecutively or cluster naturally
  - **Long-term Balance**: Less-used images gradually get higher selection probability
  - **Deterministic**: Same pattern code always produces identical sequences
  - **Configurable**: Bias strength can be adjusted (currently 0.5x multiplier)
- **Previous Issues Fixed**:
  - Replaced biased `sort(() => 0.5 - Math.random())` with Fisher-Yates shuffle
  - Removed rigid cycle-based approach that prevented consecutive appearances
  - Added gentle bias toward less-used images without eliminating randomness

#### AudioManager
- **Purpose**: Background audio playback and control
- **Key Features**: Browser autoplay handling, volume control, loop management
- **API**: `play()`, `pause()`, `setVolume()`, `toggle()`

#### UI Manager
- **Purpose**: User interface and interaction handling
- **Key Features**: Control panels, keyboard shortcuts, responsive design
- **API**: `togglePlayPause()`, `updateAnimationSpeed()`, `toggleAudio()`

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

## Developer Instructions

- **IMPORTANT**: Don't start the app yourself, ask me to do it.