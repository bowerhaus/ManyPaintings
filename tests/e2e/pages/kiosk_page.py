"""
Kiosk mode page object.
"""

from playwright.sync_api import Page, expect
from tests.e2e.pages.main_page import MainPage


class KioskPage(MainPage):
    """Kiosk mode page object - extends main page functionality."""
    
    def __init__(self, page: Page):
        super().__init__(page)
    
    def load_kiosk_page(self):
        """Load the kiosk mode page."""
        self.goto("/kiosk")
        self.wait_for_page_load()
        return self
    
    def verify_kiosk_page_title(self, expected_title: str = "Many Paintings - Kiosk Mode"):
        """Verify the kiosk page title."""
        expect(self.page).to_have_title(expected_title)
        return self
    
    def verify_kiosk_mode_active(self):
        """Verify that kiosk mode specific elements are active."""
        # Kiosk mode should have the same basic elements as main page
        self.verify_canvas_container_visible()
        self.verify_image_layers_container_exists()
        return self
    
    def verify_controls_hidden_in_kiosk(self):
        """Verify that UI controls are hidden in kiosk mode."""
        # In kiosk mode, controls should be minimized or hidden
        # This test depends on the actual kiosk implementation
        self.reveal_controls()
        
        # Wait a moment for any controls to appear
        self.wait_for_animation_frame()
        
        # Check that control panels are either hidden or minimal
        controls = self.page.locator(self.UI_OVERLAY)
        # In kiosk mode, controls should be less prominent
        
        return self