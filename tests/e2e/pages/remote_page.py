"""
Page object for iPhone Remote Control interface.
"""

from playwright.sync_api import Page, expect
from tests.e2e.pages.base_page import BasePage
import time


class RemotePage(BasePage):
    """Page object for iPhone Remote Control interface."""
    
    def __init__(self, page: Page):
        super().__init__(page)
        self.remote_url_path = "/remote"
        
        # Control selectors
        self.speed_slider = "#remote-speed-slider"
        self.speed_value = "#remote-speed-value"
        self.layers_slider = "#remote-layers-slider"
        self.layers_value = "#remote-layers-value"
        self.volume_slider = "#remote-volume-slider"
        self.volume_value = "#remote-volume-value"
        
        # Gallery Manager controls
        self.brightness_slider = "#remote-brightness-slider"
        self.brightness_value = "#remote-brightness-value"
        self.contrast_slider = "#remote-contrast-slider"
        self.contrast_value = "#remote-contrast-value"
        self.saturation_slider = "#remote-saturation-slider"
        self.saturation_value = "#remote-saturation-value"
        self.white_balance_slider = "#remote-white-balance-slider"
        self.white_balance_value = "#remote-white-balance-value"
        self.texture_slider = "#remote-texture-intensity-slider"
        self.texture_value = "#remote-texture-intensity-value"
        
        # Quick action buttons
        self.play_pause_btn = "#remote-play-pause-btn"
        self.new_pattern_btn = "#remote-new-pattern-btn"
        self.background_toggle_btn = "#remote-background-toggle-btn"
        self.save_favorite_btn = "#remote-favorite-btn"
        
        # Connection status
        self.connection_status = "#connection-status"
        self.connection_indicator = ".connection-indicator"
        self.connection_text = ".connection-text"
        
        # Favorites section
        self.favorites_gallery = "#remote-favorites-grid"
        self.favorites_empty = "#remote-favorites-empty"
        self.favorites_grid = ".remote-favorites-grid"
        self.favorite_items = ".favorite-item"
        self.favorite_delete_btns = ".remote-favorite-delete-btn"
        
        # Image Manager section
        self.image_manager_section = "#remote-upload-area"
        self.upload_btn = "#remote-upload-area"  # Upload area acts as button
        self.upload_input = "#remote-image-upload-input"
        self.images_grid = ".remote-images-grid"
        self.image_items = ".remote-image-item"
        self.image_delete_btns = ".remote-image-delete-btn"
        
        # Toast notifications
        self.toast_notifications = ".toast-notification"
        self.active_toasts = ".toast-notification.show"
    
    def load_remote_page(self):
        """Load the remote control page."""
        self.goto(self.remote_url_path)
        self.wait_for_page_load()
        return self
    
    def wait_for_remote_ready(self, timeout: int = 10000):
        """Wait for remote interface to be fully loaded and ready."""
        # Wait for main elements to be visible
        self.wait_for_element_visible("#remote-app", timeout)
        self.wait_for_element_visible(self.speed_slider, timeout)
        self.wait_for_element_visible(self.connection_status, timeout)
        
        # Wait for any initial network requests to complete
        self.wait_for_no_network_requests()
        return self
    
    def set_mobile_viewport(self):
        """Set mobile viewport for iPhone simulation."""
        self.page.set_viewport_size({"width": 375, "height": 667})  # iPhone SE size
        return self
    
    def verify_mobile_layout(self):
        """Verify that mobile layout is properly displayed."""
        # Check that remote app container is visible
        remote_app = self.wait_for_element_visible("#remote-app")
        expect(remote_app).to_have_class("remote-app")
        
        # Verify responsive design elements
        expect(self.page.locator("body.remote-control")).to_be_visible()
        return self
    
    def verify_connection_status(self, expected_status: str = "Connected"):
        """Verify connection status indicator."""
        status_element = self.wait_for_element_visible(self.connection_text)
        expect(status_element).to_contain_text(expected_status)
        return self
    
    # Control Interaction Methods
    
    def set_speed(self, value: int):
        """Set speed slider value (1-10)."""
        slider = self.wait_for_element_visible(self.speed_slider)
        slider.fill(str(value))
        # Wait for debounced update
        time.sleep(0.8)
        return self
    
    def get_speed_value(self) -> str:
        """Get current speed display value."""
        value_element = self.wait_for_element_visible(self.speed_value)
        return value_element.text_content()
    
    def set_layers(self, value: int):
        """Set layers slider value (1-8)."""
        slider = self.wait_for_element_visible(self.layers_slider)
        slider.fill(str(value))
        time.sleep(0.8)
        return self
    
    def get_layers_value(self) -> str:
        """Get current layers display value."""
        value_element = self.wait_for_element_visible(self.layers_value)
        return value_element.text_content()
    
    def set_volume(self, value: int):
        """Set volume slider value (0-100)."""
        slider = self.wait_for_element_visible(self.volume_slider)
        slider.fill(str(value))
        time.sleep(0.8)
        return self
    
    def get_volume_value(self) -> str:
        """Get current volume display value."""
        value_element = self.wait_for_element_visible(self.volume_value)
        return value_element.text_content()
    
    def set_brightness(self, value: int):
        """Set brightness slider value (25-115)."""
        slider = self.wait_for_element_visible(self.brightness_slider)
        slider.fill(str(value))
        time.sleep(0.8)
        return self
    
    def get_brightness_value(self) -> str:
        """Get current brightness display value."""
        value_element = self.wait_for_element_visible(self.brightness_value)
        return value_element.text_content()
    
    def set_contrast(self, value: int):
        """Set contrast slider value (85-115)."""
        slider = self.wait_for_element_visible(self.contrast_slider)
        slider.fill(str(value))
        time.sleep(0.8)
        return self
    
    def set_saturation(self, value: int):
        """Set saturation slider value (50-120)."""
        slider = self.wait_for_element_visible(self.saturation_slider)
        slider.fill(str(value))
        time.sleep(0.8)
        return self
    
    def set_white_balance(self, value: int):
        """Set white balance slider value (80-120)."""
        slider = self.wait_for_element_visible(self.white_balance_slider)
        slider.fill(str(value))
        time.sleep(0.8)
        return self
    
    def set_texture_intensity(self, value: int):
        """Set texture intensity slider value (0-100)."""
        slider = self.wait_for_element_visible(self.texture_slider)
        slider.fill(str(value))
        time.sleep(0.8)
        return self
    
    # Quick Action Methods
    
    def click_play_pause(self):
        """Click play/pause button."""
        btn = self.wait_for_element_visible(self.play_pause_btn)
        btn.click()
        return self
    
    def click_new_pattern(self):
        """Click new pattern button."""
        btn = self.wait_for_element_visible(self.new_pattern_btn)
        btn.click()
        return self
    
    def click_background_toggle(self):
        """Click background toggle button."""
        btn = self.wait_for_element_visible(self.background_toggle_btn)
        btn.click()
        return self
    
    def click_save_favorite(self):
        """Click save favorite button."""
        btn = self.wait_for_element_visible(self.save_favorite_btn)
        btn.click()
        return self
    
    # Favorites Methods
    
    def wait_for_favorites_loaded(self, timeout: int = 10000):
        """Wait for favorites gallery to load (either with content or empty state)."""
        # Wait for either the favorites grid or the empty state to be visible
        from playwright.sync_api import expect
        favorites_grid = self.page.locator(self.favorites_gallery)
        empty_state = self.page.locator(self.favorites_empty)
        
        # One of these should be visible when favorites are loaded
        try:
            expect(favorites_grid).to_be_visible(timeout=timeout)
        except:
            expect(empty_state).to_be_visible(timeout=timeout)
        
        return self
    
    def get_favorites_count(self) -> int:
        """Get number of favorites displayed."""
        favorites = self.page.locator(self.favorite_items)
        return favorites.count()
    
    def click_favorite_by_index(self, index: int):
        """Click a favorite by its index (0-based)."""
        favorites = self.page.locator(self.favorite_items)
        if index < favorites.count():
            favorites.nth(index).click()
        return self
    
    def delete_favorite_by_index(self, index: int):
        """Delete a favorite by its index (0-based)."""
        delete_btns = self.page.locator(self.favorite_delete_btns)
        if index < delete_btns.count():
            delete_btns.nth(index).click()
        return self
    
    def verify_favorites_empty_state(self):
        """Verify that favorites shows empty state."""
        empty_message = self.page.locator(self.favorites_empty)
        expect(empty_message).to_be_visible()
        return self
    
    # Image Manager Methods
    
    def wait_for_image_manager_loaded(self, timeout: int = 10000):
        """Wait for image manager section to load."""
        self.wait_for_element_visible(self.image_manager_section, timeout)
        return self
    
    def click_upload_button(self):
        """Click upload button to trigger file input."""
        btn = self.wait_for_element_visible(self.upload_btn)
        btn.click()
        return self
    
    def upload_files(self, file_paths: list):
        """Upload files using the file input."""
        file_input = self.page.locator(self.upload_input)
        file_input.set_input_files(file_paths)
        # Wait for upload to complete
        time.sleep(2)
        return self
    
    def get_images_count(self) -> int:
        """Get number of images displayed."""
        images = self.page.locator(self.image_items)
        return images.count()
    
    def delete_image_by_index(self, index: int):
        """Delete an image by its index (0-based)."""
        delete_btns = self.page.locator(self.image_delete_btns)
        if index < delete_btns.count():
            delete_btns.nth(index).click()
        return self
    
    def verify_images_empty_state(self):
        """Verify that image manager shows empty state."""
        empty_message = self.page.locator("#remote-images-empty")
        expect(empty_message).to_be_visible()
        return self
    
    # Toast Notification Methods
    
    def wait_for_toast(self, timeout: int = 5000):
        """Wait for a toast notification to appear."""
        self.wait_for_element_visible(self.active_toasts, timeout)
        return self
    
    def verify_toast_message(self, expected_text: str):
        """Verify toast notification contains expected text."""
        toast = self.wait_for_element_visible(self.active_toasts)
        expect(toast).to_contain_text(expected_text)
        return self
    
    def wait_for_toast_dismissed(self, timeout: int = 5000):
        """Wait for toast notifications to be dismissed."""
        # Wait for toasts to fade away
        time.sleep(3)
        active_toasts = self.page.locator(self.active_toasts)
        expect(active_toasts).to_have_count(0, timeout=timeout)
        return self
    
    def get_active_toast_count(self) -> int:
        """Get number of active toast notifications."""
        toasts = self.page.locator(self.active_toasts)
        return toasts.count()
    
    # Theme and Styling Methods
    
    def verify_dark_theme(self):
        """Verify dark theme is applied."""
        body = self.page.locator("body")
        expect(body).to_have_class("dark-theme")
        return self
    
    def verify_light_theme(self):
        """Verify light theme is applied."""
        body = self.page.locator("body")
        expect(body).not_to_have_class("dark-theme")
        return self
    
    def get_background_theme(self) -> str:
        """Get current background theme."""
        body = self.page.locator("body")
        if "dark-theme" in body.get_attribute("class") or "":
            return "dark"
        else:
            return "light"
    
    # Utility Methods
    
    def wait_for_settings_sync(self, delay: float = 3.0):
        """Wait for settings to sync with main display."""
        time.sleep(delay)  # Wait for polling cycle
        return self
    
    def simulate_network_delay(self, delay: float = 1.0):
        """Simulate network delay for testing."""
        time.sleep(delay)
        return self
    
    def capture_screenshot(self, name: str):
        """Capture screenshot for visual testing."""
        self.page.screenshot(path=f"test-results/remote/{name}.png")
        return self
    
    def verify_responsive_design(self):
        """Verify responsive design elements."""
        # Check that controls are properly sized for mobile
        sliders = self.page.locator(".control-slider")
        expect(sliders.first).to_be_visible()
        
        # Check that touch targets are appropriately sized
        buttons = self.page.locator(".action-btn")
        expect(buttons.first).to_be_visible()
        
        return self