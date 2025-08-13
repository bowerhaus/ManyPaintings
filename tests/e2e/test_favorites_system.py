"""
End-to-end tests for the favorites system using page objects.
"""

import pytest
from playwright.sync_api import Page, expect
from tests.e2e.pages.main_page import MainPage
from tests.e2e.pages.favorites_gallery import FavoritesGallery
from tests.e2e.pages.api_client import ApiClient


@pytest.mark.e2e
class TestFavoritesSaving:
    """Test saving favorites functionality."""
    
    def test_save_favorite_with_f_key(self, page: Page, live_server):
        """Test saving a favorite using F key."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Wait for initial animations to start
        main_page.wait_for_image_layers_to_appear()
        
        # Press F key to save favorite
        main_page.press_save_favorite()
        
        # Look for success toast notification
        main_page.wait_for_toast_notification()
    
    def test_save_favorite_with_heart_button(self, page: Page, live_server):
        """Test saving a favorite using heart button."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Wait for initial animations
        main_page.wait_for_image_layers_to_appear()
        
        # Click heart button to save favorite
        main_page.click_heart_button()
        
        # Look for success feedback
        main_page.wait_for_toast_notification()


@pytest.mark.e2e
class TestFavoritesGallery:
    """Test favorites gallery functionality."""
    
    def test_open_gallery_with_v_key(self, page: Page, live_server):
        """Test opening favorites gallery with V key."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        gallery = FavoritesGallery(page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Press V key to open gallery
        main_page.press_open_gallery()
        
        # Verify gallery opens
        gallery.wait_for_gallery_open()
    
    def test_open_gallery_with_button(self, page: Page, live_server):
        """Test opening favorites gallery with gallery button."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        gallery = FavoritesGallery(page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Click gallery button
        main_page.click_gallery_button()
        
        # Verify gallery opens
        gallery.wait_for_gallery_open()
    
    def test_close_gallery_with_escape(self, page: Page, live_server):
        """Test closing gallery with Escape key."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        gallery = FavoritesGallery(page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        
        # Open gallery first
        main_page.press_open_gallery()
        gallery.wait_for_gallery_open()
        
        # Close with Escape
        gallery.close_gallery_with_escape()


@pytest.mark.e2e 
@pytest.mark.slow
class TestFavoritesWorkflow:
    """Test complete favorites workflow."""
    
    def test_save_and_load_favorite(self, page: Page, live_server):
        """Test saving a favorite and then loading it."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        gallery = FavoritesGallery(page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        main_page.wait_for_image_layers_to_appear()
        
        # Save a favorite
        main_page.press_save_favorite()
        main_page.wait_for_animation_frame()  # Allow save to process
        
        # Open gallery
        main_page.press_open_gallery()
        gallery.wait_for_gallery_open()
        gallery.wait_for_favorites_to_load()
        
        # Click on first favorite if it exists
        if gallery.get_favorite_count() > 0:
            gallery.click_first_favorite()
            # Gallery should close after clicking
            gallery.verify_gallery_is_closed()
    
    def test_favorites_api_integration(self, page: Page, live_server):
        """Test that favorites API endpoints work correctly."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        api_client = ApiClient(page).set_base_url(f"http://localhost:{live_server.port}")
        
        # Test GET favorites endpoint
        api_client.verify_favorites_endpoint()
        
        # Get initial favorites count
        initial_count = api_client.get_initial_favorites_count()
        
        # Load page and save a favorite
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        main_page.wait_for_image_layers_to_appear()
        main_page.press_save_favorite()
        
        # Wait for save to complete
        main_page.wait_for_animation_frame()
        
        # Check if favorites count increased
        api_client.verify_favorites_count_increased(initial_count)


@pytest.mark.e2e
class TestFavoritesPersistence:
    """Test favorites data persistence."""
    
    def test_favorites_persist_across_sessions(self, page: Page, live_server):
        """Test that favorites persist when reloading the page."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        
        # Load page and save a favorite
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        main_page.wait_for_image_layers_to_appear()
        
        # Save a favorite
        main_page.press_save_favorite()
        main_page.wait_for_animation_frame()
        
        # Open gallery to verify favorite was saved
        main_page.press_open_gallery()
        gallery = FavoritesGallery(page)
        gallery.wait_for_gallery_open()
        
        # Check if any favorites exist
        favorites_count = gallery.get_favorite_count()
        
        # Close gallery and reload page
        gallery.close_gallery_with_escape()
        page.reload()
        main_page.wait_for_page_load()
        main_page.wait_for_application_ready()
        
        # Open gallery again to check persistence
        main_page.press_open_gallery()
        gallery.wait_for_gallery_open()
        
        # Favorites should still exist after reload
        new_favorites_count = gallery.get_favorite_count()
        assert new_favorites_count >= favorites_count, "Favorites should persist across sessions"
    
    def test_favorites_thumbnails_display(self, page: Page, live_server):
        """Test that favorites thumbnails display correctly in gallery."""
        main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
        gallery = FavoritesGallery(page)
        
        main_page.load_main_page()
        main_page.wait_for_application_ready()
        main_page.wait_for_image_layers_to_appear()
        
        # Save a favorite
        main_page.press_save_favorite()
        main_page.wait_for_animation_frame()
        
        # Open gallery
        main_page.press_open_gallery()
        gallery.wait_for_gallery_open()
        gallery.wait_for_favorites_to_load()
        
        # Verify thumbnails display correctly
        gallery.verify_thumbnails_displayed()


if __name__ == '__main__':
    pytest.main([__file__])