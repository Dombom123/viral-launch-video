#!/bin/bash
# End-to-End Test Runner for Viral Video Generator
#
# Usage:
#   ./run_e2e_tests.sh              # Run all e2e tests
#   ./run_e2e_tests.sh -k "full"    # Run only the full flow test
#   ./run_e2e_tests.sh --verbose    # Extra verbose output

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Viral Video Generator - E2E Test Suite"
echo "=========================================="
echo ""

# Check if venv exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
else
    echo "Warning: No venv found. Using system Python."
fi

# Check for required packages
echo "Checking dependencies..."
python -c "import pytest" 2>/dev/null || {
    echo "Installing pytest..."
    pip install pytest httpx
}

echo ""
echo "Starting tests..."
echo "=========================================="
echo ""

# Run pytest with any passed arguments
pytest tests/test_e2e_flow.py "$@"

echo ""
echo "=========================================="
echo "Test run complete!"
echo "=========================================="

