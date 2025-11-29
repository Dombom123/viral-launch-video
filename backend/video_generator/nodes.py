from typing import List
import asyncio
from pydantic_graph import BaseNode, End
from .state import VideoGenerationState
from .models import GeneratedClip, SceneOutput, ProjectOutput
from .veo_client import VeoClient


class ValidateInputNode(BaseNode[VideoGenerationState]):
    async def run(self, ctx: VideoGenerationState) -> "GenerateScenesNode":
        print("Validating input...")
        # Basic validation is handled by Pydantic models on input
        # We could add more complex logic here if needed
        return GenerateScenesNode()


class GenerateScenesNode(BaseNode[VideoGenerationState]):
    async def run(self, ctx: VideoGenerationState) -> "FinalizeNode":
        print("Generating scenes...")
        input_data = ctx.state.input_data
        character_desc = (
            f"{input_data.character.name}: {input_data.character.personality}"
        )

        # Initialize VeoClient with API key from state
        veo_client = VeoClient(
            api_key=ctx.state.api_key,
            image_base_path=ctx.state.image_base_path,
        )

        async def process_scene(scene) -> SceneOutput:
            print(f"Processing Scene {scene.scene_number}: {scene.scene_title}")
            clips: List[GeneratedClip] = []

            # Generate 1 clip per scene
            prompt = (
                f"Style: {input_data.concept.style}. "
                f"Character: {character_desc}. "
                f"Action: {scene.action_description}."
            )

            # Generate unique video ID
            import uuid

            video_id = f"scene_{scene.scene_number}"

            # Run blocking Veo client call in a separate thread
            import asyncio

            clip_url = await asyncio.to_thread(
                veo_client.generate_clip,
                prompt,
                image_url=scene.image,
                output_dir=ctx.state.output_dir,
                video_id=video_id,
            )

            clips.append(GeneratedClip(clip_url=clip_url, prompt_used=prompt))
            return SceneOutput(scene_number=scene.scene_number, clips=clips)

        # Create tasks for all scenes
        tasks = [process_scene(scene) for scene in input_data.storyboard]

        # Run tasks in parallel
        generated_scenes = await asyncio.gather(*tasks)

        # Update state with all generated scenes
        ctx.state.generated_scenes.extend(generated_scenes)

        return FinalizeNode()


class FinalizeNode(BaseNode[VideoGenerationState]):
    async def run(self, ctx: VideoGenerationState) -> End:
        print("Finalizing project...")
        ctx.state.project_output = ProjectOutput(
            project_title=ctx.state.input_data.project_title,
            scenes=ctx.state.generated_scenes,
        )
        return End(ctx.state.project_output)
