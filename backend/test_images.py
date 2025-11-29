import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import google.generativeai as genai_old

def test_gemini_image():
    print("--- Testing Gemini 3 Pro Image Preview ---")
    
    load_dotenv()
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        print("No API Key found")
        return

    # Method: Using google.genai Client with gemini-3-pro-image-preview
    print("\n--- Using google.genai Client ---")
    client = genai.Client(api_key=api_key)
    
    # Try generate_content with response_modalities
    print("\nTesting gemini-3-pro-image-preview with generate_content...")
    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents="Generate an image of a cute robot banana on white background",
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"]
            )
        )
        print(f"Response: {response}")
        
        # Check for image parts
        if response.candidates:
            for candidate in response.candidates:
                if candidate.content and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            print(f"SUCCESS: Got image!")
                            filename = "test_gemini_3_pro_image.png"
                            import base64
                            with open(filename, "wb") as f:
                                f.write(base64.b64decode(part.inline_data.data))
                            print(f"Saved to {filename}")
                        elif hasattr(part, 'text'):
                            print(f"Text: {part.text[:100]}...")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_gemini_image()
