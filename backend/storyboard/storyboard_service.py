from __future__ import annotations

import json
import os
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Dict, List, Tuple

import google.generativeai as genai
from fastapi import HTTPException

from .images import generate_image
from .llm import LLMCharacter, LLMEnvironment, generate_characters, generate_environments
from .schemas import (
    Research,
    Status,
    Storyboard,
    StoryboardAsset,
    StoryboardFrame,
)

# Persist generated artifacts under frontend/public/runs/<id>
# __file__ -> backend/storyboard/storyboard_service.py
# parents[2] -> repo root
ROOT_DIR = Path(__file__).resolve().parents[2]
PUBLIC_DIR = ROOT_DIR / "frontend" / "public"
RUNS_DIR = PUBLIC_DIR / "runs"
SAMPLE_INPUTS_DIR = PUBLIC_DIR / "sample-inputs"


def _load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def status_path(run_id: str) -> Path:
    return RUNS_DIR / run_id / "status.json"


def storyboard_path(run_id: str) -> Path:
    return RUNS_DIR / run_id / "storyboard.json"


def research_path(run_id: str) -> Path:
    # Input snapshot produced by the Research step
    return RUNS_DIR / run_id / "research_output.json"


def load_research(run_id: str) -> Research:
    path = research_path(run_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="research.json not found for run")
    return Research.model_validate(_load_json(path))


def write_status(status: Status) -> None:
    _write_json(status_path(status.run_id), status.model_dump())


def mock_generate_storyboard(run_id: str, research: Research) -> Storyboard:
    run_dir = RUNS_DIR / run_id
    char_dir = run_dir / "characters"
    obj_dir = run_dir / "objects"
    env_dir = run_dir / "environments"
    frame_dir = run_dir / "frames"
    for d in (char_dir, obj_dir, env_dir, frame_dir):
        d.mkdir(parents=True, exist_ok=True)
    script = research.selected_script

    def _copy_sample(src_name: str, dest: Path) -> str:
        src = SAMPLE_INPUTS_DIR / src_name
        try:
            if src.exists():
                shutil.copy(src, dest)
            else:
                dest.write_text(f"placeholder for {src_name}", encoding="utf-8")
        except Exception:
            dest.write_text(f"placeholder for {src_name}", encoding="utf-8")
        return "/" + "/".join(dest.parts[dest.parts.index("public") + 1 :])

    assets = {
        "characters": [
            StoryboardAsset(
                id="char_01",
                name="Tech User",
                image_url=_copy_sample("character1.png", char_dir / "char_01.png"),
                status="approved",
            )
        ],
        "objects": [
            StoryboardAsset(
                id="obj_01",
                name="EcoBottle 3000",
                image_url=_copy_sample("object_bottle.png", obj_dir / "obj_01.png"),
                status="approved",
            ),
            StoryboardAsset(
                id="obj_02",
                name="Dirty Bottle",
                image_url=_copy_sample("object_dirty_bottle.png", obj_dir / "obj_02.png"),
                status="approved",
            ),
        ],
        "environments": [
            StoryboardAsset(
                id="env_01",
                name="Dark Lab",
                image_url=_copy_sample("env_lab.png", env_dir / "env_01.png"),
                status="approved",
            ),
            StoryboardAsset(
                id="env_02",
                name="Modern Loft",
                image_url=_copy_sample("env_loft.png", env_dir / "env_02.png"),
                status="approved",
            ),
        ],
    }

    storyboard_frames: List[StoryboardFrame] = [
        StoryboardFrame(
            frame_id=1,
            scene_id=1,
            description="Extreme macro shot of dirty bottle rim.",
            image_url=_copy_sample("scene1.png", frame_dir / "frame1.png"),
            audio_prompt="Stop. Look at your water bottle rim.",
        ),
        StoryboardFrame(
            frame_id=2,
            scene_id=2,
            description="EcoBottle 3000 cap glowing Blue vs bacteria.",
            image_url=_copy_sample("scene2.png", frame_dir / "frame2.png"),
            audio_prompt="This is the solution.",
        ),
        StoryboardFrame(
            frame_id=3,
            scene_id=3,
            description="Finger taps cap. Bacteria disintegrate.",
            image_url=_copy_sample("scene3.png", frame_dir / "frame3.png"),
            audio_prompt="One tap. 99.9% eliminated.",
        ),
    ]

    return Storyboard(
        script_id=script.id,
        assets=assets,
        storyboard_frames=storyboard_frames,
    )


def _slugify(name: str) -> str:
    return (
        name.lower()
        .replace(" ", "-")
        .replace("/", "-")
        .replace("_", "-")
    )


def generate_storyboard(run_id: str, research: Research) -> Storyboard:
    script = research.selected_script

    # Write generated assets to sample-inputs to mirror example outputs
    char_dir = SAMPLE_INPUTS_DIR / "characters"
    env_dir = SAMPLE_INPUTS_DIR / "environments"
    obj_dir = SAMPLE_INPUTS_DIR / "objects"
    frame_dir = SAMPLE_INPUTS_DIR / "frames"
    for d in (char_dir, env_dir, obj_dir, frame_dir):
        d.mkdir(parents=True, exist_ok=True)

    # PHASE 1: Parallel LLM calls for characters and environments
    print("[storyboard] Phase 1: Generating characters and environments in parallel...")
    with ThreadPoolExecutor(max_workers=2) as executor:
        characters_future = executor.submit(generate_characters, research)
        environments_future = executor.submit(generate_environments, research)
        characters: List[LLMCharacter] = characters_future.result()
        environments: List[LLMEnvironment] = environments_future.result()
    print(f"[storyboard] Got {len(characters)} characters, {len(environments)} environments")

    # PHASE 2: Parallel image generation for ALL assets
    # Prepare all image generation tasks
    image_tasks: List[Tuple[str, str, str, Path, dict]] = []
    
    # Character images
    for char in characters:
        image_tasks.append((
            "character",
            char.id,
            f"Portrait: {char.name}. {char.role}. {char.description}.",
            char_dir / f"{char.id}.png",
            {"name": char.name},
        ))
    
    # Object images
    for obj in script.assets.objects:
        oid = _slugify(obj.name)
        image_tasks.append((
            "object",
            oid,
            f"Product object: {obj.name}. {obj.visual_prompt}. Studio lighting, product shot.",
            obj_dir / f"{oid}.png",
            {"name": obj.name},
        ))
    
    # Environment images
    for env in environments:
        image_tasks.append((
            "environment",
            env.id,
            f"Environment: {env.name}. {env.description}.",
            env_dir / f"{env.id}.png",
            {"name": env.name},
        ))
    
    # Frame images
    for idx, scene in enumerate(script.scenes, start=1):
        image_tasks.append((
            "frame",
            str(idx),
            f"Storyboard frame for scene {scene.scene_id}: {scene.visual}",
            frame_dir / f"scene-{scene.scene_id}.png",
            {"scene_id": scene.scene_id, "visual": scene.visual, "audio": scene.audio},
        ))

    print(f"[storyboard] Phase 2: Generating {len(image_tasks)} images in parallel...")
    
    # Execute all image generations in parallel
    results: Dict[str, Dict[str, Any]] = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_task = {
            executor.submit(generate_image, prompt, dest): (task_type, task_id, extra)
            for task_type, task_id, prompt, dest, extra in image_tasks
        }
        for future in as_completed(future_to_task):
            task_type, task_id, extra = future_to_task[future]
            try:
                image_path = future.result()
                results[f"{task_type}_{task_id}"] = {"image_url": image_path, **extra}
                print(f"[storyboard] ✓ Generated {task_type} {task_id}")
            except Exception as exc:
                print(f"[storyboard] ✗ Failed {task_type} {task_id}: {exc}")
                raise

    print("[storyboard] Phase 3: Assembling storyboard...")
    
    # Assemble character assets
    character_assets: List[StoryboardAsset] = []
    for char in characters:
        result = results[f"character_{char.id}"]
        character_assets.append(
            StoryboardAsset(
                id=char.id,
                name=result["name"],
                image_url=result["image_url"],
                status="approved",
            )
        )

    # Assemble object assets
    object_assets: List[StoryboardAsset] = []
    for obj in script.assets.objects:
        oid = _slugify(obj.name)
        result = results[f"object_{oid}"]
        object_assets.append(
            StoryboardAsset(
                id=oid,
                name=result["name"],
                image_url=result["image_url"],
                status="approved",
            )
        )

    # Assemble environment assets
    environment_assets: List[StoryboardAsset] = []
    for env in environments:
        result = results[f"environment_{env.id}"]
        environment_assets.append(
            StoryboardAsset(
                id=env.id,
                name=result["name"],
                image_url=result["image_url"],
                status="approved",
            )
        )

    # Assemble storyboard frames
    storyboard_frames: List[StoryboardFrame] = []
    for idx, scene in enumerate(script.scenes, start=1):
        result = results[f"frame_{idx}"]
        storyboard_frames.append(
            StoryboardFrame(
                frame_id=idx,
                scene_id=result["scene_id"],
                description=result["visual"],
                image_url=result["image_url"],
                audio_prompt=result["audio"],
            )
        )

    assets = {
        "characters": character_assets,
        "objects": object_assets,
        "environments": environment_assets,
    }

    print("[storyboard] ✓ Storyboard generation complete!")
    return Storyboard(
        script_id=script.id,
        assets=assets,
        storyboard_frames=storyboard_frames,
    )


def choose_generator() -> bool:
    """Return True if Gemini is configured and should be used; otherwise fallback to mock."""
    # Allow forcing mock mode for testing
    if os.getenv("FORCE_MOCK", "").lower() in ("1", "true", "yes"):
        return False
    return bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))


def configure_gemini_if_needed() -> None:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if api_key:
        os.environ.setdefault("GEMINI_API_KEY", api_key)
        genai.configure(api_key=api_key)
