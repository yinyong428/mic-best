#!/bin/bash
# Start MIC.BEST BOM Agent Backend
cd "$(dirname "$0")"

# Use venv python
PYTHON=./venv/bin/python

# Load env vars
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "🚀 Starting MIC.BEST BOM Agent on port ${PORT:-8080}..."
$PYTHON -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --reload
