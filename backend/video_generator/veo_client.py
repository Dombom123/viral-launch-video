from typing import Optional
import tempfile
import requests
import time
from pathlib import Path
from google import genai
from google.genai import types


class VeoClient:
    def __init__(self, api_key: str):
        """Initialize the Veo client using Google Genai SDK.

        Args:
            api_key: Google API key for authentication.
        """
        self.api_key = api_key
        self.client = genai.Client(api_key=api_key)

    def generate_clip(
        self,
        prompt: str,
        image_url: Optional[str] = None,
        output_dir: Optional[str] = None,
        video_id: Optional[str] = None,
    ) -> str:
        """
        Generates a video clip using Veo.

        Args:
            prompt: The text prompt for video generation.
            image_url: Optional URL of an image to use as a starting point.
            output_dir: Optional directory to save the video. If None, returns the URL.
            video_id: Optional unique ID for the video file. If None, uses timestamp.

        Returns:
            str: The local path to the saved video clip or the video URL.
        """
        print(f"Generating clip for prompt: '{prompt}' with image: {image_url}")

        try:
            # Prepare image if URL is provided
            image_obj = None

            if image_url:
                # Try to use from_file with URL directly first
                try:
                    image_obj = types.Image.from_file(location=image_url)
                    print(f"Image loaded directly from URL: {image_url}")
                except Exception as url_error:
                    # Fallback: download and save to temp file
                    print(f"Direct URL loading failed, downloading image: {url_error}")
                    response = requests.get(image_url)
                    response.raise_for_status()

                    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
                    temp_file.write(response.content)
                    temp_file.close()

                    image_obj = types.Image.from_file(location=temp_file.name)
                    print(f"Image loaded from temp file: {temp_file.name}")

                    # Clean up temp file
                    Path(temp_file.name).unlink(missing_ok=True)

            # Create operation - Generate video using Veo model
            print("Creating video generation operation...")
            operation = self.client.models.generate_videos(
                model="veo-3.1-generate-preview",
                prompt=prompt,
                image=image_obj,
                config=types.GenerateVideosConfig(
                    number_of_videos=1,
                    duration_seconds=8,
                ),
            )

            # Poll operation until completion
            print(f"Operation created: {operation.name}")
            print("Polling operation status...")
            while not operation.done:
                time.sleep(20)
                operation = self.client.operations.get(operation)
                print(f"Operation status: done={operation.done}")

            print("Operation completed!")

            # Get the generated video
            video = operation.response.generated_videos[0].video
            self.client.files.download(file=video)

            if video_id:
                video_filename = f"{video_id}.mp4"
            else:
                timestamp = int(time.time())
                video_filename = f"video_{timestamp}.mp4"

            output_path = Path(output_dir)
            video_path = output_path / video_filename
            video.save(video_path)

            return str(video_path)

        except Exception as e:
            print(f"Error generating video: {e}")
            raise
