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

(Rest of the file remains unchanged)