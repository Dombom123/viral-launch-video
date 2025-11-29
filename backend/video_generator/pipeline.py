from pydantic_graph import Graph
from .state import VideoGenerationState
from .nodes import ValidateInputNode, GenerateScenesNode, FinalizeNode
from .models import VideoGenerationInput, ProjectOutput

# Define the graph
video_generation_graph = Graph(
    nodes=[ValidateInputNode, GenerateScenesNode, FinalizeNode]
)


async def run_pipeline(
    input_data: VideoGenerationInput, api_key: str, output_dir: str = None
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
        input_data=input_data, api_key=api_key, output_dir=output_dir
    )
    # Start the graph execution with the initial node
    result = await video_generation_graph.run(ValidateInputNode(), state=state)
    return result.output
