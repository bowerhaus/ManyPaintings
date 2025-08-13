"""
Favorites gallery page object.
"""

from playwright.sync_api import Page, expect
from tests.e2e.pages.base_page import BasePage


class FavoritesGallery(BasePage):
    """Favorites gallery modal/overlay page object."""
    
    # Selectors for gallery elements
    GALLERY_MODAL = "#favorites-modal, .modal, .gallery, .favorites-gallery"
    GALLERY_VISIBLE = "#favorites-modal:not(.hidden), .modal:visible, .gallery:visible, .favorites-gallery:visible"
    FAVORITE_CARD = ".favorite-card, .favorite-item, .gallery-item"
    FAVORITE_THUMBNAIL = "img[src^='data:image'], .thumbnail, .favorite-preview"
    CLOSE_BUTTON = ".close-button, .modal-close, button[aria-label*='close']"
    EMPTY_GALLERY_MESSAGE = ".empty-gallery, .no-favorites"
    
    def __init__(self, page: Page):
        super().__init__(page)
    
    def wait_for_gallery_open(self, timeout: int = 5000):
        """Wait for the favorites gallery to open."""
        # Wait for the gallery modal to not have the 'hidden' class
        gallery_modal = self.page.locator("#favorites-modal")
        if gallery_modal.count() > 0:
            # Wait for the hidden class to be removed
            self.page.wait_for_function(
                "() => !document.getElementById('favorites-modal')?.classList.contains('hidden')",
                timeout=timeout
            )
        else:
            # Fallback to other selectors
            gallery = self.page.locator(self.GALLERY_VISIBLE)
            expect(gallery.first).to_be_visible(timeout=timeout)
        return self
    
    def wait_for_gallery_closed(self, timeout: int = 5000):
        """Wait for the favorites gallery to be closed."""
        # Wait for the gallery modal to have the 'hidden' class
        gallery_modal = self.page.locator("#favorites-modal")
        if gallery_modal.count() > 0:
            # Wait for the hidden class to be added
            self.page.wait_for_function(
                "() => document.getElementById('favorites-modal')?.classList.contains('hidden')",
                timeout=timeout
            )
        else:
            # Fallback to other selectors
            visible_gallery = self.page.locator(self.GALLERY_VISIBLE)
            expect(visible_gallery).to_have_count(0, timeout=timeout)
        return self
    
    def verify_gallery_is_open(self):
        """Verify the gallery is currently open."""
        gallery = self.page.locator(self.GALLERY_VISIBLE)
        expect(gallery).to_have_count(1)
        return self
    
    def verify_gallery_is_closed(self):
        """Verify the gallery is currently closed."""
        visible_gallery = self.page.locator(self.GALLERY_VISIBLE)
        expect(visible_gallery).to_have_count(0)
        return self
    
    def close_gallery_with_escape(self):
        """Close the gallery using Escape key."""
        self.press_key("Escape")
        self.wait_for_gallery_closed()
        return self
    
    def close_gallery_with_button(self):
        """Close the gallery using close button."""
        close_btn = self.page.locator(self.CLOSE_BUTTON).first
        if close_btn.count() > 0:
            close_btn.click()
            self.wait_for_gallery_closed()
        return self
    
    def get_favorite_cards(self):
        """Get all favorite card elements."""
        return self.page.locator(self.FAVORITE_CARD)
    
    def get_favorite_count(self):
        """Get the number of favorite cards displayed."""
        return self.get_favorite_cards().count()
    
    def click_first_favorite(self):
        """Click on the first favorite card."""
        favorite_cards = self.get_favorite_cards()
        if favorite_cards.count() > 0:
            favorite_cards.first.click()
            # Gallery should close after clicking a favorite
            self.wait_for_gallery_closed()
        return self
    
    def click_favorite_by_index(self, index: int):
        """Click on a favorite card by index."""
        favorite_cards = self.get_favorite_cards()
        if favorite_cards.count() > index:
            favorite_cards.nth(index).click()
            self.wait_for_gallery_closed()
        return self
    
    def verify_has_favorites(self, expected_count: int = None):
        """Verify that the gallery has favorite items."""
        favorite_cards = self.get_favorite_cards()
        if expected_count is not None:
            expect(favorite_cards).to_have_count(expected_count)
        else:
            expect(favorite_cards.first).to_be_attached()
        return self
    
    def verify_has_no_favorites(self):
        """Verify that the gallery has no favorite items."""
        # Check for empty state message or no cards
        favorite_cards = self.get_favorite_cards()
        empty_message = self.page.locator(self.EMPTY_GALLERY_MESSAGE)
        
        # Either no cards exist or empty message is shown
        if favorite_cards.count() == 0 or empty_message.count() > 0:
            return self
        
        # If neither condition is met, the test should fail
        expect(favorite_cards).to_have_count(0)
        return self
    
    def verify_thumbnails_displayed(self):
        """Verify that thumbnail images are displayed for favorites."""
        # Wait for gallery to be open first
        self.wait_for_gallery_open()
        
        thumbnails = self.page.locator(self.FAVORITE_THUMBNAIL)
        # If there are favorites, there should be thumbnails
        favorite_cards = self.get_favorite_cards()
        if favorite_cards.count() > 0:
            expect(thumbnails.first).to_be_attached()
        
        return self
    
    def wait_for_favorites_to_load(self, timeout: int = 10000):
        """Wait for favorites to load in the gallery."""
        # Wait for either favorites to appear or empty state
        self.page.wait_for_function(
            """() => {
                const cards = document.querySelectorAll('.favorite-card, .favorite-item, .gallery-item');
                const emptyMsg = document.querySelector('.empty-gallery, .no-favorites');
                return cards.length > 0 || emptyMsg !== null;
            }""",
            timeout=timeout
        )
        return self