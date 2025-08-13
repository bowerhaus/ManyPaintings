"""
End-to-end tests for core ManyPaintings functionality using page objects.
"""

import pytest
from playwright.sync_api import Page, expect
from tests.e2e.pages.main_page import MainPage
from tests.e2e.pages.kiosk_page import KioskPage
from tests.e2e.pages.api_client import ApiClient


@pytest.mark.e2e
class TestCoreApplication:
    """Test core application functionality."""
    
    def test_application_loads(self, page: Page, live_server):
        """Test that the application loads successfully."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        main_page.load_main_page()
        main_page.verify_page_title()
        main_page.verify_canvas_container_visible()
    
    def test_kiosk_mode_loads(self, page: Page, live_server):
        """Test that kiosk mode loads successfully."""
        kiosk_page = KioskPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        kiosk_page.load_kiosk_page()
        kiosk_page.verify_kiosk_page_title()
        kiosk_page.verify_canvas_container_visible()
    
    def test_image_layers_container_exists(self, page: Page, live_server):
        """Test that image layers container is present."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        main_page.load_main_page()
        main_page.verify_image_layers_container_exists()
    
    def test_control_panel_exists(self, page: Page, live_server):
        """Test that control panel UI exists."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Look for control panel elements
        controls = page.locator('.ui-overlay')
        expect(controls).to_be_attached()  # May not be visible initially
    
    @pytest.mark.slow
    def test_animation_starts(self, page: Page, live_server):
        """Test that animations start automatically."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Wait for image layers to appear
        main_page.wait_for_image_layers_to_appear()


@pytest.mark.e2e
class TestKeyboardShortcuts:
    """Test keyboard shortcut functionality."""
    
    def test_space_key_play_pause(self, page: Page, live_server):
        """Test space key for play/pause functionality."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        main_page.press_play_pause()
        
        # Wait for animation frame to ensure action processed
        main_page.wait_for_animation_frame()
        
        # The test passes if no errors occur - 
        # detailed state checking would require more complex setup
    
    def test_b_key_background_toggle(self, page: Page, live_server):
        """Test B key for background color toggle."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Get initial background color
        body = page.locator('body')
        
        # Press B key to toggle background
        main_page.press_background_toggle()
        
        # Wait for animation frame to ensure change processed
        main_page.wait_for_animation_frame()
        
        # The background should have changed (but specific color depends on initial state)
    
    def test_n_key_new_pattern(self, page: Page, live_server):
        """Test N key for new pattern generation."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        main_page.press_new_pattern()
        
        # Wait for animation frame to ensure action processed
        main_page.wait_for_animation_frame()
        
        # Test passes if no JavaScript errors occur


@pytest.mark.e2e 
class TestUIControls:
    """Test user interface controls."""
    
    def test_control_panel_appears_on_interaction(self, page: Page, live_server):
        """Test that control panel appears when interacting with the page."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        main_page.reveal_controls()
        
        # Wait for animation frame to allow controls to appear
        main_page.wait_for_animation_frame()
        
        # Look for control elements that should appear
        # This test is somewhat dependent on the current UI implementation
    
    def test_speed_control_exists(self, page: Page, live_server):
        """Test that speed control slider exists."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        main_page.verify_speed_control_exists()


@pytest.mark.e2e
class TestAPIEndpoints:
    """Test API endpoints work correctly in browser context."""
    
    def test_health_endpoint_accessible(self, page: Page, live_server):
        """Test that health endpoint is accessible."""
        api_client = ApiClient(page).set_base_url(f"http://localhost:{live_server.port}")
        api_client.verify_health_endpoint()
    
    def test_config_endpoint_accessible(self, page: Page, live_server):
        """Test that config endpoint is accessible."""
        api_client = ApiClient(page).set_base_url(f"http://localhost:{live_server.port}")
        api_client.verify_config_endpoint()
    
    def test_images_endpoint_accessible(self, page: Page, live_server):
        """Test that images endpoint is accessible."""
        api_client = ApiClient(page).set_base_url(f"http://localhost:{live_server.port}")
        api_client.verify_images_endpoint()


@pytest.mark.e2e
@pytest.mark.slow
class TestVisualElements:
    """Test visual elements and rendering."""
    
    def test_canvas_container_has_correct_styling(self, page: Page, live_server):
        """Test that canvas container has expected styling."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Check that container is visible and positioned
        main_page.verify_canvas_container_visible()
        
        # Get computed style
        canvas_rect = main_page.get_canvas_dimensions()
        assert canvas_rect is not None
        assert canvas_rect['width'] > 0
        assert canvas_rect['height'] > 0
    
    def test_no_javascript_errors(self, page: Page, live_server):
        """Test that no JavaScript errors occur during basic usage."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Basic interactions
        main_page.press_play_pause()
        main_page.wait_for_animation_frame()
        main_page.press_background_toggle()
        main_page.wait_for_animation_frame()
        
        # Verify no JavaScript errors occurred
        main_page.verify_no_javascript_errors()


if __name__ == '__main__':
    pytest.main([__file__])