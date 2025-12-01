"""
Pytest Configuration and Shared Fixtures

This file contains shared fixtures that are automatically available
to all test files in the tests directory.
"""
from __future__ import annotations

import json
import os
import shutil
import sys
from pathlib import Path
from typing import Any, Dict, Generator

import pytest

# Add backend to path for imports
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app
from storyboard.storyboard_service import RUNS_DIR


@pytest.fixture(scope="session")
def client() -> TestClient:
    """
    Create a test client for the FastAPI app.
    Session-scoped for efficiency across all tests.
    """
    return TestClient(app)


@pytest.fixture(scope="session")
def runs_directory() -> Path:
    """Return the runs directory path."""
    return RUNS_DIR


@pytest.fixture
def temp_run_dir(runs_directory: Path) -> Generator[Path, None, None]:
    """
    Create a temporary run directory for testing.
    Automatically cleans up after the test.
    """
    import uuid
    run_id = f"test_{uuid.uuid4().hex[:8]}"
    run_dir = runs_directory / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    
    yield run_dir
    
    # Cleanup
    if run_dir.exists():
        shutil.rmtree(run_dir)


@pytest.fixture
def sample_brief() -> Dict[str, Any]:
    """
    Sample brief data simulating user video upload.
    Represents Step 1 output.
    """
    return {
        "project_id": "#TEST-FIXTURE",
        "project_name": "Fixture Test Product",
        "created_at": "2024-05-20T14:00:00Z",
        "source_material": {
            "filename": "fixture_demo.mp4",
            "duration": 90,
            "resolution": "1920x1080",
            "file_path": "/uploads/raw/fixture_demo.mp4"
        },
        "user_input": {
            "brand_voice": "Professional, Modern, Innovative",
            "target_audience": "Business professionals",
            "product_name": "FixtureWidget",
            "key_features": ["Feature A", "Feature B", "Feature C"]
        }
    }


@pytest.fixture
def sample_research_output() -> Dict[str, Any]:
    """
    Sample research output with selected script.
    Represents Step 2 output.
    """
    return {
        "selected_script": {
            "id": "script_fixture_01",
            "title": "Fixture Script Title",
            "hook": "This is the hook for the test script.",
            "tone": "Professional",
            "assets": {
                "characters": [
                    {
                        "name": "Test Character",
                        "visual_prompt": "A professional person in business attire."
                    }
                ],
                "objects": [
                    {
                        "name": "Test Product",
                        "visual_prompt": "The main product being showcased."
                    }
                ],
                "environments": [
                    {
                        "name": "Test Environment",
                        "visual_prompt": "A clean modern environment."
                    }
                ]
            },
            "scenes": [
                {
                    "scene_id": 1,
                    "visual": "Opening scene description",
                    "audio": "Opening narration text",
                    "assets": {
                        "objects": ["Test Product"],
                        "environment": "Test Environment"
                    }
                },
                {
                    "scene_id": 2,
                    "visual": "Middle scene description",
                    "audio": "Middle narration text",
                    "assets": {
                        "characters": ["Test Character"],
                        "objects": ["Test Product"],
                        "environment": "Test Environment"
                    }
                },
                {
                    "scene_id": 3,
                    "visual": "Closing scene description",
                    "audio": "Call to action text",
                    "assets": {
                        "characters": ["Test Character"],
                        "objects": ["Test Product"]
                    }
                }
            ]
        }
    }


@pytest.fixture
def sample_storyboard() -> Dict[str, Any]:
    """
    Sample storyboard data.
    Represents Step 3 output.
    """
    return {
        "script_id": "script_fixture_01",
        "assets": {
            "characters": [
                {
                    "id": "char_01",
                    "name": "Test Character",
                    "image_url": "/test/character.png",
                    "status": "approved"
                }
            ],
            "objects": [
                {
                    "id": "obj_01",
                    "name": "Test Product",
                    "image_url": "/test/product.png",
                    "status": "approved"
                }
            ],
            "environments": [
                {
                    "id": "env_01",
                    "name": "Test Environment",
                    "image_url": "/test/environment.png",
                    "status": "approved"
                }
            ]
        },
        "storyboard_frames": [
            {
                "frame_id": 1,
                "scene_id": 1,
                "description": "Opening scene description",
                "image_url": "/test/frame1.png",
                "audio_prompt": "Opening narration text"
            },
            {
                "frame_id": 2,
                "scene_id": 2,
                "description": "Middle scene description",
                "image_url": "/test/frame2.png",
                "audio_prompt": "Middle narration text"
            },
            {
                "frame_id": 3,
                "scene_id": 3,
                "description": "Closing scene description",
                "image_url": "/test/frame3.png",
                "audio_prompt": "Call to action text"
            }
        ]
    }


def save_json(path: Path, data: Dict[str, Any]) -> None:
    """Helper to save JSON data to a file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_json(path: Path) -> Dict[str, Any]:
    """Helper to load JSON data from a file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# Make helpers available to tests
@pytest.fixture
def json_helpers():
    """Provide JSON save/load helpers to tests."""
    return {"save": save_json, "load": load_json}


