import os
import io
import base64
from google import genai
from google.genai import types
from PIL import Image

class ImageAgent:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            print("Warning: GEMINI_API_KEY or GOOGLE_API_KEY not found.")
        
        self.client = None
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)

    def generate_image(self, prompt: str, output_path: str) -> str:
        """
        Generates an image using Gemini 3 Pro Image Preview and saves it to output_path.
        Returns the output path on success, None on failure.
        """
        if not self.client:
            print("ImageAgent: Client not initialized.")
            return None

        print(f"Generating image for prompt: {prompt[:80]}...")
        try:
            # Using Gemini 3 Pro Image Preview with generate_content and response_modalities
            response = self.client.models.generate_content(
                model="gemini-3-pro-image-preview",
                contents=f"Generate an image: {prompt}",
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"]
                )
            )
            
            # Extract image from response
            if response.candidates:
                for candidate in response.candidates:
                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            if hasattr(part, 'inline_data') and part.inline_data:
                                # The inline_data.data might be raw bytes or base64
                                raw_data = part.inline_data.data
                                
                                # Try to use it as raw bytes first
                                try:
                                    if isinstance(raw_data, bytes):
                                        image_bytes = raw_data
                                    else:
                                        # If it's a string, try base64 decode
                                        image_bytes = base64.b64decode(raw_data)
                                    
                                    image = Image.open(io.BytesIO(image_bytes))
                                    image.save(output_path)
                                    print(f"Image saved to {output_path}")
                                    return output_path
                                except Exception as decode_err:
                                    print(f"Failed to decode image data: {decode_err}")
                                    # Try saving raw data directly as a fallback
                                    try:
                                        with open(output_path, 'wb') as f:
                                            if isinstance(raw_data, bytes):
                                                f.write(raw_data)
                                            else:
                                                f.write(base64.b64decode(raw_data))
                                        print(f"Image saved raw to {output_path}")
                                        return output_path
                                    except Exception as raw_err:
                                        print(f"Failed to save raw: {raw_err}")
            
            print("No image in response")
            return None
                
        except Exception as e:
            print(f"Error generating image: {e}")
            return None
