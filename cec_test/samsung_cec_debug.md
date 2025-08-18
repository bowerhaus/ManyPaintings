# Samsung CEC Remote Button Detection Debug Report

## Current Status
- **CEC Connection**: ✅ Working (Pi can communicate with Samsung TV)
- **Device Detection**: ✅ TV detected as Samsung (Vendor ID: 0x0000f0)
- **Logical Addressing**: ✅ Pi is Playback Device 1 (Address 4), TV is Address 0
- **Permissions**: ✅ User in `video` group, has CEC device access
- **Remote Monitoring**: ❌ Not detecting button presses

## Key Findings

### 1. CEC Topology
```
0.0.0.0: TV (Samsung)
    3.0.0.0: Playback Device 1 (Raspberry Pi)
```

### 2. Device Capabilities
- TV Power Status: "In transition Standby to On"
- Pi has "Remote Control Support" capability
- Pi configured with "Allow RC Passthrough"

### 3. Monitor Mode Issues
- `cec-ctl --monitor-all` falls back to regular monitoring
- Warning: "you may have to run this as root"
- Suggests permission/configuration issue despite proper group membership

## Samsung TV CEC Requirements

### Critical Samsung Frame TV Settings
Samsung Frame TVs require specific CEC settings to allow remote button passthrough:

1. **General → External Device Manager → Anynet+ (HDMI-CEC)**: Must be ON
2. **General → External Device Manager → Device Connect Manager**: Must be ON  
3. **General → External Device Manager → Auto Run Smart Hub**: Should be OFF (prevents conflicts)
4. **Settings → General → External Device Manager → HDMI Hot Plug**: Should be ON

### Samsung CEC Behavior Notes
- Samsung TVs may require the TV to be fully powered on (not in transition state)
- Some Samsung models only send remote events to "active" CEC devices
- Frame TVs in "Art Mode" may behave differently than in TV mode

## Recommended Debug Steps

### 1. Check TV CEC Settings
Verify all Samsung CEC settings are properly configured on the TV itself.

### 2. Test with TV Fully On
Current status shows "In transition Standby to On" - try when TV is fully powered on.

### 3. Try Different CEC Device Types
Test configuring Pi as different device types:
```bash
cec-ctl -d /dev/cec0 --record    # Recording device
cec-ctl -d /dev/cec0 --tuner     # Tuner device  
cec-ctl -d /dev/cec0 --audio     # Audio system
```

### 4. Monitor Raw CEC Traffic
```bash
# Monitor low-level pin changes
sudo cec-ctl -d /dev/cec0 --monitor-pin

# Monitor with maximum verbosity
sudo cec-ctl -d /dev/cec0 --monitor-all --verbose --show-raw
```

### 5. Test Active Source Commands
Some Samsung TVs only send remote events to the "active source":
```bash
# Make Pi the active source
cec-ctl -d /dev/cec0 --active-source
```

## Next Steps
1. Verify Samsung TV CEC configuration
2. Test with TV fully powered on (not transitioning)
3. Try running monitoring as root to bypass permission issues
4. Test different CEC device type configurations
5. Use active source commands to ensure Pi receives remote events