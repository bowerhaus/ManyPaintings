"""
Image Manager page object for E2E testing.
"""

from playwright.sync_api import Page, expect
from tests.e2e.pages.base_page import BasePage


class ImageManagerPage(BasePage):
    """Image Manager modal page object."""
    
    # Selectors for modal elements
    MODAL = "#image-manager-modal"
    MODAL_VISIBLE = "#image-manager-modal:not(.hidden)"
    CLOSE_BUTTON = "#image-manager-modal-close"
    
    # Content selectors
    IMAGES_GRID = "#images-grid"
    IMAGES_LOADING = "#images-loading"
    IMAGES_EMPTY = "#images-empty"
    IMAGE_CARD = ".image-card"
    
    # Upload area selectors
    UPLOAD_AREA = "#upload-area"
    UPLOAD_INPUT = "#image-upload-input"
    UPLOAD_PROGRESS = "#upload-progress"
    UPLOAD_PROGRESS_BAR = "#upload-progress-bar"
    UPLOAD_STATUS = "#upload-status"
    
    # Image management selectors
    DELETE_BUTTON = ".delete-btn, .image-delete"
    CONFIRM_DELETE = "#confirm-delete-btn"
    CANCEL_DELETE = "#cancel-delete-btn"
    
    def __init__(self, page: Page):
        super().__init__(page)
    
    def wait_for_modal_open(self, timeout: int = 5000):
        """Wait for the image manager modal to open."""
        modal = self.page.locator(self.MODAL_VISIBLE)
        expect(modal).to_be_visible(timeout=timeout)
        return self
    
    def wait_for_modal_closed(self, timeout: int = 5000):
        """Wait for the image manager modal to close."""
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
    
    def get_image_cards(self):
        """Get all image card elements."""
        return self.page.locator(self.IMAGE_CARD)
    
    def get_image_count(self):
        """Get the number of image cards displayed."""
        return self.get_image_cards().count()
    
    def verify_has_images(self, expected_count: int = None):
        """Verify that images are displayed."""
        image_cards = self.get_image_cards()
        if expected_count is not None:
            expect(image_cards).to_have_count(expected_count)
        else:
            expect(image_cards.first).to_be_attached()
        return self
    
    def verify_empty_state(self):
        """Verify the empty state is shown."""
        empty_section = self.page.locator(self.IMAGES_EMPTY)
        expect(empty_section).to_be_visible()
        return self
    
    def verify_loading_state(self):
        """Verify the loading state is shown."""
        loading_section = self.page.locator(self.IMAGES_LOADING)
        expect(loading_section).to_be_visible()
        return self
    
    def verify_upload_area_visible(self):
        """Verify the upload area is visible."""
        upload_area = self.page.locator(self.UPLOAD_AREA)
        expect(upload_area).to_be_visible()
        return self
    
    def upload_image(self, file_path: str):
        """Upload an image file."""
        upload_input = self.page.locator(self.UPLOAD_INPUT)
        upload_input.set_input_files(file_path)
        return self
    
    def wait_for_upload_complete(self, timeout: int = 10000):
        """Wait for upload to complete."""
        # Wait for progress to disappear or upload to complete
        self.page.wait_for_function(
            """() => {
                const progress = document.querySelector('#upload-progress');
                return !progress || progress.classList.contains('hidden');
            }""",
            timeout=timeout
        )
        return self
    
    def click_delete_button(self, image_index: int = 0):
        """Click delete button on image card."""
        image_cards = self.get_image_cards()
        if image_cards.count() > image_index:
            delete_btn = image_cards.nth(image_index).locator(self.DELETE_BUTTON)
            delete_btn.click()
        return self
    
    def confirm_delete(self):
        """Confirm image deletion."""
        confirm_btn = self.page.locator(self.CONFIRM_DELETE)
        if confirm_btn.count() > 0:
            confirm_btn.click()
        return self
    
    def cancel_delete(self):
        """Cancel image deletion."""
        cancel_btn = self.page.locator(self.CANCEL_DELETE)
        if cancel_btn.count() > 0:
            cancel_btn.click()
        return self
    
    def wait_for_images_to_load(self, timeout: int = 10000):
        """Wait for images to load in the grid."""
        # Wait for either images to appear or empty state
        self.page.wait_for_function(
            """() => {
                const cards = document.querySelectorAll('.image-card');
                const emptySection = document.querySelector('#images-empty');
                const grid = document.querySelector('#images-grid');
                // Wait for either cards to appear or empty state to be visible
                return (cards.length > 0) || (emptySection && !emptySection.classList.contains('hidden')) || (grid && grid.children.length === 0);
            }""",
            timeout=timeout
        )
        return self