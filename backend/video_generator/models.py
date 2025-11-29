from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl


# ============================================================================
# INPUT MODELS FOR ORIGINAL PIPELINE
# ============================================================================


class Concept(BaseModel):
    title: str
    genre: str
    style: str
    premise: str


class Character(BaseModel):
    name: str
    personality: str
    role: str
    image: str = Field(..., description="URL to the character image")


class StoryboardScene(BaseModel):
    scene_number: int
    scene_title: str
    action_description: str
    image: str = Field(..., description="URL to the storyboard scene image")


class VideoGenerationInput(BaseModel):
    project_title: str
    concept: Concept
    character: Character
    storyboard: List[StoryboardScene]


# ============================================================================
# INPUT MODELS FOR STORYBOARD JSON
# ============================================================================


class StoryboardCharacter(BaseModel):
    id: str
    name: str
    image_url: str
    status: str


class StoryboardObject(BaseModel):
    id: str
    name: str
    image_url: str
    status: str


class StoryboardEnvironment(BaseModel):
    id: str
    name: str
    image_url: str
    status: str


class StoryboardAssets(BaseModel):
    characters: List[StoryboardCharacter] = []
    objects: List[StoryboardObject] = []
    environments: List[StoryboardEnvironment] = []


class StoryboardFrame(BaseModel):
    frame_id: int
    scene_id: int
    description: str
    # Can be a web URL or a path like "/runs/first/frames/frame1.png"
    image_url: str
    # Optional audio prompt that will be combined into the scene prompt
    audio_prompt: str


class StoryboardInput(BaseModel):
    script_id: str
    assets: StoryboardAssets
    storyboard_frames: List[StoryboardFrame]


# ============================================================================
# PIPELINE OUTPUT MODELS
# ============================================================================


class GeneratedClip(BaseModel):
    clip_url: str
    prompt_used: str


class SceneOutput(BaseModel):
    scene_number: int
    clips: List[GeneratedClip]


class ProjectOutput(BaseModel):
    project_title: str
    scenes: List[SceneOutput]


# ============================================================================
# STORYBOARD VIDEO GENERATION OUTPUT (FRONTEND-FACING)
# ============================================================================


class StoryboardGeneratedClip(BaseModel):
    clip_id: str
    frame_id: int
    duration: float
    video_url: str
    thumbnail_url: str


class StoryboardVideoGenerationOutput(BaseModel):
    status: str
    generated_clips: List[StoryboardGeneratedClip]
