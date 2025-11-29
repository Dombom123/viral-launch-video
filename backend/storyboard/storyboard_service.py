from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List

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
    script = research.selected_script

    assets = {
        "characters": [
            StoryboardAsset(
                id="char_01",
                name="Tech User",
                image_url="/sample-inputs/character1.png",
                status="approved",
            )
        ],
        "objects": [
            StoryboardAsset(
                id="obj_01",
                name="EcoBottle 3000",
                image_url="/sample-inputs/object_bottle.png",
                status="approved",
            ),
            StoryboardAsset(
                id="obj_02",
                name="Dirty Bottle",
                image_url="/sample-inputs/object_dirty_bottle.png",
                status="approved",
            ),
        ],
        "environments": [
            StoryboardAsset(
                id="env_01",
                name="Dark Lab",
                image_url="/sample-inputs/env_lab.png",
                status="approved",
            ),
            StoryboardAsset(
                id="env_02",
                name="Modern Loft",
                image_url="/sample-inputs/env_loft.png",
                status="approved",
            ),
        ],
    }

    storyboard_frames: List[StoryboardFrame] = [
        StoryboardFrame(
            frame_id=1,
            scene_id=1,
            description="Extreme macro shot of dirty bottle rim.",
            image_url="/sample-inputs/scene1.png",
            audio_prompt="Stop. Look at your water bottle rim.",
        ),
        StoryboardFrame(
            frame_id=2,
            scene_id=2,
            description="EcoBottle 3000 cap glowing Blue vs bacteria.",
            image_url="/sample-inputs/scene2.png",
            audio_prompt="This is the solution.",
        ),
        StoryboardFrame(
            frame_id=3,
            scene_id=3,
            description="Finger taps cap. Bacteria disintegrate.",
            image_url="/sample-inputs/scene3.png",
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

    run_dir = RUNS_DIR / run_id
    char_dir = run_dir / "characters"
    env_dir = run_dir / "environments"
    obj_dir = run_dir / "objects"
    frame_dir = run_dir / "frames"
    for d in (char_dir, env_dir, obj_dir, frame_dir):
        d.mkdir(parents=True, exist_ok=True)

    # Characters via LLM
    characters: List[LLMCharacter] = generate_characters(research)
    character_assets: List[StoryboardAsset] = []
    for char in characters:
        image_path = generate_image(
            f"Portrait: {char.name}. {char.role}. {char.description}.",
            char_dir / f"{char.id}.png",
        )
        character_assets.append(
            StoryboardAsset(
                id=char.id,
                name=char.name,
                image_url=image_path,
                status="approved",
            )
        )

    # Environments via LLM
    environments: List[LLMEnvironment] = generate_environments(research)
    environment_assets: List[StoryboardAsset] = []
    for env in environments:
        image_path = generate_image(
            f"Environment: {env.name}. {env.description}.",
            env_dir / f"{env.id}.png",
        )
        environment_assets.append(
            StoryboardAsset(
                id=env.id,
                name=env.name,
                image_url=image_path,
                status="approved",
            )
        )

    # Objects from script assets
    object_assets: List[StoryboardAsset] = []
    for obj in script.assets.objects:
        oid = _slugify(obj.name)
        image_path = generate_image(
            f"Product object: {obj.name}. {obj.visual_prompt}. Studio lighting, product shot.",
            obj_dir / f"{oid}.png",
        )
        object_assets.append(
            StoryboardAsset(
                id=oid,
                name=obj.name,
                image_url=image_path,
                status="approved",
            )
        )

    # Scenes to frames
    storyboard_frames: List[StoryboardFrame] = []
    for idx, scene in enumerate(script.scenes, start=1):
        # Optional: generate a frame image; use scene id in filename
        frame_image_path = generate_image(
            f"Storyboard frame for scene {scene.scene_id}: {scene.visual}",
            frame_dir / f"scene-{scene.scene_id}.png",
        )
        storyboard_frames.append(
            StoryboardFrame(
                frame_id=idx,
                scene_id=scene.scene_id,
                description=scene.visual,
                image_url=frame_image_path,
                audio_prompt=scene.audio,
            )
        )

    assets = {
        "characters": character_assets,
        "objects": object_assets,
        "environments": environment_assets,
    }

    return Storyboard(
        script_id=script.id,
        assets=assets,
        storyboard_frames=storyboard_frames,
    )


def choose_generator() -> bool:
    """Return True if Gemini is configured and should be used; otherwise fallback to mock."""
    return bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))


def configure_gemini_if_needed() -> None:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if api_key:
        os.environ.setdefault("GEMINI_API_KEY", api_key)
        genai.configure(api_key=api_key)
