#!/bin/bash
# Test runner script for Unix-like systems

# Activate virtual environment
source venv/bin/activate

case "$1" in
    backend)
        echo "Running backend tests only..."
        python -m pytest tests/test_*.py -v
        ;;
    e2e)
        echo "Running E2E tests only..."
        python -m pytest tests/e2e/ -v
        ;;
    coverage)
        echo "Running tests with coverage..."
        python -m pytest tests/test_*.py --cov=. --cov-report=html --cov-report=term-missing -v
        ;;
    fast)
        echo "Running fast tests only..."
        python -m pytest -m "not slow" -v
        ;;
    *)
        echo "Running all tests..."
        python -m pytest tests/ -v
        ;;
esac

if [ $? -eq 0 ]; then
    echo "All tests passed!"
else
    echo "Some tests failed!"
    exit 1
fi