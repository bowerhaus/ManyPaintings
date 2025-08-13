"""
Configuration for end-to-end tests.
"""

import pytest
import threading
import time
import sys
import os
from werkzeug.serving import make_server

# Import the Flask app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app import create_app


class LiveServer:
    """A live Flask server for E2E testing."""
    
    def __init__(self, app, host='127.0.0.1', port=5555):
        self.app = app
        self.host = host
        self.port = port
        self.server = None
        self.thread = None
    
    def start(self):
        """Start the live server in a separate thread."""
        self.server = make_server(self.host, self.port, self.app)
        self.thread = threading.Thread(target=self.server.serve_forever)
        self.thread.daemon = True
        self.thread.start()
        
        # Wait for server to start
        time.sleep(0.5)
    
    def stop(self):
        """Stop the live server."""
        if self.server:
            self.server.shutdown()
        if self.thread:
            self.thread.join()


@pytest.fixture(scope="session")
def live_server():
    """Create a live Flask server for E2E tests."""
    # Create app with testing configuration
    app = create_app('testing')
    
    server = LiveServer(app, port=5555)
    server.start()
    
    yield server
    
    server.stop()


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """Configure browser context for E2E tests."""
    return {
        **browser_context_args,
        "ignore_https_errors": True,
        "viewport": {"width": 1280, "height": 720},
    }


@pytest.fixture(scope="function")  
def page(page, live_server):
    """Configure page for each test."""
    # Set a reasonable timeout for actions
    page.set_default_timeout(10000)
    
    # Configure request interception if needed
    # page.route("**/*", lambda route: route.continue_())
    
    return page


def pytest_configure(config):
    """Configure pytest markers."""
    config.addinivalue_line(
        "markers", "visual: marks tests as visual tests (Windows only)"
    )
    config.addinivalue_line(
        "markers", "e2e: marks tests as end-to-end tests"
    )


@pytest.fixture(scope="session")
def visual_context_args(browser_context_args):
    """Configure browser context specifically for visual tests."""
    return {
        **browser_context_args,
        "ignore_https_errors": True,
        "viewport": {"width": 1280, "height": 720},
        # Disable animations for consistent screenshots
        "reduced_motion": "reduce",
        # Force consistent font rendering
        "device_scale_factor": 1.0,
    }


@pytest.fixture(scope="function")
def visual_page(browser, visual_context_args, live_server):
    """Create a page specifically configured for visual testing."""
    if sys.platform != "win32":
        pytest.skip("Visual tests only run on Windows")
    
    context = browser.new_context(**visual_context_args)
    page = context.new_page()
    
    # Set specific viewport for consistent screenshots
    page.set_viewport_size({"width": 1280, "height": 720})
    
    # Set default timeout
    page.set_default_timeout(10000)
    
    # Disable animations for consistent screenshots
    page.add_init_script("""
        // Disable CSS transitions and animations
        const style = document.createElement('style');
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
            }
        `;
        document.head.appendChild(style);
    """)
    
    yield page
    
    context.close()