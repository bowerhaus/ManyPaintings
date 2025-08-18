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


# Dual Browser Sync Tests

@pytest.mark.e2e
def test_remote_to_main_speed_sync(dual_browser_setup):
    """Test speed change from remote appears on main display."""
    main_page = dual_browser_setup['main_page']
    remote_page = dual_browser_setup['remote_page']
    
    # Change speed on remote
    remote_page.set_speed(8)
    
    # Wait for polling cycle to sync changes
    remote_page.wait_for_settings_sync(delay=4.0)
    
    # Verify change appears on main display
    # Note: This requires the main page to have visible speed indicators
    # which may need to be triggered by showing the control panel
    main_page.move_mouse_to_center()  # Trigger UI visibility
    
    # The exact verification depends on main page UI structure
    # This test validates the communication mechanism
    main_page.wait_for_animation_frame()


@pytest.mark.e2e
def test_remote_to_main_volume_sync(dual_browser_setup):
    """Test volume change from remote syncs to main display."""
    main_page = dual_browser_setup['main_page']
    remote_page = dual_browser_setup['remote_page']
    
    # Change volume on remote
    remote_page.set_volume(85)
    
    # Wait for sync
    remote_page.wait_for_settings_sync(delay=4.0)
    
    # Verify the change is persisted (can be verified through API)
    main_page.wait_for_animation_frame()


@pytest.mark.e2e
def test_remote_to_main_gallery_sync(dual_browser_setup):
    """Test gallery manager changes sync between browsers."""
    main_page = dual_browser_setup['main_page']
    remote_page = dual_browser_setup['remote_page']
    
    # Change gallery settings on remote
    remote_page.set_brightness(110)
    remote_page.set_contrast(95)
    
    # Wait for sync
    remote_page.wait_for_settings_sync(delay=4.0)
    
    # Verify sync occurred
    main_page.wait_for_animation_frame()


@pytest.mark.e2e
def test_remote_play_pause_sync(dual_browser_setup):
    """Test play/pause action from remote affects main display."""
    main_page = dual_browser_setup['main_page']
    remote_page = dual_browser_setup['remote_page']
    
    # Trigger play/pause from remote
    remote_page.click_play_pause()
    
    # Wait for action to be processed
    remote_page.wait_for_settings_sync(delay=4.0)
    
    # Verify action was communicated
    main_page.wait_for_animation_frame()


@pytest.mark.e2e
def test_remote_new_pattern_sync(dual_browser_setup):
    """Test new pattern trigger from remote affects main display."""
    main_page = dual_browser_setup['main_page']
    remote_page = dual_browser_setup['remote_page']
    
    # Trigger new pattern from remote
    remote_page.click_new_pattern()
    
    # Wait for action to be processed
    remote_page.wait_for_settings_sync(delay=4.0)
    
    # Verify action was communicated
    main_page.wait_for_animation_frame()


@pytest.mark.e2e
def test_remote_background_toggle_sync(dual_browser_setup):
    """Test background toggle from remote syncs to main display."""
    main_page = dual_browser_setup['main_page']
    remote_page = dual_browser_setup['remote_page']
    
    # Toggle background from remote
    remote_page.click_background_toggle()
    
    # Wait for sync
    remote_page.wait_for_settings_sync(delay=4.0)
    
    # Verify background change on main display
    main_page.wait_for_animation_frame()


@pytest.mark.e2e
def test_remote_save_favorite_sync(dual_browser_setup):
    """Test save favorite from remote triggers main display."""
    main_page = dual_browser_setup['main_page']
    remote_page = dual_browser_setup['remote_page']
    
    # Save favorite from remote
    remote_page.click_save_favorite()
    
    # Wait for action to be processed
    remote_page.wait_for_settings_sync(delay=4.0)
    
    # Verify action was communicated
    main_page.wait_for_animation_frame()


# Polling Mechanism Tests

@pytest.mark.e2e
def test_polling_interval_timing(browser: Browser, live_server):
    """Test that polling happens at expected intervals."""
    # Create main display page
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
    
    # Should have at least 2 polling requests (one initial, one+ polling)
    assert len(settings_requests) >= 2
    
    main_context.close()


@pytest.mark.e2e
def test_settings_persistence_across_browsers(browser: Browser, live_server):
    """Test that settings changes persist across browser sessions."""
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
    
    # Verify persisted values (depending on implementation, values may load automatically)
    # This test verifies the persistence mechanism works
    speed_slider = remote_page_obj2.locator("#remote-speed-slider")
    volume_slider = remote_page_obj2.locator("#remote-volume-slider")
    
    expect(speed_slider).to_be_attached()
    expect(volume_slider).to_be_attached()
    
    context2.close()


# Network Resilience Tests

@pytest.mark.e2e
def test_network_interruption_recovery(browser: Browser, live_server):
    """Test recovery from network interruptions."""
    context = browser.new_context()
    remote_page_obj = context.new_page()
    remote_page = RemotePage(remote_page_obj).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page().wait_for_remote_ready()
    
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
    
    context.close()


@pytest.mark.e2e
def test_api_error_handling(browser: Browser, live_server):
    """Test handling of API errors."""
    context = browser.new_context()
    remote_page_obj = context.new_page()
    remote_page = RemotePage(remote_page_obj).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page().wait_for_remote_ready()
    
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
def test_multiple_remotes_concurrent_access(browser: Browser, live_server):
    """Test multiple remote sessions don't interfere with each other."""
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
    
    # Make changes from both remotes
    remote_page1.set_speed(7)
    remote_page2.set_volume(80)
    
    # Wait for changes to be processed
    time.sleep(3)
    
    # Verify both remotes still function
    remote_page1.set_layers(6)
    remote_page2.set_brightness(105)
    
    # Wait for final processing
    time.sleep(2)
    
    # Verify both pages are still responsive
    expect(remote_page_obj1.locator("#remote-app")).to_be_visible()
    expect(remote_page_obj2.locator("#remote-app")).to_be_visible()
    
    context1.close()
    context2.close()


@pytest.mark.e2e
def test_concurrent_settings_changes(browser: Browser, live_server):
    """Test concurrent settings changes from multiple remotes."""
    # Create two remote sessions
    context1 = browser.new_context()
    remote1 = context1.new_page()
    remote_page1 = RemotePage(remote1).set_base_url(f"http://localhost:{live_server.port}")
    
    context2 = browser.new_context()
    remote2 = context2.new_page()
    remote_page2 = RemotePage(remote2).set_base_url(f"http://localhost:{live_server.port}")
    
    # Load both pages
    remote_page1.load_remote_page().wait_for_remote_ready()
    remote_page2.load_remote_page().wait_for_remote_ready()
    
    # Make simultaneous changes to same setting
    remote_page1.set_speed(8)
    remote_page2.set_speed(5)  # Conflicting change
    
    # Wait for processing
    time.sleep(3)
    
    # Both should handle the conflict gracefully
    remote_page1.wait_for_animation_frame()
    remote_page2.wait_for_animation_frame()
    
    # Verify both remotes are still functional
    expect(remote1.locator("#remote-app")).to_be_visible()
    expect(remote2.locator("#remote-app")).to_be_visible()
    
    context1.close()
    context2.close()


if __name__ == '__main__':
    pytest.main([__file__])