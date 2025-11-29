import os

from fastapi import FastAPI, HTTPException

from .models import StoryboardInput, StoryboardVideoGenerationOutput
from .pipeline import run_storyboard_pipeline_from_data


app = FastAPI(title="Video Generator Service")


@app.post(
    "/generate-from-storyboard",
    response_model=StoryboardVideoGenerationOutput,
)
async def generate_from_storyboard(
    payload: StoryboardInput,
) -> StoryboardVideoGenerationOutput:
    """
    Accepts storyboard-style JSON, runs the video generation pipeline,
    and returns structured clip metadata JSON (no files), shaped like
    backend/test_video_generator.py's output model.

    Environment variables:
        - GOOGLE_API_KEY: Google API key for Veo
        - OUTPUT_VIDEO_DIR: directory where generated videos will be stored
        - IMAGE_BASE_PATH: base directory for resolving storyboard image paths
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    output_dir = os.getenv("OUTPUT_VIDEO_DIR")
    image_base_path = os.getenv("IMAGE_BASE_PATH")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Environment variable GOOGLE_API_KEY is not set.",
        )

    if not output_dir:
        raise HTTPException(
            status_code=500,
            detail="Environment variable OUTPUT_VIDEO_DIR is not set.",
        )

    if not image_base_path:
        raise HTTPException(
            status_code=500,
            detail="Environment variable IMAGE_BASE_PATH is not set.",
        )

    result = await run_storyboard_pipeline_from_data(
        storyboard_input=payload,
        api_key=api_key,
        output_dir=output_dir,
        image_base_path=image_base_path,
    )
    return result


