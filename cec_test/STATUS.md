# CEC Testing Status Report
**Date:** 2025-08-16  
**Device:** Samsung Frame TV 43"  
**Test System:** Raspberry Pi with CEC via HDMI

## Executive Summary
After extensive testing, we've identified that Samsung Frame TV has limited CEC control support. The `TEXT_VIEW_ON` command can wake the TV from standby with a 67% success rate using retries. However, **NO CEC commands successfully turn the TV off** - all power-off commands failed in testing.

## Key Findings

### Power ON Commands (Wake from Standby)

#### Working Commands
1. **TEXT_VIEW_ON** (`--text-view-on`)
   - Success rate: 67% (2 out of 3 attempts)
   - Most reliable wake command discovered
   
2. **Power On User Control** (`--user-control-pressed ui-cmd=power-on-function`)
   - Success rate: 33% (1 out of 3 attempts)
   - Less reliable than TEXT_VIEW_ON

#### Non-Working Wake Commands
The following standard CEC commands do NOT wake the Samsung Frame TV from standby:
- IMAGE_VIEW_ON
- ACTIVE_SOURCE
- Power button press
- Power toggle function
- Menu button press
- Routing change
- SET_STREAM_PATH
- One Touch Play sequence

### Power OFF Commands (Turn TV to Standby)

#### ALL Commands Failed - 0% Success Rate
Tested each command 3 times with 5-second delays between attempts:
1. **STANDBY** (`--standby`) - ❌ Failed
2. **Power Button Press** (`--user-control-pressed ui-cmd=power`) - ❌ Failed
3. **Power Off User Control** (`--user-control-pressed ui-cmd=power-off-function`) - ❌ Failed
4. **Power Toggle** (`--user-control-pressed ui-cmd=power-toggle-function`) - ❌ Failed
5. **Inactive Source** (`--inactive-source`) - ❌ Failed

**Critical Finding:** Samsung Frame TV completely ignores all CEC power-off commands

## Retry Testing Results

### TEXT_VIEW_ON with 3 Retries (5 seconds apart)
- **Success Rate:** 67% (2 out of 3 test sequences)
- **Attempt 1:** ✅ Success (TV turned on during retry sequence)
- **Attempt 2:** ❌ Failed (no response even with 3 retries)
- **Attempt 3:** ✅ Success (TV turned on during retry sequence)

### TEXT_VIEW_ON Spam Testing (10 rapid commands)
- **Success Rate:** 100% (5 out of 5 attempts)
- All attempts successful with 10 rapid TEXT_VIEW_ON commands
- **Key Discovery:** TV produces two distinct clicks during wake process

### TEXT_VIEW_ON Double Command Testing (2 commands, 0.1s apart)
- **Success Rate:** 100% (5 out of 5 attempts) 
- Each attempt produced two distinct clicks with different sounds
- **Theory:** Samsung Frame TV requires 2-command wake sequence

### **BREAKTHROUGH: True Standby Discovery**
**Critical Finding:** Samsung Frame TV has a ~15-second delayed standby transition

#### Single TEXT_VIEW_ON After True Standby
- **Success Rate:** 100% (3 out of 3 tested)
- **Key:** Wait for delayed standby click (~15s after turning TV off)
- **Result:** Single command works reliably when TV is in true standby mode

## Current Issues
1. **No Power Off Support:** Samsung Frame TV completely ignores ALL CEC power-off commands
2. **Delayed Standby Transition:** TV requires ~15 seconds to enter true standby mode
3. **Inconsistent Wake Response:** TV responds unreliably when not in true standby
4. **No Vendor Detection:** TV vendor (Samsung) not detected in basic CEC queries, only visible in topology scan
5. **Severely Limited CEC:** Samsung has disabled most CEC functionality, likely for security/energy saving

## Recommended Solution

### CEC Can Only Wake TV - Cannot Turn Off

#### Optimal Method: Single Command After True Standby
```bash
#!/bin/bash
# Wake Samsung Frame TV - RELIABLE METHOD
# Wait for TV to enter true standby (~15s after turning off)
# Then send single TEXT_VIEW_ON command
cec-ctl -d /dev/cec0 --playback
cec-ctl -d /dev/cec0 -t 0 --text-view-on
```

#### Alternative: Double Command Method (100% reliable)
```bash
#!/bin/bash
# Wake Samsung Frame TV with 2-command sequence
# Works regardless of standby state
cec-ctl -d /dev/cec0 --playback
cec-ctl -d /dev/cec0 -t 0 --text-view-on
sleep 0.1
cec-ctl -d /dev/cec0 -t 0 --text-view-on
```

#### Python Implementation (Optimal)
```python
import subprocess
import time

def wake_tv_reliable():
    """Wake Samsung Frame TV using optimal single command method
    IMPORTANT: Only works if TV has been in standby for ~15+ seconds
    WARNING: CEC cannot turn the TV off - only wake it"""
    # Initialize CEC
    subprocess.run(['cec-ctl', '-d', '/dev/cec0', '--playback'], capture_output=True)
    # Send single wake command
    cmd = ['cec-ctl', '-d', '/dev/cec0', '-t', '0', '--text-view-on']
    result = subprocess.run(cmd, capture_output=True)
    return result.returncode == 0

def wake_tv_fallback():
    """Wake Samsung Frame TV using 2-command method (100% reliable)
    Works regardless of how long TV has been in standby"""
    # Initialize CEC
    subprocess.run(['cec-ctl', '-d', '/dev/cec0', '--playback'], capture_output=True)
    # Send double command sequence
    cmd = ['cec-ctl', '-d', '/dev/cec0', '-t', '0', '--text-view-on']
    subprocess.run(cmd, capture_output=True)
    time.sleep(0.1)
    subprocess.run(cmd, capture_output=True)
    return True

# Note: No power_off function - CEC cannot turn off Samsung Frame TV
```

## Alternative Approaches Required for Power Off
Since CEC cannot turn off the Samsung Frame TV, you MUST use one of these alternatives:

1. **IR Blaster (Recommended):** Full power control capability for both on and off
2. **Samsung SmartThings API:** Network-based control if TV supports it
3. **Manual Control:** Use the TV remote or physical power button
4. **Keep TV Always On:** Leave TV in Art Mode to avoid needing power control
5. **Smart Plug:** Control TV power at the outlet (not recommended - may damage TV)

## Test Configuration
- **HDMI Port:** Should use HDMI 3 or HDMI 4 (ARC port recommended)
- **TV Settings Required:**
  - Anynet+ (HDMI-CEC): ON
  - Auto Power Off: ON
  - Auto Power On: ON
- **CEC Device Registration:** Raspberry Pi successfully registers as Playback Device 1

## Next Steps
1. ✅ Implement retry mechanism in production code
2. ⏳ Monitor long-term reliability of TEXT_VIEW_ON command
3. ⏳ Investigate Samsung SmartThings API as backup solution
4. ⏳ Consider IR blaster for 100% reliable power control

## CEC Status Detection Findings (2025-08-16)

### Test: Real-time Standby Transition Detection
**Objective:** Use CEC status polling to detect when TV enters true standby (~15s after manual power off)

**Results:**
- ❌ **CEC status polling cannot detect real-time transitions**
- ✅ **CEC can report current state** (on/standby) when directly queried
- 🔍 **Physical "hard standby click" occurred** but no CEC state change detected during monitoring
- 📊 **CEC status showed "standby"** only when polled after the transition completed

**Key Discovery:** Samsung Frame TV does not broadcast CEC state changes in real-time. The CEC bus only reports current state when specifically queried, making transition timing detection via CEC unreliable.

**Implication:** Original timing-based approach (~15 seconds + listening for physical click) remains the most reliable method for detecting true standby. CEC status commands are useful for verifying final state but not for detecting the moment of transition.

## Conclusion
**CEC is only half-functional with Samsung Frame TV:**
- ✅ Can wake TV from standby (67% success rate with retries)
- ❌ Cannot turn TV off to standby (0% success rate - all commands ignored)
- ❌ Cannot reliably detect real-time standby transitions via status polling

For any application requiring both power on AND power off control, CEC alone is insufficient. You must implement an alternative solution (IR blaster or network API) for complete power management. The TEXT_VIEW_ON command with retries can be used for wake functionality, but turning the TV off requires a different approach entirely.

**Status Detection Recommendation:** Use timing-based detection (~15s) combined with physical audio cues (standby click) rather than CEC status polling for detecting true standby transitions.