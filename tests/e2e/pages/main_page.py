"""
Main application page object.
"""

from playwright.sync_api import Page, expect
from tests.e2e.pages.base_page import BasePage


class MainPage(BasePage):
    """Main application page object."""
    
    # Selectors
    CANVAS_CONTAINER = "#canvas-container"
    IMAGE_LAYERS = "#image-layers"
    IMAGE_LAYER = "#image-layers .image-layer"
    UI_OVERLAY = ".ui-overlay"
    CONTROL_PANEL = ".control-panel"
    SPEED_SLIDER = 'input[type="range"]'
    BODY = "body"
    
    # Button selectors - based on actual HTML IDs
    HEART_BUTTON = '#favorites-btn, button[title*="favorite"], button[aria-label*="favorite"]'
    GALLERY_BUTTON = '#favorites-gallery-btn'
    IMAGE_MANAGER_BUTTON = '#image-manager-btn'
    GALLERY_MANAGER_BUTTON = '#gallery-manager-btn'
    
    # Notification selectors
    TOAST_NOTIFICATION = ".toast, .notification, .success-message"
    
    def __init__(self, page: Page):
        super().__init__(page)
    
    def load_main_page(self):
        """Load the main application page."""
        self.goto("/")
        self.wait_for_page_load()
        return self
    
    def wait_for_application_ready(self, timeout: int = 15000):
        """Wait for the application to be fully loaded and ready."""
        # Wait for essential elements
        self.wait_for_element_visible(self.CANVAS_CONTAINER, timeout)
        self.wait_for_element_attached(self.IMAGE_LAYERS, timeout)
        
        # Wait for JavaScript modules to load and initialize
        self.page.wait_for_function(
            "() => window.APP_CONFIG && document.readyState === 'complete'",
            timeout=timeout
        )
        
        # Wait for at least one animation frame to allow initialization
        self.wait_for_animation_frame()
        
        return self
    
    def verify_page_title(self, expected_title: str = "Many Paintings - Generative Art"):
        """Verify the page title."""
        expect(self.page).to_have_title(expected_title)
        return self
    
    def verify_canvas_container_visible(self):
        """Verify the canvas container is visible."""
        canvas_container = self.page.locator(self.CANVAS_CONTAINER)
        expect(canvas_container).to_be_visible()
        return self
    
    def verify_image_layers_container_exists(self):
        """Verify the image layers container exists."""
        image_layers = self.page.locator(self.IMAGE_LAYERS)
        expect(image_layers).to_be_visible()
        return self
    
    def wait_for_image_layers_to_appear(self, timeout: int = 15000):
        """Wait for at least one image layer to appear."""
        try:
            first_layer = self.page.locator(self.IMAGE_LAYER).first
            expect(first_layer).to_be_attached(timeout=timeout)
        except Exception:
            # If no layers appear, wait for the application to at least be responsive
            self.page.wait_for_function(
                "() => window.APP_CONFIG !== undefined",
                timeout=5000
            )
            # Give it a bit more time for potential layers
            self.wait_for_animation_frame()
        return self
    
    def reveal_controls(self):
        """Move mouse to reveal control panels."""
        # Move mouse to bottom area where controls typically appear
        viewport = self.page.viewport_size
        self.page.mouse.move(viewport["width"] // 2, viewport["height"] - 100)
        
        # Wait for controls to potentially appear
        self.wait_for_animation_frame()
        return self
    
    # Keyboard shortcuts
    def press_play_pause(self):
        """Press space key for play/pause."""
        self.press_key("Space")
        return self
    
    def press_background_toggle(self):
        """Press B key to toggle background color."""
        self.press_key("b")
        return self
    
    def press_new_pattern(self):
        """Press N key to generate new pattern."""
        self.press_key("n")
        return self
    
    def press_save_favorite(self):
        """Press F key to save favorite."""
        self.press_key("f")
        return self
    
    def press_open_gallery(self):
        """Press V key to open gallery."""
        self.press_key("v")
        return self
    
    def press_image_manager(self):
        """Press I key to open image manager."""
        self.press_key("i")
        return self
    
    def press_gallery_manager(self):
        """Press C key to open gallery manager."""
        self.press_key("c")
        return self
    
    def press_toggle_grid(self):
        """Press G key to toggle debug grid."""
        self.press_key("g")
        return self
    
    def press_escape(self):
        """Press Escape key."""
        self.press_key("Escape")
        return self
    
    # Button interactions
    def click_heart_button(self):
        """Click the heart/favorites button."""
        self.reveal_controls()
        heart_btn = self.page.locator(self.HEART_BUTTON).first
        if heart_btn.count() > 0:
            heart_btn.click()
        return self
    
    def click_gallery_button(self):
        """Click the gallery button."""
        self.reveal_controls()
        # Wait for the gallery button to be visible
        gallery_btn = self.wait_for_element_visible(self.GALLERY_BUTTON)
        gallery_btn.click()
        return self
    
    def click_image_manager_button(self):
        """Click the image manager button."""
        self.reveal_controls()
        img_mgr_btn = self.page.locator(self.IMAGE_MANAGER_BUTTON).first
        if img_mgr_btn.count() > 0:
            img_mgr_btn.click()
        return self
    
    def click_gallery_manager_button(self):
        """Click the gallery manager button."""
        self.reveal_controls()
        gal_mgr_btn = self.page.locator(self.GALLERY_MANAGER_BUTTON).first
        if gal_mgr_btn.count() > 0:
            gal_mgr_btn.click()
        return self
    
    # Validation helpers
    def wait_for_toast_notification(self, timeout: int = 5000):
        """Wait for a toast notification to appear."""
        toast = self.page.locator(self.TOAST_NOTIFICATION)
        if toast.count() > 0:
            expect(toast.first).to_be_visible(timeout=timeout)
        return self
    
    def verify_no_javascript_errors(self, collect_timeout: int = 3000):
        """Verify no JavaScript errors occurred."""
        error_messages = []
        
        def handle_console(msg):
            if msg.type == 'error':
                error_messages.append(msg.text)
        
        self.page.on('console', handle_console)
        
        # Wait for potential errors
        self.page.wait_for_timeout(collect_timeout)
        
        # Check for critical errors
        critical_errors = [msg for msg in error_messages if 'error' in msg.lower()]
        assert len(critical_errors) == 0, f"JavaScript errors occurred: {critical_errors}"
        
        return self
    
    def get_canvas_dimensions(self):
        """Get canvas container dimensions."""
        canvas = self.page.locator(self.CANVAS_CONTAINER)
        return canvas.bounding_box()
    
    def verify_speed_control_exists(self):
        """Verify that speed control slider exists."""
        self.reveal_controls()
        speed_slider = self.page.locator(self.SPEED_SLIDER).first
        expect(speed_slider).to_be_attached(timeout=5000)
        return self