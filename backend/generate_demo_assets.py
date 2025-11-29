#!/usr/bin/env python3
"""
Generate storyboard assets for the selected script.
Uses the Capybara's Chill script with absurd/funny visuals.

Usage:
    cd backend
    python generate_demo_assets.py
"""
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

# Ensure GEMINI_API_KEY is set
if os.getenv("GOOGLE_API_KEY") and not os.getenv("GEMINI_API_KEY"):
    os.environ["GEMINI_API_KEY"] = os.getenv("GOOGLE_API_KEY")

from storyboard.images import generate_image

# Paths
ROOT_DIR = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT_DIR / "frontend" / "public"
RUNS_DIR = PUBLIC_DIR / "runs" / "first"

# Asset directories
CHAR_DIR = RUNS_DIR / "characters"
OBJ_DIR = RUNS_DIR / "objects"
ENV_DIR = RUNS_DIR / "environments"
FRAME_DIR = RUNS_DIR / "frames"

# Create directories
for d in (CHAR_DIR, OBJ_DIR, ENV_DIR, FRAME_DIR):
    d.mkdir(parents=True, exist_ok=True)


def generate_asset(prompt: str, dest: Path, name: str) -> str:
    """Generate a single asset and return its public URL."""
    print(f"\n{'='*60}")
    print(f"🎨 Generating: {name}")
    print(f"📝 Prompt: {prompt[:80]}...")
    print(f"📁 Destination: {dest.name}")
    print("="*60)
    
    try:
        url = generate_image(prompt, dest)
        print(f"✅ Success! → {url}")
        return url
    except Exception as e:
        print(f"❌ Failed: {e}")
        raise


def main():
    print("\n" + "🎬"*30)
    print("STORYBOARD ASSET GENERATOR")
    print("Script: The Capybara's Chill - Surviving the Digital Deluge")
    print("🎬"*30)
    
    if not os.getenv("GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
        print("ERROR: Set GEMINI_API_KEY or GOOGLE_API_KEY")
        sys.exit(1)

    # Assets based on the selected Capybara script
    assets = {
        "characters": [
            {
                "id": "char_01",
                "name": "Zen Capybara",
                "prompt": "A large adorable capybara wearing tiny stylish black sunglasses, sitting calmly with an utterly unbothered serene expression, soft fur, cute face, studio lighting, centered composition, high quality illustration style",
            },
            {
                "id": "char_02", 
                "name": "Panicked Sales Rep",
                "prompt": "A stressed disheveled office worker, messy hair, loosened tie, sweat on forehead, wide panicked eyes, holding multiple phones, surrounded by chaos, comic exaggerated expression, illustration style",
            },
        ],
        "objects": [
            {
                "id": "testwidget-device",
                "name": "Tiny Capybara Smartphone",
                "prompt": "A miniature cute smartphone perfectly sized for tiny paws, showing a clean organized app interface with colorful folders, kawaii style, product shot, white background",
            },
            {
                "id": "legacy-system",
                "name": "Chaos Notification Explosion",
                "prompt": "Explosive burst of notification bubbles, chat icons, email alerts, social media icons, red warning badges, all flying chaotically, digital art style, dramatic lighting",
            },
        ],
        "environments": [
            {
                "id": "env_01",
                "name": "Overwhelmed Home Office",
                "prompt": "Cluttered chaotic home office desk, tangled wires everywhere, multiple monitors showing error messages, coffee cups, crumpled papers, post-it notes covering everything, stressed atmosphere, wide shot",
            },
            {
                "id": "env_02",
                "name": "Digital Vortex",
                "prompt": "Swirling colorful abstract digital vortex background, representing internet chaos, neon colors, data streams, notification icons floating, cyberpunk aesthetic, dramatic",
            },
            {
                "id": "env_03",
                "name": "Zen Oasis Corner",
                "prompt": "Peaceful calm corner with soft lighting, minimal design, a small plant, warm sunbeam, tranquil atmosphere contrasting with chaos, cozy serene space",
            },
        ],
        "frames": [
            {
                "id": "scene-1",
                "scene_id": 1,
                "description": "Chaos scene - Panicked rep surrounded by notifications",
                "prompt": "Split scene: stressed office worker surrounded by exploding notifications and multiple screens, chaotic home office, swirling alerts everywhere, dramatic overwhelmed moment, comic illustration style, wide shot",
                "audio": "Chaotic soundscape: phone rings, notification pings, stressed muttering",
            },
            {
                "id": "scene-2",
                "scene_id": 2,
                "description": "Reveal - Zen Capybara calmly using Boards",
                "prompt": "Adorable capybara wearing tiny sunglasses sitting serenely in foreground, calmly using a tiny smartphone, chaos and notifications swirling in background but capybara is unbothered, zen peaceful expression, soft glow around capybara, illustration style",
                "audio": "Sudden shift to calm lo-fi chillhop music",
            },
            {
                "id": "scene-3",
                "scene_id": 3,
                "description": "Resolution - Capybara winks, everyone is calm",
                "prompt": "Close-up of adorable capybara giving a knowing wink to camera, tiny sunglasses, holding tiny invisible coconut drink, peaceful satisfied expression, soft warm lighting, the word 'Zen' floating nearby, cute illustration style",
                "audio": "Find your Zen. Get Boards now.",
            },
        ],
    }

    # Track generated assets
    generated = {"characters": [], "objects": [], "environments": []}
    frames = []

    # Generate characters
    print("\n" + "🐹"*20)
    print("PHASE 1: CHARACTERS")
    print("🐹"*20)
    for char in assets["characters"]:
        dest = CHAR_DIR / f"{char['id']}.png"
        url = generate_asset(char["prompt"], dest, char["name"])
        generated["characters"].append({
            "id": char["id"],
            "name": char["name"],
            "image_url": url,
            "status": "approved"
        })

    # Generate objects
    print("\n" + "📱"*20)
    print("PHASE 2: OBJECTS")
    print("📱"*20)
    for obj in assets["objects"]:
        dest = OBJ_DIR / f"{obj['id']}.png"
        url = generate_asset(obj["prompt"], dest, obj["name"])
        generated["objects"].append({
            "id": obj["id"],
            "name": obj["name"],
            "image_url": url,
            "status": "approved"
        })

    # Generate environments
    print("\n" + "🏠"*20)
    print("PHASE 3: ENVIRONMENTS")
    print("🏠"*20)
    for env in assets["environments"]:
        dest = ENV_DIR / f"{env['id']}.png"
        url = generate_asset(env["prompt"], dest, env["name"])
        generated["environments"].append({
            "id": env["id"],
            "name": env["name"],
            "image_url": url,
            "status": "approved"
        })

    # Generate frames
    print("\n" + "🎬"*20)
    print("PHASE 4: STORYBOARD FRAMES")
    print("🎬"*20)
    for idx, frame in enumerate(assets["frames"], start=1):
        dest = FRAME_DIR / f"{frame['id']}.png"
        url = generate_asset(frame["prompt"], dest, f"Scene {frame['scene_id']}: {frame['description'][:30]}...")
        frames.append({
            "frame_id": idx,
            "scene_id": frame["scene_id"],
            "description": frame["description"],
            "image_url": url,
            "audio_prompt": frame["audio"]
        })

    # Generate storyboard JSON
    storyboard = {
        "script_id": "script_03",
        "assets": generated,
        "storyboard_frames": frames
    }

    # Save storyboard JSON
    storyboard_path = RUNS_DIR / "storyboard.json"
    with open(storyboard_path, "w") as f:
        json.dump(storyboard, f, indent=2)
    print(f"\n✅ Saved storyboard.json")

    # Also save as example for cached mode
    example_path = RUNS_DIR / "example_3_storyboard.json"
    with open(example_path, "w") as f:
        json.dump(storyboard, f, indent=2)
    print(f"✅ Saved example_3_storyboard.json")

    print("\n" + "🎉"*30)
    print("ALL ASSETS GENERATED!")
    print("🎉"*30)
    print(f"\n📊 Summary:")
    print(f"   🐹 Characters: {len(generated['characters'])}")
    print(f"   📱 Objects: {len(generated['objects'])}")
    print(f"   🏠 Environments: {len(generated['environments'])}")
    print(f"   🎬 Frames: {len(frames)}")
    print(f"\n📁 Files saved to: {RUNS_DIR}")
    print("\n✨ Ready for cached demo mode!")


if __name__ == "__main__":
    main()
