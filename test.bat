@echo off
REM Test runner batch script for Windows

call "venv\Scripts\activate.bat"

if "%1"=="backend" (
    echo Running backend tests only...
    python -m pytest tests/test_*.py -v
) else if "%1"=="e2e" (
    echo Running E2E tests only...
    python -m pytest tests/e2e/ -v
) else if "%1"=="coverage" (
    echo Running tests with coverage...
    python -m pytest tests/test_*.py --cov=. --cov-report=html --cov-report=term-missing -v
) else if "%1"=="fast" (
    echo Running fast tests only...
    python -m pytest -m "not slow" -v  
) else (
    echo Running all tests...
    python -m pytest tests/ -v
)

echo.
if %ERRORLEVEL% equ 0 (
    echo All tests passed!
) else (
    echo Some tests failed!
)