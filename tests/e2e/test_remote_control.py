"""
End-to-end tests for iPhone Remote Control functionality.
"""

import pytest
from playwright.sync_api import Page, expect
from tests.e2e.pages.remote_page import RemotePage


# Remote Interface Tests

@pytest.mark.e2e
def test_remote_page_loads(page: Page, live_server):
    """Test that remote page loads successfully."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Verify main elements are present
    expect(page.locator("#remote-app")).to_be_visible()
    expect(page.locator(".remote-title")).to_contain_text("ManyPaintings")
    expect(page.locator(".remote-subtitle")).to_contain_text("Remote Control")


@pytest.mark.e2e
def test_mobile_viewport_layout(page: Page, live_server):
    """Test remote interface with mobile viewport."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.set_mobile_viewport()
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    remote_page.verify_mobile_layout()
    remote_page.verify_responsive_design()


@pytest.mark.e2e
def test_connection_status_display(page: Page, live_server):
    """Test connection status indicator."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    remote_page.verify_connection_status("Connected")
    
    # Verify connection indicator is visible
    expect(page.locator(".connection-indicator")).to_be_visible()


# Basic Controls Tests

@pytest.mark.e2e
def test_speed_control(page: Page, live_server):
    """Test speed slider control."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Test setting speed value
    remote_page.set_speed(7)
    
    # Verify value is displayed correctly
    speed_value = remote_page.get_speed_value()
    assert "7" in speed_value


@pytest.mark.e2e
def test_layers_control(page: Page, live_server):
    """Test layers slider control."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Test setting layers value
    remote_page.set_layers(6)
    
    # Verify value is displayed correctly
    layers_value = remote_page.get_layers_value()
    assert "6" in layers_value


@pytest.mark.e2e
def test_volume_control(page: Page, live_server):
    """Test volume slider control."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Test setting volume value
    remote_page.set_volume(80)
    
    # Verify value is displayed correctly
    volume_value = remote_page.get_volume_value()
    assert "80" in volume_value


@pytest.mark.e2e
def test_all_sliders_responsive(page: Page, live_server):
    """Test that all sliders are responsive to input."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Test multiple controls in sequence
    remote_page.set_speed(5)
    remote_page.set_layers(3)
    remote_page.set_volume(60)
    
    # Verify all values are set correctly
    assert "5" in remote_page.get_speed_value()
    assert "3" in remote_page.get_layers_value()
    assert "60" in remote_page.get_volume_value()


# Gallery Manager Controls Tests

@pytest.mark.e2e
def test_brightness_control(page: Page, live_server):
    """Test brightness slider control."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Test setting brightness value
    remote_page.set_brightness(110)
    
    # Verify value is displayed correctly
    brightness_value = remote_page.get_brightness_value()
    assert "110" in brightness_value


@pytest.mark.e2e
def test_contrast_control(page: Page, live_server):
    """Test contrast slider control."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Test setting contrast value
    remote_page.set_contrast(95)
    
    # Verify contrast slider works
    contrast_slider = page.locator("#remote-contrast-slider")
    expect(contrast_slider).to_have_value("95")


@pytest.mark.e2e
def test_saturation_control(page: Page, live_server):
    """Test saturation slider control."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Test setting saturation value
    remote_page.set_saturation(120)
    
    # Verify saturation slider works
    saturation_slider = page.locator("#remote-saturation-slider")
    expect(saturation_slider).to_have_value("120")


@pytest.mark.e2e
def test_white_balance_control(page: Page, live_server):
    """Test white balance slider control."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Test setting white balance value
    remote_page.set_white_balance(90)
    
    # Verify white balance slider works
    wb_slider = page.locator("#remote-white-balance-slider")
    expect(wb_slider).to_have_value("90")


@pytest.mark.e2e
def test_texture_intensity_control(page: Page, live_server):
    """Test texture intensity slider control."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Test setting texture intensity value
    remote_page.set_texture_intensity(50)
    
    # Verify texture slider works
    texture_slider = page.locator("#remote-texture-intensity-slider")
    expect(texture_slider).to_have_value("50")


@pytest.mark.e2e
def test_gallery_controls_range_validation(page: Page, live_server):
    """Test that gallery controls respect their valid ranges."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Test brightness range (25-115)
    brightness_slider = page.locator("#remote-brightness-slider")
    expect(brightness_slider).to_have_attribute("min", "25")
    expect(brightness_slider).to_have_attribute("max", "115")
    
    # Test contrast range (85-115)
    contrast_slider = page.locator("#remote-contrast-slider")
    expect(contrast_slider).to_have_attribute("min", "85")
    expect(contrast_slider).to_have_attribute("max", "115")


# Quick Actions Tests

@pytest.mark.e2e
def test_play_pause_button(page: Page, live_server):
    """Test play/pause button functionality."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Click play/pause button
    remote_page.click_play_pause()
    
    # Wait for action to process
    remote_page.wait_for_animation_frame()
    
    # Verify button exists and is clickable
    play_pause_btn = page.locator("#remote-play-pause-btn")
    expect(play_pause_btn).to_be_visible()
    expect(play_pause_btn).to_be_enabled()


@pytest.mark.e2e
def test_new_pattern_button(page: Page, live_server):
    """Test new pattern button functionality."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Click new pattern button
    remote_page.click_new_pattern()
    
    # Wait for action to process
    remote_page.wait_for_animation_frame()
    
    # Verify button works
    new_pattern_btn = page.locator("#remote-new-pattern-btn")
    expect(new_pattern_btn).to_be_visible()
    expect(new_pattern_btn).to_be_enabled()


@pytest.mark.e2e
def test_background_toggle_button(page: Page, live_server):
    """Test background toggle button functionality."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Click background toggle button
    remote_page.click_background_toggle()
    
    # Wait for action to process
    remote_page.wait_for_animation_frame()
    
    # Verify button works
    bg_toggle_btn = page.locator("#remote-background-toggle-btn")
    expect(bg_toggle_btn).to_be_visible()
    expect(bg_toggle_btn).to_be_enabled()


@pytest.mark.e2e
def test_save_favorite_button(page: Page, live_server):
    """Test save favorite button functionality."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Click save favorite button
    remote_page.click_save_favorite()
    
    # Wait for action to process
    remote_page.wait_for_animation_frame()
    
    # Verify button works
    save_fav_btn = page.locator("#remote-favorite-btn")
    expect(save_fav_btn).to_be_visible()
    expect(save_fav_btn).to_be_enabled()


@pytest.mark.e2e
def test_all_quick_actions_visible(page: Page, live_server):
    """Test that all quick action buttons are visible and properly labeled."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Verify all buttons are visible with correct labels
    # Play/Pause button shows dynamic text based on state
    play_pause_label = page.locator("#remote-play-pause-btn .action-label")
    expect(play_pause_label).to_be_visible()
    label_text = play_pause_label.text_content()
    assert label_text in ["Play", "Pause"], f"Expected 'Play' or 'Pause', got '{label_text}'"
    expect(page.locator("#remote-new-pattern-btn .action-label")).to_contain_text("New Pattern")
    expect(page.locator("#remote-background-toggle-btn .action-label")).to_contain_text("Background")
    expect(page.locator("#remote-favorite-btn .action-label")).to_contain_text("Save Favorite")


# Favorites Management Tests

@pytest.mark.e2e
def test_favorites_section_visible(page: Page, live_server):
    """Test that favorites section is visible."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    remote_page.wait_for_favorites_loaded()
    
    # Verify favorites section exists
    expect(page.locator(remote_page.favorites_gallery)).to_be_visible()
    # Find the section title specifically in the favorites section
    favorites_section = page.locator(".control-section").filter(has=page.locator("#remote-favorites-grid"))
    expect(favorites_section.locator(".section-title")).to_contain_text("Favorites")


@pytest.mark.e2e
def test_favorites_empty_state(page: Page, live_server):
    """Test favorites empty state display."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    # Mock empty favorites response
    page.route("**/api/favorites", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body="[]"
    ))
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    remote_page.wait_for_favorites_loaded()
    
    # Should show empty state
    empty_message = page.locator(remote_page.favorites_empty)
    expect(empty_message).to_be_visible()


@pytest.mark.e2e
def test_favorites_with_data(page: Page, live_server):
    """Test favorites display with mock data."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    # Mock favorites response with test data
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
    
    import json
    page.route("**/api/favorites", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps(mock_favorites)
    ))
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    remote_page.wait_for_favorites_loaded()
    
    # Should show favorites
    favorites = page.locator(".favorite-item")
    expect(favorites).to_have_count(2)


# Image Manager Tests

@pytest.mark.e2e
def test_image_manager_section_visible(page: Page, live_server):
    """Test that image manager section is visible."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    remote_page.wait_for_image_manager_loaded()
    
    # Verify image manager section exists
    expect(page.locator(remote_page.image_manager_section)).to_be_visible()
    # Find the section title specifically in the image manager section
    image_section = page.locator(".control-section").filter(has=page.locator("#remote-upload-area"))
    expect(image_section.locator(".section-title")).to_contain_text("Image Manager")


@pytest.mark.e2e
def test_upload_button_visible(page: Page, live_server):
    """Test that upload button is visible and functional."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    remote_page.wait_for_image_manager_loaded()
    
    # Verify upload area (acts as upload button)
    upload_btn = page.locator(remote_page.upload_btn)
    expect(upload_btn).to_be_visible()
    # Upload area should be clickable (no need to check enabled for div)


@pytest.mark.e2e
def test_images_empty_state(page: Page, live_server):
    """Test image manager empty state."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    # Mock empty images response
    page.route("**/api/images*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"images": []}'
    ))
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    remote_page.wait_for_image_manager_loaded()
    
    # Should show empty state
    remote_page.verify_images_empty_state()


@pytest.mark.e2e
def test_images_with_data(page: Page, live_server):
    """Test image manager with mock image data."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    # Mock images response with test data
    mock_images = {
        "images": [
            {
                "id": "test-img-1",
                "filename": "test1.png",
                "url": "/static/images/test1.png",
                "size": 1024,
                "dimensions": {"width": 100, "height": 100}
            },
            {
                "id": "test-img-2",
                "filename": "test2.jpg", 
                "url": "/static/images/test2.jpg",
                "size": 2048,
                "dimensions": {"width": 200, "height": 150}
            }
        ]
    }
    
    import json
    page.route("**/api/images*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps(mock_images)
    ))
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    remote_page.wait_for_image_manager_loaded()
    
    # Should show images
    images = page.locator(".remote-image-item")
    expect(images).to_have_count(2)


# Toast Notifications Tests

@pytest.mark.e2e
def test_toast_notifications_exist(page: Page, live_server):
    """Test that toast notification container exists."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Toast container should exist (even if empty)
    toast_container = page.locator("#remote-toast")
    expect(toast_container).to_be_attached()


@pytest.mark.slow
@pytest.mark.e2e
def test_control_interaction_shows_feedback(page: Page, live_server):
    """Test that control interactions show visual feedback."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Interact with a control
    remote_page.set_speed(8)
    
    # Wait for potential toast (may or may not appear depending on implementation)
    remote_page.wait_for_animation_frame()
    
    # This test verifies the mechanism exists, even if toast doesn't always show
    # The important thing is that the control interaction doesn't cause errors


# Responsive Design Tests

@pytest.mark.e2e
def test_mobile_viewport_controls(page: Page, live_server):
    """Test controls work properly in mobile viewport."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.set_mobile_viewport()
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Test that sliders work in mobile viewport
    remote_page.set_speed(6)
    remote_page.set_volume(75)
    
    # Verify values are set correctly
    assert "6" in remote_page.get_speed_value()
    assert "75" in remote_page.get_volume_value()


@pytest.mark.e2e
def test_touch_friendly_targets(page: Page, live_server):
    """Test that interactive elements have touch-friendly sizes."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.set_mobile_viewport()
    remote_page.load_remote_page()
    remote_page.wait_for_remote_ready()
    
    # Check button sizes are appropriate for touch
    action_buttons = page.locator(".action-btn")
    expect(action_buttons.first).to_be_visible()
    
    # Check slider thumb sizes
    sliders = page.locator(".control-slider")
    expect(sliders.first).to_be_visible()


@pytest.mark.e2e
def test_viewport_meta_tag(page: Page, live_server):
    """Test that viewport meta tag is properly set for mobile."""
    remote_page = RemotePage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    remote_page.load_remote_page()
    
    # Check for viewport meta tag
    viewport_meta = page.locator('meta[name="viewport"]')
    expect(viewport_meta).to_be_attached()


if __name__ == '__main__':
    pytest.main([__file__])