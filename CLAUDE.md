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
  - `ui/` - User interface components (UI, FavoritesGallery, imageManagerUI)
  - `utils/` - Utility modules (GridManager)
- **No Build Tools**: Pure JavaScript with immediate browser compatibility

### User Preferences System
- **LocalStorage Integration**: Comprehensive browser localStorage for persistent user settings
- **UserPreferences Module**: Centralized preferences management with validation and error handling
- **Settings Persisted**: Speed multiplier (1-10), max layers (1-8), audio volume (0-100%), background color (black/white)
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

### UI Interaction Notes
- **Delete Operations**: Don't show confirmation alerts when a delete operation occurs. Just show a toast notification.
- **Image Management**: Use I key or click image manager button to access upload/delete functionality
- **Favorites Gallery**: Use V key or click gallery button to browse saved favorites with thumbnails
- **Debug Grid**: Use G key to toggle rule of thirds grid visualization for positioning debugging