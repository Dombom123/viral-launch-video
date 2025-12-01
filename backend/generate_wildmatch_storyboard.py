#!/usr/bin/env python3
"""
Generate storyboard images for the WildMatch dating app ad.
Uses Gemini 2.0 Flash to generate all images in parallel.
"""

import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai.types import GenerateContentConfig

load_dotenv()

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT_DIR / "frontend" / "public"
RUNS_DIR = PUBLIC_DIR / "runs"
RUN_ID = "third"
RUN_DIR = RUNS_DIR / RUN_ID

# Consistent style prefix for all images
STYLE_PREFIX = "Colorful Pixar-style 3D animation, expressive cartoon animals with big eyes, warm lighting, cinematic composition, high quality render. IMPORTANT: Do not include any text, words, letters, or writing in the image. Single scene only, no split screens or multiple panels."


def get_client():
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY not set")
    return genai.Client(api_key=api_key)


def generate_image(client, prompt: str, dest_path: Path) -> str:
    """Generate an image and save it to dest_path."""
    full_prompt = f"{STYLE_PREFIX}. {prompt}"
    print(f"  Generating: {dest_path.name}...")
    
    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=f"Generate an image: {full_prompt}",
            config=GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )
        
        image_bytes = None
        if response.candidates:
            for part in response.candidates[0].content.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    if part.inline_data.mime_type and part.inline_data.mime_type.startswith("image/"):
                        image_bytes = part.inline_data.data
                        break
        
        if not image_bytes:
            print(f"  ⚠ No image in response for {dest_path.name}")
            return None
        
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        dest_path.write_bytes(image_bytes)
        print(f"  ✓ Saved: {dest_path.name}")
        
        # Return URL path relative to public folder
        return "/" + "/".join(dest_path.parts[dest_path.parts.index("public") + 1:])
    
    except Exception as e:
        print(f"  ✗ Error generating {dest_path.name}: {e}")
        return None


def main():
    print("=" * 60)
    print("WildMatch Storyboard Generator")
    print("=" * 60)
    
    # Load research output
    research_path = RUN_DIR / "research_output.json"
    if not research_path.exists():
        print(f"Error: {research_path} not found")
        return
    
    with open(research_path) as f:
        research = json.load(f)
    
    script = research["selected_script"]
    scenes = script["scenes"]
    objects = script["assets"]["objects"]
    environments = script["assets"]["environments"]
    
    print(f"\nRun ID: {RUN_ID}")
    print(f"Scenes: {len(scenes)}")
    print(f"Objects: {len(objects)}")
    print(f"Environments: {len(environments)}")
    
    # Initialize client
    client = get_client()
    print("\n✓ Gemini client initialized")
    
    # Prepare directories
    frame_dir = RUN_DIR / "frames"
    obj_dir = RUN_DIR / "objects"
    env_dir = RUN_DIR / "environments"
    for d in (frame_dir, obj_dir, env_dir):
        d.mkdir(parents=True, exist_ok=True)
    
    # Prepare all image generation tasks
    tasks = []
    
    # Scene frames (8 scenes)
    print("\n📽 Preparing scene frames...")
    for scene in scenes:
        scene_id = scene["scene_id"]
        prompt = f"Scene for dating app ad: {scene['visual']}"
        dest = frame_dir / f"scene-{scene_id}.png"
        tasks.append({
            "type": "frame",
            "id": scene_id,
            "prompt": prompt,
            "dest": dest,
            "scene": scene,
        })
    
    # Objects
    print("📦 Preparing objects...")
    for i, obj in enumerate(objects, start=1):
        prompt = f"Object for dating app ad: {obj['name']}. {obj['visual_prompt']}"
        dest = obj_dir / f"obj_{i:02d}.png"
        tasks.append({
            "type": "object",
            "id": f"obj_{i:02d}",
            "name": obj["name"],
            "prompt": prompt,
            "dest": dest,
        })
    
    # Environments
    print("🌆 Preparing environments...")
    for i, env in enumerate(environments, start=1):
        prompt = f"Environment for dating app ad: {env['name']}. {env['visual_prompt']}"
        dest = env_dir / f"env_{i:02d}.png"
        tasks.append({
            "type": "environment",
            "id": f"env_{i:02d}",
            "name": env["name"],
            "prompt": prompt,
            "dest": dest,
        })
    
    print(f"\n🎨 Generating {len(tasks)} images in parallel...")
    print("-" * 40)
    
    # Generate all images in parallel
    results = {}
    with ThreadPoolExecutor(max_workers=8) as executor:
        future_to_task = {
            executor.submit(generate_image, client, task["prompt"], task["dest"]): task
            for task in tasks
        }
        
        for future in as_completed(future_to_task):
            task = future_to_task[future]
            task_key = f"{task['type']}_{task['id']}"
            try:
                image_url = future.result()
                results[task_key] = {
                    "image_url": image_url,
                    "task": task,
                }
            except Exception as e:
                print(f"  ✗ Failed {task_key}: {e}")
                results[task_key] = {"image_url": None, "task": task}
    
    print("-" * 40)
    
    # Build storyboard.json
    print("\n📋 Building storyboard.json...")
    
    # Assemble objects
    storyboard_objects = []
    for i, obj in enumerate(objects, start=1):
        task_key = f"object_obj_{i:02d}"
        result = results.get(task_key, {})
        storyboard_objects.append({
            "id": f"obj_{i:02d}",
            "name": obj["name"],
            "image_url": result.get("image_url") or f"/runs/{RUN_ID}/objects/obj_{i:02d}.png",
            "status": "approved" if result.get("image_url") else "failed",
        })
    
    # Assemble environments
    storyboard_environments = []
    for i, env in enumerate(environments, start=1):
        task_key = f"environment_env_{i:02d}"
        result = results.get(task_key, {})
        storyboard_environments.append({
            "id": f"env_{i:02d}",
            "name": env["name"],
            "image_url": result.get("image_url") or f"/runs/{RUN_ID}/environments/env_{i:02d}.png",
            "status": "approved" if result.get("image_url") else "failed",
        })
    
    # Assemble frames
    storyboard_frames = []
    for scene in scenes:
        scene_id = scene["scene_id"]
        task_key = f"frame_{scene_id}"
        result = results.get(task_key, {})
        storyboard_frames.append({
            "frame_id": int(scene_id),
            "scene_id": int(scene_id),
            "description": scene["visual"],
            "image_url": result.get("image_url") or f"/runs/{RUN_ID}/frames/scene-{scene_id}.png",
            "audio_prompt": scene["audio"],
            "text_overlay": scene.get("text_overlay", ""),
        })
    
    storyboard = {
        "script_id": script["id"],
        "assets": {
            "characters": [],  # No separate characters as per request
            "objects": storyboard_objects,
            "environments": storyboard_environments,
        },
        "storyboard_frames": storyboard_frames,
    }
    
    # Save storyboard.json
    storyboard_path = RUN_DIR / "storyboard.json"
    with open(storyboard_path, "w") as f:
        json.dump(storyboard, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved: {storyboard_path}")
    
    # Summary
    successful = sum(1 for r in results.values() if r.get("image_url"))
    print("\n" + "=" * 60)
    print(f"✅ Generation complete!")
    print(f"   Images generated: {successful}/{len(tasks)}")
    print(f"   Storyboard saved to: {storyboard_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()

