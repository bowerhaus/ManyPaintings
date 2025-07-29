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
  "layer_management": { /* layer settings */ },
  "transformations": { /* transformation settings */ },
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
    "max_opacity": 0.7
  }
}
```

### Configuration Loading
- Environment selection via `FLASK_CONFIG` environment variable
- JSON config loader in `config/__init__.py`
- Deep merge of base config with environment overrides
- Per-image configs override base settings for specific images

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
- **Configuration System**: JSON-based config with per-image overrides
- **Image Management**: Discovery, metadata extraction, and intelligent preloading
- **Pattern System**: Deterministic sequences with initial pattern code support
- **UI Controls**: Real-time speed, layer, and background controls
- **Duplicate Prevention**: No image appears on multiple layers simultaneously

### Key Features Implemented
1. **Deterministic Pattern System**: Same pattern code produces identical visual sequences
2. **Per-Image Configuration**: JSON metadata files override settings per image
3. **Seeded Random System**: All animations use deterministic random for repeatability
4. **Real-time Controls**: Speed (0.1x-20x), layers (1-8), background toggle
5. **Memory Management**: Dynamic layer cleanup and intelligent preloading
6. **Clean Startup**: No loading popups, immediate animation start

### Architecture Highlights
- **Browser-Centric**: Minimal server contact, all animations client-side
- **Deterministic**: Same inputs always produce same visual outputs
- **Configurable**: Per-image timing and transformation overrides
- **Performance-Optimized**: 30+ FPS targeting with responsive controls

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

### Testing Guidelines
- **Server Startup**: Don't start the server yourself when testing. Ask the developer to do it

## Developer Instructions

- **IMPORTANT**: Don't start the app yourself, ask me to do it.