#!/usr/bin/env python3
"""
Example integration for ManyPaintings app
Shows how to use Samsung CEC remote control for gallery navigation
"""

from cec_control import SamsungCECControl

def handle_navigation(button, event):
    """Handle remote control navigation for ManyPaintings
    
    Args:
        button: 'OK', 'BACK', 'UP', 'DOWN', 'LEFT', 'RIGHT'
        event: 'PRESSED' or 'RELEASED'
    """
    # Only respond to button presses, not releases
    if event != 'PRESSED':
        return
    
    print(f"🎨 ManyPaintings Navigation: {button}")
    
    # Map buttons to gallery actions
    if button == 'OK':
        print("   → Action: Save current painting as favorite")
        # In real app: trigger favorites save
        
    elif button == 'BACK':
        print("   → Action: Return to previous view / Exit gallery")
        # In real app: navigate back or exit
        
    elif button == 'UP':
        print("   → Action: Previous favorite")
        # In real app: previous item in gallery
        
    elif button == 'DOWN':
        print("   → Action: Next favorite")
        # In real app: next item in gallery
        
    elif button == 'LEFT':
        print("   → Action: Decrease speed/brightness")
        # In real app: adjust settings
        
    elif button == 'RIGHT':
        print("   → Action: Increase speed/brightness")
        # In real app: adjust settings

def main():
    """Example main function for ManyPaintings integration"""
    print("🎨 ManyPaintings Samsung TV Remote Integration")
    print("=" * 50)
    print("Remote Control Mapping:")
    print("  OK     → Save current painting as favorite")
    print("  BACK   → Return/Exit")
    print("  UP     → Previous favorite")
    print("  DOWN   → Next favorite")
    print("  LEFT   → Decrease setting")
    print("  RIGHT  → Increase setting")
    print("=" * 50)
    
    # Initialize CEC control
    cec = SamsungCECControl()
    
    # Start monitoring navigation buttons
    try:
        cec.start_navigation_monitoring(handle_navigation)
    except KeyboardInterrupt:
        print("\n🎨 ManyPaintings remote control stopped")

if __name__ == "__main__":
    main()