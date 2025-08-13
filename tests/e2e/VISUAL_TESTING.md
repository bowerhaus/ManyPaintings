# Visual Testing for ManyPaintings UI

This directory contains Windows-only visual regression tests for the ManyPaintings UI components.

## Overview

Visual tests capture screenshots of UI components and compare them against baseline images to detect visual regressions. These tests only run on Windows to ensure consistent font rendering and avoid cross-platform differences.

## Test Coverage

### Components Tested
- **Favorites Gallery**: Modal appearance, empty state, populated state with thumbnails
- **Image Manager**: Modal structure, upload area, empty/populated states  
- **Gallery Manager**: Bottom-sheet interface, slider controls, filter effects

### Test Categories
- Modal appearance and layout
- Empty vs populated states
- Filter effects on actual artwork
- Responsive behavior at different resolutions
- Canvas texture overlay effects

## Running Visual Tests

### Prerequisites
- Windows operating system
- Python 3.11+ 
- Playwright installed: `pip install playwright`
- Browsers installed: `playwright install chromium`

### Quick Start

```bash
# Run all visual tests
python run_visual_tests.py

# Run with browser window visible (debugging)
python run_visual_tests.py --headed

# Update baseline screenshots (first run or after UI changes)
python run_visual_tests.py --update-baselines

# Run specific test category
python run_visual_tests.py --test-filter favorites
python run_visual_tests.py --test-filter gallery_manager

# Run with slow motion for debugging
python run_visual_tests.py --headed --slow-mo 1000
```

### Using Batch File (Windows)
```cmd
rem Quick run
run_visual_tests.bat

rem Update baselines
run_visual_tests.bat --update-baselines

rem Run specific tests
run_visual_tests.bat --test-filter image_manager --headed
```

## Test Structure

```
tests/e2e/
├── test_visual_appearance_windows.py     # Main visual test suite
├── test_visual_appearance_windows_py/    # Baseline screenshots
│   ├── TestFavoritesGalleryVisuals/     
│   ├── TestImageManagerVisuals/         
│   └── TestGalleryManagerVisuals/       
└── pages/
    ├── image_manager_page.py            # Image Manager page object
    └── gallery_manager_page.py          # Gallery Manager page object
```

## Test Classes

### TestFavoritesGalleryVisuals
- `test_favorites_gallery_modal_appearance`: Overall modal layout
- `test_favorites_gallery_empty_state`: Empty gallery state
- `test_favorites_gallery_with_items`: Populated gallery with thumbnails

### TestImageManagerVisuals  
- `test_image_manager_modal_appearance`: Overall modal layout
- `test_image_manager_empty_state`: Empty state messaging
- `test_image_manager_upload_area`: Upload area appearance

### TestGalleryManagerVisuals
- `test_gallery_manager_modal_appearance`: Bottom-sheet modal
- `test_gallery_manager_default_state`: Default slider values
- `test_gallery_manager_adjusted_values`: Non-default settings
- `test_gallery_manager_extreme_values`: Min/max slider positions

### TestCombinedVisuals
- `test_multiple_modals_z_index`: Modal layering and z-index
- `test_ui_responsiveness_desktop`: 1920x1080 layout
- `test_ui_responsiveness_laptop`: 1366x768 layout

### TestFilterEffectsVisuals
- `test_brightness_filter_effect`: Brightness filter on artwork
- `test_texture_overlay_effect`: Canvas texture overlay

## Configuration

### Browser Settings
- **Browser**: Chromium (consistent rendering)
- **Viewport**: 1280x720 (default for most tests)
- **Animations**: Disabled for consistent screenshots
- **Font Rendering**: Device scale factor 1.0

### Visual Test Fixtures
- `visual_page`: Page configured specifically for visual testing
- Animations disabled via CSS injection
- Consistent viewport and rendering settings

## Managing Screenshots

### Screenshot Storage
Screenshots are automatically saved to `test-results/visual/` directory:
```
test-results/visual/
├── favorites-gallery-modal.png
├── favorites-gallery-empty.png
├── image-manager-modal.png
├── gallery-manager-modal.png
└── brightness-filter-dark.png
```

### Visual Verification Workflow
1. **Run Tests**: Execute visual tests to capture current UI state
2. **Manual Review**: Examine screenshots in `test-results/visual/`
3. **Compare**: Review against previous versions or expected appearance
4. **Validate**: Ensure UI components render correctly

### Screenshot Organization
- **Component-based**: Each UI manager has dedicated screenshots
- **State-based**: Different states (empty, populated, adjusted) captured separately
- **Resolution-based**: Multiple viewport sizes tested
- **Effect-based**: Filter effects and interactions documented

## Troubleshooting

### Tests Failing on Other Platforms
✅ **Expected behavior** - Visual tests automatically skip on non-Windows platforms:
```
SKIPPED [1] conftest.py:114: Visual tests only run on Windows
```

### Screenshot Differences
1. **Check actual vs expected**: Review `test-results/` directory
2. **Verify UI changes**: Use `--headed` mode to see what's happening
3. **Update baselines**: If changes are intentional, use `--update-baselines`

### Test Environment Issues
- Ensure consistent Windows environment (same Windows version, display scaling)
- Use same browser version for baseline generation and testing
- Close other applications that might affect rendering

## CI/CD Integration

Visual tests are automatically skipped on GitHub Actions (Ubuntu):
```yaml
# In GitHub Actions, these tests will show as SKIPPED
- name: Run E2E tests  
  run: python -m pytest tests/e2e/ -v
```

For Windows CI (if needed), add to workflow:
```yaml
visual-tests:
  runs-on: windows-latest
  steps:
    - name: Run Visual Tests
      run: python run_visual_tests.py
```

## Best Practices

### When to Run Visual Tests
- Before committing UI changes
- After updating CSS or component styles  
- When adding new UI components
- Before releasing new versions

### Baseline Management
- Commit baseline images to version control
- Review baseline changes in pull requests
- Update baselines deliberately, not automatically

### Test Reliability
- Tests run only on Windows for consistency
- Animations disabled for stable screenshots
- Fixed viewport sizes for predictable layouts
- Proper wait strategies for dynamic content