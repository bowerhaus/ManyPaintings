# Many Paintings - Generative Art Application

*A Python Flask web application inspired by Brian Eno's "77 Million Paintings"*

## 1. Introduction

This document outlines the Product Requirements for a generative art application inspired by Brian Eno's "77 Million Paintings." The application has been designed to use Python Flask, creating an ever-changing, non-repeating visual experience by layering and animating a set of predefined images. The application will run on both Raspberry Pi and Windows, accessible through a web browser, with a kiosk mode option for immersive viewing.

## 2. Goals and Objectives

*   **Primary Goal:** To create a visually engaging and calming generative art experience with immersive ambient audio that can run continuously on low-power devices like the Raspberry Pi using Python.
*   **Secondary Goal:** To build a flexible platform that can be expanded in the future with more advanced features like user-provided content and enhanced audio-visual synchronization.

### Success Metrics:

*   The application runs smoothly on a Raspberry Pi 4B (or higher) using Python 3.9+.
*   The web interface is accessible and functional on modern web browsers on both Windows and Raspberry Pi OS.
*   The kiosk mode provides an immersive, full-screen experience.
*   The pattern identification code allows for reproducible art sequences.

## 3. Features

### 3.1. Core Functionality

*   **Generative Art:** The application will display a continuous, non-repeating sequence of generative art. This will be achieved by layering multiple, semi-transparent abstract images that fade in and out with slow, contemplative transitions. 
*   **Image Set:** The initial version will use a predefined set abstract images. These images are located in the `static/images` directory.
*   **Web Interface:** The application will be built using Flask and will be accessible through a web browser. The web interface will display the generative art, ambient audio controls, and a unique code that identifies the current state of the animation.
*   **Background Audio:** Continuous ambient MP3 audio playback with volume control, play/pause functionality, and browser autoplay handling for an immersive audiovisual experience.
*   **Kiosk Mode:** The application will have a kiosk mode that displays the generative art in full-screen, hiding all browser UI elements. On Raspberry Pi, this mode will also disable user input to prevent accidental interruption.
*   **Pattern Identification Code:** The sequence should be deterministic being derived from a random seed. A unique code will be displayed on the screen, representing the current sequence of images and their current animation state. This code can be used to restart the application with the same visual pattern if required.
*   **Favouriting System:** ✅ **NEW FEATURE** - Save and share specific painting moments with exact layer states, transformations, and opacity values. Generate shareable URLs that recreate favorite paintings across different devices and screen sizes. Features pixel-perfect thumbnail generation using html2canvas library.

### 3.2. Animation System

*   **Slow Transitions:** All image transitions should be deliberately slow and contemplative, creating a meditative viewing experience. Fade transitions should feel gradual and organic.

*   **Layer Management:** Multiple images can be displayed simultaneously as semi-transparent layers, creating rich compositional depth through overlapping elements.

*   **Intelligent Image Selection:** ✅ **NEW FEATURE** - Advanced weighted random distribution system that balances natural randomness with equitable representation of all images over time.

*   **Enhanced Image Transformations:** ✅ **IMPROVED FEATURE** - Advanced transformation system with multiple layout modes:
    *   **Rotation:** Images may be rotated by random angles with deterministic seeded generation
    *   **Scaling:** Images may be scaled up or down within defined limits
    *   **Multi-Mode Layout System:** ✅ **NEW** - Four positioning strategies: Rule of Thirds (4 corner points), Rule of Thirds + Center (5 points), Rule of Fifths Thirds + Center (5 points), Rule of Fifths and Thirds (4 corner points), and Random distribution with matte border awareness and minimum visibility constraints
    *   **Color Remapping:** Images may have their colors dynamically shifted for visual variety

*   **Configurable Animation Parameters:** The animation system should support fine-tuned control through configuration:
    *   **Fade In/Out Duration:** Time taken for images to gradually appear and disappear
    *   **Maximum Opacity:** The peak transparency level images reach when fully visible
    *   **Hold Time Range:** Minimum and maximum duration images remain at peak opacity
    *   **Concurrent Layers:** Maximum number of images displayed simultaneously
    *   **Transformation Limits:** Ranges for rotation angles, scale factors, and position offsets

### 3.3. Configuration System

The application should provide extensive configuration options to fine-tune the visual experience:

#### Animation Timing Configuration (JSON-based)
*   `fade_in_min_sec` / `fade_in_max_sec` - Random fade-in duration range (default: 15.0-60.0 seconds)
*   `fade_out_min_sec` / `fade_out_max_sec` - Random fade-out duration range (default: 15.0-60.0 seconds)
*   `min_hold_time_sec` / `max_hold_time_sec` - Random hold time range (default: 5.0-120.0 seconds)
*   `max_opacity` - Peak opacity level for images (default: 1.0, range: 0.1-1.0)
*   `min_opacity` - Minimum opacity level for images (default: 0.7, range: 0.1-1.0)
*   `layer_spawn_interval_sec` - Base interval between new images (default: 4.0 seconds)

#### Layer Management Configuration
*   `max_concurrent_layers` - Maximum simultaneous visible images (default: 4, UI adjustable: 1-8)

#### Image Transformation Configuration (JSON-based)
*   `rotation.enabled` - Enable random rotation (default: true)
*   `rotation.min_degrees` - Minimum rotation angle (default: -60°)
*   `rotation.max_degrees` - Maximum rotation angle (default: 60°)
*   `scale.enabled` - Enable random scaling (default: true)
*   `scale.min_factor` - Minimum scale multiplier (default: 0.5)
*   `scale.max_factor` - Maximum scale multiplier (default: 1.0)
*   `translation.enabled` - Enable positioning system (default: true)
*   `translation.layout_mode` - Positioning strategy: "rule_of_thirds", "rule_of_thirds_and_centre", "rule_of_fifths_thirds_and_centre", "rule_of_fifths_and_thirds", or "random" (default: "rule_of_thirds_and_centre")
*   `translation.minimum_visible_percent` - Minimum image visibility percentage (default: 60%)
*   `best_fit_scaling.enabled` - Enable automatic image scaling to fit within image area (default: true)

#### Color Remapping Configuration ✅ NEW FEATURE
*   `enabled` - Enable/disable dynamic color remapping system (default: true)
*   `probability` - Chance of hue shift per image appearance (default: 0.3, range: 0.0-1.0)
*   `hue_shift_range.min_degrees` - Minimum hue rotation angle (default: 0, range: 0-360)
*   `hue_shift_range.max_degrees` - Maximum hue rotation angle (default: 360, range: 0-360)

#### Audio Configuration ✅ IMPLEMENTED
*   `enabled` - Enable/disable background audio system (default: true)
*   `file_path` - Path to MP3 audio file (default: "static/audio/Ethereal Strokes Loop.mp3")
*   `volume` - Default audio volume level (default: 0.5, range: 0.0-1.0)
*   `loop` - Enable seamless audio looping (default: true)
*   `autoplay` - Attempt automatic playback on page load (default: true)

#### Matte Border Frame System ✅ IMPLEMENTED
*   **Samsung Frame TV-Style Presentation:** Professional matte border frame system with configurable aspect ratios
*   **Aspect Ratio Control:** Support for multiple aspect ratios (1:1 square, 16:9 widescreen, 4:3 traditional, custom ratios)
*   **Full-Viewport Matte Texture:** Paper fiber texture covers entire viewport with precise image area cutout
*   **Configurable Border Size:** Border width as percentage of smaller canvas dimension for proportional scaling
*   **Professional Frame Effects:** Inner bevel frame detail with configurable colors and depth
*   **Cross-Mode Compatibility:** Consistent behavior in both main display and kiosk modes
*   **Responsive Design:** Automatic recalculation on window resize with proper centering

#### Canvas Drop Shadow Configuration ✅ IMPLEMENTED
*   `enabled` - Enable/disable canvas drop shadow system (default: true)
*   `opacity` - Maximum shadow opacity (default: 0.5, range: 0.0-1.0)
*   `width_percent` - Shadow blur width as percentage of viewport (default: 30, range: 5-100)

The drop shadow creates a professional gallery-style presentation with exponential decay falloff. Multiple shadow layers blend smoothly from strong inner shadows to faint outer shadows for natural depth perception.

#### Matte Border Configuration ✅ IMPLEMENTED
*   `enabled` - Enable/disable matte border system (default: true)
*   `border_percent` - Border size as percentage of smaller canvas dimension (default: 10)
*   `color` - Matte border color with paper texture (default: "#F8F8F8")
*   `style` - Frame style variant: "classic", "modern", "elegant" (default: "classic")
*   `image_area.aspect_ratio` - Canvas aspect ratio in format "width:height" (default: "1:1")
*   `bevel.enabled` - Enable inner bevel frame detail (default: true)
*   `bevel.width` - Bevel thickness in pixels (default: 1.5)
*   `bevel.inner_color` - Light highlight color (default: "rgba(255, 255, 255, 0.3)")
*   `bevel.outer_color` - Dark shadow color (default: "rgba(0, 0, 0, 0.2)")

#### Favouriting System ✅ NEW FEATURE
The application now includes a comprehensive favouriting system that allows users to save and share specific painting moments:

**Core Features:**
*   **State Capture:** Saves exact painting moments with all visible layer properties including image IDs, opacity levels, transformations (rotation, scale, translation, hue shift), and animation phases
*   **Pixel-Perfect Thumbnails:** Uses html2canvas library to capture exact visual state as 200x200px thumbnails, handling all CSS transforms and effects automatically
*   **Server-Side Storage:** Persistent JSON database storage with UUID identifiers and base64 thumbnail data for reliable retrieval across browser sessions
*   **URL Sharing:** Generate shareable links that recreate favorite paintings exactly, enabling easy sharing via email, social media, or bookmarks
*   **Cross-Viewport Compatibility:** Favorites automatically adapt to different screen sizes and aspect ratios using responsive positioning
*   **Staggered Restoration:** Natural fade-out timing when loading favorites, with layers disappearing at different intervals for smooth transition back to normal generation

**User Interface:**
*   **Heart Button (♥):** Added to both main interface and kiosk mode action groups for easy access
*   **Keyboard Shortcut:** F key for quick favoriting without interrupting the viewing experience
*   **Toast Notifications:** Success feedback with UUID display and clickable URL copying to clipboard
*   **Visual Feedback:** Heart button changes color on hover for clear interaction cues

**Technical Implementation:**
*   **REST API Endpoints:** 
    - `POST /api/favorites` - Save current painting state, returns UUID
    - `GET /api/favorites/<uuid>` - Load saved painting state
    - `DELETE /api/favorites/<uuid>` - Remove favorite (for future management features)
*   **State Data Structure:** Comprehensive JSON format capturing all layer properties and metadata
*   **Performance Optimized:** Sub-second loading times with intelligent image preloading
*   **Error Handling:** Graceful fallbacks for missing images or invalid favorite IDs

**Usage Workflow:**
1. **Save:** Click heart button (♥) or press F key during any interesting moment
2. **Share:** Toast notification appears with UUID and "Click to copy URL" instruction
3. **Load:** Open URL with `?favorite=<uuid>` parameter to recreate exact painting state
4. **Experience:** Favorite loads quickly with correct opacity/transformations, then transitions naturally back to live generation

**Cross-Platform Support:**
*   **Responsive Design:** Favorites work identically across desktop, tablet, and mobile devices
*   **Viewport Adaptation:** Automatic scaling and positioning adjustment for different screen sizes
*   **Browser Compatibility:** Works with all modern browsers supporting Fetch API and Clipboard API

### 3.4. iPhone Remote Control System ✅ NEW FEATURE

The application now features a comprehensive **iPhone Remote Control System** that enables complete control of the main display from any iPhone or mobile device through a web interface.

#### Core Features
*   **Mobile-Optimized Interface:** Professional iPhone web app accessible at `/remote` endpoint
*   **Real-time Synchronization:** Bidirectional communication between main display and remote control
*   **Complete Control Suite:** All main application features accessible from mobile device
*   **Instant Feedback:** Changes appear immediately on main display with visual confirmation

#### Control Capabilities
*   **Animation Controls:** Speed multiplier (1-10x), maximum layers (1-8), play/pause functionality
*   **Audio Management:** Volume control (0-100%) with mute capability
*   **Gallery Management:** Complete Samsung Frame TV-style color grading controls
    - Brightness (25-115%), Contrast (85-115%), Saturation (50-120%)
    - White Balance (80-120%), Canvas Texture Intensity (0-100%)
*   **Favorites System:** Browse, load, and delete saved paintings with thumbnails
*   **Image Management:** Complete image library management with mobile-optimized interface
    - Upload images directly from iPhone photo library
    - Browse all images with thumbnails and metadata
    - Delete images with touch-friendly controls
    - **✅ CRITICAL: Automatic Image Display** - Uploaded images appear immediately on main display

#### User Experience
*   **Touch-Optimized Design:** Large touch targets and gesture-friendly interfaces
*   **Theme Synchronization:** Remote interface automatically matches main display theme (dark/light)
*   **Connection Status:** Real-time connection indicators and error recovery
*   **Progressive Enhancement:** Works on all modern mobile browsers without app installation

#### Technical Implementation
*   **RESTful API:** Server-side settings storage with real-time polling
*   **Responsive Design:** Optimized for iPhone Safari with proper viewport handling
*   **Performance Optimized:** 2-3 second polling intervals for real-time synchronization
*   **Automatic Image Triggering:** New API endpoints enable immediate display of uploaded images
    - `POST /api/images/refresh` - Triggers main display refresh with uploaded image IDs
    - `GET /api/check-refresh-images` - Polling endpoint for refresh request detection
    - Smart layer management removes oldest layers to make room for new images

**Access URL:** `http://[device-ip]:5000/remote` from any iPhone or mobile browser

#### Smart Polling Optimization ✅ NEW FEATURE (August 2025)

The iPhone Remote Control System now features an intelligent **Smart Disconnect/Reconnect Architecture** that dramatically improves battery life and reduces unnecessary network traffic.

##### Core Benefits
*   **Battery Conservation:** Eliminates 100% of unnecessary polling when remote is idle (vs progressive reduction)
*   **Server Efficiency:** Dramatic reduction in API requests when no remote controls are active
*   **Network Optimization:** Zero bandwidth usage during inactive periods
*   **Instant Responsiveness:** Immediate reconnection on any user interaction

##### Technical Implementation
*   **Activity Monitoring:** Tracks all user interactions (touches, clicks, slider changes, scrolling)
*   **Auto-Disconnect:** Remote automatically disconnects after 30 seconds of inactivity
*   **Heartbeat System:** Server tracks active remote connections via timestamp validation  
*   **Conditional Polling:** Main application only polls for remote changes when remotes are connected
*   **Smart Reconnection:** Any user interaction instantly resumes full functionality

##### Architecture Details
*   **Remote Control Behavior:**
    - Monitors user activity with global event listeners
    - Stops polling after 30 seconds of inactivity
    - Includes heartbeat timestamp with all API requests
    - Instantly reconnects on touch/interaction detection

*   **Main Application Optimization:**
    - Checks `/api/remote-status` before polling for remote changes
    - Active Mode: 1-second polling for maximum responsiveness when remotes connected
    - Heartbeat Mode: 10-second polling when no remotes (10x efficiency improvement)
    - Only processes remote requests when active connections detected
    - Considers remotes active if heartbeat within last 35 seconds

*   **Server-Side Intelligence:**
    - Tracks heartbeat timestamps per session
    - Automatically cleans up stale heartbeat data
    - Provides real-time active remote counts

This optimization maintains the seamless user experience while achieving dramatic efficiency improvements for mobile devices and server resources.

### 3.5. Intelligent Distribution System ✅ NEW FEATURE

The application now features an advanced **Weighted Random Distribution System** that provides the perfect balance between natural randomness and equitable image representation.

#### Core Philosophy
Traditional random selection can lead to clustering where some images appear frequently while others are neglected. Our system maintains the organic, unpredictable feel of true randomness while ensuring all images receive fair representation over time.

#### Key Features
*   **Dynamic Weighting:** Images that appear less frequently gradually receive higher selection probability
*   **Natural Clustering:** Unlike rigid rotation systems, images can still appear consecutively or cluster naturally
*   **Statistical Fairness:** Over longer viewing sessions, all images receive approximately equal screen time
*   **Deterministic Reproduction:** Same pattern codes produce identical sequences for sharing and reproduction
*   **Real-time Adaptation:** Selection weights continuously adjust throughout pattern sequences

#### Technical Implementation
*   **Usage Tracking:** Monitors how frequently each image appears within the current pattern sequence
*   **Bias Calculation:** Compares individual image usage to the pattern average
*   **Weight Adjustment:** Less-used images receive bonus weight (up to +0.5x multiplier)
*   **Proper Randomization:** Uses Fisher-Yates shuffle algorithm instead of biased sorting methods
*   **Seeded Randomness:** All selections use pattern-seeded generators for reproducible results

#### Mathematical Model
```
Selection Weight = Base Weight (1.0) + (Bias Strength × Usage Deficit)

Where:
- Base Weight: 1.0 (equal starting probability)
- Bias Strength: 0.5 (configurable boost factor)  
- Usage Deficit: max(0, average_usage - current_usage)
```

#### Benefits Over Traditional Systems
*   **Eliminates Statistical Bias:** Fixed the common `sort(() => 0.5 - Math.random())` anti-pattern
*   **Prevents Image Neglect:** No image gets "forgotten" during long viewing sessions
*   **Maintains Surprise:** Natural clustering and consecutive appearances still occur
*   **Performance Optimized:** Minimal computational overhead suitable for real-time animation
*   **Configurable Balance:** Bias strength can be adjusted from pure random (0.0) to strong bias (1.0+)

#### Visual Experience Impact
*   **Short Sessions (< 30 minutes):** Feels completely random with natural variety
*   **Medium Sessions (30-120 minutes):** Subtle balance ensures broader image exposure
*   **Long Sessions (2+ hours):** Clear equitable distribution while maintaining organic feel
*   **Pattern Reproduction:** Identical visual sequences when using same pattern codes

#### Performance Characteristics
*   **Memory Usage:** Minimal - simple usage counters per image
*   **CPU Impact:** Negligible - basic arithmetic during image selection
*   **Scalability:** Efficient with large collections (tested with 1000+ images)
*   **Real-time Updates:** Selection calculations happen instantly during animation

### 3.7. Multi-Mode Layout System ✅ RECENT IMPROVEMENT

The application now features a sophisticated **Multi-Mode Layout System** with four distinct positioning strategies that provide different visual experiences and use cases.

#### Available Layout Modes

##### 1. Rule of Thirds (`rule_of_thirds`)
**Purpose:** Structured, aesthetically pleasing positioning based on photography composition principles
*   **Positioning:** Images cycle through 4 corner points at rule of thirds intersections
*   **Pattern:** (1/3, 1/3) → (2/3, 1/3) → (1/3, 2/3) → (2/3, 2/3) (round-robin)
*   **Visual Effect:** Classic photographic composition with balanced corner positioning
*   **Grid Visualization:** Shows red grid lines and yellow corner dots when enabled (G key)

##### 2. Rule of Thirds + Center (`rule_of_thirds_and_centre`)
**Purpose:** Expanded structured positioning including the viewport center
*   **Positioning:** Images cycle through 4 corner points + center point (5 total)
*   **Pattern:** 4 corners + (1/2, 1/2) center point (round-robin)
*   **Visual Effect:** Classic composition with central focus option
*   **Grid Visualization:** Shows red grid lines, yellow corner dots + center dot when visible

##### 3. Rule of Fifths Thirds + Center (`rule_of_fifths_thirds_and_centre`)
**Purpose:** Alternative golden ratio inspired positioning with center
*   **Positioning:** Images cycle through 4 corner points at fifths/thirds intersections + center (5 total)
*   **Pattern:** (1/5, 1/3) → (4/5, 1/3) → (1/5, 2/3) → (4/5, 2/3) → (1/2, 1/2) (round-robin)
*   **Visual Effect:** More dynamic corner positioning with central option
*   **Grid Visualization:** Shows cyan grid lines, cyan corner dots + center dot when visible

##### 4. Rule of Fifths and Thirds (`rule_of_fifths_and_thirds`)
**Purpose:** Golden ratio inspired corner positioning without center
*   **Positioning:** Images cycle through 4 corner points at fifths/thirds intersections
*   **Pattern:** (1/5, 1/3) → (4/5, 1/3) → (1/5, 2/3) → (4/5, 2/3) (round-robin)  
*   **Visual Effect:** Dynamic corner-only positioning
*   **Grid Visualization:** Shows orange grid lines and orange corner dots when enabled (G key)

##### 5. Random (`random`)
**Purpose:** Natural, unpredictable positioning across the entire visible area
*   **Positioning:** Images are placed randomly throughout the viewport
*   **Pattern:** Completely random positioning with no predetermined points
*   **Visual Effect:** Organic, unpredictable composition
*   **Grid Visualization:** Grid is disabled in random mode


#### Configuration
Set your preferred layout mode in `config.json`:
```json
"transformations": {
  "translation": {
    "layout_mode": "rule_of_thirds_and_centre"
  }
}
```
Options: `rule_of_thirds`, `rule_of_thirds_and_centre`, `rule_of_fifths_thirds_and_centre`, `rule_of_fifths_and_thirds`, `random`

#### Debugging
Press **G** to toggle grid visualization and see how images are positioned.


### 3.8. UI Controls
*   **Speed Control:** 0.1x to 20x animation speed multiplier
*   **Layer Control:** 1-8 concurrent image layers  
*   **Audio Controls:** Volume and play/pause
*   **Background Toggle:** Switch between black and white backgrounds
*   **Pattern Display:** Shows current pattern code for reproducibility
*   **Image Management:** ✅ **NEW FEATURE** - Upload, browse, and delete images through web interface
*   **Favorites Gallery:** ✅ **NEW FEATURE** - Visual gallery with thumbnails to browse and manage saved favorites
*   **Gallery Manager:** ✅ **NEW FEATURE** - Professional Samsung Frame TV-style display calibration controls

#### 3.8.1 User Preferences ✅ **NEW FEATURE**
The application automatically saves and restores user preferences across browser sessions using server-side storage:
*   **Auto-Save:** All control panel changes saved instantly without user action
*   **Cross-Session:** Settings persist when browser is closed and reopened  
*   **Settings Saved:** Speed multiplier, max layers, audio volume, background color, gallery settings
*   **Server-Side Storage:** Settings stored in `settings.json` file on server for cross-device access
*   **Remote Sync:** Settings synchronized between main display and iPhone remote control
*   **Smart Defaults:** Graceful fallbacks with sensible defaults
*   **No Configuration:** Works automatically with no setup required

#### 3.8.2 Gallery Manager ✅ **NEW FEATURE**
Professional Samsung Frame TV-style display calibration system for optimal artwork presentation:

**Color Grading Controls:**
*   **Brightness:** 85-115% range (±15%) for optimal display conditions
*   **Contrast:** 85-115% range (±15%) for artwork clarity
*   **Saturation:** 50-120% range for color intensity control  
*   **White Balance:** 80-120% range (±20%) for warm/cool gallery lighting temperature adjustment

**Canvas Texture System:**
*   **Canvas Texture Intensity:** 0-100% overlay intensity for authentic painted-on-canvas appearance
*   **Dual Texture Assets:** Two texture variants optimized for each background mode
    - Light linen texture for white backgrounds with multiply blending
    - Dark inverted linen texture for black backgrounds with normal blending
*   **Background-Adaptive Positioning:** Texture layering adapts to background for optimal visual experience
    - Black backgrounds: Texture behind images (preserves artwork clarity)
    - White backgrounds: Texture over images (traditional canvas effect)
*   **Realistic Linen Weave:** High-quality linen canvas texture scaled appropriately for natural look
*   **Filter Integration:** Texture responds to all color grading adjustments for cohesive appearance

**Professional Interface:**
*   **Bottom-Sheet Modal:** Samsung Frame TV-style interface positioned at bottom for artwork visibility
*   **Real-Time Preview:** All adjustments apply instantly while controls remain visible
*   **Persistent Settings:** All gallery settings automatically saved to server-side storage
*   **Reset to Defaults:** One-click restoration of neutral calibration settings
*   **Keyboard Access:** C key or Gallery Manager button for quick access

**Technical Features:**
*   **Entire Canvas Filtering:** Affects complete visual output including background, layers, matte border, and texture
*   **Professional Color Space:** Proper hue rotation for white balance with realistic temperature shifts
*   **Performance Optimized:** Real-time filtering with minimal performance impact
*   **Cross-Mode Compatibility:** Works identically in both main interface and kiosk mode

**Usage Workflow:**
1. **Access:** Press C key or click Gallery Manager button to open calibration controls
2. **Adjust:** Use sliders to fine-tune brightness, contrast, saturation, white balance, and canvas texture
3. **Preview:** All changes apply instantly to the entire artwork for immediate feedback
4. **Reset:** Click "Reset to Defaults" to return to neutral calibration
5. **Auto-Save:** All settings automatically persist across browser sessions

#### 3.8.3 Pattern Behavior ✅ **CONFIG-DRIVEN**
Pattern generation follows strict configuration-based logic:
*   **Config `initial_pattern_code: null`** → Fresh random pattern each refresh
*   **Config `initial_pattern_code: "code"`** → Always use that specific pattern
*   **No LocalStorage:** Pattern codes never saved to browser storage
*   **Deterministic:** Same config produces same pattern sequences

### 3.9. Keyboard Shortcuts
*   **Spacebar:** Play/Pause animations
*   **N:** Generate new pattern  
*   **B:** Toggle background (black/white)
*   **A:** Toggle audio playback
*   **F:** Save current painting as favorite
*   **V:** View favorites gallery
*   **I:** Open image manager
*   **C:** Open Gallery Manager (display calibration)
*   **G:** Toggle grid visualization (for debugging positioning)

## 4. Target Audience

*   **Primary:** Individuals interested in generative art, ambient visuals, and creating a calming atmosphere in their homes or workspaces.
*   **Secondary:** Artists and hobbyists who want to experiment with generative art and potentially contribute their own content in the future.

## 5. Technical Requirements

### 5.1. Platform Support

*   **Operating Systems:** The application must be able to run on both Windows and Raspberry Pi OS (or any Linux distribution that supports Python 3.9+).
*   **Web Browser:** The web interface should be compatible with modern web browsers like Chrome, Firefox, and Edge.

### 5.2. Performance

*   **Raspberry Pi:** The application should be optimized to run smoothly on a Raspberry Pi 4B with at least 2GB of RAM. The animation should be fluid, with a target frame rate of at least 30 FPS.
*   **Windows:** The application should run efficiently on a standard Windows PC.

### 5.3. Technology Stack

*   **Backend:** Python 3.9+ with Flask web framework.
*   **Frontend:** HTML, CSS, and JavaScript.
*   **Image Processing:** Pillow (PIL) for any future dynamic image generation needs.
*   **Static Files:** The initial set of 10 abstract images with flowing forms are included in the `static/images` directory.

## 6. Installation and Setup

### 6.1. Easy Installation: Pre-Built Executables

For the simplest installation, download the pre-built executables that include everything needed:

#### Windows
1. Download `ManyPaintings-Windows.exe`
2. Double-click to run - no Python installation required!
3. The app will automatically start a server and open your browser

#### Raspberry Pi
1. Download `ManyPaintings-RaspberryPi` to your Pi
2. Make executable: `chmod +x ManyPaintings-RaspberryPi`
3. Run: `./ManyPaintings-RaspberryPi`
4. The app will automatically start and open Chromium

**Note:** Executables are completely self-contained and include all dependencies.

### 6.2. Fresh Install on Virgin Systems

#### Fresh Windows Installation

**Prerequisites:**
- Windows 10/11
- Google Chrome (recommended) or Microsoft Edge

**Installation Steps:**
1. **Install Python 3.9+** (if building from source):
   - Download from [python.org](https://python.org)
   - During installation, check "Add Python to PATH"
   - Verify: Open Command Prompt, type `python --version`

2. **Install Git** (optional, for cloning):
   - Download from [git-scm.com](https://git-scm.com)
   - Use default installation options

3. **Get ManyPaintings:**
   ```bash
   # Option 1: Clone repository
   git clone https://github.com/your-repo/ManyPaintings.git
   cd ManyPaintings
   
   # Option 2: Download and extract ZIP file
   # Then navigate to the extracted folder
   ```

4. **Quick Setup:**
   ```bash
   # Automated build (creates executable)
   build-windows.bat
   
   # OR manual development setup
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

#### Fresh Raspberry Pi Installation

**Prerequisites:**
- Raspberry Pi 4B+ (2GB RAM minimum, 4GB+ recommended)
- Raspberry Pi OS (32-bit or 64-bit)
- Internet connection for initial setup

**Fresh Pi OS Setup:**
1. **Install Raspberry Pi OS:**
   - Use Raspberry Pi Imager
   - Enable SSH and set username/password if needed
   - Boot and complete initial setup

2. **System Update:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Install Required Packages:**
   ```bash
   # Essential development tools
   sudo apt install -y python3 python3-pip python3-venv python3-dev
   
   # Image processing libraries (for Pillow)
   sudo apt install -y libjpeg-dev zlib1g-dev libfreetype6-dev
   
   # Browser for display
   sudo apt install -y chromium-browser
   
   # Git for cloning (optional)
   sudo apt install -y git
   ```

4. **Get ManyPaintings:**
   ```bash
   # Clone repository
   git clone https://github.com/your-repo/ManyPaintings.git
   cd ManyPaintings
   
   # OR download via wget/curl if available
   ```

5. **Build Executable:**
   ```bash
   # Automated build (recommended)
   chmod +x build-pi.sh
   ./build-pi.sh
   
   # This creates: ManyPaintings-RaspberryPi executable
   # Plus desktop launcher for easy access
   ```

### 6.3. Development Installation (Source Code)

For developers who want to modify the code:

#### Prerequisites
*   **Windows:** Python 3.9+, Git (optional)
*   **Raspberry Pi:** Python 3.9+, development libraries (see above)
*   **macOS:** Python 3.9+, Xcode command line tools

#### Installation Steps

1. **Clone/Download the project:**
   ```bash
   git clone https://github.com/your-repo/ManyPaintings.git
   cd ManyPaintings
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   
   # Linux/macOS/Pi:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run development server:**
   ```bash
   python app.py
   ```

5. **Access the application:**
   - Main interface: `http://localhost:5000`
   - Kiosk mode: `http://localhost:5000/kiosk`

### 6.4. Running the Application

#### Option 1: Quick Kiosk Launch (Recommended)
For immediate full-screen kiosk mode with hidden cursor and action buttons:
```bash
# Linux/macOS - Streamlined kiosk launcher
./launch-kiosk.sh

# Windows - Streamlined kiosk launcher  
launch-kiosk.bat
```

#### Option 2: Advanced Launch Modes
For other display modes using the core launcher:
```bash
# Full-screen kiosk mode (programmatic)
python launcher.py kiosk

# Normal windowed mode
python launcher.py normal

# Normal full-screen mode (with browser UI)
python launcher.py normal-fullscreen
```

#### Option 3: Pre-Built Executable (Alternative)
```bash
# Windows
ManyPaintings-Windows.exe

# Raspberry Pi
./ManyPaintings-RaspberryPi
```

#### Option 4: Development Server
```bash
# Activate virtual environment first
python app.py
```

#### Option 5: Production Deployment
```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### 6.5. Using the Application

#### Interactive Controls
- **Mouse hover** over the bottom area to reveal the control panel
- **Speed slider:** Adjust animation speed from 0.1x to 20x
- **Layer slider:** Control concurrent layers from 1 to 8
- **Audio slider:** Control volume from 0% to 100%
- **Audio toggle:** Play/pause background music (🔊/🔇)
- **Background toggle:** Switch between black and white backgrounds (⚫⚪)
- **Favorite button:** Save current painting as shareable favorite (♥)
- **Pattern display:** View current pattern code

#### Keyboard Shortcuts
- **Space:** Play/Pause animation
- **N:** Generate new pattern
- **B:** Toggle background (black/white)
- **A:** Toggle audio playback
- **F:** Save current painting as favorite
- **V:** View favorites gallery
- **I:** Open image manager
- **C:** Open Gallery Manager (display calibration)
- **G:** Toggle rule of thirds grid / debug borders

#### Control Panel Features
- **Real-time adjustments:** All changes take effect immediately
- **Persistent settings:** Background preference is saved automatically
- **Adaptive UI:** Interface colors adjust based on background theme

### 6.6. Building Executables (Advanced)

For creating your own executables or modifying the build process, see [BUILD-INSTRUCTIONS.md](BUILD-INSTRUCTIONS.md) for detailed instructions.

**Quick Build Commands:**
```bash
# Windows
build-windows.bat

# Raspberry Pi (must run on actual Pi)
chmod +x build-pi.sh
./build-pi.sh
```

### 6.7. Configuration

The application is configured using a **JSON-based configuration system** (`config.json`) with **hot reload support**. The configuration supports different environment profiles (development, production, raspberry_pi).

#### Configuration Structure
```json
{
  "flask": {
    "secret_key": "your-secret-key",
    "debug": true,
    "host": "127.0.0.1",
    "port": 5000
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
  "audio": {
    "enabled": true,
    "file_path": "static/audio/Ethereal Strokes Loop.mp3",
    "volume": 0.5,
    "loop": true,
    "autoplay": true
  },
  "transformations": {
    "rotation": {
      "enabled": true,
      "min_degrees": -60,
      "max_degrees": 60
    },
    "scale": {
      "enabled": true,
      "min_factor": 0.5,
      "max_factor": 1.0
    },
    "translation": {
      "enabled": true,
      "layout_mode": "rule_of_thirds_and_centre",
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
  }
}
```

#### Environment Profiles

The configuration system supports three environment profiles:

**Development** (default)
- Full debugging enabled
- High animation quality
- Standard timing parameters

**Production**
- Debugging disabled
- Optimized for deployment
- Remember to change the secret key

**Raspberry Pi**
- Optimized for Pi hardware
- Reduced concurrent layers (2)
- Lower animation FPS (24)
- Faster timing for better performance
- Medium animation quality

#### Environment Selection

Set the environment using the `FLASK_CONFIG` environment variable:
```bash
# Development (default)
python app.py

# Production
FLASK_CONFIG=production python app.py

# Raspberry Pi
FLASK_CONFIG=raspberry_pi python app.py
```

#### Simplified Configuration System ✅ RECENT IMPROVEMENT

The application now uses a **streamlined configuration architecture** that eliminates complexity and reduces potential errors:

**Previous Complex System (Removed):**
- JSON config → Flask processing → HTML template injection → JavaScript variables
- Required 4 different naming conventions for the same setting
- Example: `max_horizontal_deviation_percent` → `TRANSLATION_RULE_OF_THIRDS_MAX_HORIZONTAL_DEVIATION_PERCENT` → `translationRuleOfThirdsMaxHorizontalDeviationPercent`

**New Simple System:**
- JSON config → Direct API fetch → JavaScript uses JSON structure
- Single consistent naming convention across all layers
- Example: Direct access to `config.transformations.translation.rule_of_thirds.max_horizontal_deviation_percent`

**Benefits:**
- **Much simpler:** One source of truth (JSON config)
- **Fewer errors:** No variable name mismatches between layers
- **Easier maintenance:** Add new config options just in JSON
- **Hot reload still works:** Config changes detected on page refresh
- **Same functionality:** All features work exactly as before

#### Configuration Hot Reload ✅ MAINTAINED FEATURE

The application continues to support **hot reloading** of configuration changes:

**How to use:**
1. Edit `config.json` with any desired changes
2. Save the file  
3. Refresh your browser (F5 or Ctrl+R)
4. Changes take effect immediately

**What gets reloaded:**
- All JSON configuration sections
- Layout modes and positioning settings
- Animation timing and transformation parameters
- Audio, matte border, and performance settings

### 6.8. Production Deployment

For production deployment on Raspberry Pi or other systems:

1. Use a WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

2. Consider using a reverse proxy like Nginx for better performance and security.

## 7. Project Structure

```
ManyPaintings/
├── app.py                      # Main Flask application
├── launcher.py                 # Universal launcher for executables
├── requirements.txt            # Python dependencies
├── config.json                 # Main configuration file
├── config.example.json         # Configuration template
├── favorites.json              # Favorites database (auto-generated)
├── STATUS.md                   # Current project status and features
├── BUILD-INSTRUCTIONS.md       # Detailed build instructions
├── build-windows.bat           # Windows executable build script
├── build-pi.sh                 # Raspberry Pi executable build script
├── windows.spec                # PyInstaller config for Windows
├── raspberry-pi.spec           # PyInstaller config for Raspberry Pi
├── config/                     # Configuration system
│   └── __init__.py             # JSON config loader
├── static/
│   ├── css/
│   │   └── style.css           # CSS styles
│   ├── js/
│   │   ├── main.js             # JavaScript entry point and coordination
│   │   ├── constants/          # Shared constants modules
│   │   │   └── LayoutConstants.js  # Layout modes, fractions, and color schemes
│   │   ├── managers/           # Core system managers
│   │   │   ├── ImageManager.js
│   │   │   ├── PatternManager.js
│   │   │   ├── AudioManager.js
│   │   │   ├── FavoritesManager.js
│   │   │   ├── MatteBorderManager.js
│   │   │   ├── DropShadowManager.js
│   │   │   └── UserPreferences.js
│   │   ├── modules/            # Animation engine and specialized components
│   │   │   ├── AnimationEngine.js
│   │   │   └── imageManagerUI.js
│   │   ├── ui/                 # User interface components
│   │   │   ├── UI.js
│   │   │   ├── FavoritesGallery.js
│   │   │   └── GalleryManager.js
│   │   └── utils/              # Utility modules
│   │       ├── GridManager.js
│   │       └── LayoutUtils.js  # Shared layout calculation functions
│   ├── audio/                  # Audio assets  
│   │   └── *.mp3               # Background ambient audio files
│   └── images/                 # Art images and per-image configs
│       ├── *.png               # Art image files
│       └── *.json              # Optional per-image configurations
├── templates/
│   ├── base.html               # Base template
│   ├── index.html              # Main page with favorite button
│   └── kiosk.html              # Kiosk mode with favorite button
├── utils/
│   ├── __init__.py
│   └── image_manager.py        # Image discovery and metadata
├── dist/                       # Generated executables (after build)
│   ├── ManyPaintings-Windows.exe     # Windows executable
│   └── ManyPaintings-RaspberryPi     # Raspberry Pi executable
└── .vscode/                    # VS Code configuration
    ├── launch.json             # Debug and run configurations
    ├── settings.json           # Project settings
    └── tasks.json              # Build tasks
```

## 8. Troubleshooting

### Common Issues

#### Windows
- **"Python not found"**: Install Python from python.org and check "Add to PATH"
- **Executable won't start**: Run from command prompt to see error messages
- **Browser doesn't open**: Check if Chrome or Edge is installed
- **Port 5000 in use**: Close other applications using port 5000

#### Raspberry Pi  
- **Build fails**: Install development packages: `sudo apt install python3-dev libjpeg-dev zlib1g-dev`
- **Executable won't run**: Check permissions: `chmod +x ManyPaintings-RaspberryPi`
- **Browser won't open**: Install Chromium: `sudo apt install chromium-browser`
- **Performance issues**: Use Raspberry Pi configuration environment

#### General
- **Server won't start**: Check console output for detailed error messages
- **Images don't load**: Verify `static/images/` contains PNG files
- **Config changes ignored**: Refresh browser (F5) after editing `config.json`

### Debug API for Troubleshooting

When console access is limited (e.g., kiosk mode), the application provides debug logging endpoints:

#### Debug Logging Endpoints
- **`POST /api/debug-log`** - Log messages to `debug.log` file
  ```bash
  curl -X POST http://localhost:5000/api/debug-log \
    -H "Content-Type: application/json" \
    -d '{"message": "Debug message here"}'
  ```

- **`POST /api/debug-clear`** - Clear debug log file
  ```bash
  curl -X POST http://localhost:5000/api/debug-clear
  ```

- **`GET /api/debug-config`** - View current config state and environment detection
  ```bash
  curl http://localhost:5000/api/debug-config
  ```

#### Using Debug API in Code
For temporary debugging, add logging calls to JavaScript:
```javascript
// In AnimationEngine or other modules
this.debugLog(`Debug info: ${JSON.stringify(data)}`);
```

#### Config System Debug Logging
Enable detailed config merge logging:
```bash
DEBUG_CONFIG=1 python launcher.py
```

### Getting Help

1. Check console output for detailed error messages
2. Use debug API endpoints when console access is limited
3. Verify all prerequisites are installed  
4. Try running `python launcher.py` directly for debugging
5. Review [BUILD-INSTRUCTIONS.md](BUILD-INSTRUCTIONS.md) for build issues

## 9. Development

### VS Code Integration

The project includes comprehensive VS Code support:

#### Launch Configurations (`.vscode/launch.json`)
1. **Flask: Many Paintings (Development)** - Development server with debugging
2. **Flask: Many Paintings (Production)** - Production mode server  
3. **Flask: Many Paintings (Raspberry Pi Config)** - Pi-optimized settings
4. **Python: Test Image Manager** - Test image discovery system
5. **Python: Launcher Script** - Debug the launcher directly

#### Build Tasks (`.vscode/tasks.json`)
- **Build Windows Executable** - Automated Windows build
- **Build Raspberry Pi Executable** - Automated Pi build (on Pi only)
- **Install Dependencies** - Install requirements.txt
- **Run Development Server** - Start Flask in development mode

#### Debugging

1. Set breakpoints in Python code
2. Press F5 or use "Run and Debug" panel  
3. Select appropriate configuration
4. Server starts with debugger attached

#### Recommended Extensions

- **Python** - Microsoft's Python extension
- **Python Debugger** - Enhanced debugging capabilities  
- **Jinja** - Template syntax highlighting
- **HTML CSS Support** - Enhanced HTML/CSS editing

### Testing System ✅ **ENTERPRISE-GRADE IMPLEMENTATION**

ManyPaintings includes a comprehensive three-tier automated testing system with 24+ test cases covering all functionality:

#### Testing Architecture
- **Backend Testing**: pytest with Flask integration for API endpoints and business logic
- **End-to-End Testing**: Playwright with page object models for reliable UI testing  
- **Visual Testing**: Windows-only screenshot-based UI validation with API stubbing
- **Smart Wait Strategies**: No arbitrary delays, reliable element waiting
- **Cross-Platform**: Tests auto-skip on unsupported platforms

#### Page Object Model E2E Tests
- **`tests/e2e/pages/`** - Maintainable page object classes
- **`MainPage`** - Core application interactions and keyboard shortcuts
- **`FavoritesGallery`** - Gallery modal operations and validations
- **`ImageManagerPage`** - Image management interface testing
- **`GalleryManagerPage`** - Color grading controls testing
- **Smart Selectors** - Uses actual HTML IDs and semantic selectors for stability

#### Visual Testing Suite ✅ NEW FEATURE
- **Windows-Only**: Platform-specific screenshot validation
- **API Stubbing**: Route interception for predictable test states
  - Mock `/api/favorites` for empty/populated favorites scenarios
  - Mock `/api/images` for empty/populated image manager scenarios
- **Automated Screenshots**: Generated to `test-results/visual/` directory
- **CSS Bug Detection**: Tests uncovered and fixed empty state visibility issues

#### Running Tests

**All tests:**
```bash
# Cross-platform scripts
test.bat        # Windows
./test.sh       # Unix/Linux/macOS
python run_tests.py  # Python script

# Direct pytest
python -m pytest
```

**E2E tests only:**
```bash
python -m pytest tests/e2e/ -v
```

**Visual tests (Windows only):**
```bash
python -m pytest tests/e2e/test_visual_appearance_windows.py -v
```

**With coverage:**
```bash
python -m pytest --cov=. --cov-report=html
```

#### Test Coverage
- **Core Functionality**: Application loading, animations, controls (15 tests)
- **Favorites System**: Save, load, gallery, persistence (9 tests)  
- **Visual Validation**: UI component appearance and behavior (12+ tests)
- **Keyboard Shortcuts**: All major keys (F, V, G, C, I, Space, B, N, A)
- **API Endpoints**: All REST endpoints with error handling
- **Bug Detection**: Tests have identified and resolved several UI issues

#### Recent Testing Achievements ✅
- **Visual Test Implementation**: Comprehensive UI validation with screenshot capture
- **API Stubbing Strategy**: Predictable test data without filesystem complexity
- **CSS Bug Fixes**: Identified and resolved image manager empty state visibility
- **Unicode Compatibility**: Fixed Windows console output for reliable CI/CD

#### VS Code Integration
- **Test Explorer**: Visual test runner with ▶️ buttons for all test types
- **Debug Support**: Full breakpoint support for backend, E2E, and visual tests
- **Test Discovery**: All 24+ tests automatically visible in VS Code
- **Launch Configs**: Pre-configured test running and debugging configurations

The testing system ensures reliable, maintainable code and has actively improved the application by identifying and resolving bugs during development.

## 10. Future Enhancements

### ✅ Recently Completed
*   **User Preferences & Server Storage:** ✅ COMPLETED - Comprehensive server-side storage system for persisting user settings across devices
*   **Pattern Behavior System:** ✅ COMPLETED - Config-driven pattern generation with no localStorage interference
*   **Background Preference Fix:** ✅ COMPLETED - Proper background color restoration with !important styling priority
*   **JavaScript Modularization:** ✅ COMPLETED - Refactored 3,684-line main.js into manageable ES6 modules
*   **Layout System Refactoring:** ✅ COMPLETED - Eliminated ~420 lines of duplicate code between AnimationEngine and GridManager by creating centralized LayoutConstants and LayoutUtils modules for consistent layout behavior
*   **Image Management System:** ✅ COMPLETED - Web-based image upload, browse, and delete functionality
*   **Enhanced Favorites Gallery:** ✅ COMPLETED - Visual thumbnails using html2canvas for pixel-perfect previews
*   **Animation Engine Fixes:** ✅ COMPLETED - Resolved play/pause timing issues with proper phase calculations
*   **Rule of Thirds Positioning:** ✅ COMPLETED - Fixed grid alignment and debug visualization system
*   **CSS Architecture:** ✅ COMPLETED - Eliminated Tailwind dependencies, converted to semantic CSS
*   **Enhanced Audio Integration:** ✅ COMPLETED - Background ambient audio with volume control and browser autoplay handling
*   **Configuration Hot Reload:** ✅ COMPLETED - Config changes take effect on browser refresh without server restart
*   **Fullscreen Mode Consistency:** ✅ COMPLETED - Image positioning remains identical between windowed and fullscreen modes
*   **Favouriting System:** ✅ COMPLETED - Save and share specific painting moments with server-side storage and URL sharing
*   **Play/Pause Control:** ✅ COMPLETED - Working animation pause/resume with proper state preservation
*   **API Endpoints:** ✅ COMPLETED - REST API endpoints for favorites and image management
*   **Favorites Opacity Fix:** ✅ COMPLETED - Fixed favorites saving to capture current animated opacity values instead of target opacity
*   **UI Polish:** ✅ COMPLETED - Removed "successfully" from toast messages and added ESC key support to close favorites modal
*   **Gallery Manager System:** ✅ COMPLETED - Professional Samsung Frame TV-style display calibration with brightness, contrast, saturation, white balance, and canvas texture controls
*   **Launcher System Overhaul:** ✅ COMPLETED (August 2025) - Streamlined launcher scripts focused on kiosk mode with hidden cursor and smart action button management

### 🚀 Potential Future Features
*   **Advanced Audio Features:** Add multiple audio tracks, crossfading, and synchronization with visual patterns.
*   **More Complex Animations:** Introduce more advanced animation effects, such as panning, zooming, and rotation.
*   **Color Palette Customization:** Allow users to customize the color palette of the generative art.
*   **Social Media Integration:** Direct sharing to social platforms with preview images
*   **Collection Management:** Organize favorites into collections or categories
*   **Export Features:** Save favorite paintings as high-resolution images
*   **WebSocket Integration:** Real-time pattern updates and synchronization across multiple displays.
*   **Mobile App:** Native mobile applications for iOS and Android
*   **Advanced Pattern Control:** More sophisticated pattern generation algorithms and user controls
