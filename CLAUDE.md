# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Flask-based generative art application inspired by Brian Eno's "77 Million Paintings." The application creates continuously changing, non-repeating visual experiences by layering and animating predefined abstract images. It's designed to run on both Raspberry Pi and Windows systems.

## Development Commands

### Running the Application

#### Quick Kiosk Launch (Recommended)
```bash
# Linux/macOS - Full-screen kiosk mode with hidden cursor and controls
./launch-kiosk.sh

# Windows - Full-screen kiosk mode with hidden cursor and controls  
launch-kiosk.bat
```

#### Advanced Launch Options
```bash
# Development server only
python app.py

# Kiosk mode (programmatic)
python launcher.py kiosk

# Normal windowed mode
python launcher.py normal

# Normal full-screen mode (with browser UI)
python launcher.py normal-fullscreen

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
- iPhone Remote Control: `http://localhost:5000/remote`

## Developer Notes

### Launcher System (Updated August 2025)
The launcher system has been streamlined to focus on kiosk mode deployment while maintaining flexibility:

#### Current Launcher Files
- **`launch-kiosk.sh` / `launch-kiosk.bat`** - Simplified kiosk launchers for immediate full-screen deployment
- **`launcher.py`** - Core Python launcher with command-line mode support
- **Removed files**: Interactive menu launchers and redundant mode-specific scripts (cleaned up August 2025)

#### Kiosk Mode Features
- **Hidden cursor**: CSS `cursor: none !important` applied in kiosk mode
- **Smart control hiding**: Action buttons automatically hidden when browser enters kiosk mode (`--kiosk` flag) or fullscreen
- **Browser kiosk detection**: JavaScript detects browser kiosk mode via window dimensions and `navigator.standalone`
- **Cross-platform**: Works on both Raspberry Pi (Chromium) and Windows (Chrome/Edge)

#### Launch Mode Comparison
- **Kiosk mode**: Full-screen, no browser UI, hidden cursor, hidden action buttons
- **Normal mode**: Windowed with browser UI, visible cursor, visible action buttons  
- **Normal-fullscreen mode**: Full-screen with browser UI, visible cursor, action buttons hidden only in fullscreen

### Testing Guidelines
- **Server Startup**: Don't start the server yourself when testing. Ask the developer to do it.
- **Four-Tier Testing**: Enterprise-grade automated testing with backend, E2E, integration, and visual validation
- **Test Commands**: 
  - `python -m pytest` - Run all tests (backend + E2E + integration + visual)
  - `python -m pytest tests/e2e/` - Run E2E tests only
  - `python -m pytest tests/e2e/test_visual_appearance_windows.py` - Visual tests (Windows only)
  - `python -m pytest tests/test_remote_api.py` - Remote control API tests
  - `python -m pytest tests/e2e/test_remote_control.py` - Remote control E2E tests
  - `python -m pytest tests/e2e/test_remote_integration.py` - Remote control integration tests
  - `test.bat` or `./test.sh` - Cross-platform test scripts
- **Page Objects**: All E2E tests use page object models to minimize test flakiness and improve maintainability
- **Wait Strategies**: Tests use proper wait strategies (no arbitrary delays) for reliable execution
- **Visual Testing**: Uses API stubbing via `page.route()` for predictable test states
- **Bug Detection**: Tests actively identify and help resolve UI/UX issues
- **Remote Control Testing**: Comprehensive test suite covers API, E2E, integration, and visual validation
  - Mobile viewport simulation (no iPhone required)
  - Multi-browser synchronization testing
  - API mocking for consistent test states
  - Network resilience and error handling validation

### Important Guidance
- **IMPORTANT** - Don't ever start the server. Ask me to do it
- **CSS Bug Fixes**: Recent test work identified and resolved empty state visibility issues
- **API Stubbing**: Prefer API route interception over filesystem mocking for test reliability

### Debug API for Troubleshooting
When console access is limited (e.g., during kiosk mode or remote debugging), the application provides debug logging endpoints:

#### Available Debug Endpoints:
- **`POST /api/debug-log`** - Send debug messages to `debug.log` file
- **`POST /api/debug-clear`** - Clear the debug log file  
- **`GET /api/debug-config`** - View current configuration state and environment detection

#### JavaScript Debug Methods:
```javascript
// Temporarily add debug logging to any module
this.debugLog(`Debug message: ${JSON.stringify(data)}`);
this.clearDebugLog(); // Clear previous debug entries
```

#### Config System Debug Mode:
Enable detailed configuration merge logging:
```bash
DEBUG_CONFIG=1 python launcher.py
```

#### Usage Guidelines:
- **Temporary Usage**: Add debug calls only when needed for specific issues
- **Remove After Use**: Clean up debug calls after troubleshooting is complete
- **File Access**: Debug log written to `debug.log` in project root
- **API Access**: All endpoints work without authentication for easy troubleshooting

## Key Features

### Favorites System
- **Save Favorites**: Press F key or click heart button to save current painting state
- **Thumbnail Generation**: Uses html2canvas library to capture pixel-perfect thumbnails with preserved background colors
- **Background Preservation**: Thumbnails maintain original background color (black/white) from when they were saved
- **Storage**: Favorites saved as JSON with base64 thumbnail data
- **Gallery**: Press V key or click gallery button to view/load saved favorites
- **Delete Functionality**: Full delete capabilities in both main browser and mobile remote interfaces
- **Cross-Platform**: Consistent favorites experience across desktop and iPhone remote control

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
- **Server-Side Storage**: Comprehensive server-side settings storage via `settings.json` file
- **UserPreferences Module**: Centralized preferences management with validation and error handling
- **Settings Persisted**: Speed multiplier (1-10), max layers (1-8), audio volume (0-100%), background color (black/white), gallery settings (brightness, contrast, saturation, white balance)
- **Auto-Save**: All control panel changes saved instantly without user action
- **Cross-Device Sync**: Settings synchronized between main display and iPhone remote control
- **Smart Restoration**: Preferences applied during initialization and after all modules loaded
- **Error Resilience**: Graceful fallbacks with sensible defaults when server unavailable

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
- **Persistent Settings**: All adjustments automatically saved to server-side storage and restored on startup
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

### Enterprise Testing System
- **Three-Tier Architecture**: Backend (pytest), E2E (Playwright), and Visual (Windows screenshot validation)
- **Page Object Model**: Modern testing architecture using page object pattern for maintainable test code
- **No Arbitrary Delays**: Smart wait strategies eliminate test flakiness from timing issues
- **Comprehensive Coverage**: 24+ automated test cases covering all major user workflows
- **Test Structure**:
  - `tests/e2e/pages/` - Page object models (BasePage, MainPage, FavoritesGallery, ImageManagerPage, GalleryManagerPage)
  - `tests/e2e/test_core_functionality.py` - Core app functionality (15 tests)  
  - `tests/e2e/test_favorites_system.py` - Favorites system testing (9 tests)
  - `tests/e2e/test_visual_appearance_windows.py` - Visual validation with API stubbing (12+ tests)
- **Smart Waits**: Uses `wait_for_element_visible()`, `wait_for_animation_frame()`, `wait_for_application_ready()`
- **Reliable Selectors**: Uses actual HTML IDs and semantic selectors for stable test execution
- **API Stubbing**: Route interception with `page.route()` for predictable test states
- **Bug Detection**: Tests have identified and resolved CSS visibility issues and UI bugs

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

### iPhone Remote Control System
- **Mobile Web Interface**: Professional iPhone-optimized remote control accessible at `http://localhost:5000/remote`
- **Complete Control Suite**: All main application features controllable from mobile device
- **Real-time Synchronization**: Bidirectional communication via 2-second polling intervals
- **Hero Image Header**: Dynamic cycling header showcasing saved favorite paintings
  - **Cycling Display**: Auto-rotates through all saved favorites every 20 seconds
  - **Smooth Crossfade**: 1.5-second transitions between images with dual-layer system
  - **Text Visibility**: Dark gradient overlay and text shadows ensure title readability on any background
  - **Performance Optimized**: Page Visibility API pauses rotation when tab hidden to save battery
  - **Fallback Design**: Animated gradient pattern displays when no favorites exist
  - **Responsive Heights**: 240px → 200px → 180px scaling for different screen sizes
  - **Image Preloading**: Seamless transitions with background image preloading
- **Image Management Features**:
  - **Upload from iPhone**: Direct integration with iPhone photo library
  - **Browse Images**: Mobile-optimized grid with thumbnails and metadata
  - **Delete Images**: Touch-friendly delete controls with immediate UI feedback
  - **✅ CRITICAL: Automatic Image Appearance** - **NEW FUNCTIONALITY**
    - Remote uploads now automatically trigger display on main application
    - Uploaded images inserted at current sequence position for immediate viewing
    - Smart layer management removes oldest layers when at capacity
    - Real-time communication via new API endpoints:
      - `POST /api/images/refresh` - Triggers main display refresh
      - `GET /api/check-refresh-images` - Polling for refresh requests
      - `DELETE /api/refresh-images-status` - Clears processed requests
- **Favorites Management**: Full browsing, loading, and deletion with mobile-optimized interface
- **Gallery Controls**: All Samsung Frame TV-style color grading controls accessible on mobile
- **Theme Synchronization**: Remote interface automatically matches main display theme
- **Touch Optimization**: Large touch targets and gesture-friendly interfaces

### Smart Polling Optimization System ✅ NEW FEATURE (August 2025)
- **Intelligent Disconnect/Reconnect Architecture**: Activity-aware system that eliminates unnecessary polling
- **Battery Conservation**: 100% elimination of network requests when remote control is idle
- **Server Efficiency**: Dramatic reduction in API requests when no active remotes connected
- **Activity Detection**: Comprehensive user interaction monitoring system
  - **Global Event Listeners**: Tracks touchstart, touchmove, mousedown, scroll events
  - **Interaction Wrapping**: All UI controls wrapped with activity recording
  - **30-Second Timeout**: Remote automatically disconnects after inactivity period
- **Heartbeat System**: Server-side connection status tracking
  - **Timestamp Validation**: Heartbeat included with every API request
  - **Session Management**: Per-device heartbeat tracking with automatic cleanup
  - **35-Second Cutoff**: Remotes considered active if heartbeat within threshold
- **Main Application Optimization**: Conditional polling based on remote status
  - **Remote Status Check**: `/api/remote-status` endpoint reports active connections
  - **Selective Polling**: Only processes remote requests when connections detected
  - **Zero-Waste Architecture**: Complete polling cessation when no remotes active
- **Smart Reconnection**: Instant resume on any user interaction
  - **Immediate Activation**: Any touch/click instantly resumes full functionality
  - **Status Updates**: Connection status indicators reflect current state
  - **Seamless UX**: User experience remains completely transparent

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
  - **Delete Favorites**: Click red X button in top-right corner of thumbnails to delete favorites
  - **Background Preservation**: Thumbnails display with original background color regardless of current theme
- **Gallery Manager**: Use C key or click gallery manager button to open professional color adjustment interface
- **Debug Grid**: Use G key to toggle grid visualization for positioning debugging (works with all layout modes)
- **Remote Control**: iPhone remote interface includes full favorites management with delete functionality
- **Connection Status**: Enhanced pulsating connection indicator in Quick Actions header with dramatic fade and expanding shadow ring effect

## Recent Development Achievements ✅

### Visual Testing Implementation (2025-01)
- **Comprehensive UI Validation**: Windows-only visual testing with screenshot capture
- **API Stubbing Strategy**: Route interception for predictable test states (favorites, images)
- **CSS Bug Fixes**: Identified and resolved `.empty-section` visibility issues
- **Unicode Compatibility**: Fixed Windows console output for reliable CI/CD execution

### Testing System Maturity ✅
- **Enterprise-Grade Coverage**: 24+ automated test cases across backend, E2E, and visual layers
- **Page Object Models**: 5 comprehensive page classes for maintainable test code
- **Bug Detection & Resolution**: Tests actively improve application quality by identifying issues
- **Cross-Platform Reliability**: Platform-specific tests with proper auto-skipping

### Production Readiness ✅
- **Code Quality**: Modular ES6 architecture (3,684-line monolith → 12 focused modules)
- **Professional Features**: Samsung Frame TV-style gallery management with color grading
- **Advanced Graphics**: Multi-layer canvas texture system with background-adaptive blending  
- **Developer Experience**: Full VS Code integration with comprehensive debugging support

## Current Development Status: COMPLETE ✅

The ManyPaintings application has achieved full production readiness with:
- ✅ **All Core Features**: Generative art engine, professional UI, advanced effects
- ✅ **Enterprise Testing**: Comprehensive automated test coverage with bug detection
- ✅ **Cross-Platform Support**: Windows executables, Raspberry Pi optimization, development environment
- ✅ **Professional Polish**: Gallery-grade presentation with Samsung Frame TV-style interface
- ✅ **Enhanced Favorites System**: Complete favorites management with background preservation and cross-platform delete functionality
- ✅ **Remote Control Integration**: Full iPhone remote interface with automatic image appearance, favorites management, and theme synchronization
- ✅ **Smart Polling Optimization**: Intelligent disconnect/reconnect system for dramatic battery life improvement
- ✅ **Documentation**: Complete README, STATUS, and developer guidance

The project stands as a complete implementation of the original vision with significant enhancements beyond initial requirements, including comprehensive remote control capabilities and advanced favorites management.