from typing import Optional
from google import genai


class VeoClient:
    def __init__(self, api_key: str):
        """Initialize the Veo client using Google Genai SDK.

        Args:
            api_key: Google API key for authentication.
        """
        self.client = genai.Client(api_key=api_key)

    def generate_clip(self, prompt: str, image_url: Optional[str] = None) -> str:
        """
        Generates a video clip using Veo.

        Args:
            prompt: The text prompt for video generation.
            image_url: Optional URL of an image to use as a starting point.

        Returns:
            str: The URL or path to the generated video clip.
        """
        print(f"Generating clip for prompt: '{prompt}' with image: {image_url}")

        try:
            # Prepare the generation request
            generation_config = {
                "prompt": prompt,
            }

            # If image URL is provided, include it in the request
            if image_url:
                generation_config["reference_image"] = image_url

            # Generate video using Veo model
            response = self.client.models.generate_video(
                model="veo-3.1-generate-preview",  # Veo 3.1 model identifier
                prompt=prompt,
                image=image_url,
            )

            # Extract the video URL from the response
            # The exact response structure may vary based on the API
            if hasattr(response, "video_url"):
                return response.video_url
            elif hasattr(response, "uri"):
                return response.uri
            else:
                # Fallback: return the response as string
                return str(response)

        except Exception as e:
            print(f"Error generating video: {e}")
            raise
