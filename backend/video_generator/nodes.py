from typing import List
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
        veo_client = VeoClient(api_key=ctx.state.api_key)

        for i, scene in enumerate(input_data.storyboard):
            print(f"Processing Scene {scene.scene_number}: {scene.scene_title}")
            clips: List[GeneratedClip] = []

            # Generate 1 clip per scene
            prompt = (
                f"Style: {input_data.concept.style}. "
                f"Character: {character_desc}. "
                f"Action: {scene.action_description}."
            )
            clip_url = veo_client.generate_clip(prompt, image_url=scene.image)
            clips.append(GeneratedClip(clip_url=clip_url, prompt_used=prompt))

            ctx.generated_scenes.append(
                SceneOutput(scene_number=scene.scene_number, clips=clips)
            )

        return FinalizeNode()


class FinalizeNode(BaseNode[VideoGenerationState]):
    async def run(self, ctx: VideoGenerationState) -> End:
        print("Finalizing project...")
        ctx.state.project_output = ProjectOutput(
            project_title=ctx.state.input_data.project_title,
            scenes=ctx.state.generated_scenes,
        )
        return End(ctx.state.project_output)
