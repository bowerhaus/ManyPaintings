# ManyPaintings iPhone Remote Control - Product Requirements Document

## Executive Summary

This document outlines the requirements and implementation approach for adding iPhone web application remote control functionality to the ManyPaintings generative art application. The solution provides direct control of the artwork display through a mobile-optimized web interface.

## Project Goals

- **Primary**: Enable remote control of ManyPaintings display from iPhone web browser
- **Secondary**: Maintain clean TV display while providing intuitive control interface
- **Tertiary**: Avoid over-engineering while ensuring real-time responsiveness

## Current System Overview

### Architecture
- **Display**: Samsung Frame TV connected to Raspberry Pi (Windows PC for development)
- **Backend**: Flask Python server with RESTful API
- **Frontend**: ES6 JavaScript modules with no build tools
- **Data**: JSON configuration and favorites storage
- **Network**: WiFi connection between devices

### Existing Controls
- Speed: 1-10x multiplier
- Layers: 1-8 concurrent layers  
- Volume: 0-100% audio levels
- Gallery Manager: Brightness (25-115%), Contrast (85-115%), Saturation (50-120%), White Balance (80-120%), Texture Intensity (0-100%)
- Favorites: Save/load painting states with thumbnails
- Background: Black/white toggle

## User Requirements

### MVP Features (Must-Have)
1. **Save Favorite** - Capture current painting state
2. **View/Select Favorites** - Browse and load saved paintings with thumbnails
3. **Delete Favorites** - Remove unwanted saved paintings with enhanced mobile-friendly delete buttons
4. **Gallery Manager Controls** - All 5 color grading adjustments
5. **Speed Control** - Animation speed multiplier (1-10x)
6. **Volume Control** - Audio volume (0-100%)

### User Experience Requirements
- **Immediate Feedback**: Visual changes appear on TV instantly when adjusting iPhone controls
- **Favorites Display**: Thumbnails visible on iPhone during selection with proper background color theming
- **Mobile-Friendly Interface**: Enhanced delete buttons with proper touch targets for mobile devices
- **Theme Consistency**: Favorites gallery adapts to black/white background mode
- **Response Time**: <200ms from control input to screen feedback
- **No App Store**: Browser-based solution requiring no installation

## Solution Architecture

### iPhone Web Application

#### Technical Approach
- **Web App**: Responsive HTML/CSS/JS served from Flask at `/remote` endpoint
- **State Storage**: Server-side settings storage (eliminates localStorage entirely)
- **Communication**: Simple REST API calls for setting updates
- **UI**: Mobile-optimized interface matching main application design
- **No App Store**: Browser-based solution requiring no installation

#### User Flow
1. Open iPhone browser to `http://[pi-ip]:5000/remote`
2. iPhone loads current settings from server via API
3. Control adjustments immediately update server and appear on TV
4. Favorites gallery shows thumbnails loaded from server
5. TV browser polls server for setting changes (light polling every 1-2 seconds)

## Technical Implementation

### Backend Requirements

#### New Flask Routes
```python
@app.route('/remote')                    # iPhone web app interface
@app.route('/api/settings', methods=['GET', 'POST'])  # Settings storage API
```

#### API Protocol
```json
// Get All Settings
GET /api/settings
{
  "speed": 5,
  "layers": 4,
  "volume": 50,
  "isWhiteBackground": false,
  "gallery": {
    "brightness": 100,
    "contrast": 100,
    "saturation": 100,
    "whiteBalance": 100,
    "textureIntensity": 0
  }
}

// Update Settings (Partial)
POST /api/settings
{
  "speed": 7
}
```

#### Dependencies
**No new dependencies required** - uses existing Flask setup

### Frontend Implementation

#### iPhone Web Remote (`/templates/remote.html`)
- **Layout**: Portrait mobile interface with touch-friendly controls
- **Components**: Speed slider, layers slider, volume slider, gallery controls, favorites grid
- **Feedback**: Real-time value updates and connection status indicator
- **Responsive**: Optimized for iPhone Safari with viewport meta tags

#### Updated UserPreferences Module
```javascript
class UserPreferences {
  async get(key) {
    // Check memory cache first
    if (this.cache[key] !== undefined) return this.cache[key];
    
    try {
      // Fetch from server
      const response = await fetch('/api/settings');
      const settings = await response.json();
      this.cache = settings; // Update cache
      return settings[key] || this.defaults[key];
    } catch (error) {
      // Fallback to defaults if server unavailable
      return this.defaults[key];
    }
  }
  
  async save(key, value) {
    // Update cache immediately
    this.cache[key] = value;
    
    try {
      // Save to server
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
    } catch (error) {
      console.warn('Failed to save setting to server:', error);
      // Setting remains in cache for current session
    }
  }
}
```

#### TV Browser Polling
```javascript
// Light polling to detect iPhone changes
setInterval(async () => {
  const response = await fetch('/api/settings');
  const serverSettings = await response.json();
  
  // Apply changes if different from current state
  if (serverSettings.speed !== UI.speedMultiplier) {
    UI.speedMultiplier = serverSettings.speed;
    UI.updateSpeedDisplay();
  }
  // ... check other settings
}, 2000); // Poll every 2 seconds
```

### Visual Feedback System

#### On-Screen Notifications
- **Toast Style**: Temporary overlays for control changes
- **Position**: Top-right corner, auto-fade after 2 seconds
- **Content**: "Speed: 7x", "Volume: 80%", "Favorite Saved"
- **Styling**: Matches existing UI theme

#### Control Panel Behavior
- **Auto-Show**: Appears when iPhone changes detected
- **Auto-Hide**: Fades after 3 seconds of inactivity
- **State Persistence**: Maintains current values during display

## User Interface Design

### iPhone Web Remote Layout

```
┌─────────────────────┐
│  ManyPaintings      │
│  Remote Control     │
├─────────────────────┤
│ ●●● Connected       │
├─────────────────────┤
│ Speed      [====|--] │
│ Layers     [==|----] │  
│ Volume     [======|-] │
├─────────────────────┤
│ Gallery Manager     │
│ Brightness [===|---] │
│ Contrast   [====|--] │
│ Saturation [==|----] │
│ White Bal  [====|--] │
│ Texture    [|------] │
├─────────────────────┤
│ Favorites           │
│ [🖼️❌] [🖼️❌] [🖼️❌] [🖼️❌] │
│ [🖼️❌] [🖼️❌] [+ Save]     │
│ (Enhanced delete UI) │
└─────────────────────┘
```

## Implementation Phases

### Phase 1: Server Settings Storage
1. **Settings API**: Create GET/POST `/api/settings` endpoints
2. **Server Storage**: Implement `settings.json` file storage
3. **UserPreferences Update**: Replace localStorage with API calls
4. **Default Values**: Use hardcoded defaults for first-time setup

### Phase 2: iPhone Web Remote
1. **Mobile UI**: Create responsive `/remote` interface
2. **Control Integration**: Connect sliders to settings API
3. **Favorites Display**: Show thumbnails from existing favorites API
4. **Visual Feedback**: Real-time value updates on iPhone

### Phase 3: TV Browser Polling
1. **Light Polling**: Check for setting changes every 1-2 seconds
2. **Smooth Updates**: Apply changes without disrupting animations
3. **Conditional Updates**: Only update UI if values actually changed

### Phase 4: Polish & Testing
1. **Error Handling**: Network failure recovery
2. **Performance**: Optimize polling frequency
3. **Testing**: Cross-device validation
4. **Documentation**: Setup and usage guides

## Technical Considerations

### Network Requirements
- **Bandwidth**: Minimal (settings JSON <1KB per request)
- **Latency**: 50-100ms on local WiFi network
- **Reliability**: Standard HTTP requests with error handling
- **Security**: Local network only, no external access

### Raspberry Pi Compatibility
- **Performance**: REST API adds minimal CPU overhead
- **Memory**: Settings storage ~1KB additional
- **Storage**: Web remote assets ~200KB total

### Browser Compatibility
- **iPhone Safari**: Primary target with modern JavaScript support
- **Chrome Mobile**: Secondary support
- **Feature Detection**: Graceful fallback for older browsers
- **PWA Support**: Add manifest for "Add to Home Screen"

## Success Metrics

### Functional Requirements
- [ ] iPhone remote connects within 5 seconds
- [ ] Control changes appear on TV within 200ms
- [ ] Favorites thumbnails load within 1 second
- [ ] Settings persist across browser refreshes
- [ ] No missed inputs during normal operation

### User Experience
- [ ] Intuitive control layout matching main interface
- [ ] Reliable connection with error recovery
- [ ] Clear visual feedback for all actions
- [ ] Responsive mobile interface
- [ ] Easy setup process (<2 minutes)

## Future Enhancements (Out of Scope)

### Potential Additions
- **Multi-Remote**: Support multiple iPhone remotes simultaneously
- **Voice Control**: Integration with Siri shortcuts
- **Gesture Control**: iPhone accelerometer for speed control
- **PWA Support**: Add manifest for "Add to Home Screen"
- **Haptic Feedback**: iPhone vibration on control changes

### Platform Extensions
- **Android Support**: Web app works but could be optimized
- **Desktop Remote**: Browser-based control from laptops
- **Physical Remote**: Separate Bluetooth remote implementation

## Risk Assessment

### Technical Risks
- **Network Reliability**: WiFi interruptions could affect control responsiveness
  - *Mitigation*: Error handling with graceful degradation to defaults
- **State Sync**: TV browser might miss setting changes
  - *Mitigation*: Light polling with conditional updates
- **First-Time Setup**: No existing settings to load
  - *Mitigation*: Sensible default values and automatic initialization

### User Experience Risks  
- **Learning Curve**: New interaction patterns
  - *Mitigation*: Intuitive UI matching existing controls
- **Device Management**: Multiple devices accessing same settings
  - *Mitigation*: Clear connection status indicators

## Conclusion

This iPhone remote control solution provides a clean, user-friendly way to control ManyPaintings without over-engineering the system. The server-side state approach eliminates localStorage complexity while maintaining the application's clean aesthetic and responsive performance.

The implementation leverages existing Flask infrastructure and ES6 JavaScript architecture, ensuring minimal disruption to the current codebase while adding significant user value for gallery display scenarios.