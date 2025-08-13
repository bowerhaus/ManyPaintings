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

## Developer Notes

### Testing Guidelines
- **Server Startup**: Don't start the server yourself when testing. Ask the developer to do it.

### Important Guidance
 - IMPORTANT - Dont ever start the server. Ask me to do it

## Key Features

### Favorites System
- **Save Favorites**: Press F key or click heart button to save current painting state
- **Thumbnail Generation**: Uses html2canvas library to capture pixel-perfect thumbnails
- **Storage**: Favorites saved as JSON with base64 thumbnail data
- **Gallery**: Press V key or click gallery button to view/load saved favorites

### JavaScript Architecture
- **Modular Design**: Refactored from 3,684-line monolith into manageable ES6 modules
- **ES6 Modules**: Native JavaScript modules with zero compilation required
- **Module Structure**:
  - `main.js` (105 lines) - Entry point and initialization
  - `managers/` - Core system managers (ImageManager, PatternManager, AudioManager, FavoritesManager, MatteBorderManager, UserPreferences)
  - `modules/` - Animation engine and specialized components
  - `ui/` - User interface components (UI, FavoritesGallery, GalleryManager, imageManagerUI)
  - `utils/` - Utility modules (GridManager, LayoutUtils)
  - `constants/` - Shared constants (LayoutConstants)
- **No Build Tools**: Pure JavaScript with immediate browser compatibility
- **Centralized Layout System**: ✅ **RECENT REFACTOR** - Eliminated ~420 lines of duplicate code between AnimationEngine and GridManager by extracting shared layout logic into dedicated constants and utilities modules

### User Preferences System
- **LocalStorage Integration**: Comprehensive browser localStorage for persistent user settings
- **UserPreferences Module**: Centralized preferences management with validation and error handling
- **Settings Persisted**: Speed multiplier (1-10), max layers (1-8), audio volume (0-100%), background color (black/white), gallery settings (brightness, contrast, saturation, white balance)
- **Auto-Save**: All control panel changes saved instantly without user action
- **Smart Restoration**: Preferences applied during initialization and after all modules loaded
- **Error Resilience**: Graceful fallbacks when localStorage unavailable or corrupted

### Pattern Behavior System
- **Config-Driven Logic**: Pattern generation strictly follows configuration settings
- **No LocalStorage**: Pattern codes are never saved to browser storage
- **Behavior Rules**:
  - `initial_pattern_code: null` in config → Fresh random pattern each refresh
  - `initial_pattern_code: "code"` in config → Always use that specific pattern
- **Deterministic**: Same config produces same pattern sequences
- **Enhanced Logging**: Clear console messages indicate pattern behavior and generation strategy

### Dependencies
- **html2canvas**: Used for thumbnail generation in favorites system
- **No Build Tools**: Pure JavaScript with ES6 modules
- **Flask Backend**: Simple Python server for API and static file serving

### Gallery Manager System (Samsung Frame TV Experience)
- **Professional Color Grading**: Press C key or click Gallery Manager button for artwork display optimization
- **Real-time Adjustments**: All settings apply instantly to artwork while controls remain visible
- **Samsung Frame TV Style**: Bottom-sheet interface allows artwork visibility during adjustments
- **Gallery Controls**:
  - **Brightness**: 25-115% range for optimal display conditions
  - **Contrast**: 85-115% (±15%) for artwork clarity  
  - **Saturation**: 50-120% range for color intensity control
  - **White Balance**: 80-120% (±20%) for warm/cool gallery lighting temperature
  - **Canvas Texture Intensity**: 0-100% authentic linen weave canvas texture overlay
- **Persistent Settings**: All adjustments automatically saved to localStorage and restored on startup
- **Professional Interface**: Centered bottom modal (400-500px width) with transparent background
- **Reset Functionality**: One-click reset to defaults button
- **Module Architecture**: Separate `GalleryManager.js` module following existing patterns

### Canvas Drop Shadow System
- **Professional Gallery Effect**: Configurable exponential decay drop shadow around canvas for depth and presentation
- **Multi-Layer Blending**: Creates natural shadow falloff using multiple CSS box-shadow layers
- **Viewport-Responsive Width**: Shadow width scales as percentage of viewport size for consistent appearance across displays
- **Exponential Decay**: Inner layers high opacity, outer layers fade naturally for realistic shadow effect
- **Configuration Options**:
  - `enabled`: Enable/disable drop shadow system (boolean)
  - `opacity`: Maximum shadow opacity (0.0-1.0, default: 0.5)
  - `width_percent`: Shadow blur width as percentage of viewport (5-100, default: 30)
- **Z-Index Positioning**: Positioned at z-index 60 to appear over matte border
- **Performance Optimized**: Uses CSS transitions for smooth opacity changes

### Canvas Texture Overlay System
- **Dual Texture Assets**: Two texture variants for optimal visibility across background modes
  - `static/resources/linen-weave-canvas.png`: Original light texture for white backgrounds
  - `static/resources/linen-weave-canvas-dark.png`: Inverted dark texture for black backgrounds
- **Realistic Scaling**: Texture scaled to 20% of original size for natural canvas appearance
- **Background-Adaptive Blending**: 
  - **Black backgrounds**: Dark texture with normal blend mode (z-index 5, behind images)
  - **White backgrounds**: Light texture with multiply blend mode (z-index 15, over images)
- **Optimized Layering**: Texture positioning adapts to background for best visual experience
- **Filter Integration**: Texture responds to all Gallery Manager color grading adjustments
- **Performance Optimized**: CSS background-image with repeat pattern for efficient rendering

### Layout System
- **Four Layout Modes**: Sophisticated positioning system with corner-focused placement
  - `rule_of_thirds`: 4 corner points at rule of thirds intersections
  - `rule_of_thirds_and_centre`: 4 corners + center point (5 total)
  - `rule_of_fifths_thirds_and_centre`: 4 corners at fifths/thirds intersections + center (5 total)
  - `rule_of_fifths_and_thirds`: 4 corners at fifths/thirds intersections only
- **Corner-Focused Design**: All modes exclude edge-center points (top-center, bottom-center, middle-left, middle-right)
- **Visual Grid System**: Each mode has distinct colored grid visualization for debugging
- **Matte Border Aware**: All positioning calculations account for matte border area

### UI Interaction Notes
- **Delete Operations**: Don't show confirmation alerts when a delete operation occurs. Just show a toast notification.
- **Image Management**: Use I key or click image manager button to access upload/delete functionality
- **Favorites Gallery**: Use V key or click gallery button to browse saved favorites with thumbnails
- **Gallery Manager**: Use C key or click gallery manager button to open professional color adjustment interface
- **Debug Grid**: Use G key to toggle grid visualization for positioning debugging (works with all layout modes)