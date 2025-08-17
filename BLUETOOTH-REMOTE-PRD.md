# ManyPaintings Bluetooth Remote Control - Product Requirements Document

## Executive Summary

This document outlines the requirements and implementation approach for adding Amazon Fire TV remote control functionality to the ManyPaintings generative art application. The solution provides navigation-based control through Bluetooth connectivity and D-pad interface.

## Project Goals

- **Primary**: Enable remote control of ManyPaintings using Amazon Fire TV remote via Bluetooth
- **Secondary**: Provide intuitive D-pad navigation through existing on-screen controls
- **Tertiary**: Maintain stylish remote control experience without complex universal remotes

## Current System Overview

### Architecture
- **Display**: Samsung Frame TV connected to Raspberry Pi (Windows PC for development)
- **Backend**: Flask Python server with RESTful API
- **Frontend**: ES6 JavaScript modules with no build tools
- **Data**: JSON configuration and favorites storage
- **Input**: Amazon Fire TV remote paired via Bluetooth

### Existing Controls
- Speed: 1-10x multiplier
- Layers: 1-8 concurrent layers  
- Volume: 0-100% audio levels
- Gallery Manager: Brightness (25-115%), Contrast (85-115%), Saturation (50-120%), White Balance (80-120%), Texture Intensity (0-100%)
- Favorites: Save/load painting states with thumbnails
- Background: Black/white toggle

## User Requirements

### MVP Features (Must-Have)
1. **Navigate Controls** - D-pad navigation through on-screen control panel
2. **Adjust Settings** - Modify speed, layers, volume, gallery settings
3. **Save Favorite** - Quick save current painting state
4. **Browse Favorites** - Navigate and select saved favorites
5. **Visual Feedback** - Control panel appears during navigation

### User Experience Requirements
- **Control Panel Auto-Show**: Panel appears when remote activity detected
- **Focus Indicators**: Clear visual highlighting of selected controls
- **Immediate Feedback**: Settings changes apply instantly on screen
- **Auto-Hide**: Panel disappears after inactivity period

## Hardware Requirements

### Amazon Fire TV Remote Specifications
- **Connectivity**: Bluetooth 4.0+ (compatible with Raspberry Pi 4)
- **Buttons Available**:
  - D-Pad (Up, Down, Left, Right, Select)
  - Back, Home, Menu
  - Play/Pause
  - Volume Up/Down
  - Voice button (optional use)

### Raspberry Pi Compatibility
- **Bluetooth**: Built-in Pi 4 Bluetooth stack
- **Linux Support**: evdev library for input handling
- **Pairing**: Standard Bluetooth pairing process

## Solution Architecture

### Bluetooth Input System

#### Technical Approach
- **Input Handling**: Linux `evdev` library for raw button events
- **State Storage**: Shared server-side settings (same as iPhone remote)
- **Navigation**: Focus management system for on-screen controls
- **Feedback**: Visual indicators and control panel auto-show/hide

#### Button Mapping Strategy
```
Fire TV Remote → Application Function
─────────────────────────────────────
D-Pad Up/Down   → Navigate between control categories
D-Pad Left/Right → Adjust focused control value
Select          → Enter/confirm selection
Menu            → Show/hide control panel
Back            → Return to previous control level
Play/Pause      → Save current favorite
Volume +/-      → Direct volume control (bypass navigation)
```

## Technical Implementation

### Backend Requirements

#### Dependencies Addition
```bash
# Add to requirements.txt (Linux only)
evdev==1.6.1
```

#### System Service
```python
# New module: bluetooth_remote.py
class BluetoothRemoteHandler:
    def __init__(self):
        self.device = None
        self.focus_manager = FocusManager()
        
    def connect_remote(self):
        # Scan for Fire TV remote
        # Handle pairing and connection
        
    def handle_input(self, event):
        # Process button events
        # Update focus or trigger actions
        # Send commands to Flask API
```

### Frontend Implementation

#### Focus Management System
```javascript
// New module: FocusManager.js
class FocusManager {
  constructor() {
    this.currentFocus = null;
    this.controls = [];
    this.categories = ['speed', 'layers', 'volume', 'gallery', 'favorites'];
  }
  
  moveFocus(direction) {
    // Handle D-pad navigation
    // Update visual focus indicators
  }
  
  adjustValue(direction) {
    // Increase/decrease focused control
    // Call settings API to save changes
  }
  
  showControlPanel() {
    // Display control panel with focus indicators
    // Auto-hide after inactivity
  }
}
```

#### Visual Focus Indicators
```css
.control-focused {
  border: 2px solid #007bff;
  background: rgba(0, 123, 255, 0.1);
  transform: scale(1.05);
  transition: all 0.3s ease;
}

.control-category-focused {
  background: rgba(0, 123, 255, 0.2);
  border-radius: 8px;
}
```

#### Control Panel Enhancement
- **Auto-Show**: Appears when remote input detected
- **Focus Visualization**: Highlighted controls with clear selection
- **Smooth Transitions**: Animated focus movement
- **Value Indicators**: Current values prominently displayed

## User Interface Design

### Navigation Flow

```
Control Panel Structure:
┌─────────────────────────────────────┐
│ ► Main Controls          [Focused]  │
│   ├─ Speed: [====|--] 5x           │
│   ├─ Layers: [==|----] 2           │
│   └─ Volume: [======|-] 70%        │
│                                     │
│   Gallery Manager                   │
│   ├─ Brightness: [===|---] 60%     │
│   ├─ Contrast: [====|--] 100%      │
│   ├─ Saturation: [==|----] 80%     │
│   ├─ White Balance: [====|--] 100% │
│   └─ Texture: [|------] 10%        │
│                                     │
│   Favorites                         │
│   ├─ [Save Current]                 │
│   └─ [Browse Gallery]               │
└─────────────────────────────────────┘
```

### Button Interaction Patterns

#### Category Navigation (D-Pad Up/Down)
1. **Main Controls** → **Gallery Manager** → **Favorites** → (cycle)

#### Value Adjustment (D-Pad Left/Right)
1. **Speed**: 1 ↔ 10 (step: 1)
2. **Layers**: 1 ↔ 8 (step: 1)  
3. **Volume**: 0 ↔ 100 (step: 10)
4. **Gallery Settings**: Min ↔ Max (step: 5)

#### Quick Actions
- **Play/Pause**: Instant save favorite
- **Menu**: Toggle control panel visibility
- **Back**: Return to category level from individual control

## Implementation Phases

### Phase 1: Server Settings Foundation
1. **Settings API**: Server-side storage system with defaults
2. **UserPreferences Update**: Replace localStorage with API calls
3. **Control Panel Enhancement**: Focus-ready UI structure

### Phase 2: Bluetooth Integration
1. **evdev Setup**: Install and configure input library
2. **Device Discovery**: Scan and pair Fire TV remote
3. **Event Handling**: Process button press events
4. **API Integration**: Send commands to settings API

### Phase 3: Focus Management
1. **Focus System**: Implement navigation logic
2. **Visual Indicators**: Add CSS focus styling
3. **Auto-Show/Hide**: Control panel behavior
4. **Smooth Transitions**: Animated focus movement

### Phase 4: Polish & Testing
1. **Button Mapping**: Fine-tune control sensitivity
2. **Error Handling**: Connection recovery and fallbacks
3. **Performance**: Optimize input responsiveness
4. **Documentation**: Setup and pairing guides

## Technical Considerations

### Bluetooth Reliability
- **Pairing Process**: Standard Linux bluetoothctl workflow
- **Connection Recovery**: Auto-reconnect on disconnect
- **Input Latency**: <50ms response time for button presses
- **Battery Management**: Remote sleep/wake handling

### System Integration
- **Linux Dependencies**: evdev library (Pi 4 compatible)
- **Permissions**: Input device access rights
- **Service Management**: systemd service for remote daemon
- **Resource Usage**: Minimal CPU overhead (<1%)

### Cross-Platform Considerations
- **Linux Only**: Bluetooth remote requires Linux evdev
- **Windows Development**: Use keyboard simulation for testing
- **Fallback Mode**: Keyboard shortcuts as backup control method

## Success Metrics

### Functional Requirements
- [ ] Fire TV remote pairs within 30 seconds
- [ ] Button presses register within 50ms
- [ ] Focus navigation works smoothly between all controls
- [ ] Control panel auto-shows within 200ms of input
- [ ] Settings changes apply immediately to display

### User Experience
- [ ] Intuitive D-pad navigation pattern
- [ ] Clear visual focus indicators
- [ ] Responsive control adjustments
- [ ] Reliable Bluetooth connectivity
- [ ] Easy pairing process

## Setup Instructions

### Raspberry Pi Bluetooth Setup
```bash
# Install dependencies
sudo apt update
sudo apt install bluetooth bluez python3-evdev

# Enable Bluetooth service
sudo systemctl enable bluetooth
sudo systemctl start bluetooth

# Pair Fire TV remote
sudo bluetoothctl
[bluetooth]# scan on
[bluetooth]# pair [REMOTE_MAC_ADDRESS]
[bluetooth]# trust [REMOTE_MAC_ADDRESS]
[bluetooth]# connect [REMOTE_MAC_ADDRESS]
```

### Service Installation
```bash
# Install remote control service
sudo cp bluetooth_remote_service.py /usr/local/bin/
sudo cp manypaintings-remote.service /etc/systemd/system/
sudo systemctl enable manypaintings-remote
sudo systemctl start manypaintings-remote
```

## Future Enhancements (Out of Scope)

### Advanced Features
- **Multiple Remotes**: Support for multiple Fire TV remotes
- **Custom Mapping**: User-configurable button assignments
- **Voice Commands**: Integration with remote's voice button
- **Gesture Support**: Long press and multi-button combinations
- **Universal Remote**: Support for other Bluetooth remote types

### Integration Possibilities
- **Smart Home**: Integration with home automation systems
- **Mobile Backup**: iPhone remote as backup when Bluetooth fails
- **Scheduled Control**: Time-based automatic adjustments

## Risk Assessment

### Technical Risks
- **Bluetooth Pairing**: Inconsistent pairing on some Pi units
  - *Mitigation*: Detailed troubleshooting guide and pairing scripts
- **Input Lag**: Delay between button press and response
  - *Mitigation*: Optimized event processing and direct API calls
- **Connection Drops**: Remote disconnects during use
  - *Mitigation*: Auto-reconnection and connection monitoring
- **First-Time Setup**: No existing settings configuration
  - *Mitigation*: Sensible default values and automatic initialization

### Hardware Compatibility
- **Remote Variations**: Different Fire TV remote versions
  - *Mitigation*: Support for common Fire TV remote models
- **Pi Bluetooth**: Older Pi models with weaker Bluetooth
  - *Mitigation*: Document minimum Pi 4 requirement

## Conclusion

This Bluetooth remote control solution provides a stylish, physical control method for ManyPaintings without requiring complex universal remotes. The Fire TV remote's limited button set is leveraged effectively through intelligent D-pad navigation and focus management.

The implementation builds on the same server-side state architecture as the iPhone remote, ensuring consistency and reducing complexity. The solution maintains the application's elegant aesthetic while providing reliable physical control for gallery display scenarios.