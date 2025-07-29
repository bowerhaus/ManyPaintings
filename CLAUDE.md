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

## File Structure (Expected)
```
ManyPaintings/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies  
├── config.py             # Configuration settings
├── static/
│   ├── css/style.css     # Styling
│   ├── js/main.js        # Animation logic
│   └── images/           # Art image assets
├── templates/
│   ├── base.html         # Base template
│   ├── index.html        # Main page
│   └── kiosk.html        # Kiosk mode
└── utils/
    └── pattern_generator.py  # Pattern ID generation
```

## Configuration Management

### Environment Variables
The application should support different configurations via environment variables:

```bash
# Flask Configuration
FLASK_ENV=development|production
FLASK_DEBUG=true|false
FLASK_HOST=0.0.0.0  # For Raspberry Pi deployment
FLASK_PORT=5000

# Application Settings  
IMAGE_DIRECTORY=static/images
MAX_CONCURRENT_IMAGES=10  # Memory management
PRELOAD_BUFFER_SIZE=5     # Number of images to preload
ANIMATION_FPS=30          # Target frame rate
PATTERN_SEED=auto|<number>  # For reproducible sequences

# Performance Settings
ENABLE_CACHING=true
CACHE_MAX_AGE=3600
LAZY_LOADING=true
```

### Configuration Files
Create environment-specific config files:

- `config/development.py` - Local development settings
- `config/production.py` - Production deployment settings  
- `config/raspberry_pi.py` - Raspberry Pi optimizations
- `.env.example` - Template for environment variables

### Deployment Configurations
- **Development**: Debug enabled, verbose logging, hot reload
- **Production**: Optimized caching, minimal logging, security headers
- **Raspberry Pi**: Memory-optimized settings, lower resource usage

## Development Notes

### Current State
The repository currently contains only:
- README.md with comprehensive project documentation
- Static art images in `static/images/` directory

### Implementation Status  
Based on the README, the Flask application and supporting files are not yet implemented. The project requires:
- Flask application setup (app.py) with minimal API endpoints
- HTML templates with JavaScript-heavy frontend
- CSS/JavaScript for client-side animations and image management
- Python utilities for pattern generation and image metadata
- Requirements file for dependencies
- Configuration management system

### Key Implementation Priorities
1. **Image Catalog API**: Endpoint to provide available images list/metadata
2. **Client-Side Animation Engine**: JavaScript framework for smooth animations
3. **Intelligent Image Loading**: On-demand loading with predictive preloading
4. **Memory Management**: Browser-side caching and cleanup strategies
5. **Pattern Generation**: Deterministic sequence generation with reproducible codes

### VS Code Integration
The project is configured for VS Code development with:
- Launch configurations for debugging
- Task definitions for common operations
- Recommended extensions for Python/Flask development
- Workspace settings for optimal development experience