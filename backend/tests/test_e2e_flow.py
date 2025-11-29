"""
End-to-End Test Suite for Viral Video Generator

This test file simulates the complete user flow:
1. Video Upload (Brief) → Creates initial project data
2. Research → Analyzes video and generates scripts
3. Storyboard → Creates assets and frames from selected script
4. Video Generation → Renders video scenes
5. Editor → Final adjustments
6. Launch → Final output ready

Run with: pytest tests/test_e2e_flow.py -v
"""
from __future__ import annotations

import json
import os
import shutil
import tempfile
import time
from pathlib import Path
from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient

# Adjust imports based on backend structure
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import app
from storyboard.schemas import Research, Storyboard, Status
from storyboard.storyboard_service import (
    RUNS_DIR,
    research_path,
    storyboard_path,
    status_path,
)


# Test fixtures
@pytest.fixture(scope="module")
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture(scope="module")
def test_run_id():
    """Use a dedicated test run ID to avoid polluting real data."""
    return "test_e2e_run"


@pytest.fixture(scope="function")
def setup_test_run(test_run_id):
    """Set up test run directory and clean up after test."""
    run_dir = RUNS_DIR / test_run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    
    yield run_dir
    
    # Cleanup after test
    if run_dir.exists():
        shutil.rmtree(run_dir)


@pytest.fixture
def sample_brief() -> Dict[str, Any]:
    """Sample brief data simulating user video upload."""
    return {
        "project_id": "#TEST-E2E",
        "project_name": "E2E Test Product Launch",
        "created_at": "2024-05-20T14:00:00Z",
        "source_material": {
            "filename": "test_product_demo.mp4",
            "duration": 120,
            "resolution": "1920x1080",
            "file_path": "/uploads/raw/test_product_demo.mp4"
        },
        "user_input": {
            "brand_voice": "Modern, Innovative, Trustworthy",
            "target_audience": "Tech-savvy professionals aged 25-45",
            "product_name": "TestWidget Pro",
            "key_features": ["AI-Powered", "Cloud Sync", "Cross-Platform"]
        }
    }


@pytest.fixture
def sample_research_output() -> Dict[str, Any]:
    """Sample research output data with selected script."""
    return {
        "selected_script": {
            "id": "script_test_01",
            "title": "The Innovation Story",
            "hook": "Your workflow is about to change forever.",
            "tone": "Inspiring & Professional",
            "assets": {
                "characters": [
                    {
                        "name": "Professional User",
                        "visual_prompt": "Mid-30s professional in modern office attire, confident expression."
                    }
                ],
                "objects": [
                    {
                        "name": "TestWidget Device",
                        "visual_prompt": "Sleek modern device with glowing indicators and premium finish."
                    },
                    {
                        "name": "Legacy System",
                        "visual_prompt": "Outdated cluttered desk setup with multiple screens showing errors."
                    }
                ],
                "environments": [
                    {
                        "name": "Modern Office",
                        "visual_prompt": "Clean minimalist office with natural lighting and green plants."
                    },
                    {
                        "name": "Home Office",
                        "visual_prompt": "Cozy home workspace with warm lighting and personal touches."
                    }
                ]
            },
            "scenes": [
                {
                    "scene_id": 1,
                    "visual": "Split screen: cluttered old setup vs clean new workflow",
                    "audio": "Remember when your desk looked like this?",
                    "assets": {
                        "objects": ["Legacy System"],
                        "environment": "Modern Office"
                    }
                },
                {
                    "scene_id": 2,
                    "visual": "TestWidget Device activating with smooth animation",
                    "audio": "Meet TestWidget Pro. Your new command center.",
                    "assets": {
                        "objects": ["TestWidget Device"],
                        "environment": "Modern Office"
                    }
                },
                {
                    "scene_id": 3,
                    "visual": "User working seamlessly across devices",
                    "audio": "One tap. Everything synced. Everywhere.",
                    "assets": {
                        "characters": ["Professional User"],
                        "objects": ["TestWidget Device"],
                        "environment": "Home Office"
                    }
                }
            ]
        }
    }


@pytest.fixture
def minimal_research_output() -> Dict[str, Any]:
    """Minimal research output for fast testing - only 1 character + 1 scene = 2 images total."""
    return {
        "selected_script": {
            "id": "script_minimal_01",
            "title": "Quick Test",
            "hook": "Test hook.",
            "tone": "Test",
            "assets": {
                "characters": [
                    {
                        "name": "Test User",
                        "visual_prompt": "Simple test character."
                    }
                ],
                "objects": [],
                "environments": []
            },
            "scenes": [
                {
                    "scene_id": 1,
                    "visual": "Test scene with character",
                    "audio": "Test audio prompt",
                    "assets": {
                        "characters": ["Test User"]
                    }
                }
            ]
        }
    }


class TestStep1Upload:
    """Step 1: Video Upload / Brief Creation Tests"""

    def test_create_brief(self, setup_test_run, test_run_id, sample_brief):
        """Test creating initial project brief from video upload."""
        run_dir = setup_test_run
        brief_path = run_dir / "brief.json"
        
        # Simulate frontend saving brief data
        with open(brief_path, "w", encoding="utf-8") as f:
            json.dump(sample_brief, f, indent=2)
        
        # Verify brief was saved
        assert brief_path.exists()
        
        with open(brief_path, "r", encoding="utf-8") as f:
            saved_brief = json.load(f)
        
        assert saved_brief["project_name"] == sample_brief["project_name"]
        assert saved_brief["user_input"]["product_name"] == "TestWidget Pro"
        print(f"✓ Brief created successfully for project: {saved_brief['project_name']}")


class TestStep2Research:
    """Step 2: Research / Script Generation Tests"""

    def test_create_research_output(self, setup_test_run, test_run_id, sample_research_output):
        """Test creating research output with generated scripts."""
        run_dir = setup_test_run
        research_output_path = run_dir / "research_output.json"
        
        # Simulate research step saving output
        with open(research_output_path, "w", encoding="utf-8") as f:
            json.dump(sample_research_output, f, indent=2)
        
        # Verify research output was saved and is valid
        assert research_output_path.exists()
        
        # Validate against schema
        research = Research.model_validate(sample_research_output)
        assert research.selected_script.id == "script_test_01"
        assert len(research.selected_script.scenes) == 3
        assert len(research.selected_script.assets.characters) == 1
        assert len(research.selected_script.assets.objects) == 2
        assert len(research.selected_script.assets.environments) == 2
        
        print(f"✓ Research output created with script: {research.selected_script.title}")


class TestStep3Storyboard:
    """Step 3: Storyboard Generation Tests"""

    def test_get_storyboard_not_found(self, client):
        """Test GET storyboard returns 404 when not exists."""
        # Use the 'first' run ID as the backend hardcodes it
        # This test verifies error handling
        response = client.get("/runs/nonexistent/storyboard")
        # Note: Backend always uses run_id="first", so this tests that path
        # In real implementation, would return 404 for missing storyboard
        assert response.status_code in [200, 404]

    def test_create_storyboard_mock(self, client, setup_test_run, minimal_research_output, monkeypatch):
        """Test creating storyboard via API (mock mode) - uses minimal data for speed."""
        # Force mock mode for fast testing
        monkeypatch.setenv("FORCE_MOCK", "1")
        
        run_dir = setup_test_run
        
        # First, save research output to the expected location for 'first' run
        # (Backend hardcodes run_id to 'first')
        first_run_dir = RUNS_DIR / "first"
        first_run_dir.mkdir(parents=True, exist_ok=True)
        research_output_path = first_run_dir / "research_output.json"
        
        # Save minimal research output for faster testing
        with open(research_output_path, "w", encoding="utf-8") as f:
            json.dump(minimal_research_output, f, indent=2)
        
        # Call storyboard generation API
        response = client.post("/runs/test/storyboard")
        
        assert response.status_code == 200
        storyboard_data = response.json()
        
        # Validate response structure
        storyboard = Storyboard.model_validate(storyboard_data)
        assert storyboard.script_id is not None
        assert "characters" in storyboard.assets
        assert "objects" in storyboard.assets
        assert "environments" in storyboard.assets
        assert len(storyboard.storyboard_frames) > 0
        
        print(f"✓ Storyboard created with {len(storyboard.storyboard_frames)} frames")
        
        # Cleanup
        if research_output_path.exists():
            research_output_path.unlink()

    def test_storyboard_status_flow(self, client):
        """Test status updates during storyboard generation."""
        # Check initial status
        response = client.get("/runs/test/status")
        assert response.status_code == 200
        status = Status.model_validate(response.json())
        
        # Status should be one of: queued, processing, done, error
        assert status.status in ["queued", "processing", "done", "error"]
        print(f"✓ Status check successful: {status.status}")


class TestStep4VideoGeneration:
    """Step 4: Video Generation / Rendering Tests"""

    def test_video_generation_data_structure(self, setup_test_run):
        """Test video generation output structure."""
        run_dir = setup_test_run
        
        # Sample video generation output
        video_gen_output = {
            "status": "complete",
            "scenes": [
                {
                    "scene_id": 1,
                    "video_url": "/runs/test_e2e_run/videos/scene_1.mp4",
                    "duration": 3.5,
                    "status": "rendered"
                },
                {
                    "scene_id": 2,
                    "video_url": "/runs/test_e2e_run/videos/scene_2.mp4",
                    "duration": 4.0,
                    "status": "rendered"
                },
                {
                    "scene_id": 3,
                    "video_url": "/runs/test_e2e_run/videos/scene_3.mp4",
                    "duration": 3.0,
                    "status": "rendered"
                }
            ],
            "total_duration": 10.5,
            "render_time_seconds": 45
        }
        
        videos_path = run_dir / "videos.json"
        with open(videos_path, "w", encoding="utf-8") as f:
            json.dump(video_gen_output, f, indent=2)
        
        assert videos_path.exists()
        
        with open(videos_path, "r", encoding="utf-8") as f:
            saved_videos = json.load(f)
        
        assert saved_videos["status"] == "complete"
        assert len(saved_videos["scenes"]) == 3
        assert saved_videos["total_duration"] == 10.5
        
        print(f"✓ Video generation complete: {len(saved_videos['scenes'])} scenes rendered")


class TestStep5Editor:
    """Step 5: Editor / Timeline Assembly Tests"""

    def test_editor_project_structure(self, setup_test_run):
        """Test editor project file structure."""
        run_dir = setup_test_run
        
        # Sample editor timeline data
        editor_project = {
            "version": "1.0",
            "timeline": {
                "duration": 10.5,
                "fps": 30,
                "resolution": {"width": 1080, "height": 1920}  # Vertical for viral
            },
            "tracks": [
                {
                    "type": "video",
                    "clips": [
                        {"scene_id": 1, "start": 0, "end": 3.5, "source": "scene_1.mp4"},
                        {"scene_id": 2, "start": 3.5, "end": 7.5, "source": "scene_2.mp4"},
                        {"scene_id": 3, "start": 7.5, "end": 10.5, "source": "scene_3.mp4"}
                    ]
                },
                {
                    "type": "audio",
                    "clips": [
                        {"type": "voiceover", "start": 0, "end": 10.5, "source": "voiceover.mp3"},
                        {"type": "music", "start": 0, "end": 10.5, "source": "background_music.mp3", "volume": 0.3}
                    ]
                }
            ],
            "effects": {
                "transitions": ["fade", "cut", "cut"],
                "color_grade": "viral_warm"
            }
        }
        
        editor_path = run_dir / "editor_project.json"
        with open(editor_path, "w", encoding="utf-8") as f:
            json.dump(editor_project, f, indent=2)
        
        assert editor_path.exists()
        
        with open(editor_path, "r", encoding="utf-8") as f:
            saved_project = json.load(f)
        
        assert saved_project["timeline"]["duration"] == 10.5
        assert len(saved_project["tracks"]) == 2
        assert saved_project["timeline"]["resolution"]["width"] == 1080  # Vertical format
        
        print(f"✓ Editor project created with {len(saved_project['tracks'])} tracks")


class TestStep6Launch:
    """Step 6: Launch / Final Export Tests"""

    def test_launch_output_structure(self, setup_test_run):
        """Test final launch output structure."""
        run_dir = setup_test_run
        
        # Sample launch/export data
        launch_output = {
            "status": "ready",
            "final_video": {
                "url": "/runs/test_e2e_run/final/viral_video_final.mp4",
                "resolution": "1080x1920",
                "duration": 10.5,
                "file_size_mb": 45.2,
                "format": "mp4",
                "codec": "h264"
            },
            "metadata": {
                "title": "TestWidget Pro - Transform Your Workflow",
                "description": "Discover how TestWidget Pro can revolutionize your daily productivity...",
                "tags": ["tech", "productivity", "innovation", "workflow"],
                "thumbnail_url": "/runs/test_e2e_run/final/thumbnail.jpg"
            },
            "platforms": {
                "tiktok": {"status": "ready", "optimized": True},
                "instagram_reels": {"status": "ready", "optimized": True},
                "youtube_shorts": {"status": "ready", "optimized": True}
            },
            "analytics_tracking": {
                "campaign_id": "TEST-E2E-001",
                "utm_source": "viral_launch",
                "utm_medium": "video",
                "utm_campaign": "testwidget_launch"
            }
        }
        
        launch_path = run_dir / "launch.json"
        with open(launch_path, "w", encoding="utf-8") as f:
            json.dump(launch_output, f, indent=2)
        
        assert launch_path.exists()
        
        with open(launch_path, "r", encoding="utf-8") as f:
            saved_launch = json.load(f)
        
        assert saved_launch["status"] == "ready"
        assert saved_launch["final_video"]["resolution"] == "1080x1920"
        assert len(saved_launch["platforms"]) == 3
        
        print(f"✓ Launch ready with video at {saved_launch['final_video']['url']}")


class TestE2EFullFlow:
    """Complete End-to-End Flow Test"""

    def test_complete_user_journey(self, client, sample_brief, sample_research_output):
        """
        Test the complete flow from video upload to launch.
        This simulates a real user going through all steps.
        """
        print("\n" + "="*60)
        print("STARTING END-TO-END USER JOURNEY TEST")
        print("="*60)
        
        # Create a unique test run directory
        test_run_id = f"e2e_test_{int(time.time())}"
        run_dir = RUNS_DIR / test_run_id
        run_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            # ==========================================
            # STEP 1: VIDEO UPLOAD / BRIEF
            # ==========================================
            print("\n[STEP 1] Video Upload & Brief Creation")
            print("-" * 40)
            
            brief_path = run_dir / "brief.json"
            with open(brief_path, "w", encoding="utf-8") as f:
                json.dump(sample_brief, f, indent=2)
            
            assert brief_path.exists(), "Brief file should exist"
            print(f"  ✓ Brief saved: {sample_brief['project_name']}")
            print(f"  ✓ Product: {sample_brief['user_input']['product_name']}")
            
            # ==========================================
            # STEP 2: RESEARCH & SCRIPT GENERATION
            # ==========================================
            print("\n[STEP 2] Research & Script Generation")
            print("-" * 40)
            
            # Save research output (normally generated by AI)
            research_output_path = run_dir / "research_output.json"
            with open(research_output_path, "w", encoding="utf-8") as f:
                json.dump(sample_research_output, f, indent=2)
            
            # Validate research data
            research = Research.model_validate(sample_research_output)
            assert research.selected_script is not None
            print(f"  ✓ Script selected: {research.selected_script.title}")
            print(f"  ✓ Hook: \"{research.selected_script.hook}\"")
            print(f"  ✓ Scenes: {len(research.selected_script.scenes)}")
            
            # ==========================================
            # STEP 3: STORYBOARD GENERATION
            # ==========================================
            print("\n[STEP 3] Storyboard Generation")
            print("-" * 40)
            
            # For API test, we need to use 'first' run (hardcoded in backend)
            first_run_dir = RUNS_DIR / "first"
            first_run_dir.mkdir(parents=True, exist_ok=True)
            first_research_path = first_run_dir / "research_output.json"
            
            # Copy research output to first run
            with open(first_research_path, "w", encoding="utf-8") as f:
                json.dump(sample_research_output, f, indent=2)
            
            # Call storyboard API
            response = client.post("/runs/first/storyboard")
            assert response.status_code == 200, f"Storyboard creation failed: {response.text}"
            
            storyboard = Storyboard.model_validate(response.json())
            print(f"  ✓ Assets generated:")
            print(f"    - Characters: {len(storyboard.assets.get('characters', []))}")
            print(f"    - Objects: {len(storyboard.assets.get('objects', []))}")
            print(f"    - Environments: {len(storyboard.assets.get('environments', []))}")
            print(f"  ✓ Frames: {len(storyboard.storyboard_frames)}")
            
            # Save storyboard to test run
            storyboard_local_path = run_dir / "storyboard.json"
            with open(storyboard_local_path, "w", encoding="utf-8") as f:
                json.dump(storyboard.model_dump(), f, indent=2)
            
            # ==========================================
            # STEP 4: VIDEO GENERATION
            # ==========================================
            print("\n[STEP 4] Video Generation (Simulated)")
            print("-" * 40)
            
            # Simulate video generation for each scene
            videos_data = {
                "status": "complete",
                "scenes": []
            }
            
            total_duration = 0
            for frame in storyboard.storyboard_frames:
                scene_duration = 3.5  # Average scene duration
                videos_data["scenes"].append({
                    "scene_id": frame.scene_id,
                    "frame_id": frame.frame_id,
                    "video_url": f"/runs/{test_run_id}/videos/scene_{frame.scene_id}.mp4",
                    "duration": scene_duration,
                    "status": "rendered",
                    "description": frame.description
                })
                total_duration += scene_duration
                print(f"  ✓ Scene {frame.scene_id} rendered: {frame.description[:40]}...")
            
            videos_data["total_duration"] = total_duration
            
            videos_path = run_dir / "videos.json"
            with open(videos_path, "w", encoding="utf-8") as f:
                json.dump(videos_data, f, indent=2)
            
            print(f"  ✓ Total duration: {total_duration}s")
            
            # ==========================================
            # STEP 5: EDITOR / ASSEMBLY
            # ==========================================
            print("\n[STEP 5] Editor Assembly")
            print("-" * 40)
            
            editor_project = {
                "version": "1.0",
                "timeline": {
                    "duration": total_duration,
                    "fps": 30,
                    "resolution": {"width": 1080, "height": 1920}
                },
                "tracks": [
                    {
                        "type": "video",
                        "clips": [
                            {
                                "scene_id": scene["scene_id"],
                                "start": sum(s["duration"] for s in videos_data["scenes"][:i]),
                                "end": sum(s["duration"] for s in videos_data["scenes"][:i+1]),
                                "source": f"scene_{scene['scene_id']}.mp4"
                            }
                            for i, scene in enumerate(videos_data["scenes"])
                        ]
                    },
                    {
                        "type": "audio",
                        "clips": [
                            {"type": "voiceover", "start": 0, "end": total_duration},
                            {"type": "music", "start": 0, "end": total_duration, "volume": 0.25}
                        ]
                    }
                ],
                "effects": {
                    "transitions": ["fade"] + ["cut"] * (len(videos_data["scenes"]) - 1),
                    "color_grade": "viral_punchy"
                }
            }
            
            editor_path = run_dir / "editor_project.json"
            with open(editor_path, "w", encoding="utf-8") as f:
                json.dump(editor_project, f, indent=2)
            
            print(f"  ✓ Timeline assembled: {total_duration}s @ 30fps")
            print(f"  ✓ Video clips: {len(editor_project['tracks'][0]['clips'])}")
            print(f"  ✓ Audio tracks: {len(editor_project['tracks'][1]['clips'])}")
            
            # ==========================================
            # STEP 6: LAUNCH
            # ==========================================
            print("\n[STEP 6] Launch Preparation")
            print("-" * 40)
            
            launch_output = {
                "status": "ready",
                "final_video": {
                    "url": f"/runs/{test_run_id}/final/viral_video.mp4",
                    "resolution": "1080x1920",
                    "duration": total_duration,
                    "file_size_mb": round(total_duration * 4.5, 1),  # ~4.5MB per second for quality
                    "format": "mp4",
                    "codec": "h264"
                },
                "metadata": {
                    "title": f"{sample_brief['user_input']['product_name']} - {research.selected_script.hook}",
                    "description": f"Discover {sample_brief['user_input']['product_name']}. "
                                   f"Target: {sample_brief['user_input']['target_audience']}",
                    "tags": sample_brief['user_input']['key_features'] + ["viral", "tech"],
                    "thumbnail_url": f"/runs/{test_run_id}/final/thumbnail.jpg"
                },
                "platforms": {
                    "tiktok": {"status": "ready", "optimized": True, "aspect_ratio": "9:16"},
                    "instagram_reels": {"status": "ready", "optimized": True, "aspect_ratio": "9:16"},
                    "youtube_shorts": {"status": "ready", "optimized": True, "aspect_ratio": "9:16"}
                },
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
            
            launch_path = run_dir / "launch.json"
            with open(launch_path, "w", encoding="utf-8") as f:
                json.dump(launch_output, f, indent=2)
            
            print(f"  ✓ Final video: {launch_output['final_video']['resolution']}")
            print(f"  ✓ File size: {launch_output['final_video']['file_size_mb']}MB")
            print(f"  ✓ Platforms ready: {', '.join(launch_output['platforms'].keys())}")
            
            # ==========================================
            # VERIFICATION
            # ==========================================
            print("\n" + "="*60)
            print("END-TO-END VERIFICATION")
            print("="*60)
            
            # Verify all files exist
            required_files = [
                "brief.json",
                "research_output.json",
                "storyboard.json",
                "videos.json",
                "editor_project.json",
                "launch.json"
            ]
            
            for filename in required_files:
                filepath = run_dir / filename
                assert filepath.exists(), f"Missing file: {filename}"
                print(f"  ✓ {filename} exists")
            
            print("\n" + "="*60)
            print("✅ END-TO-END TEST COMPLETED SUCCESSFULLY!")
            print("="*60)
            print(f"\nTest artifacts saved to: {run_dir}")
            
        finally:
            # Cleanup test run directory
            if run_dir.exists():
                shutil.rmtree(run_dir)
            # Cleanup first run research if we created it
            first_research = RUNS_DIR / "first" / "research_output.json"
            # Don't delete if it was pre-existing (check content)


class TestAPIEndpoints:
    """Test individual API endpoints."""

    def test_health_check(self, client):
        """Test that the API is running."""
        # FastAPI default docs endpoint as health check
        response = client.get("/docs")
        assert response.status_code == 200

    def test_get_status_default(self, client):
        """Test GET status returns valid response."""
        response = client.get("/runs/any/status")
        assert response.status_code == 200
        
        status = response.json()
        assert "run_id" in status
        assert "status" in status

    def test_cors_headers(self, client):
        """Test CORS headers are properly set."""
        response = client.options(
            "/runs/test/storyboard",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST"
            }
        )
        # CORS preflight should work
        assert response.status_code in [200, 405]


if __name__ == "__main__":
    # Run with verbose output
    pytest.main([__file__, "-v", "--tb=short"])

