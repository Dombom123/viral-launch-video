#!/usr/bin/env python3
"""
Generate research data from a video walkthrough using Gemini.
This analyzes the video, generates 3 script concepts, and saves them for cached demo mode.

Usage:
    cd backend
    python generate_research_from_video.py

Make sure GEMINI_API_KEY is set.
"""
import json
import os
import re
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Ensure GEMINI_API_KEY is set (gemini_utils.py requires it)
if os.getenv("GOOGLE_API_KEY") and not os.getenv("GEMINI_API_KEY"):
    os.environ["GEMINI_API_KEY"] = os.getenv("GOOGLE_API_KEY")

from google import genai

from gemini_utils import analyze_walkthrough_for_ads

# Paths
ROOT_DIR = Path(__file__).resolve().parents[1]
PUBLIC_DIR = ROOT_DIR / "frontend" / "public"
RUNS_DIR = PUBLIC_DIR / "runs" / "first"
SAMPLE_INPUTS_DIR = PUBLIC_DIR / "sample-inputs"

# Video to analyze
VIDEO_PATH = SAMPLE_INPUTS_DIR / "Boards App Walkthrough.mp4"


def upload_video_to_gemini(video_path: Path) -> str:
    """Upload video to Gemini File API and return the URI."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)
    
    print(f"[upload] Uploading video: {video_path.name}")
    print(f"[upload] Size: {video_path.stat().st_size / 1024 / 1024:.1f} MB")
    
    # Upload the file
    uploaded_file = client.files.upload(file=video_path)
    
    print(f"[upload] Upload started, URI: {uploaded_file.uri}")
    print(f"[upload] State: {uploaded_file.state}")
    
    # Wait for processing to complete
    while uploaded_file.state.name == "PROCESSING":
        print("[upload] Processing video...")
        time.sleep(5)
        uploaded_file = client.files.get(name=uploaded_file.name)
    
    if uploaded_file.state.name == "FAILED":
        raise RuntimeError(f"Video processing failed: {uploaded_file.state}")
    
    print(f"[upload] ✓ Video ready: {uploaded_file.uri}")
    return uploaded_file.uri


def generate_scripts_from_analysis(analysis: dict) -> list:
    """Generate 3 script concepts from the walkthrough analysis."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key)
    
    # Simplify analysis to reduce token count
    simplified_analysis = {
        "product": analysis.get("product_overview", {}),
        "users": analysis.get("target_users", [])[:2],
        "value_props": analysis.get("core_value_props", [])[:3],
        "ad_angles": analysis.get("ad_angle_ideas", [])[:3],
    }
    
    prompt = f"""Generate 3 ABSURD and FUNNY viral video ad scripts for this product.

PRODUCT ANALYSIS:
{json.dumps(simplified_analysis, indent=2)}

CREATIVE DIRECTION:
- Make it ABSURD and HILARIOUS like a TikTok or meme ad
- MUST include a CUTE ANIMAL character (hamster, cat, corgi, capybara, etc.) as a main character or sidekick
- The animal should be doing something unexpected and funny related to the product
- Think: "What if a hamster was a sales manager?" or "Cat judges your messy workflow"
- Still communicate the product value, but in a ridiculous way
- Gen-Z humor, unexpected twists, chaotic energy

Create 3 DIFFERENT absurd scripts:
1. The Dramatic Animal - Animal character has an over-the-top reaction to the problem/solution
2. The Unexpected Expert - Animal is somehow the expert using the product
3. The Chaos to Calm - Absurd chaotic situation saved by the product (with animal)

For EACH script include:
- id: script_01, script_02, script_03
- title: Catchy funny name
- hook: First attention-grabbing line (max 15 words, funny/absurd)
- body: What happens visually (2-3 sentences, embrace the chaos)
- callToAction: Final CTA (max 8 words, can be funny)
- tone: e.g. "Absurd & Chaotic", "Dramatic Comedy", "Wholesome Chaos"
- estimatedViralScore: 1-10
- assets.characters: array of {{name, visual_prompt}} - MUST include the cute animal!
- assets.objects: array of {{name, visual_prompt}}
- assets.environments: array of {{name, visual_prompt}}
- scenes: array of 3 {{scene_id, visual, audio, assets}}

Return valid JSON only. No markdown. No explanation."""

    print("[scripts] Generating 3 script concepts...")
    
    from google.genai.types import GenerateContentConfig
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.8,
        ),
    )
    
    response_text = response.text
    print(f"[scripts] Response length: {len(response_text)} chars")
    
    # Extract JSON from response if wrapped in markdown
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', response_text)
    if json_match:
        response_text = json_match.group(1).strip()
    
    try:
        data = json.loads(response_text)
        # Handle both {scripts: [...]} and direct array
        if isinstance(data, list):
            scripts = data
        else:
            scripts = data.get("scripts", [])
        print(f"[scripts] ✓ Generated {len(scripts)} scripts")
        return scripts
    except json.JSONDecodeError as e:
        print(f"[scripts] Failed to parse JSON: {e}")
        print(f"[scripts] Response: {response_text[:500]}...")
        # Save for debugging
        (RUNS_DIR / "scripts_raw.txt").write_text(response_text)
        raise


def select_best_script(scripts: list) -> dict:
    """Select the script with the highest viral score."""
    if not scripts:
        raise RuntimeError("No scripts generated")
    
    best = max(scripts, key=lambda s: s.get("estimatedViralScore", 0))
    print(f"[select] Selected: '{best['title']}' (score: {best.get('estimatedViralScore', 'N/A')})")
    return best


def main():
    print("\n" + "=" * 60)
    print("RESEARCH GENERATION FROM VIDEO")
    print("=" * 60)
    
    if not os.getenv("GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
        print("ERROR: Set GEMINI_API_KEY or GOOGLE_API_KEY")
        sys.exit(1)
    
    if not VIDEO_PATH.exists():
        print(f"ERROR: Video not found: {VIDEO_PATH}")
        sys.exit(1)
    
    # Ensure output directory exists
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Step 1: Upload video
    print("\n" + "-" * 40)
    print("STEP 1: Upload Video to Gemini")
    print("-" * 40)
    video_uri = upload_video_to_gemini(VIDEO_PATH)
    
    # Step 2: Analyze walkthrough
    print("\n" + "-" * 40)
    print("STEP 2: Analyze Video Walkthrough")
    print("-" * 40)
    print("[analyze] Running walkthrough analysis...")
    
    result = analyze_walkthrough_for_ads(
        video_uri=video_uri,
        model="gemini-2.5-flash",
        product_context="Visual project management / kanban board app",
        media_resolution="medium",
        thinking_level="high",
    )
    
    if result.get("was_filtered"):
        print(f"[analyze] ✗ Response filtered: {result.get('filter_reason')}")
        sys.exit(1)
    
    analysis_text = result.get("text", "")
    print(f"[analyze] Response length: {len(analysis_text)} chars")
    
    # Parse analysis JSON
    try:
        # Try to extract JSON from potential markdown
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', analysis_text)
        if json_match:
            analysis_text = json_match.group(1).strip()
        analysis = json.loads(analysis_text)
        print("[analyze] ✓ Analysis parsed successfully")
    except json.JSONDecodeError as e:
        print(f"[analyze] Failed to parse analysis JSON: {e}")
        print(f"[analyze] Raw response: {analysis_text[:1000]}...")
        # Save raw response for debugging
        (RUNS_DIR / "analysis_raw.txt").write_text(analysis_text)
        sys.exit(1)
    
    # Save intermediate analysis
    intermediate_path = RUNS_DIR / "example_2_research_intermediate.json"
    with open(intermediate_path, "w") as f:
        json.dump({
            "source_video": f"/sample-inputs/{VIDEO_PATH.name}",
            "walkthrough_analysis": analysis,
        }, f, indent=2)
    print(f"[analyze] ✓ Saved intermediate to {intermediate_path}")
    
    # Step 3: Generate scripts
    print("\n" + "-" * 40)
    print("STEP 3: Generate Script Concepts")
    print("-" * 40)
    scripts = generate_scripts_from_analysis(analysis)
    
    # Step 4: Select best script
    print("\n" + "-" * 40)
    print("STEP 4: Select Best Script")
    print("-" * 40)
    selected_script = select_best_script(scripts)
    
    # Step 5: Save outputs
    print("\n" + "-" * 40)
    print("STEP 5: Save Outputs")
    print("-" * 40)
    
    # Save all scripts for the UI to display
    all_scripts_path = RUNS_DIR / "research.json"
    research_ui_data = {
        "source_video": f"/sample-inputs/{VIDEO_PATH.name}",
        "productInfo": {
            "name": analysis.get("product_overview", {}).get("working_name", "Product"),
            "description": analysis.get("product_overview", {}).get("one_sentence_pitch", ""),
            "targetAudience": ", ".join([
                u.get("segment_name", "") 
                for u in analysis.get("target_users", [])
            ]),
            "competitors": [],  # Could extract from differentiation_hypotheses
        },
        "marketAnalysis": {
            "trend": analysis.get("differentiation_hypotheses", [""])[0] if analysis.get("differentiation_hypotheses") else "",
            "insight": "; ".join(analysis.get("research_goals_for_agent", [])[:2]),
        },
        "scripts": [
            {
                "id": i + 1,
                "title": s["title"],
                "hook": s["hook"],
                "body": s["body"],
                "callToAction": s["callToAction"],
            }
            for i, s in enumerate(scripts)
        ],
    }
    with open(all_scripts_path, "w") as f:
        json.dump(research_ui_data, f, indent=2)
    print(f"[save] ✓ Saved research.json (for UI)")
    
    # Save selected script in the format expected by storyboard generation
    selected_output = {
        "selected_script": {
            "id": selected_script["id"],
            "title": selected_script["title"],
            "hook": selected_script["hook"],
            "tone": selected_script.get("tone", "Engaging"),
            "assets": selected_script.get("assets", {
                "characters": [],
                "objects": [],
                "environments": [],
            }),
            "scenes": selected_script.get("scenes", []),
        }
    }
    
    research_output_path = RUNS_DIR / "research_output.json"
    with open(research_output_path, "w") as f:
        json.dump(selected_output, f, indent=2)
    print(f"[save] ✓ Saved research_output.json (for storyboard)")
    
    # Also save as example file for cached mode
    example_path = RUNS_DIR / "example_2_research_output.json"
    with open(example_path, "w") as f:
        json.dump(selected_output, f, indent=2)
    print(f"[save] ✓ Saved example_2_research_output.json (for cached demo)")
    
    print("\n" + "=" * 60)
    print("✓ RESEARCH GENERATION COMPLETE!")
    print("=" * 60)
    print(f"\nGenerated {len(scripts)} script concepts:")
    for i, s in enumerate(scripts, 1):
        marker = "→" if s["id"] == selected_script["id"] else " "
        print(f"  {marker} {i}. {s['title']}: \"{s['hook'][:40]}...\"")
    print(f"\nSelected: {selected_script['title']}")
    print(f"\nFiles saved to: {RUNS_DIR}")


if __name__ == "__main__":
    main()

