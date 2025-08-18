# CEC Test Application for Raspberry Pi

This test application demonstrates HDMI-CEC control capabilities on Raspberry Pi, including TV power control and remote control event handling.

## Prerequisites

- Raspberry Pi with HDMI connection to TV
- CEC enabled on your TV (look for settings like HDMI-CEC, Anynet+, Bravia Link, Simplink, etc.)
- `cec-ctl` installed (comes with v4l-utils package)

## Installation

```bash
# Install v4l-utils if not already installed
sudo apt-get update
sudo apt-get install v4l-utils

# Clone or copy the test files to your Pi
cd /home/bower/projects/ManyPaintings/cec_test
```

## Files Included

- `cec_init.py` - Initialize CEC adapter (run this first!)
- `power_test.py` - Simple TV power control (on/off/status)
- `power_test_advanced.py` - Try multiple power control methods
- `remote_test.py` - Monitor TV remote control button presses
- `quick_test.py` - Quick CEC connectivity test
- `cec_test_app.py` - Interactive menu-driven test app

## Usage

### 1. Initialize CEC (Run First!)

```bash
python3 cec_init.py
```

This sets up the Raspberry Pi as a CEC playback device so the TV will recognize it.

### 2. Test TV Power Control

Simple power control:
```bash
python3 power_test.py status  # Check if TV is on/off
python3 power_test.py on      # Turn TV on
python3 power_test.py off     # Turn TV off (standby)
```

Advanced testing (tries multiple methods):
```bash
python3 power_test_advanced.py off   # Try all OFF methods
python3 power_test_advanced.py on    # Try all ON methods
python3 power_test_advanced.py info  # Get TV information
```

### 3. Test Remote Control Reception

```bash
python3 remote_test.py
```

Press buttons on your TV remote to see if the Pi receives them. Press Ctrl+C to stop.

### 4. Interactive Test Menu

```bash
python3 cec_test_app.py
```

Provides a menu-driven interface for all CEC functions.

## Troubleshooting

### TV Not Responding to Power Commands

1. **Check TV Settings**: Enable CEC in your TV settings (name varies by brand)
   - Samsung: Anynet+
   - LG: Simplink
   - Sony: Bravia Link
   - Philips: EasyLink
   - Generic: HDMI-CEC

2. **Try Different Device**: Your TV might be on `/dev/cec0` instead of `/dev/cec1`
   ```bash
   # Edit the scripts to use cec0 instead of cec1
   # Or pass device as parameter where supported
   ```

3. **Re-initialize CEC**: Run `python3 cec_init.py` again

4. **Check Physical Connection**: Ensure HDMI cable supports CEC (most do)

### Remote Control Not Working

1. TV must be set to the HDMI input connected to the Pi
2. Run `cec_init.py` first to register as a playback device
3. Some TVs only pass through certain buttons (arrows, OK, back)

### Commands Send But Nothing Happens

This usually means CEC messages are being sent but the TV isn't responding:
- TV CEC might be disabled
- TV might not support the specific CEC commands
- Try unplugging TV power for 30 seconds to reset CEC

## CEC Device Detection

To see which CEC device is connected to your TV:
```bash
# Check both devices
cec-ctl -d /dev/cec0 -S
cec-ctl -d /dev/cec1 -S
```

The one showing your TV's info is the correct device.

## Integration with ManyPaintings App

Once testing is successful, the CEC control can be integrated into the ManyPaintings Flask app to:
- Turn display on/off based on schedule
- Navigate galleries with TV remote
- Control playback with remote buttons

## Notes

- CEC behavior varies significantly between TV brands and models
- Not all TVs support all CEC commands
- Some TVs require specific initialization sequences
- Power on/off might only work from certain device types (playback, tuner, etc.)