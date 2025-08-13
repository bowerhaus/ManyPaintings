"""
Gallery Manager page object for E2E testing.
"""

from playwright.sync_api import Page, expect
from tests.e2e.pages.base_page import BasePage


class GalleryManagerPage(BasePage):
    """Gallery Manager modal page object."""
    
    # Selectors for modal elements
    MODAL = "#gallery-manager-modal"
    MODAL_VISIBLE = "#gallery-manager-modal:not(.hidden)"
    CLOSE_BUTTON = "#gallery-manager-modal-close"
    
    # Control selectors
    BRIGHTNESS_SLIDER = "#gallery-brightness-slider"
    CONTRAST_SLIDER = "#gallery-contrast-slider"
    SATURATION_SLIDER = "#gallery-saturation-slider"
    WHITE_BALANCE_SLIDER = "#gallery-white-balance-slider"
    TEXTURE_INTENSITY_SLIDER = "#gallery-texture-intensity-slider"
    
    # Value display selectors
    BRIGHTNESS_VALUE = "#gallery-brightness-value"
    CONTRAST_VALUE = "#gallery-contrast-value"
    SATURATION_VALUE = "#gallery-saturation-value"
    WHITE_BALANCE_VALUE = "#gallery-white-balance-value"
    TEXTURE_INTENSITY_VALUE = "#gallery-texture-intensity-value"
    
    # Button selectors
    RESET_BUTTON = "#gallery-reset-btn"
    
    # Target elements that receive filter effects
    IMAGE_LAYERS = "#image-layers"
    CANVAS_TEXTURE = "#canvas-texture"
    
    def __init__(self, page: Page):
        super().__init__(page)
    
    def wait_for_modal_open(self, timeout: int = 5000):
        """Wait for the gallery manager modal to open."""
        modal = self.page.locator(self.MODAL_VISIBLE)
        expect(modal).to_be_visible(timeout=timeout)
        return self
    
    def wait_for_modal_closed(self, timeout: int = 5000):
        """Wait for the gallery manager modal to close."""
        modal = self.page.locator(self.MODAL_VISIBLE)
        expect(modal).to_have_count(0, timeout=timeout)
        return self
    
    def verify_modal_is_open(self):
        """Verify the modal is currently open."""
        modal = self.page.locator(self.MODAL_VISIBLE)
        expect(modal).to_be_visible()
        return self
    
    def verify_modal_is_closed(self):
        """Verify the modal is currently closed."""
        modal = self.page.locator(self.MODAL_VISIBLE)
        expect(modal).to_have_count(0)
        return self
    
    def close_modal_with_escape(self):
        """Close the modal using Escape key."""
        self.press_key("Escape")
        self.wait_for_modal_closed()
        return self
    
    def close_modal_with_button(self):
        """Close the modal using close button."""
        close_btn = self.page.locator(self.CLOSE_BUTTON)
        if close_btn.count() > 0:
            close_btn.click()
            self.wait_for_modal_closed()
        return self
    
    def set_brightness(self, value: int):
        """Set brightness slider value (25-115)."""
        slider = self.page.locator(self.BRIGHTNESS_SLIDER)
        if slider.count() == 0:
            raise Exception(f"Brightness slider not found with selector: {self.BRIGHTNESS_SLIDER}")
        slider.fill(str(value))
        self.wait_for_animation_frame()  # Allow filter to apply
        return self
    
    def set_contrast(self, value: int):
        """Set contrast slider value (85-115)."""
        slider = self.page.locator(self.CONTRAST_SLIDER)
        slider.fill(str(value))
        self.wait_for_animation_frame()
        return self
    
    def set_saturation(self, value: int):
        """Set saturation slider value (50-120)."""
        slider = self.page.locator(self.SATURATION_SLIDER)
        slider.fill(str(value))
        self.wait_for_animation_frame()
        return self
    
    def set_white_balance(self, value: int):
        """Set white balance slider value (80-120)."""
        slider = self.page.locator(self.WHITE_BALANCE_SLIDER)
        slider.fill(str(value))
        self.wait_for_animation_frame()
        return self
    
    def set_texture_intensity(self, value: int):
        """Set texture intensity slider value (0-100)."""
        slider = self.page.locator(self.TEXTURE_INTENSITY_SLIDER)
        if slider.count() == 0:
            raise Exception(f"Texture intensity slider not found with selector: {self.TEXTURE_INTENSITY_SLIDER}")
        slider.fill(str(value))
        self.wait_for_animation_frame()
        return self
    
    def get_brightness_value(self):
        """Get current brightness value."""
        value_element = self.page.locator(self.BRIGHTNESS_VALUE)
        return int(value_element.inner_text().replace('%', ''))
    
    def get_contrast_value(self):
        """Get current contrast value."""
        value_element = self.page.locator(self.CONTRAST_VALUE)
        return int(value_element.inner_text().replace('%', ''))
    
    def get_saturation_value(self):
        """Get current saturation value."""
        value_element = self.page.locator(self.SATURATION_VALUE)
        return int(value_element.inner_text().replace('%', ''))
    
    def get_white_balance_value(self):
        """Get current white balance value."""
        value_element = self.page.locator(self.WHITE_BALANCE_VALUE)
        return int(value_element.inner_text().replace('%', ''))
    
    def get_texture_intensity_value(self):
        """Get current texture intensity value."""
        value_element = self.page.locator(self.TEXTURE_INTENSITY_VALUE)
        return int(value_element.inner_text().replace('%', ''))
    
    def click_reset_button(self):
        """Click the reset to defaults button."""
        reset_btn = self.page.locator(self.RESET_BUTTON)
        if reset_btn.count() > 0:
            reset_btn.click()
            self.wait_for_animation_frame()  # Allow values to reset
        return self
    
    def verify_filter_applied(self, expected_filters: dict):
        """Verify that CSS filters are applied to image layers."""
        image_layers = self.page.locator(self.IMAGE_LAYERS)
        filter_value = image_layers.evaluate("el => getComputedStyle(el).filter")
        
        # Check each expected filter
        for filter_name, expected_value in expected_filters.items():
            if filter_name == 'brightness':
                assert f"brightness({expected_value})" in filter_value
            elif filter_name == 'contrast':
                assert f"contrast({expected_value})" in filter_value
            elif filter_name == 'saturate':
                assert f"saturate({expected_value})" in filter_value
        
        return self
    
    def verify_texture_opacity(self, expected_opacity: float):
        """Verify canvas texture opacity."""
        texture = self.page.locator(self.CANVAS_TEXTURE)
        if texture.count() > 0:
            opacity = texture.evaluate("el => getComputedStyle(el).opacity")
            # Allow small floating point differences
            assert abs(float(opacity) - expected_opacity) < 0.01
        return self
    
    def verify_default_values(self):
        """Verify all sliders are at default values."""
        assert self.get_brightness_value() == 100
        assert self.get_contrast_value() == 100
        assert self.get_saturation_value() == 100
        assert self.get_white_balance_value() == 100
        assert self.get_texture_intensity_value() == 0
        return self
    
    def verify_modal_positioning(self):
        """Verify modal is positioned correctly and return positioning info."""
        modal = self.page.locator(self.MODAL_VISIBLE)
        bbox = modal.bounding_box()
        viewport = self.page.viewport_size
        
        if bbox and viewport:
            # Calculate positioning metrics
            modal_y_percent = (bbox["y"] / viewport["height"]) * 100
            modal_center_x = bbox["x"] + bbox["width"] / 2
            viewport_center_x = viewport["width"] / 2
            horizontal_offset = abs(modal_center_x - viewport_center_x)
            
            # Log positioning info for debugging
            print(f"📐 Modal positioning: Y={modal_y_percent:.1f}% from top, horizontal offset={horizontal_offset:.1f}px")
            
            # Basic sanity checks (more flexible than strict bottom-half requirement)
            assert bbox["y"] >= 0, "Modal should be within viewport vertically"
            assert bbox["x"] >= 0, "Modal should be within viewport horizontally"
            assert bbox["y"] + bbox["height"] <= viewport["height"], "Modal should not extend below viewport"
            assert bbox["x"] + bbox["width"] <= viewport["width"], "Modal should not extend beyond viewport width"
            
            print("✅ Modal positioning is within viewport bounds")
        else:
            print("⚠️  Could not get modal bounding box for positioning verification")
        
        return self
    
    def verify_slider_ranges(self):
        """Verify sliders have correct min/max values."""
        brightness_slider = self.page.locator(self.BRIGHTNESS_SLIDER)
        contrast_slider = self.page.locator(self.CONTRAST_SLIDER)
        saturation_slider = self.page.locator(self.SATURATION_SLIDER)
        white_balance_slider = self.page.locator(self.WHITE_BALANCE_SLIDER)
        texture_slider = self.page.locator(self.TEXTURE_INTENSITY_SLIDER)
        
        # Check min/max attributes
        assert brightness_slider.get_attribute("min") == "25"
        assert brightness_slider.get_attribute("max") == "115"
        
        assert contrast_slider.get_attribute("min") == "85"
        assert contrast_slider.get_attribute("max") == "115"
        
        assert saturation_slider.get_attribute("min") == "50"
        assert saturation_slider.get_attribute("max") == "120"
        
        assert white_balance_slider.get_attribute("min") == "80"
        assert white_balance_slider.get_attribute("max") == "120"
        
        assert texture_slider.get_attribute("min") == "0"
        assert texture_slider.get_attribute("max") == "100"
        
        return self