import asyncio
import json
import os
from video_generator import run_storyboard_pipeline_from_data
from video_generator.models import StoryboardInput


# Configuration
API_KEY = os.environ.get("GOOGLE_API_KEY", "")
IMAGE_BASE_PATH = os.environ.get(
    "IMAGE_BASE_PATH",
    "../frontend/public",
)
INPUT_JSON_PATH = "../frontend/public/runs/first/storyboard.json"
OUTPUT_VIDEO_DIR = "../frontend/public/sample-inputs/"
OUTPUT_JSON_PATH = "../frontend/public/runs/first/video_generation.json"


async def main():
    # Read input from JSON file
    print(f"Reading input from {INPUT_JSON_PATH}...")
    with open(INPUT_JSON_PATH, "r") as f:
        sample_data = json.load(f)
    storyboard_input = StoryboardInput(**sample_data)

    # Delegate all transformation and pipeline work to video_generator.pipeline
    result = await run_storyboard_pipeline_from_data(
        storyboard_input,
        api_key=API_KEY,
        output_dir=OUTPUT_VIDEO_DIR,
        image_base_path=IMAGE_BASE_PATH,
    )

    print("\nStoryboard pipeline finished successfully!")
    print(f"Status: {result.status}")
    print(f"Generated clips: {len(result.generated_clips)}")

    # Save to videos.json in the run directory
    print(f"\nSaving output to {OUTPUT_JSON_PATH}...")
    with open(OUTPUT_JSON_PATH, "w") as f:
        # Use Pydantic v2 JSON export
        f.write(result.model_dump_json(indent=2))
    print("Output saved successfully!")


if __name__ == "__main__":
    asyncio.run(main())
