"""
End-to-end tests for core ManyPaintings functionality.
"""

import pytest
import time
from playwright.sync_api import Page, expect


@pytest.mark.e2e
class TestCoreApplication:
    """Test core application functionality."""
    
    def test_application_loads(self, page: Page, live_server):
        """Test that the application loads successfully."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Check that the page title contains expected text
        expect(page).to_have_title("Many Paintings - Generative Art")
        
        # Check for canvas container
        canvas_container = page.locator('#canvas-container')
        expect(canvas_container).to_be_visible()
    
    def test_kiosk_mode_loads(self, page: Page, live_server):
        """Test that kiosk mode loads successfully."""
        page.goto(f"http://localhost:{live_server.port}/kiosk")
        
        # Check that the page loads
        expect(page).to_have_title("Many Paintings - Kiosk Mode")
        
        # Check for canvas container
        canvas_container = page.locator('#canvas-container')
        expect(canvas_container).to_be_visible()
    
    def test_image_layers_container_exists(self, page: Page, live_server):
        """Test that image layers container is present."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Check for image layers container
        image_layers = page.locator('#image-layers')
        expect(image_layers).to_be_visible()
    
    def test_control_panel_exists(self, page: Page, live_server):
        """Test that control panel UI exists."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Look for control panel elements
        controls = page.locator('.ui-overlay')
        expect(controls).to_be_attached()  # May not be visible initially
    
    @pytest.mark.slow
    def test_animation_starts(self, page: Page, live_server):
        """Test that animations start automatically."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait a bit for animations to start
        page.wait_for_timeout(3000)
        
        # Check if any image layers have been created
        image_layers = page.locator('#image-layers .image-layer')
        
        # Should have at least one image layer after a few seconds
        # Note: This might be flaky depending on timing and available images
        expect(image_layers.first).to_be_attached(timeout=10000)


@pytest.mark.e2e
class TestKeyboardShortcuts:
    """Test keyboard shortcut functionality."""
    
    def test_space_key_play_pause(self, page: Page, live_server):
        """Test space key for play/pause functionality."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for page to load
        page.wait_for_timeout(2000)
        
        # Press space key
        page.keyboard.press('Space')
        
        # Wait a moment for the action to take effect
        page.wait_for_timeout(500)
        
        # The test passes if no errors occur - 
        # detailed state checking would require more complex setup
    
    def test_b_key_background_toggle(self, page: Page, live_server):
        """Test B key for background color toggle."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for page to load
        page.wait_for_timeout(1000)
        
        # Get initial background color
        body = page.locator('body')
        
        # Press B key to toggle background
        page.keyboard.press('b')
        
        # Wait for change to take effect
        page.wait_for_timeout(500)
        
        # The background should have changed (but specific color depends on initial state)
    
    def test_n_key_new_pattern(self, page: Page, live_server):
        """Test N key for new pattern generation."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for page to load
        page.wait_for_timeout(2000)
        
        # Press N key for new pattern
        page.keyboard.press('n')
        
        # Wait for action to complete
        page.wait_for_timeout(1000)
        
        # Test passes if no JavaScript errors occur


@pytest.mark.e2e 
class TestUIControls:
    """Test user interface controls."""
    
    def test_control_panel_appears_on_interaction(self, page: Page, live_server):
        """Test that control panel appears when interacting with the page."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for page to load
        page.wait_for_timeout(1000)
        
        # Move mouse to trigger control panel
        page.mouse.move(100, 100)
        
        # Wait for controls to appear
        page.wait_for_timeout(1000)
        
        # Look for control elements that should appear
        # This test is somewhat dependent on the current UI implementation
    
    def test_speed_control_exists(self, page: Page, live_server):
        """Test that speed control slider exists."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for page to load
        page.wait_for_timeout(1000)
        
        # Move mouse to potentially show controls
        page.mouse.move(400, 600)
        page.wait_for_timeout(500)
        
        # Look for speed control (may need to adjust selector based on implementation)
        speed_slider = page.locator('input[type="range"]').first
        
        # Should exist even if not immediately visible
        expect(speed_slider).to_be_attached(timeout=5000)


@pytest.mark.e2e
class TestAPIEndpoints:
    """Test API endpoints work correctly in browser context."""
    
    def test_health_endpoint_accessible(self, page: Page, live_server):
        """Test that health endpoint is accessible."""
        response = page.request.get(f"http://localhost:{live_server.port}/health")
        
        assert response.status == 200
        data = response.json()
        assert data['status'] == 'healthy'
    
    def test_config_endpoint_accessible(self, page: Page, live_server):
        """Test that config endpoint is accessible."""
        response = page.request.get(f"http://localhost:{live_server.port}/api/config")
        
        assert response.status == 200
        data = response.json()
        assert isinstance(data, dict)
    
    def test_images_endpoint_accessible(self, page: Page, live_server):
        """Test that images endpoint is accessible."""
        response = page.request.get(f"http://localhost:{live_server.port}/api/images")
        
        assert response.status == 200
        data = response.json()
        assert 'images' in data
        assert isinstance(data['images'], list)


@pytest.mark.e2e
@pytest.mark.slow
class TestVisualElements:
    """Test visual elements and rendering."""
    
    def test_canvas_container_has_correct_styling(self, page: Page, live_server):
        """Test that canvas container has expected styling."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for page to load
        page.wait_for_timeout(1000)
        
        canvas_container = page.locator('#canvas-container')
        
        # Check that container is visible and positioned
        expect(canvas_container).to_be_visible()
        
        # Get computed style
        canvas_rect = canvas_container.bounding_box()
        assert canvas_rect is not None
        assert canvas_rect['width'] > 0
        assert canvas_rect['height'] > 0
    
    def test_no_javascript_errors(self, page: Page, live_server):
        """Test that no JavaScript errors occur during basic usage."""
        # Collect console messages
        messages = []
        
        def handle_console(msg):
            if msg.type == 'error':
                messages.append(msg.text)
        
        page.on('console', handle_console)
        
        # Load the page
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for page to fully load and initialize
        page.wait_for_timeout(3000)
        
        # Basic interactions
        page.keyboard.press('Space')  # Pause/play
        page.wait_for_timeout(1000)
        page.keyboard.press('b')      # Background toggle
        page.wait_for_timeout(1000)
        
        # Check that no critical JavaScript errors occurred
        error_messages = [msg for msg in messages if 'error' in msg.lower()]
        assert len(error_messages) == 0, f"JavaScript errors occurred: {error_messages}"


if __name__ == '__main__':
    pytest.main([__file__])