"""
Configuration for end-to-end tests.
"""

import pytest
import threading
import time
from werkzeug.serving import make_server

# Import the Flask app
import sys
import os
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
    
    # Ensure we have test image directory
    import tempfile
    with tempfile.TemporaryDirectory() as temp_dir:
        app.config['IMAGE_DIRECTORY'] = temp_dir
        
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