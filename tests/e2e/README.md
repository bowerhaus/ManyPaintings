# E2E Tests with Page Object Model

This directory contains end-to-end tests for the ManyPaintings application using the Page Object Model pattern with Playwright.

## Architecture

### Page Objects (`pages/` directory)

- **`base_page.py`** - Base class with common functionality and wait strategies
- **`main_page.py`** - Main application page with all core interactions
- **`kiosk_page.py`** - Kiosk mode page (extends main page)
- **`favorites_gallery.py`** - Favorites gallery modal/overlay interactions
- **`api_client.py`** - API endpoint testing utilities

### Key Benefits

1. **No Arbitrary Delays** - Uses proper wait strategies instead of `time.sleep()` or `page.wait_for_timeout()`
2. **Reusable Components** - Page objects encapsulate common interactions
3. **Better Maintainability** - UI changes only require updates to page objects
4. **Improved Reliability** - Smart waits reduce flaky tests

## Wait Strategies Used

### Replaced Delays With:

- **`wait_for_element_visible()`** - Waits for elements to become visible
- **`wait_for_element_attached()`** - Waits for elements to be added to DOM
- **`wait_for_animation_frame()`** - Waits for single animation frame (better than arbitrary delays)
- **`wait_for_page_load()`** - Waits for DOM content loaded + network idle
- **`wait_for_no_network_requests()`** - Waits for network activity to finish
- **Custom business logic waits** - Like `wait_for_image_layers_to_appear()`

### Playwright Built-in Waits:

- `expect(element).to_be_visible(timeout=5000)` - Auto-waits for visibility
- `expect(element).to_be_attached()` - Auto-waits for DOM attachment
- `page.wait_for_function()` - Waits for JavaScript conditions
- `page.wait_for_load_state()` - Waits for page load states

## Running Tests

```bash
# Run all E2E tests
pytest tests/e2e/ -m e2e

# Run specific test file
pytest tests/e2e/test_core_functionality.py -v

# Run only fast tests (exclude slow ones)
pytest tests/e2e/ -m "e2e and not slow"

# Run with browser visible (for debugging)
pytest tests/e2e/ --headed

# Run specific test class
pytest tests/e2e/test_favorites_system.py::TestFavoritesSaving -v
```

## Test Organization

### Markers Used:
- `@pytest.mark.e2e` - All end-to-end tests
- `@pytest.mark.slow` - Tests that take longer to run
- `@pytest.mark.skip` - Temporarily disabled tests

### Test Classes:
- **TestCoreApplication** - Basic app loading and functionality
- **TestKeyboardShortcuts** - Keyboard interaction testing
- **TestUIControls** - UI element interaction
- **TestAPIEndpoints** - Backend API testing
- **TestVisualElements** - Visual and styling verification
- **TestFavoritesSaving** - Favorites creation functionality
- **TestFavoritesGallery** - Gallery UI interactions
- **TestFavoritesWorkflow** - Complete user workflows
- **TestFavoritesPersistence** - Data persistence testing

## Page Object Pattern Examples

### Before (Using Raw Playwright):
```python
def test_save_favorite(self, page: Page, live_server):
    page.goto(f"http://localhost:{live_server.port}")
    page.wait_for_timeout(3000)  # Arbitrary delay
    page.keyboard.press('f')
    page.wait_for_timeout(1000)  # Another arbitrary delay
    toast = page.locator('.toast')
    expect(toast.first).to_be_visible(timeout=3000)
```

### After (Using Page Objects):
```python
def test_save_favorite(self, page: Page, live_server):
    main_page = MainPage(page).set_base_url(f"http://localhost:{live_server.port}")
    
    main_page.load_main_page()
    main_page.wait_for_application_ready()
    main_page.wait_for_image_layers_to_appear()
    main_page.press_save_favorite()
    main_page.wait_for_toast_notification()
```

## Configuration

Tests use the `live_server` fixture from `conftest.py` which:
- Starts a Flask test server on port 5555
- Uses test configuration and temporary directories
- Automatically cleans up after tests

Browser configuration:
- Default viewport: 1280x720
- Default timeout: 10 seconds
- Ignores HTTPS errors for local testing

## Best Practices

1. **Always use page objects** instead of direct Playwright calls in tests
2. **Chain methods** for fluent interface: `page.load().wait_for_ready().press_key()`
3. **Use business-specific waits** like `wait_for_image_layers_to_appear()` instead of generic timeouts
4. **Verify state with assertions** after actions: `main_page.verify_gallery_is_closed()`
5. **Handle optional elements gracefully** with count checks before interaction
6. **Use meaningful test names** that describe the user behavior being tested

## Debugging Tips

1. **Run with `--headed`** to see browser during test execution
2. **Add screenshots** on failure: `page.screenshot(path="debug.png")`
3. **Use page object methods** for consistent element discovery
4. **Check console errors** with `verify_no_javascript_errors()`
5. **Use browser dev tools** during `--headed` runs for live debugging