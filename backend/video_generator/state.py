from dataclasses import dataclass, field
from typing import List, Optional
from .models import VideoGenerationInput, ProjectOutput, SceneOutput


@dataclass
class VideoGenerationState:
    input_data: VideoGenerationInput
    api_key: str
    project_output: Optional[ProjectOutput] = None
    current_scene_index: int = 0
    generated_scenes: List[SceneOutput] = field(default_factory=list)
