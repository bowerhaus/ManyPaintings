"""
Base page object with common functionality.
"""

from playwright.sync_api import Page, expect


class BasePage:
    """Base page object with common functionality."""
    
    def __init__(self, page: Page):
        self.page = page
        self.base_url = None
    
    def goto(self, path=""):
        """Navigate to a page."""
        if self.base_url:
            url = f"{self.base_url}{path}"
            self.page.goto(url, timeout=10000)  # 10 second timeout for navigation
            return self
        raise ValueError("Base URL not set")
    
    def set_base_url(self, base_url: str):
        """Set the base URL for this page."""
        self.base_url = base_url
        return self
    
    def wait_for_page_load(self, timeout: int = 10000):
        """Wait for page to be fully loaded."""
        try:
            # Wait for DOM to be ready first
            self.page.wait_for_load_state("domcontentloaded", timeout=timeout)
            # Try to wait for network idle, but don't fail if it times out
            self.page.wait_for_load_state("networkidle", timeout=5000)
        except Exception:
            # If networkidle times out, just wait for load event
            self.page.wait_for_load_state("load", timeout=timeout)
        return self
    
    def wait_for_element_visible(self, selector: str, timeout: int = 10000):
        """Wait for element to be visible."""
        element = self.page.locator(selector)
        expect(element).to_be_visible(timeout=timeout)
        return element
    
    def wait_for_element_attached(self, selector: str, timeout: int = 10000):
        """Wait for element to be attached to DOM."""
        element = self.page.locator(selector)
        expect(element).to_be_attached(timeout=timeout)
        return element
    
    def wait_for_element_hidden(self, selector: str, timeout: int = 10000):
        """Wait for element to be hidden."""
        element = self.page.locator(selector)
        expect(element).to_be_hidden(timeout=timeout)
        return element
    
    def press_key(self, key: str):
        """Press a keyboard key."""
        self.page.keyboard.press(key)
        return self
    
    def click_element(self, selector: str, timeout: int = 10000):
        """Click an element after waiting for it to be visible."""
        element = self.wait_for_element_visible(selector, timeout)
        element.click()
        return self
    
    def move_mouse_to_center(self):
        """Move mouse to center of viewport to potentially trigger UI elements."""
        viewport = self.page.viewport_size
        self.page.mouse.move(viewport["width"] // 2, viewport["height"] // 2)
        return self
    
    def wait_for_animation_frame(self):
        """Wait for animation frame - better than arbitrary timeouts."""
        self.page.wait_for_function("() => new Promise(resolve => requestAnimationFrame(resolve))")
        return self
    
    def wait_for_no_network_requests(self, timeout: int = 5000):
        """Wait for no network requests to be in flight."""
        try:
            self.page.wait_for_load_state("networkidle", timeout=timeout)
        except Exception:
            # If network doesn't go idle, just wait a short time for critical requests
            self.page.wait_for_timeout(1000)
        return self