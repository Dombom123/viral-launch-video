from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class AssetItem(BaseModel):
    name: str
    visual_prompt: str


class ScriptAssets(BaseModel):
    characters: List[AssetItem]
    objects: List[AssetItem]
    environments: List[AssetItem]


class ScriptScene(BaseModel):
    scene_id: int = Field(..., ge=1)
    visual: str
    audio: str
    assets: Optional[Dict] = None


class SelectedScript(BaseModel):
    id: str
    title: str
    hook: str
    tone: str
    assets: ScriptAssets
    scenes: List[ScriptScene]


class Research(BaseModel):
    """Snapshot produced by the Research step (matches frontend/public/runs/<id>/research_output.json)."""

    selected_script: SelectedScript


class StoryboardAsset(BaseModel):
    id: str
    name: str
    image_url: str
    status: str = "approved"


class StoryboardFrame(BaseModel):
    frame_id: int
    scene_id: int
    description: str
    image_url: str
    audio_prompt: str


class Storyboard(BaseModel):
    """Final storyboard payload persisted to public/runs/<id>/storyboard.json."""

    script_id: str
    assets: Dict[str, List[StoryboardAsset]]
    storyboard_frames: List[StoryboardFrame]


class Status(BaseModel):
    """Lightweight status document persisted as status.json."""

    run_id: str
    status: str
    message: Optional[str] = None
