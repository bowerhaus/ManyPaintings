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

### 3.2. Animation System

*   **Slow Transitions:** All image transitions should be deliberately slow and contemplative, creating a meditative viewing experience. Fade transitions should feel gradual and organic.

*   **Layer Management:** Multiple images can be displayed simultaneously as semi-transparent layers, creating rich compositional depth through overlapping elements.

*   **Image Transformations:** Before appearing, images can be randomly transformed to create visual variety:
    *   **Rotation:** Images may be rotated by random angles
    *   **Scaling:** Images may be scaled up or down within defined limits
    *   **Translation:** Images may be positioned at different locations on the canvas
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
*   `translation.enabled` - Enable random positioning (default: true)
*   `translation.x_range_percent` - Horizontal variance as % of viewport (default: 30%)
*   `translation.y_range_percent` - Vertical variance as % of viewport (default: 30%)

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

#### Fullscreen Mode Support ✅ IMPLEMENTED
*   **Consistent Positioning:** Image layers maintain identical visual positioning between windowed and fullscreen modes
*   **Container-Relative Transformations:** Image translations use percentage-based positioning instead of viewport units
*   **Seamless Transition:** No visual jump or repositioning when entering/exiting fullscreen
*   **Automatic Detection:** Browser fullscreen API integration with responsive layout adjustments

#### Performance Optimization Configuration
*   `animation_quality` - Animation smoothness level (default: 'high', options: 'low', 'medium', 'high')
*   `preload_transform_cache` - Pre-calculate transformations for performance (default: true)

#### UI Control Configuration ✅ IMPLEMENTED
*   **Speed Range:** 0.1x to 20x multiplier with real-time effect on all animations
*   **Layer Range:** 1-8 concurrent layers with immediate cleanup
*   **Audio Controls:** Volume slider (0-100%), play/pause toggle with visual feedback
*   **Background Toggle:** Black/white background switching with adaptive blend modes
*   **Pattern Display:** Real-time pattern code display with automatic updates
*   **Control Panel:** 85% viewport width, bottom-center positioning, mouse-activated, enlarged for 5 control groups
*   **Visual Design:** Glassmorphism effects with backdrop-blur and smooth transitions
*   **Unified Interface:** All controls consolidated in single panel for improved UX

### 3.4. User Interaction

#### 3.4.1. Onscreen Controls System ✅ IMPLEMENTED
*   **Mouse-Activated Control Panel:** A sophisticated control interface that appears when hovering over the bottom-center area of the canvas
*   **Real-time Speed Control:** Dynamic speed multiplier ranging from 0.1x to 20x affecting all animation timings (fade in/out, hold times, spawn intervals)
*   **Layer Management:** Live adjustment of concurrent layer count (1-8 layers) with immediate cleanup of excess layers
*   **Audio Control:** Volume slider (0-100%) and play/pause toggle with browser autoplay compliance and visual feedback
*   **Background Theme Toggle:** Instant switching between black and white backgrounds with adaptive UI styling and smart blend modes
*   **Pattern Code Display:** Real-time pattern code display showing current sequence with automatic updates
*   **Glassmorphism UI Design:** Modern backdrop-blur visual effects with smooth opacity transitions
*   **Responsive Layout:** 85% canvas width control panel optimized for different screen sizes
*   **Unified Control Interface:** All settings consolidated in single horizontal layout for improved accessibility

#### 3.4.2. Interactive Features
*   **Speed Multiplier Effects:**
    - At 1x: Normal contemplative timing (15-60s fades, 5-120s hold times)
    - At 10x: Rapid dynamic changes (1.5-6s fades, 0.5-12s holds)
    - At 20x: Ultra-fast generative effects (0.75-3s fades, 0.25-6s holds)
    - At 0.1x: Ultra-slow meditative experience (150-600s fades, 50-1200s holds)

*   **Layer Control Benefits:**
    - 1-2 layers: Minimalist, focused compositions
    - 4-6 layers: Rich, complex overlapping visuals
    - 8 layers: Dense, dynamic layered experiences

*   **Pattern Code System:**
    - Real-time display of current pattern codes for sequence identification
    - Automatic updates as patterns change and evolve
    - Deterministic generation for consistent results

*   **Background Theme System:**
    - Instant toggle between black and white backgrounds
    - Adaptive UI styling that automatically adjusts for optimal contrast
    - Smart blend mode switching (normal for black, multiply for white backgrounds)
    - Persistent preference storage using localStorage
    - Keyboard shortcut (B key) for quick switching

*   **Fullscreen Mode:**
    - Consistent image positioning between windowed and fullscreen modes
    - Use F11 or browser fullscreen controls for immersive viewing
    - All animations and controls work identically in fullscreen
    - Seamless transition without visual jumps or repositioning

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

#### Option 1: Pre-Built Executable (Recommended)
```bash
# Windows
ManyPaintings-Windows.exe

# Raspberry Pi
./ManyPaintings-RaspberryPi
```

#### Option 2: Development Server
```bash
# Activate virtual environment first
python app.py
```

#### Option 3: Production Deployment
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
- **Pattern display:** View current pattern code

#### Keyboard Shortcuts
- **Space:** Play/Pause animation
- **N:** Generate new pattern
- **B:** Toggle background (black/white)
- **A:** Toggle audio playback

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
      "x_range_percent": 30,
      "y_range_percent": 30
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

#### Configuration Hot Reload ✅ NEW FEATURE

The application now supports **hot reloading** of configuration changes without requiring a server restart:

**How to use:**
1. Edit `config.json` with any desired changes
2. Save the file
3. Refresh your browser (F5 or Ctrl+R)
4. Changes take effect immediately

**Features:**
- **Automatic Detection:** File modification timestamps are monitored
- **Thread-Safe:** Multiple browser refreshes safely trigger config reloads
- **No Server Restart:** Changes apply without stopping the Flask server
- **All Settings:** Works with all configuration sections (timing, transformations, audio, etc.)

**What gets reloaded:**
- Animation timing parameters
- Layer management settings
- Image transformation settings
- Audio configuration
- Matte border settings
- Performance settings

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
│   │   └── main.js             # JavaScript for animations
│   ├── audio/                  # Audio assets  
│   │   └── *.mp3               # Background ambient audio files
│   └── images/                 # Art images and per-image configs
│       ├── *.png               # Art image files
│       └── *.json              # Optional per-image configurations
├── templates/
│   ├── base.html               # Base template
│   ├── index.html              # Main page
│   └── kiosk.html              # Kiosk mode template
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

### Getting Help

1. Check console output for detailed error messages
2. Verify all prerequisites are installed
3. Try running `python launcher.py` directly for debugging
4. Review [BUILD-INSTRUCTIONS.md](BUILD-INSTRUCTIONS.md) for build issues

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

## 10. Future Enhancements

*   **User-Provided Content:** Allow users to upload their own images to be used in the generative art.
*   **Enhanced Audio Integration:** ✅ COMPLETED - Background ambient audio with volume control and browser autoplay handling
*   **Configuration Hot Reload:** ✅ COMPLETED - Config changes take effect on browser refresh without server restart
*   **Fullscreen Mode Consistency:** ✅ COMPLETED - Image positioning remains identical between windowed and fullscreen modes
*   **Advanced Audio Features:** Add multiple audio tracks, crossfading, and synchronization with visual patterns.
*   **More Complex Animations:** Introduce more advanced animation effects, such as panning, zooming, and rotation.
*   **Color Palette Customization:** Allow users to customize the color palette of the generative art.
*   **Social Sharing:** Allow users to share their favorite "paintings" on social media.
*   **API Endpoints:** Create REST API endpoints for programmatic control of the art generation.
*   **WebSocket Integration:** Real-time pattern updates and synchronization across multiple displays.
