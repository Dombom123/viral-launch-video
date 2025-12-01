import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

def test_veo():
    print("--- Testing Veo 3.1 Video Generation ---")
    
    load_dotenv()
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        print("No GOOGLE_API_KEY found")
        return

    print(f"API Key found: {api_key[:10]}...")
    
    client = genai.Client(api_key=api_key)
    
    prompt = "A cute robot banana dancing on a white background, smooth camera movement"
    
    print(f"\nGenerating video with prompt: {prompt}")
    print("Using model: veo-3.1-generate-preview")
    print("This may take a minute...")
    
    try:
        operation = client.models.generate_videos(
            model="veo-3.1-generate-preview",
            prompt=prompt,
            config=types.GenerateVideosConfig(
                duration_seconds=6
            )
        )
        
        print("Operation started, waiting for result...")
        
        # This blocks until complete
        response = operation.result()
        
        if response.generated_videos:
            video_bytes = response.generated_videos[0].video.video_bytes
            filename = "test_veo_output.mp4"
            with open(filename, "wb") as f:
                f.write(video_bytes)
            print(f"\nSUCCESS! Video saved to {filename}")
            print(f"File size: {len(video_bytes) / 1024:.1f} KB")
        else:
            print("No video returned in response")
            print(f"Response: {response}")
            
    except Exception as e:
        print(f"\nFAILED: {e}")

if __name__ == "__main__":
    test_veo()

