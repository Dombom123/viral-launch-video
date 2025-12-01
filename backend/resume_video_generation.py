#!/usr/bin/env python3
"""
Resume video generation - skips already completed videos.
Usage: python resume_video_generation.py <run_id>
"""

import asyncio
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, str(Path(__file__).parent))

from video_generator.veo_client import VeoClient
from video_generator.models import StoryboardInput

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT_DIR / "frontend" / "public"
RUNS_DIR = PUBLIC_DIR / "runs"


def get_existing_videos(videos_dir: Path) -> set:
    """Get set of scene numbers that already have videos."""
    existing = set()
    if videos_dir.exists():
        for f in videos_dir.glob("scene_*.mp4"):
            # Extract scene number from filename like scene_1.mp4
            try:
                num = int(f.stem.split("_")[1])
                existing.add(num)
            except (IndexError, ValueError):
                pass
    return existing


async def generate_single_video(
    veo_client: VeoClient,
    frame: dict,
    image_url: str,
    output_dir: Path,
    scene_num: int,
):
    """Generate a single video for a frame."""
    prompt = f"Style: cinematic, Pixar-style 3D animation. Action: {frame['description']}. {frame.get('audio_prompt', '')}"
    
    print(f"  🎬 Generating scene {scene_num}...")
    print(f"     Prompt: {prompt[:100]}...")
    
    try:
        result_path = await asyncio.to_thread(
            veo_client.generate_clip,
            prompt=prompt,
            image_url=image_url,
            output_dir=str(output_dir),
            video_id=f"scene_{scene_num}",
        )
        print(f"  ✅ Scene {scene_num} completed: {result_path}")
        return True
    except Exception as e:
        print(f"  ❌ Scene {scene_num} failed: {e}")
        return False


async def resume_generation(run_id: str):
    """Resume video generation for a run, skipping completed videos."""
    run_dir = RUNS_DIR / run_id
    storyboard_path = run_dir / "storyboard.json"
    videos_dir = run_dir / "videos"
    
    print("=" * 60)
    print(f"Resume Video Generation: {run_id}")
    print("=" * 60)
    
    # Check for API key
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("ERROR: GOOGLE_API_KEY not set")
        return False
    
    # Load storyboard
    if not storyboard_path.exists():
        print(f"ERROR: {storyboard_path} not found")
        return False
    
    with open(storyboard_path) as f:
        storyboard = json.load(f)
    
    frames = storyboard["storyboard_frames"]
    total_frames = len(frames)
    
    # Check existing videos
    videos_dir.mkdir(parents=True, exist_ok=True)
    existing = get_existing_videos(videos_dir)
    
    print(f"\n📊 Status:")
    print(f"   Total frames: {total_frames}")
    print(f"   Already completed: {len(existing)} - {sorted(existing)}")
    print(f"   Remaining: {total_frames - len(existing)}")
    
    # Filter frames that need generation
    pending_frames = []
    for frame in frames:
        scene_id = int(frame["scene_id"])
        if scene_id not in existing:
            pending_frames.append(frame)
    
    if not pending_frames:
        print("\n✅ All videos already generated!")
        return True
    
    print(f"\n🎬 Generating {len(pending_frames)} remaining videos...")
    print("-" * 40)
    
    # Initialize Veo client with image_base_path for resolving relative URLs
    veo_client = VeoClient(api_key=api_key, image_base_path=str(PUBLIC_DIR))
    
    # Generate videos one at a time to avoid rate limits
    success_count = 0
    for frame in pending_frames:
        scene_id = int(frame["scene_id"])
        image_url = frame["image_url"]  # e.g. "/runs/second/frames/scene-01.png"
        
        success = await generate_single_video(
            veo_client, frame, image_url, videos_dir, scene_id
        )
        
        if success:
            success_count += 1
        
        # Small delay between requests to help with rate limits
        if pending_frames.index(frame) < len(pending_frames) - 1:
            print("  ⏳ Waiting 5s before next video...")
            await asyncio.sleep(5)
    
    print("-" * 40)
    print(f"\n✅ Generated {success_count}/{len(pending_frames)} videos")
    
    # Update video_generation.json with actual paths
    update_video_generation_json(run_dir, storyboard)
    
    return success_count == len(pending_frames)


def update_video_generation_json(run_dir: Path, storyboard: dict):
    """Update video_generation.json with actual video paths."""
    videos_dir = run_dir / "videos"
    existing = get_existing_videos(videos_dir)
    
    clips = []
    for frame in storyboard["storyboard_frames"]:
        scene_id = int(frame["scene_id"])
        clip = {
            "clip_id": f"clip_{scene_id:02d}",
            "frame_id": frame["frame_id"],
            "duration": 5.0,
            "video_url": f"/runs/{run_dir.name}/videos/scene_{scene_id}.mp4" if scene_id in existing else None,
            "thumbnail_url": frame["image_url"],
            "description": frame["description"],
            "audio_prompt": frame.get("audio_prompt", ""),
            "text_overlay": frame.get("text_overlay", ""),
            "status": "completed" if scene_id in existing else "pending",
        }
        clips.append(clip)
    
    all_completed = all(c["status"] == "completed" for c in clips)
    
    output = {
        "status": "completed" if all_completed else "partial",
        "generated_clips": clips,
    }
    
    output_path = run_dir / "video_generation.json"
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Updated {output_path}")


async def main():
    if len(sys.argv) < 2:
        print("Usage: python resume_video_generation.py <run_id> [run_id2] ...")
        sys.exit(1)
    
    for run_id in sys.argv[1:]:
        await resume_generation(run_id)
        print("\n")


if __name__ == "__main__":
    asyncio.run(main())

