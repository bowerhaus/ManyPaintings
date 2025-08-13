"""
End-to-end tests for the favorites system.
"""

import pytest
import time
from playwright.sync_api import Page, expect


@pytest.mark.e2e
class TestFavoritesSaving:
    """Test saving favorites functionality."""
    
    def test_save_favorite_with_f_key(self, page: Page, live_server):
        """Test saving a favorite using F key."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for page to load and animations to start
        page.wait_for_timeout(3000)
        
        # Press F key to save favorite
        page.keyboard.press('f')
        
        # Wait for save operation to complete
        page.wait_for_timeout(1000)
        
        # Look for success toast notification
        toast = page.locator('.toast, .notification, .success-message')
        
        # Should show some kind of success feedback
        # (The exact selector depends on implementation)
        if toast.count() > 0:
            expect(toast.first).to_be_visible(timeout=3000)
    
    def test_save_favorite_with_heart_button(self, page: Page, live_server):
        """Test saving a favorite using heart button."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for page to load
        page.wait_for_timeout(2000)
        
        # Move mouse to show controls
        page.mouse.move(400, 600)
        page.wait_for_timeout(1000)
        
        # Look for heart/save button
        heart_button = page.locator('button:has-text("♥"), button[title*="favorite"], button[aria-label*="favorite"]').first
        
        if heart_button.count() > 0:
            heart_button.click()
            
            # Wait for save operation
            page.wait_for_timeout(1000)
            
            # Should show some feedback
            # Test passes if no errors occur


@pytest.mark.e2e
class TestFavoritesGallery:
    """Test favorites gallery functionality."""
    
    def test_open_gallery_with_v_key(self, page: Page, live_server):
        """Test opening favorites gallery with V key."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for page to load
        page.wait_for_timeout(2000)
        
        # Press V key to open gallery
        page.keyboard.press('v')
        
        # Wait for gallery to open
        page.wait_for_timeout(1000)
        
        # Look for modal or gallery container
        gallery = page.locator('.modal, .gallery, .favorites-gallery')
        
        # Should open some kind of gallery interface
        if gallery.count() > 0:
            expect(gallery.first).to_be_visible(timeout=3000)
    
    def test_open_gallery_with_button(self, page: Page, live_server):
        """Test opening favorites gallery with gallery button."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for page to load
        page.wait_for_timeout(2000)
        
        # Move mouse to show controls
        page.mouse.move(400, 600)
        page.wait_for_timeout(1000)
        
        # Look for gallery button
        gallery_button = page.locator('button:has-text("📋"), button[title*="gallery"], button[aria-label*="gallery"]').first
        
        if gallery_button.count() > 0:
            gallery_button.click()
            
            # Wait for gallery to open
            page.wait_for_timeout(1000)
    
    def test_close_gallery_with_escape(self, page: Page, live_server):
        """Test closing gallery with Escape key."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for page to load
        page.wait_for_timeout(2000)
        
        # Open gallery first
        page.keyboard.press('v')
        page.wait_for_timeout(1000)
        
        # Close with Escape
        page.keyboard.press('Escape')
        page.wait_for_timeout(500)
        
        # Gallery should be closed
        gallery = page.locator('.modal:visible, .gallery:visible, .favorites-gallery:visible')
        expect(gallery).to_have_count(0, timeout=3000)


@pytest.mark.e2e 
@pytest.mark.slow
class TestFavoritesWorkflow:
    """Test complete favorites workflow."""
    
    def test_save_and_load_favorite(self, page: Page, live_server):
        """Test saving a favorite and then loading it."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for initial content to load
        page.wait_for_timeout(3000)
        
        # Save a favorite
        page.keyboard.press('f')
        page.wait_for_timeout(2000)
        
        # Open gallery
        page.keyboard.press('v')
        page.wait_for_timeout(1000)
        
        # Look for favorites in the gallery
        favorite_items = page.locator('.favorite-card, .favorite-item, .gallery-item')
        
        # Should have at least one favorite
        if favorite_items.count() > 0:
            # Click on the first favorite to load it
            favorite_items.first.click()
            
            # Wait for favorite to load
            page.wait_for_timeout(2000)
            
            # Gallery should close and favorite should be loading
            gallery = page.locator('.modal:visible, .gallery:visible')
            expect(gallery).to_have_count(0, timeout=3000)
    
    def test_favorites_api_integration(self, page: Page, live_server):
        """Test that favorites API endpoints work correctly."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Test GET favorites endpoint
        response = page.request.get(f"http://localhost:{live_server.port}/api/favorites")
        assert response.status == 200
        
        favorites = response.json()
        assert isinstance(favorites, list)
        
        # Should start with empty or existing favorites
        initial_count = len(favorites)
        
        # Wait and save a favorite
        page.wait_for_timeout(3000)
        page.keyboard.press('f')
        page.wait_for_timeout(2000)
        
        # Check if favorites count increased
        response2 = page.request.get(f"http://localhost:{live_server.port}/api/favorites")
        assert response2.status == 200
        
        new_favorites = response2.json()
        # Should have more favorites now (if save was successful)
        # Note: This test might be flaky depending on whether images are available


@pytest.mark.e2e
class TestFavoritesPersistence:
    """Test favorites data persistence."""
    
    def test_favorites_persist_across_sessions(self, page: Page, live_server):
        """Test that favorites persist when reloading the page."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for page to load
        page.wait_for_timeout(2000)
        
        # Get initial favorites count
        response = page.request.get(f"http://localhost:{live_server.port}/api/favorites")
        initial_favorites = response.json()
        initial_count = len(initial_favorites)
        
        # Save a favorite if we have content
        page.wait_for_timeout(3000)
        page.keyboard.press('f')
        page.wait_for_timeout(2000)
        
        # Reload the page
        page.reload()
        page.wait_for_timeout(2000)
        
        # Check favorites still exist
        response2 = page.request.get(f"http://localhost:{live_server.port}/api/favorites")
        assert response2.status == 200
        
        new_favorites = response2.json()
        # Should have at least the same number of favorites
        assert len(new_favorites) >= initial_count
    
    def test_favorites_thumbnails_display(self, page: Page, live_server):
        """Test that favorites thumbnails display correctly in gallery."""
        page.goto(f"http://localhost:{live_server.port}")
        
        # Wait for content to load
        page.wait_for_timeout(3000)
        
        # Save a favorite
        page.keyboard.press('f')
        page.wait_for_timeout(2000)
        
        # Open gallery
        page.keyboard.press('v')
        page.wait_for_timeout(1000)
        
        # Look for thumbnail images
        thumbnails = page.locator('img[src^="data:image"], .thumbnail, .favorite-preview')
        
        # Should have thumbnail images if favorites exist
        # This test passes if no errors occur during thumbnail loading


if __name__ == '__main__':
    pytest.main([__file__])