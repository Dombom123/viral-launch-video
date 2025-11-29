#!/usr/bin/env bash

set -e

# Change to backend directory (location of this script)
cd "$(dirname "$0")"

# Load environment variables from .env if present
if [ -f ".env" ]; then
  echo "Loading environment variables from .env"
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

if [ -z "${GOOGLE_API_KEY:-}" ]; then
  echo "ERROR: GOOGLE_API_KEY environment variable is not set (or in .env)." >&2
  exit 1
fi

if [ -z "${OUTPUT_VIDEO_DIR:-}" ]; then
  echo "ERROR: OUTPUT_VIDEO_DIR environment variable is not set (or in .env)." >&2
  exit 1
fi

echo "Starting Video Generator FastAPI service on http://0.0.0.0:8000 ..."

exec uvicorn video_generator.service:app --host 0.0.0.0 --port 8000


