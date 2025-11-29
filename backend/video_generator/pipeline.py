from typing import Any, Dict, List, Optional

from pydantic_graph import Graph
from .state import VideoGenerationState
from .nodes import ValidateInputNode, GenerateScenesNode, FinalizeNode
from .models import (
    VideoGenerationInput,
    ProjectOutput,
    Concept,
    Character,
    StoryboardScene,
    StoryboardInput,
    StoryboardVideoGenerationOutput,
    StoryboardGeneratedClip,
)

# Define the graph
video_generation_graph = Graph(
    nodes=[ValidateInputNode, GenerateScenesNode, FinalizeNode]
)


async def run_pipeline(
    input_data: VideoGenerationInput,
    api_key: str,
    output_dir: Optional[str] = None,
    image_base_path: Optional[str] = None,
) -> ProjectOutput:
    """
    Runs the video generation pipeline.

    Args:
        input_data: The structured input for video generation.
        api_key: Google API key for Veo authentication.
        output_dir: Optional directory to save generated videos.

    Returns:
        ProjectOutput: The result containing generated clips.
    """
    state = VideoGenerationState(
        input_data=input_data,
        api_key=api_key,
        output_dir=output_dir,
        image_base_path=image_base_path,
    )
    # Start the graph execution with the initial node
    result = await video_generation_graph.run(ValidateInputNode(), state=state)
    return result.output


async def run_storyboard_pipeline_from_data(
    storyboard_input: StoryboardInput,
    api_key: str,
    output_dir: Optional[str] = None,
    image_base_path: Optional[str] = None,
) -> StoryboardVideoGenerationOutput:
    """
    High-level helper that takes storyboard.json-shaped data, runs the
    core video generation pipeline, and returns frontend-ready output
    shaped like example_4_video_generation.json.
    """
    # Parse storyboard JSON with Pydantic
    print("Storyboard input initialized successfully!")
    print(f"Script ID: {storyboard_input.script_id}")
    print(f"Frames: {len(storyboard_input.storyboard_frames)}")

    # Map storyboard_frames -> VideoGenerationInput expected by the pipeline
    # Prompts are a combination of description and audio_prompt
    if storyboard_input.assets.characters:
        first_char = storyboard_input.assets.characters[0]
        character = Character(
            name=first_char.name,
            personality="",
            role="",
            image=first_char.image_url,
        )
    else:
        character = Character(
            name="Default Character",
            personality="",
            role="",
            image="",
        )

    concept = Concept(
        title=f"Script {storyboard_input.script_id}",
        genre="ad",
        style="cinematic",
        premise="Generated from storyboard frames",
    )

    storyboard_scenes: List[StoryboardScene] = []
    for frame in storyboard_input.storyboard_frames:
        combined_description = f"{frame.description} {frame.audio_prompt}"
        storyboard_scenes.append(
            StoryboardScene(
                scene_number=frame.frame_id,
                scene_title=f"Frame {frame.frame_id}",
                action_description=combined_description,
                image=str(frame.image_url),
            )
        )

    input_model = VideoGenerationInput(
        project_title=concept.title,
        concept=concept,
        character=character,
        storyboard=storyboard_scenes,
    )

    print("VideoGenerationInput model initialized successfully!")
    print(f"Project: {input_model.project_title}")
    print(f"Scenes: {len(input_model.storyboard)}")

    # Run the core pipeline
    project_result = await run_pipeline(
        input_model,
        api_key=api_key,
        output_dir=output_dir,
        image_base_path=image_base_path,
    )

    print("\nPipeline finished successfully!")
    print(f"Project: {project_result.project_title}")

    # Prepare output in the shape of example_4_video_generation.json
    clips_output: List[StoryboardGeneratedClip] = []

    # Map scenes (one clip per scene) back to storyboard frames by frame_id
    frames_by_id = {
        frame.frame_id: frame for frame in storyboard_input.storyboard_frames
    }

    for idx, scene in enumerate(project_result.scenes, start=1):
        print(f"\nScene {scene.scene_number}:")

        if not scene.clips:
            print("  No clips generated for this scene.")
            continue

        clip = scene.clips[0]
        print(f"  Clip: {clip.clip_url}")
        print(f"  Prompt: {clip.prompt_used[:50]}...")

        frame = frames_by_id.get(scene.scene_number)
        thumbnail_url = str(frame.image_url) if frame is not None else ""

        clip_id = f"clip_{idx:02d}"

        clips_output.append(
            StoryboardGeneratedClip(
                clip_id=clip_id,
                frame_id=scene.scene_number,
                duration=8.0,
                video_url=clip.clip_url,
                thumbnail_url=thumbnail_url,
            )
        )

    return StoryboardVideoGenerationOutput(
        status="completed",
        generated_clips=clips_output,
    )
