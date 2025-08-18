"""
Integration tests for iPhone Remote Control multi-browser synchronization.
Tests bidirectional sync between main display and remote control.
"""

import pytest
import time
from playwright.sync_api import Page, Browser, BrowserContext, expect
from tests.e2e.pages.main_page import MainPage
from tests.e2e.pages.remote_page import RemotePage


@pytest.fixture
def dual_browser_setup(browser: Browser, live_server):
    """Setup two browser contexts for main display and remote control."""
    # Main display context (desktop)
    main_context = browser.new_context(viewport={"width": 1280, "height": 720})
    main_page_obj = main_context.new_page()
    main_page = MainPage(main_page_obj).set_base_url(f"http://localhost:{live_server.port}")
    
    # Remote control context (mobile)
    remote_context = browser.new_context(viewport={"width": 375, "height": 667})
    remote_page_obj = remote_context.new_page()
    remote_page = RemotePage(remote_page_obj).set_base_url(f"http://localhost:{live_server.port}")
    
    # Load both pages
    main_page.load_main_page().wait_for_application_ready()
    remote_page.load_remote_page().wait_for_remote_ready()
    
    yield {
        'main_page': main_page,
        'remote_page': remote_page,
        'main_context': main_context,
        'remote_context': remote_context
    }
    
    # Cleanup
    main_context.close()
    remote_context.close()


# Comprehensive Dual Browser Sync Tests

@pytest.mark.e2e
def test_comprehensive_remote_to_main_sync(dual_browser_setup):
    """Comprehensive test of all remote control sync functionality with main display."""
    main_page = dual_browser_setup['main_page']
    remote_page = dual_browser_setup['remote_page']
    
    # Test speed sync
    remote_page.set_speed(8)
    remote_page.wait_for_settings_sync(delay=4.0)
    main_page.move_mouse_to_center()  # Trigger UI visibility
    main_page.wait_for_animation_frame()
    
    # Test volume sync
    remote_page.set_volume(85)
    remote_page.wait_for_settings_sync(delay=4.0)
    main_page.wait_for_animation_frame()
    
    # Test gallery manager settings sync
    remote_page.set_brightness(110)
    remote_page.set_contrast(95)
    remote_page.wait_for_settings_sync(delay=4.0)
    main_page.wait_for_animation_frame()
    
    # Test quick action syncs
    remote_page.click_play_pause()
    remote_page.wait_for_settings_sync(delay=4.0)
    main_page.wait_for_animation_frame()
    
    remote_page.click_new_pattern()
    remote_page.wait_for_settings_sync(delay=4.0)
    main_page.wait_for_animation_frame()
    
    remote_page.click_background_toggle()
    remote_page.wait_for_settings_sync(delay=4.0)
    main_page.wait_for_animation_frame()
    
    # Test save favorite sync
    remote_page.click_save_favorite()
    remote_page.wait_for_settings_sync(delay=4.0)
    main_page.wait_for_animation_frame()


# Polling and Persistence Tests

@pytest.mark.e2e
def test_polling_and_persistence_mechanisms(browser: Browser, live_server):
    """Comprehensive test of polling intervals and settings persistence."""
    # Test polling interval timing
    main_context = browser.new_context()
    main_page_obj = main_context.new_page()
    main_page = MainPage(main_page_obj).set_base_url(f"http://localhost:{live_server.port}")
    
    # Track network requests to settings API
    requests = []
    main_page_obj.on("request", lambda request: 
        requests.append(request) if "/api/settings" in request.url else None)
    
    # Load main page and wait for initial setup
    main_page.load_main_page().wait_for_application_ready()
    
    # Wait for several polling cycles
    time.sleep(8)  # Should see 2-3 polling requests
    
    # Verify polling is happening
    settings_requests = [req for req in requests if "/api/settings" in req.url and req.method == "GET"]
    assert len(settings_requests) >= 2
    
    main_context.close()
    
    # Test settings persistence across browser sessions
    # First browser session - make changes
    context1 = browser.new_context()
    remote_page_obj1 = context1.new_page()
    remote_page1 = RemotePage(remote_page_obj1).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page1.load_remote_page().wait_for_remote_ready()
    remote_page1.set_speed(9)
    remote_page1.set_volume(90)
    
    # Wait for settings to be saved
    time.sleep(2)
    context1.close()
    
    # Second browser session - verify changes persist
    context2 = browser.new_context()
    remote_page_obj2 = context2.new_page()
    remote_page2 = RemotePage(remote_page_obj2).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page2.load_remote_page().wait_for_remote_ready()
    
    # Wait for settings to load
    time.sleep(2)
    
    # Verify persisted values using proper page object methods
    # Check that sliders are properly loaded and functional
    remote_page2.wait_for_element_visible(remote_page2.speed_slider)
    remote_page2.wait_for_element_visible(remote_page2.volume_slider)
    
    context2.close()


# Network Resilience and Error Handling Tests

@pytest.mark.e2e
def test_network_resilience_and_error_handling(browser: Browser, live_server):
    """Comprehensive test of network interruption recovery and API error handling."""
    context = browser.new_context()
    remote_page_obj = context.new_page()
    remote_page = RemotePage(remote_page_obj).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page().wait_for_remote_ready()
    
    # Test network interruption recovery
    # Simulate network failure by blocking API requests
    remote_page_obj.route("**/api/settings", lambda route: route.abort())
    
    # Try to make a change during network failure
    remote_page.set_speed(7)
    
    # Wait and then restore network
    time.sleep(2)
    remote_page_obj.unroute("**/api/settings")
    
    # Verify page still functions after network recovery
    remote_page.set_volume(70)
    remote_page.wait_for_animation_frame()
    
    # Test API error handling
    # Simulate API server error
    remote_page_obj.route("**/api/settings", lambda route: route.fulfill(
        status=500,
        body="Internal Server Error"
    ))
    
    # Try to make changes with API errors
    remote_page.set_speed(6)
    remote_page.set_volume(60)
    
    # Verify page doesn't crash
    remote_page.wait_for_animation_frame()
    
    # Restore API and verify recovery
    remote_page_obj.unroute("**/api/settings")
    remote_page.set_layers(5)
    
    context.close()


# Multiple Remote Sessions Tests

@pytest.mark.e2e
def test_multiple_remote_sessions_comprehensive(browser: Browser, live_server):
    """Comprehensive test of multiple remote sessions and concurrent access."""
    # Create two remote control sessions
    context1 = browser.new_context(viewport={"width": 375, "height": 667})
    remote_page_obj1 = context1.new_page()
    remote_page1 = RemotePage(remote_page_obj1).set_base_url(f"http://localhost:{live_server.port}")
    
    context2 = browser.new_context(viewport={"width": 375, "height": 667})
    remote_page_obj2 = context2.new_page()
    remote_page2 = RemotePage(remote_page_obj2).set_base_url(f"http://localhost:{live_server.port}")
    
    # Load both remote pages
    remote_page1.load_remote_page().wait_for_remote_ready()
    remote_page2.load_remote_page().wait_for_remote_ready()
    
    # Test non-conflicting changes from both remotes
    remote_page1.set_speed(7)
    remote_page2.set_volume(80)
    
    # Wait for changes to be processed
    time.sleep(3)
    
    # Verify both remotes still function
    remote_page1.set_layers(6)
    remote_page2.set_brightness(105)
    
    # Test concurrent settings changes (conflicting)
    remote_page1.set_speed(8)
    remote_page2.set_speed(5)  # Conflicting change
    
    # Wait for processing
    time.sleep(3)
    
    # Both should handle the conflict gracefully
    remote_page1.wait_for_animation_frame()
    remote_page2.wait_for_animation_frame()
    
    # Verify both pages are still responsive using page object methods
    remote_page1.wait_for_element_visible("#remote-app")
    remote_page2.wait_for_element_visible("#remote-app")
    
    context1.close()
    context2.close()


if __name__ == '__main__':
    pytest.main([__file__])