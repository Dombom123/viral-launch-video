import asyncio
from video_generator import run_pipeline, VideoGenerationInput


async def main():
    sample_data = {
        "project_title": "aiCanto Launch Video",
        "concept": {
            "title": "Rusty’s Writer’s Block",
            "genre": "3D Animated Short / Product Demo",
            "style": "High-end 3D Animation (Pixar/Illumination style)",
            "premise": "The video visualizes the lonely, chaotic struggle of creativity. We follow a frantic screenwriter who is overwhelmed by ideas until he uses aiCanto. The software's AI agents are represented as literal holographic teammates in his room, turning a solitary struggle into a collaborative party.",
        },
        "character": {
            "name": "Rusty the Raccoon",
            "personality": "The 'manic creative.' High energy but zero focus. Prone to dramatic sighs, chugging espresso from a tiny mug, and pacing around the room.",
            "role": "Rusty represents the user's pain point. He interacts with the software not just by typing, but by physically gesturing to the holographic projections of the aiCanto agents.",
            "image": "http://example.com/rusty.png",
        },
        "storyboard": [
            {
                "scene_number": 1,
                "scene_title": "The Creative Slump",
                "action_description": "We open on a cluttered, dimly lit home office. Rusty is slumped over his laptop, defeated. Piles of crumpled paper litter the floor. He bangs his head gently against the keyboard. A 'Writer's Block' cloud hangs over him. He is lonely and stuck.",
                "image": "http://example.com/scene1.png",
            }
        ],
    }

    print("Initializing input model...")
    input_model = VideoGenerationInput(**sample_data)

    print("Running pipeline...")
    # Hardcoded API key for testing
    api_key = "AIzaSyDlHifa_lQWeSOSuARYsPLbLaR0GQRwhl0"
    result = await run_pipeline(input_model, api_key=api_key)

    print("\nPipeline finished successfully!")
    print(f"Project: {result.project_title}")
    for scene in result.scenes:
        print(f"\nScene {scene.scene_number}:")
        for i, clip in enumerate(scene.clips):
            print(f"  Clip {i+1}: {clip.clip_url}")
            print(f"  Prompt: {clip.prompt_used[:50]}...")


if __name__ == "__main__":
    asyncio.run(main())
