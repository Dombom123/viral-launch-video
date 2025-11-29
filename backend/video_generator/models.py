from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl


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


class GeneratedClip(BaseModel):
    clip_url: str
    prompt_used: str


class SceneOutput(BaseModel):
    scene_number: int
    clips: List[GeneratedClip]


class ProjectOutput(BaseModel):
    project_title: str
    scenes: List[SceneOutput]
