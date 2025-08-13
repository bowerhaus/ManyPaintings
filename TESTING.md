# Testing Guide for ManyPaintings

This document provides comprehensive information about the automated testing system for ManyPaintings.

## Overview

The ManyPaintings testing system provides complete coverage with two complementary testing approaches:

- **Backend Testing (pytest)**: Tests Flask routes, API endpoints, business logic, and configuration
- **End-to-End Testing (Playwright)**: Tests complete user workflows, UI interactions, and browser functionality

## Quick Start

### Prerequisites
```bash
# Install dependencies (from requirements.txt)
pip install pytest pytest-flask pytest-cov pytest-mock playwright pytest-playwright

# Install browser binaries (one-time setup)
playwright install
```

### Running Tests

**All tests:**
```bash
# Windows
test.bat

# Unix/Linux/macOS  
./test.sh

# Python script (cross-platform)
python run_tests.py
```

**Backend tests only:**
```bash
# Windows
test.bat backend

# Unix/Linux/macOS
./test.sh backend

# Direct pytest
python -m pytest tests/test_*.py -v
```

**End-to-End tests only:**
```bash
# Windows
test.bat e2e

# Unix/Linux/macOS
./test.sh e2e

# Direct pytest
python -m pytest tests/e2e/ -v
```

**With coverage:**
```bash
# Windows
test.bat coverage

# Unix/Linux/macOS
./test.sh coverage

# Direct pytest
python -m pytest tests/test_*.py --cov=. --cov-report=html --cov-report=term-missing
```

## Test Structure

```
tests/
├── conftest.py                 # Shared fixtures and utilities
├── test_app.py                 # Flask route tests
├── test_image_manager.py       # Image processing tests
├── test_config.py              # Configuration tests
├── e2e/
│   ├── conftest.py            # E2E specific fixtures
│   ├── test_core_functionality.py
│   └── test_favorites_system.py
└── fixtures/
    ├── test_images/           # Sample images for testing
    └── test_configs/          # Test configuration files
```

## Test Categories

### Backend Tests (42+ test cases)

**Flask Routes & API:**
- Route accessibility (/, /kiosk, /health)
- Image API (GET /api/images, upload, delete)
- Favorites API (GET, POST, DELETE /api/favorites)
- Pattern generation API (GET /api/pattern/<seed>)
- Configuration API (GET /api/config)

**Business Logic:**
- ImageManager functionality
- Configuration loading and hot-reload
- Per-image config overrides
- Error handling and validation

### End-to-End Tests (15+ test scenarios)

**Core Functionality:**
- Application loading and initialization
- Canvas rendering and animations
- Keyboard shortcuts (F, V, G, C, I, Space, B, N)

**User Workflows:**
- Save and load favorites
- Gallery management and color controls
- Image upload and management
- UI interactions and controls

**Browser Compatibility:**
- Cross-browser testing (Chromium, Firefox, WebKit)
- JavaScript error detection
- Visual element verification

## Configuration

### pytest.ini
```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --tb=short
    --strict-markers
    --disable-warnings
    --color=yes
    --browser chromium
    --headed=false
markers =
    unit: Unit tests
    integration: Integration tests  
    e2e: End-to-end tests
    slow: Slow running tests
```

### Test Environment

The testing system uses a dedicated `TestingConfig` that:
- Isolates test data from production
- Uses test-specific image directories
- Disables CSRF for easier testing
- Provides consistent test fixtures

## Writing Tests

### Backend Test Example
```python
def test_health_endpoint(client):
    """Test the health check endpoint."""
    response = client.get('/health')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data['status'] == 'healthy'
    assert 'config' in data
```

### E2E Test Example
```python
@pytest.mark.e2e
def test_save_favorite(page: Page, live_server):
    """Test saving a favorite using F key."""
    page.goto(f"http://localhost:{live_server.port}")
    page.wait_for_timeout(3000)
    
    page.keyboard.press('f')
    page.wait_for_timeout(1000)
    
    # Verify save operation succeeded
```

## Continuous Integration

### GitHub Actions

The project includes a complete GitHub Actions workflow (`.github/workflows/tests.yml`) that:

- Tests on multiple Python versions (3.11, 3.12, 3.13)
- Runs both backend and E2E tests
- Generates coverage reports
- Uploads test artifacts
- Supports Ubuntu and cross-platform testing

### Coverage Reporting

```bash
# Generate HTML coverage report
python -m pytest --cov=. --cov-report=html

# View coverage in browser
open htmlcov/index.html  # macOS/Linux
start htmlcov/index.html # Windows
```

## Debugging Tests

### Running Tests in Debug Mode
```bash
# Show all output (including print statements)
python -m pytest -s tests/test_app.py

# Run specific test with verbose output
python -m pytest tests/test_app.py::TestBasicRoutes::test_health_endpoint -vv

# Run E2E tests with visible browser (headed mode)
python -m pytest tests/e2e/ --headed
```

### Common Issues

**Test Discovery Issues:**
- Ensure test files start with `test_`
- Ensure test classes start with `Test`
- Ensure test functions start with `test_`

**E2E Test Issues:**
- Check that live server is starting correctly
- Verify browser binaries are installed: `playwright install`
- Use `page.wait_for_timeout()` for timing-sensitive operations

**Import Issues:**
- Verify virtual environment is activated
- Check that all dependencies are installed
- Ensure PYTHONPATH includes project root

## Performance

- **Backend tests**: ~1-2 seconds for full suite
- **E2E tests**: ~10-30 seconds depending on scenarios
- **Coverage analysis**: Adds ~2-3 seconds overhead

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Test names should describe what they verify
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Use mocks for external services
5. **Use Fixtures**: Leverage pytest fixtures for test data
6. **Mark Slow Tests**: Use `@pytest.mark.slow` for time-consuming tests

## Contributing

When adding new functionality:

1. Add corresponding backend tests for API changes
2. Add E2E tests for user-facing features
3. Update fixtures if new test data is needed
4. Ensure tests pass locally before submitting PR
5. Maintain test coverage above 80%

The testing system is designed to grow with the application and provide confidence in all deployments.