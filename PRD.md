# PRD: Generative Art Application (Python Flask)

## 1. Introduction

This document outlines the Product Requirements for a generative art application inspired by Brian Eno's "77 Million Paintings." The application has been designed to use Python Flask, creating an ever-changing, non-repeating visual experience by layering and animating a set of predefined images. The application will run on both Raspberry Pi and Windows, accessible through a web browser, with a kiosk mode option for immersive viewing.

## 2. Goals and Objectives

*   **Primary Goal:** To create a visually engaging and calming generative art experience that can run continuously on low-power devices like the Raspberry Pi using Python.
*   **Secondary Goal:** To build a flexible platform that can be expanded in the future with more advanced features like user-provided content and audio-visual synchronization.

### Success Metrics:

*   The application runs smoothly on a Raspberry Pi 4B (or higher) using Python 3.9+.
*   The web interface is accessible and functional on modern web browsers on both Windows and Raspberry Pi OS.
*   The kiosk mode provides an immersive, full-screen experience.
*   The pattern identification code allows for reproducible art sequences.

## 3. Features

### 3.1. Core Functionality

*   **Generative Art:** The application will display a continuous, non-repeating sequence of generative art. This will be achieved by layering multiple, semi-transparent abstract images that fade in and out with slow, contemplative transitions. 
*   **Image Set:** The initial version will use a predefined set abstract images. These images are located in the `static/images` directory.
*   **Web Interface:** The application will be built using Flask and will be accessible through a web browser. The web interface will display the generative art and a unique code that identifies the current state of the animation.
*   **Kiosk Mode:** The application will have a kiosk mode that displays the generative art in full-screen, hiding all browser UI elements. On Raspberry Pi, this mode will also disable user input to prevent accidental interruption.
*   **Pattern Identification Code:** The sequence should be deterministic being derived from a random seed. A unique code will be displayed on the screen, representing the current sequence of images and their current animation state. This code can be used to restart the application with the same visual pattern if required.

### 3.2. Animation System

*   **Slow Transitions:** All image transitions should be deliberately slow and contemplative, creating a meditative viewing experience. Fade transitions should feel gradual and organic.

*   **Layer Management:** Multiple images can be displayed simultaneously as semi-transparent layers, creating rich compositional depth through overlapping elements.

*   **Image Transformations:** Before appearing, images can be randomly transformed to create visual variety:
    *   **Rotation:** Images may be rotated by random angles
    *   **Scaling:** Images may be scaled up or down within defined limits
    *   **Translation:** Images may be positioned at different locations on the canvas

*   **Configurable Animation Parameters:** The animation system should support fine-tuned control through configuration:
    *   **Fade In/Out Duration:** Time taken for images to gradually appear and disappear
    *   **Maximum Opacity:** The peak transparency level images reach when fully visible
    *   **Hold Time Range:** Minimum and maximum duration images remain at peak opacity
    *   **Concurrent Layers:** Maximum number of images displayed simultaneously
    *   **Transformation Limits:** Ranges for rotation angles, scale factors, and position offsets

### 3.3. Configuration System

The application should provide extensive configuration options to fine-tune the visual experience:

#### Animation Timing Configuration
*   `FADE_IN_DURATION_SEC` - Time for image to fade from 0% to maximum opacity (default: 3.0 seconds)
*   `FADE_OUT_DURATION_SEC` - Time for image to fade from maximum to 0% opacity (default: 4.0 seconds)
*   `MIN_HOLD_TIME_SEC` - Minimum time image stays at maximum opacity (default: 5.0 seconds)
*   `MAX_HOLD_TIME_SEC` - Maximum time image stays at maximum opacity (default: 15.0 seconds)
*   `MAX_OPACITY` - Peak opacity level for images (default: 0.7, range: 0.1-1.0)

#### Layer Management Configuration
*   `MAX_CONCURRENT_LAYERS` - Maximum simultaneous visible images (default: 3, range: 1-8)
*   `LAYER_SPAWN_INTERVAL_SEC` - Time between new image appearances (default: 4.0 seconds)

#### Image Transformation Configuration
*   `ROTATION_ENABLED` - Enable random rotation (default: true)
*   `ROTATION_MIN_DEGREES` - Minimum rotation angle (default: -15)
*   `ROTATION_MAX_DEGREES` - Maximum rotation angle (default: 15)
*   `SCALE_ENABLED` - Enable random scaling (default: true)
*   `SCALE_MIN_FACTOR` - Minimum scale multiplier (default: 0.8)
*   `SCALE_MAX_FACTOR` - Maximum scale multiplier (default: 1.2)
*   `TRANSLATION_ENABLED` - Enable random positioning (default: true)
*   `TRANSLATION_X_RANGE` - Horizontal position variance as % of screen width (default: 20)
*   `TRANSLATION_Y_RANGE` - Vertical position variance as % of screen height (default: 15)

#### Performance Optimization Configuration
*   `ANIMATION_QUALITY` - Animation smoothness level (default: 'high', options: 'low', 'medium', 'high')
*   `PRELOAD_TRANSFORM_CACHE` - Pre-calculate transformations for performance (default: true)

### 3.4. User Interaction

*   **No Direct Interaction (MVP):** The initial version of the application will not require any user interaction. The generative art will be displayed passively.

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

### 6.1. Prerequisites

*   Python 3.9 or higher
*   pip (Python package installer)

### 6.2. Installation

1. Navigate to the project directory:
   ```bash
   cd ManyPaintings
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Linux/macOS
   source venv/bin/activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 6.3. Running the Application

1. Start the Flask development server:
   ```bash
   python app.py
   ```

2. Open your web browser and navigate to `http://localhost:5000`

3. For kiosk mode, navigate to `http://localhost:5000/kiosk`

### 6.4. Configuration

The application behavior can be customized through environment variables. Create a `.env` file based on `.env.example`:

#### Animation Configuration Example
```bash
# Animation Timing (seconds)
FADE_IN_DURATION_SEC=3.0
FADE_OUT_DURATION_SEC=4.0
MIN_HOLD_TIME_SEC=5.0
MAX_HOLD_TIME_SEC=15.0
MAX_OPACITY=0.7

# Layer Management
MAX_CONCURRENT_LAYERS=3
LAYER_SPAWN_INTERVAL_SEC=4.0

# Image Transformations
ROTATION_ENABLED=true
ROTATION_MIN_DEGREES=-15
ROTATION_MAX_DEGREES=15
SCALE_ENABLED=true
SCALE_MIN_FACTOR=0.8
SCALE_MAX_FACTOR=1.2
TRANSLATION_ENABLED=true
TRANSLATION_X_RANGE=20
TRANSLATION_Y_RANGE=15

# Performance
ANIMATION_QUALITY=high
PRELOAD_TRANSFORM_CACHE=true
```

### 6.5. Production Deployment

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
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── config.py             # Configuration settings
├── static/
│   ├── css/
│   │   └── style.css     # CSS styles
│   ├── js/
│   │   └── main.js       # JavaScript for animations
│   └── images/           # Art images (image_0.png to image_9.png)
├── templates/
│   ├── base.html         # Base template
│   ├── index.html        # Main page
│   └── kiosk.html        # Kiosk mode template
└── utils/
    └── pattern_generator.py  # Pattern identification code generator
```

## 9. Future Enhancements

### Launch Configurations

The project includes several VS Code launch configurations in `.vscode/launch.json`:

1. **Flask: Many Paintings** - Main development server with debugging
2. **Flask: Many Paintings (Production)** - Production mode server
3. **Flask: Run Script** - Alternative launcher using `run.py`
4. **Python: Setup Script** - Run the setup script

### Tasks

Available tasks in VS Code (Ctrl+Shift+P → "Tasks: Run Task"):

- **Flask: Start Development Server** - Start Flask in development mode
- **Flask: Start Production Server** - Start Flask in production mode
- **Python: Install Dependencies** - Install requirements.txt
- **Python: Setup Project** - Run the setup script
- **Flask: Run with Gunicorn** - Production server with Gunicorn

### Debugging

1. Set breakpoints in Python code
2. Press F5 or use "Run and Debug" panel
3. Select "Flask: Many Paintings" configuration
4. Server will start with debugger attached

### Extensions Recommended

For the best development experience, install these VS Code extensions:

- **Python** - Microsoft's Python extension
- **Python Debugger** - Enhanced debugging capabilities
- **Jinja** - Template syntax highlighting
- **HTML CSS Support** - Enhanced HTML/CSS editing
- **Auto Rename Tag** - Automatically rename HTML tags
- **Prettier** - Code formatter

### Settings

The project includes VS Code settings in `.vscode/settings.json`:

- Python interpreter set to virtual environment
- Jinja template support
- File associations for templates
- Debugging configuration

*   **User-Provided Content:** Allow users to upload their own images to be used in the generative art.
*   **Audio Integration:** Add a generative audio component that synchronizes with the visuals.
*   **More Complex Animations:** Introduce more advanced animation effects, such as panning, zooming, and rotation.
*   **Color Palette Customization:** Allow users to customize the color palette of the generative art.
*   **Social Sharing:** Allow users to share their favorite "paintings" on social media.
*   **API Endpoints:** Create REST API endpoints for programmatic control of the art generation.
*   **WebSocket Integration:** Real-time pattern updates and synchronization across multiple displays.
