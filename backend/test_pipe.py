import asyncio
from video_generator import run_pipeline, VideoGenerationInput


async def main():
    # Read input from JSON file
    import json

    input_file = "/Users/nikitakonstantinovskiy/Development/GeminiHack/viral-launch-video/frontend/public/runs/first/generate.json"
    print(f"Reading input from {input_file}...")
    with open(input_file, "r") as f:
        sample_data = json.load(f)

    print("Initializing input model...")
    input_model = VideoGenerationInput(**sample_data)

    print("Running pipeline...")
    # Hardcoded API key for testing
    api_key = "AIzaSyDGxMRLkf-dO5GRvGSRhgYFUMm0UCjwsvQ"
    # Hardcoded output directory for generated videos
    output_dir = "/Users/nikitakonstantinovskiy/Development/GeminiHack/viral-launch-video/frontend/public/sample-inputs/videos"
    result = await run_pipeline(input_model, api_key=api_key, output_dir=output_dir)

    print("\nPipeline finished successfully!")
    print(f"Project: {result.project_title}")
    for scene in result.scenes:
        print(f"\nScene {scene.scene_number}:")
        for i, clip in enumerate(scene.clips):
            print(f"  Clip {i+1}: {clip.clip_url}")
            print(f"  Prompt: {clip.prompt_used[:50]}...")


if __name__ == "__main__":
    asyncio.run(main())
