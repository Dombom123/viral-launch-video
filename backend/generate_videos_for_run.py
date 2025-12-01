#!/usr/bin/env python3
"""
Generate videos for a specific run using Veo.
Usage: python generate_videos_for_run.py <run_id>
"""

import asyncio
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from video_generator import run_storyboard_pipeline_from_data
from video_generator.models import StoryboardInput


# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT_DIR / "frontend" / "public"
RUNS_DIR = PUBLIC_DIR / "runs"


async def generate_videos_for_run(run_id: str):
    """Generate videos for a specific run."""
    run_dir = RUNS_DIR / run_id
    storyboard_path = run_dir / "storyboard.json"
    output_json_path = run_dir / "video_generation.json"
    videos_dir = run_dir / "videos"
    
    # Create videos directory
    videos_dir.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print(f"Video Generator for Run: {run_id}")
    print("=" * 60)
    
    # Check for API key
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("ERROR: GOOGLE_API_KEY environment variable is not set.")
        sys.exit(1)
    
    # Check storyboard exists
    if not storyboard_path.exists():
        print(f"ERROR: {storyboard_path} not found")
        sys.exit(1)
    
    # Read storyboard
    print(f"\n📖 Reading storyboard from {storyboard_path}...")
    with open(storyboard_path, "r") as f:
        storyboard_data = json.load(f)
    
    storyboard_input = StoryboardInput(**storyboard_data)
    print(f"   Found {len(storyboard_input.storyboard_frames)} frames to generate")
    
    # Configuration
    image_base_path = str(PUBLIC_DIR)
    output_dir = str(videos_dir)
    
    print(f"\n🎬 Starting video generation...")
    print(f"   Output directory: {output_dir}")
    print(f"   Image base path: {image_base_path}")
    
    try:
        result = await run_storyboard_pipeline_from_data(
            storyboard_input=storyboard_input,
            api_key=api_key,
            output_dir=output_dir,
            image_base_path=image_base_path,
        )
        
        print(f"\n✅ Video generation completed!")
        print(f"   Status: {result.status}")
        print(f"   Generated clips: {len(result.generated_clips)}")
        
        # Update video URLs to be relative to public folder
        output_data = result.model_dump()
        for clip in output_data["generated_clips"]:
            # Convert absolute path to relative URL
            video_path = Path(clip["video_url"])
            if video_path.is_absolute():
                try:
                    relative = video_path.relative_to(PUBLIC_DIR)
                    clip["video_url"] = "/" + str(relative)
                except ValueError:
                    pass
        
        # Add description and text_overlay from storyboard
        for clip in output_data["generated_clips"]:
            frame_id = clip["frame_id"]
            for frame in storyboard_data["storyboard_frames"]:
                if frame["frame_id"] == frame_id:
                    clip["description"] = frame["description"]
                    clip["audio_prompt"] = frame["audio_prompt"]
                    if "text_overlay" in frame:
                        clip["text_overlay"] = frame["text_overlay"]
                    break
        
        # Save output
        print(f"\n💾 Saving to {output_json_path}...")
        with open(output_json_path, "w") as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print("✅ Done!")
        
    except Exception as e:
        print(f"\n❌ Error during video generation: {e}")
        raise


async def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_videos_for_run.py <run_id> [run_id2] ...")
        print("Example: python generate_videos_for_run.py second third")
        sys.exit(1)
    
    run_ids = sys.argv[1:]
    
    for run_id in run_ids:
        await generate_videos_for_run(run_id)
        print("\n" + "-" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())


