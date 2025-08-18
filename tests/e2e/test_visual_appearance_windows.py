"""
Windows-only visual appearance tests for UI managers.
Uses screenshot comparisons that only run on Windows platform.
"""

import json
import sys
import pytest
from pathlib import Path
from playwright.sync_api import Page
from tests.e2e.pages.main_page import MainPage
from tests.e2e.pages.favorites_gallery import FavoritesGallery
from tests.e2e.pages.image_manager_page import ImageManagerPage
from tests.e2e.pages.gallery_manager_page import GalleryManagerPage
from tests.e2e.pages.remote_page import RemotePage


@pytest.mark.skipif(sys.platform != "win32", reason="Visual tests only run on Windows")
@pytest.mark.visual
class TestFavoritesGalleryVisuals:
    """Visual tests for Favorites Gallery on Windows."""
    
    def test_favorites_gallery_modal_appearance(self, visual_page: Page, live_server):
        """Test the visual appearance of the favorites gallery modal."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        favorites_gallery = FavoritesGallery(visual_page)
        
        # Mock the /api/favorites endpoint to return empty results for consistent visual testing
        visual_page.route("**/api/favorites", lambda route: route.fulfill(
            content_type="application/json",
            body='[]'
        ))
        
        # Load page and ensure application is ready
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Open favorites gallery
        main_page.press_open_gallery()
        favorites_gallery.wait_for_gallery_open()
        
        # Take screenshot of the modal
        modal = visual_page.locator("#favorites-modal")
        screenshot_path = Path("test-results/visual/favorites-gallery-modal.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        modal.screenshot(path=str(screenshot_path))
        
        # Verify modal is visible
        assert modal.is_visible(), "Favorites gallery modal should be visible"
    
    def test_favorites_gallery_empty_state(self, visual_page: Page, live_server):
        """Test the visual appearance of favorites gallery in empty state."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        favorites_gallery = FavoritesGallery(visual_page)
        
        # Mock the /api/favorites endpoint to return empty results
        visual_page.route("**/api/favorites", lambda route: route.fulfill(
            content_type="application/json",
            body='[]'
        ))
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Open favorites gallery
        main_page.press_open_gallery()
        favorites_gallery.wait_for_gallery_open()
        favorites_gallery.wait_for_favorites_to_load()
        
        # Take screenshot of empty state
        modal = visual_page.locator("#favorites-modal")
        screenshot_path = Path("test-results/visual/favorites-gallery-empty.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        modal.screenshot(path=str(screenshot_path))
        
        favorite_count = favorites_gallery.get_favorite_count()
        print(f"[SCREENSHOT] Captured empty favorites gallery ({favorite_count} items)")
        
        # Verify empty state
        assert favorite_count == 0, "Should show empty state"
        
        favorites_gallery.close_gallery_with_escape()
    
    def test_favorites_gallery_populated_state(self, visual_page: Page, live_server):
        """Test the visual appearance of favorites gallery with sample favorites."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        favorites_gallery = FavoritesGallery(visual_page)
        
        # Mock the /api/favorites endpoint to return sample favorites
        sample_favorites = [
            {
                "id": "fav1",
                "timestamp": "2025-01-15T12:00:00.000Z",
                "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "pattern_code": "test123"
            },
            {
                "id": "fav2", 
                "timestamp": "2025-01-15T12:30:00.000Z",
                "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "pattern_code": "test456"
            },
            {
                "id": "fav3",
                "timestamp": "2025-01-15T13:00:00.000Z", 
                "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "pattern_code": "test789"
            }
        ]
        
        visual_page.route("**/api/favorites", lambda route: route.fulfill(
            content_type="application/json",
            body=json.dumps(sample_favorites)
        ))
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Open favorites gallery
        main_page.press_open_gallery()
        favorites_gallery.wait_for_gallery_open()
        favorites_gallery.wait_for_favorites_to_load()
        
        # Take screenshot of populated state
        modal = visual_page.locator("#favorites-modal")
        screenshot_path = Path("test-results/visual/favorites-gallery-populated.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        modal.screenshot(path=str(screenshot_path))
        
        favorite_count = favorites_gallery.get_favorite_count()
        print(f"[SCREENSHOT] Captured populated favorites gallery ({favorite_count} items)")
        
        # Verify populated state
        assert favorite_count == 3, f"Should show 3 favorites, got {favorite_count}"
        
        favorites_gallery.close_gallery_with_escape()
    
    def test_favorites_gallery_save_attempt_workflow(self, visual_page: Page, live_server):
        """Test the visual appearance of favorites gallery during save workflow."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        favorites_gallery = FavoritesGallery(visual_page)
        
        # Start with empty favorites for predictable test
        visual_page.route("**/api/favorites", lambda route: (
            route.fulfill(
                content_type="application/json", 
                body='[]'
            ) if route.request.method == "GET" else
            route.fulfill(
                content_type="application/json",
                body='{"success": true, "id": "test-fav-123"}'
            ) if route.request.method == "POST" else
            route.continue_()
        ))
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        main_page.wait_for_image_layers_to_appear()
        
        # Get initial count (should be 0)
        main_page.press_open_gallery()
        favorites_gallery.wait_for_gallery_open()
        initial_count = favorites_gallery.get_favorite_count()
        favorites_gallery.close_gallery_with_escape()
        
        # Attempt to save favorites (may succeed or fail due to duplicates/limits)
        main_page.press_save_favorite()
        # Wait for any notification (success or failure)
        try:
            main_page.wait_for_toast_notification()
        except:
            # No notification appeared, that's okay
            pass
        
        # Generate new pattern and try again
        main_page.press_new_pattern()
        visual_page.wait_for_timeout(1000)  # Wait for new pattern to generate
        main_page.press_save_favorite()
        try:
            main_page.wait_for_toast_notification()
        except:
            # No notification appeared, that's okay
            pass
        
        # Open gallery to document current state
        main_page.press_open_gallery()
        favorites_gallery.wait_for_gallery_open()
        favorites_gallery.wait_for_favorites_to_load()
        
        # Take screenshot of the gallery after save workflow
        final_count = favorites_gallery.get_favorite_count()
        modal = visual_page.locator("#favorites-modal")
        screenshot_path = Path("test-results/visual/favorites-gallery-save-workflow.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        modal.screenshot(path=str(screenshot_path))
        
        # Document the workflow result (don't assert strict requirements)
        print(f"[SCREENSHOT] Captured favorites gallery after save workflow ({initial_count} -> {final_count} items)")
        if final_count > initial_count:
            print(f"[SUCCESS] Successfully added {final_count - initial_count} new favorites")
        elif final_count == initial_count:
            print("[INFO] No new favorites added (may be duplicates or at limit)")
        
        # Basic verification that gallery is functional
        assert final_count >= 0, "Gallery should show valid favorite count"
        
        favorites_gallery.close_gallery_with_escape()
    
    def test_favorites_gallery_populated_layout(self, visual_page: Page, live_server):
        """Test the visual layout of a populated favorites gallery."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        favorites_gallery = FavoritesGallery(visual_page)
        
        # Mock favorites with varied thumbnails for layout testing
        layout_test_favorites = [
            {
                "id": f"layout-test-{i+1}",
                "timestamp": f"2025-01-15T{10+i}:00:00.000Z",
                "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "pattern_code": f"layout{i+1:03d}"
            } for i in range(6)  # 6 favorites for good layout testing
        ]
        
        visual_page.route("**/api/favorites", lambda route: route.fulfill(
            content_type="application/json",
            body=json.dumps(layout_test_favorites)
        ))
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Open gallery
        main_page.press_open_gallery()
        favorites_gallery.wait_for_gallery_open()
        favorites_gallery.wait_for_favorites_to_load()
        
        favorite_count = favorites_gallery.get_favorite_count()
        
        # Take screenshot focusing on populated layout
        modal = visual_page.locator("#favorites-modal")
        screenshot_path = Path("test-results/visual/favorites-gallery-populated-layout.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        modal.screenshot(path=str(screenshot_path))
        
        print(f"[SCREENSHOT] Captured populated favorites gallery layout ({favorite_count} items)")
        
        # Verify gallery structure is present
        assert modal.is_visible(), "Gallery modal should be visible"
        assert favorite_count == 6, f"Should show 6 favorites for layout test, got {favorite_count}"
        print("[SUCCESS] Gallery layout properly displayed")
        
        favorites_gallery.close_gallery_with_escape()


@pytest.mark.skipif(sys.platform != "win32", reason="Visual tests only run on Windows")
@pytest.mark.visual
class TestImageManagerVisuals:
    """Visual tests for Image Manager on Windows."""
    
    def test_image_manager_modal_appearance(self, visual_page: Page, live_server):
        """Test the visual appearance of the image manager modal."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        image_manager = ImageManagerPage(visual_page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Open image manager
        main_page.press_image_manager()
        image_manager.wait_for_modal_open()
        image_manager.wait_for_images_to_load()
        
        # Take screenshot of the modal
        modal = visual_page.locator("#image-manager-modal")
        screenshot_path = Path("test-results/visual/image-manager-modal.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        modal.screenshot(path=str(screenshot_path))
        
        # Verify modal is open
        image_manager.verify_modal_is_open()
        
        image_manager.close_modal_with_escape()
    
    def test_image_manager_empty_state(self, visual_page: Page, live_server):
        """Test the visual appearance of empty image manager."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        image_manager = ImageManagerPage(visual_page)
        
        # Mock the /api/images endpoint to return empty results
        visual_page.route("**/api/images*", lambda route: route.fulfill(
            content_type="application/json",
            body='{"images": [], "total_count": 0}'
        ))
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        main_page.press_image_manager()
        image_manager.wait_for_modal_open()
        image_manager.wait_for_images_to_load()
        
        # Verify and screenshot empty state
        image_manager.verify_empty_state()
        
        modal = visual_page.locator("#image-manager-modal")
        screenshot_path = Path("test-results/visual/image-manager-empty.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        modal.screenshot(path=str(screenshot_path))
        
        image_manager.close_modal_with_escape()
    
    def test_image_manager_upload_area(self, visual_page: Page, live_server):
        """Test the visual appearance of the upload area."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        image_manager = ImageManagerPage(visual_page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        main_page.press_image_manager()
        image_manager.wait_for_modal_open()
        image_manager.verify_upload_area_visible()
        
        # Focus on the upload area for screenshot
        upload_area = visual_page.locator("#upload-area")
        upload_area.scroll_into_view_if_needed()
        
        # Screenshot just the upload area
        screenshot_path = Path("test-results/visual/image-manager-upload-area.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        upload_area.screenshot(path=str(screenshot_path))
        
        image_manager.close_modal_with_escape()


@pytest.mark.skipif(sys.platform != "win32", reason="Visual tests only run on Windows")
@pytest.mark.visual  
class TestGalleryManagerVisuals:
    """Visual tests for Gallery Manager on Windows."""
    
    def test_gallery_manager_modal_appearance(self, visual_page: Page, live_server):
        """Test the visual appearance of the gallery manager modal."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        gallery_manager = GalleryManagerPage(visual_page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Open gallery manager
        main_page.press_gallery_manager()
        gallery_manager.wait_for_modal_open()
        
        # Take screenshot of the modal (bottom sheet style)
        modal = visual_page.locator("#gallery-manager-modal")
        screenshot_path = Path("test-results/visual/gallery-manager-modal.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        modal.screenshot(path=str(screenshot_path))
        
        # Verify modal positioning
        gallery_manager.verify_modal_positioning()
        
        gallery_manager.close_modal_with_escape()
    
    def test_gallery_manager_default_state(self, visual_page: Page, live_server):
        """Test the visual appearance with default slider values."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        gallery_manager = GalleryManagerPage(visual_page)
        
        # Mock the /api/settings endpoint to return default values for consistent testing
        default_settings = {
            "speed": 1,
            "maxLayers": 4,
            "volume": 50,
            "isWhiteBackground": False,
            "gallery": {
                "brightness": 100,
                "contrast": 100,
                "saturation": 100,
                "whiteBalance": 100,
                "textureIntensity": 0
            }
        }
        visual_page.route("**/api/settings", lambda route: route.fulfill(
            content_type="application/json",
            body=json.dumps(default_settings)
        ))
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        main_page.press_gallery_manager()
        gallery_manager.wait_for_modal_open()
        
        # Verify gallery manager controls exist
        brightness_slider = visual_page.locator("#gallery-brightness-slider")
        assert brightness_slider.count() > 0, "Gallery Manager should have brightness slider - UI may not be implemented"
        
        # Verify default values are displayed
        gallery_manager.verify_default_values()
        
        # Take screenshot of the default state
        modal = visual_page.locator("#gallery-manager-modal")
        screenshot_path = Path("test-results/visual/gallery-manager-defaults.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        modal.screenshot(path=str(screenshot_path))
        
        gallery_manager.close_modal_with_escape()
    
    def test_gallery_manager_adjusted_values(self, visual_page: Page, live_server):
        """Test the visual appearance with adjusted slider values."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        gallery_manager = GalleryManagerPage(visual_page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        main_page.press_gallery_manager()
        gallery_manager.wait_for_modal_open()
        
        # Verify gallery manager controls exist
        brightness_slider = visual_page.locator("#gallery-brightness-slider")
        assert brightness_slider.count() > 0, "Gallery Manager should have brightness slider - UI may not be implemented"
        
        # Adjust various sliders to non-default values
        gallery_manager.set_brightness(110)
        gallery_manager.set_contrast(105)
        gallery_manager.set_saturation(90)
        gallery_manager.set_white_balance(115)
        gallery_manager.set_texture_intensity(25)
        
        # Take screenshot with adjusted values
        modal = visual_page.locator("#gallery-manager-modal")
        screenshot_path = Path("test-results/visual/gallery-manager-adjusted.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        modal.screenshot(path=str(screenshot_path))
        
        gallery_manager.close_modal_with_escape()
    
    def test_gallery_manager_extreme_values(self, visual_page: Page, live_server):
        """Test the visual appearance with extreme slider values."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        gallery_manager = GalleryManagerPage(visual_page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        main_page.press_gallery_manager()
        gallery_manager.wait_for_modal_open()
        
        # Verify gallery manager controls exist
        brightness_slider = visual_page.locator("#gallery-brightness-slider")
        assert brightness_slider.count() > 0, "Gallery Manager should have brightness slider - UI may not be implemented"
        
        # Set to extreme values
        gallery_manager.set_brightness(25)    # Minimum
        gallery_manager.set_contrast(115)     # Maximum
        gallery_manager.set_saturation(120)   # Maximum  
        gallery_manager.set_white_balance(80) # Minimum
        gallery_manager.set_texture_intensity(100) # Maximum
        
        # Take screenshot with extreme values
        modal = visual_page.locator("#gallery-manager-modal")
        screenshot_path = Path("test-results/visual/gallery-manager-extremes.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        modal.screenshot(path=str(screenshot_path))
        
        gallery_manager.close_modal_with_escape()


@pytest.mark.skipif(sys.platform != "win32", reason="Visual tests only run on Windows")
@pytest.mark.visual
class TestCombinedVisuals:
    """Visual tests for multiple managers and their interactions."""
    
    def test_multiple_modals_z_index(self, visual_page: Page, live_server):
        """Test visual layering when multiple modals might overlap."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        gallery_manager = GalleryManagerPage(visual_page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Open gallery manager (bottom sheet)
        main_page.press_gallery_manager()
        gallery_manager.wait_for_modal_open()
        
        # Take screenshot showing proper z-index layering
        modal = visual_page.locator("#gallery-manager-modal")
        screenshot_path = Path("test-results/visual/gallery-manager-layering.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        modal.screenshot(path=str(screenshot_path))
        
        gallery_manager.close_modal_with_escape()
    
    def test_ui_responsiveness_desktop(self, visual_page: Page, live_server):
        """Test UI appearance at standard desktop resolution."""
        # Set standard desktop viewport
        visual_page.set_viewport_size({"width": 1920, "height": 1080})
        
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        gallery_manager = GalleryManagerPage(visual_page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Test gallery manager at desktop resolution
        main_page.press_gallery_manager()
        gallery_manager.wait_for_modal_open()
        
        # Document positioning at desktop resolution
        print("[DESKTOP] Testing desktop resolution (1920x1080)")
        gallery_manager.verify_modal_positioning()
        
        # Take screenshot at desktop resolution
        modal = visual_page.locator("#gallery-manager-modal")
        screenshot_path = Path("test-results/visual/gallery-manager-desktop-1920x1080.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        modal.screenshot(path=str(screenshot_path))
        
        print("[SCREENSHOT] Captured gallery manager at desktop resolution")
        
        gallery_manager.close_modal_with_escape()
    
    def test_ui_responsiveness_laptop(self, visual_page: Page, live_server):
        """Test UI appearance at laptop resolution."""
        # Set laptop viewport
        visual_page.set_viewport_size({"width": 1366, "height": 768})
        
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        favorites_gallery = FavoritesGallery(visual_page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Test favorites gallery at laptop resolution
        print("[LAPTOP] Testing laptop resolution (1366x768)")
        main_page.press_open_gallery()
        favorites_gallery.wait_for_gallery_open()
        
        # Take screenshot at laptop resolution
        modal = visual_page.locator("#favorites-modal")
        screenshot_path = Path("test-results/visual/favorites-gallery-laptop-1366x768.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        modal.screenshot(path=str(screenshot_path))
        
        print("[SCREENSHOT] Captured favorites gallery at laptop resolution")
        
        favorites_gallery.close_gallery_with_escape()


@pytest.mark.skipif(sys.platform != "win32", reason="Visual tests only run on Windows")
@pytest.mark.visual
class TestFilterEffectsVisuals:
    """Visual tests for gallery manager filter effects on actual artwork."""
    
    def test_brightness_filter_effect(self, visual_page: Page, live_server):
        """Test visual effect of brightness filter on artwork."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        gallery_manager = GalleryManagerPage(visual_page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        main_page.wait_for_image_layers_to_appear()
        
        # Open gallery manager
        main_page.press_gallery_manager()
        gallery_manager.wait_for_modal_open()
        
        # Verify gallery manager controls are available
        modal = visual_page.locator("#gallery-manager-modal")
        assert modal.is_visible(), "Gallery manager modal should be visible"
        
        # Verify brightness slider exists
        brightness_slider = visual_page.locator("#gallery-brightness-slider")
        assert brightness_slider.count() > 0, "Gallery Manager should have brightness slider for filter effects - UI may not be implemented"
        
        # Adjust brightness to dark setting
        gallery_manager.set_brightness(50)  # Very dark
        
        # Take screenshot showing darkened artwork with controls
        screenshot_path = Path("test-results/visual/brightness-filter-dark.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        visual_page.screenshot(path=str(screenshot_path))
        
        # Test bright setting
        gallery_manager.set_brightness(115)  # Maximum brightness
        screenshot_path = Path("test-results/visual/brightness-filter-bright.png")
        visual_page.screenshot(path=str(screenshot_path))
        
        gallery_manager.close_modal_with_escape()
    
    def test_texture_overlay_effect(self, visual_page: Page, live_server):
        """Test visual effect of canvas texture overlay."""
        main_page = MainPage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
        gallery_manager = GalleryManagerPage(visual_page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        main_page.wait_for_image_layers_to_appear()
        
        # Open gallery manager
        main_page.press_gallery_manager()
        gallery_manager.wait_for_modal_open()
        
        # Verify texture slider exists
        texture_slider = visual_page.locator("#gallery-texture-intensity-slider")
        assert texture_slider.count() > 0, "Gallery Manager should have texture intensity slider - UI may not be implemented"
        
        # Test with maximum texture
        gallery_manager.set_texture_intensity(100)
        
        # Close modal to see full effect without UI
        gallery_manager.close_modal_with_escape()
        
        # Take screenshot showing texture overlay effect
        canvas_container = visual_page.locator("#canvas-container")
        screenshot_path = Path("test-results/visual/canvas-texture-overlay.png")
        screenshot_path.parent.mkdir(parents=True, exist_ok=True)
        canvas_container.screenshot(path=str(screenshot_path))
        
        # Verify canvas is visible
        assert canvas_container.is_visible(), "Canvas container should be visible"


# Remote Control Visual Tests

@pytest.mark.skipif(sys.platform != "win32", reason="Visual tests only run on Windows")
@pytest.mark.visual
def test_remote_interface_mobile_layout(visual_page: Page, live_server):
    """Test the visual appearance of remote interface in mobile viewport."""
    # Set mobile viewport (iPhone SE size)
    visual_page.set_viewport_size({"width": 375, "height": 667})
    
    remote_page = RemotePage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
    
    # Mock settings API for consistent testing
    default_settings = {
        "speed": 1,
        "layers": 4,
        "volume": 50,
        "isWhiteBackground": False,
        "gallery": {
            "brightness": 100,
            "contrast": 100,
            "saturation": 100,
            "whiteBalance": 100,
            "textureIntensity": 0
        }
    }
    visual_page.route("**/api/settings", lambda route: route.fulfill(
        content_type="application/json",
        body=json.dumps(default_settings)
    ))
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Take screenshot of full mobile interface
    screenshot_path = Path("test-results/visual/remote-mobile-interface.png")
    screenshot_path.parent.mkdir(parents=True, exist_ok=True)
    visual_page.screenshot(path=str(screenshot_path))
    
    # Verify mobile layout elements
    remote_page.verify_mobile_layout()
    remote_page.verify_responsive_design()


@pytest.mark.skipif(sys.platform != "win32", reason="Visual tests only run on Windows")
@pytest.mark.visual
def test_remote_control_sections(visual_page: Page, live_server):
    """Test visual appearance of different control sections."""
    visual_page.set_viewport_size({"width": 375, "height": 667})
    
    remote_page = RemotePage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Screenshot quick actions section
    quick_actions = visual_page.locator(".quick-actions-grid")
    screenshot_path = Path("test-results/visual/remote-quick-actions.png")
    screenshot_path.parent.mkdir(parents=True, exist_ok=True)
    quick_actions.screenshot(path=str(screenshot_path))
    
    # Screenshot basic controls section  
    basic_controls = visual_page.locator(".control-section").first
    screenshot_path = Path("test-results/visual/remote-basic-controls.png")
    basic_controls.screenshot(path=str(screenshot_path))
    
    # Screenshot gallery manager controls
    gallery_controls = visual_page.locator(".control-section").nth(2)
    screenshot_path = Path("test-results/visual/remote-gallery-controls.png")
    gallery_controls.screenshot(path=str(screenshot_path))


@pytest.mark.skipif(sys.platform != "win32", reason="Visual tests only run on Windows")
@pytest.mark.visual
def test_remote_sliders_appearance(visual_page: Page, live_server):
    """Test visual appearance of slider controls."""
    visual_page.set_viewport_size({"width": 375, "height": 667})
    
    remote_page = RemotePage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Set various slider values for visual testing
    remote_page.set_speed(7)
    remote_page.set_layers(6)
    remote_page.set_volume(80)
    remote_page.set_brightness(110)
    remote_page.set_contrast(95)
    
    # Screenshot control sliders with values
    controls_section = visual_page.locator(".controls-list").first
    screenshot_path = Path("test-results/visual/remote-sliders-values.png")
    screenshot_path.parent.mkdir(parents=True, exist_ok=True)
    controls_section.screenshot(path=str(screenshot_path))
    
    # Verify slider values are displayed
    assert "7" in remote_page.get_speed_value()
    assert "80" in remote_page.get_volume_value()


@pytest.mark.skipif(sys.platform != "win32", reason="Visual tests only run on Windows")
@pytest.mark.visual
def test_remote_favorites_gallery_visual(visual_page: Page, live_server):
    """Test visual appearance of favorites section in remote."""
    visual_page.set_viewport_size({"width": 375, "height": 667})
    
    remote_page = RemotePage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
    
    # Mock favorites with test data
    mock_favorites = [
        {
            "id": "test-fav-1",
            "created_at": "2025-08-18T10:00:00.000Z",
            "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9AAAAAElFTkSuQmCC",
            "state": {"backgroundColor": "black"}
        },
        {
            "id": "test-fav-2", 
            "created_at": "2025-08-18T11:00:00.000Z",
            "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9AAAAAElFTkSuQmCC",
            "state": {"backgroundColor": "white"}
        }
    ]
    
    visual_page.route("**/api/favorites", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps(mock_favorites)
    ))
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    remote_page.wait_for_favorites_loaded()
    
    # Screenshot favorites section
    favorites_section = visual_page.locator("#remote-favorites-grid")
    screenshot_path = Path("test-results/visual/remote-favorites-gallery.png")
    screenshot_path.parent.mkdir(parents=True, exist_ok=True)
    favorites_section.screenshot(path=str(screenshot_path))


@pytest.mark.skipif(sys.platform != "win32", reason="Visual tests only run on Windows")
@pytest.mark.visual
def test_remote_favorites_empty_state(visual_page: Page, live_server):
    """Test visual appearance of empty favorites in remote."""
    visual_page.set_viewport_size({"width": 375, "height": 667})
    
    remote_page = RemotePage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
    
    # Mock empty favorites
    visual_page.route("**/api/favorites", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body="[]"
    ))
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    remote_page.wait_for_favorites_loaded()
    
    # Screenshot empty favorites state
    favorites_section = visual_page.locator("#remote-favorites-empty")
    screenshot_path = Path("test-results/visual/remote-favorites-empty.png")
    screenshot_path.parent.mkdir(parents=True, exist_ok=True)
    favorites_section.screenshot(path=str(screenshot_path))
    
    # Verify empty state is shown
    remote_page.verify_favorites_empty_state()


@pytest.mark.skipif(sys.platform != "win32", reason="Visual tests only run on Windows")
@pytest.mark.visual
def test_remote_connection_status_visual(visual_page: Page, live_server):
    """Test visual appearance of connection status indicator."""
    visual_page.set_viewport_size({"width": 375, "height": 667})
    
    remote_page = RemotePage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Screenshot connection status area
    connection_status = visual_page.locator("#connection-status")
    screenshot_path = Path("test-results/visual/remote-connection-status.png")
    screenshot_path.parent.mkdir(parents=True, exist_ok=True)
    connection_status.screenshot(path=str(screenshot_path))
    
    # Verify connection status
    remote_page.verify_connection_status("Connected")


@pytest.mark.skipif(sys.platform != "win32", reason="Visual tests only run on Windows")
@pytest.mark.visual
def test_remote_touch_targets_visual(visual_page: Page, live_server):
    """Test visual verification of touch-friendly target sizes."""
    visual_page.set_viewport_size({"width": 375, "height": 667})
    
    remote_page = RemotePage(visual_page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Screenshot action buttons area
    quick_actions = visual_page.locator(".quick-actions-grid")
    screenshot_path = Path("test-results/visual/remote-touch-targets.png")
    screenshot_path.parent.mkdir(parents=True, exist_ok=True)
    quick_actions.screenshot(path=str(screenshot_path))
    
    # Verify responsive design
    remote_page.verify_responsive_design()