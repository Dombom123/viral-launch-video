import os
import time
import threading
from google import genai
from google.genai import types

class VideoAgent:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            print("Warning: GEMINI_API_KEY or GOOGLE_API_KEY not found.")
        
        self.client = None
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)

    def start_generation_task(self, prompt: str, project_id: str, output_path: str, manager_callback):
        """
        Starts video generation in a background thread.
        manager_callback: function to update status (project_id, status_dict)
        """
        if not self.client:
            print("VideoAgent: Client not initialized.")
            manager_callback(project_id, {"status": "failed", "error": "Client not initialized"})
            return

        # Use a semaphore to limit concurrent video generations if needed, 
        # but for now we fire them off. 
        # Note: Veo 3.1 might have quota limits.
        
        thread = threading.Thread(
            target=self._run_generation,
            args=(prompt, project_id, output_path, manager_callback)
        )
        thread.start()

    def _run_generation(self, prompt: str, project_id: str, output_path: str, manager_callback):
        print(f"Starting video generation for: {prompt[:80]}...")
        try:
            # Update status to processing
            manager_callback(project_id, {"status": "processing", "progress": 10})

            # Call Veo API (using Veo 3.1 Preview - duration must be 4-8 seconds)
            operation = self.client.models.generate_videos(
                model="veo-3.1-generate-preview",
                prompt=prompt,
                config=types.GenerateVideosConfig(
                    duration_seconds=6
                )
            )
            
            print("Video generation operation started...")
            manager_callback(project_id, {"status": "processing", "progress": 30})

            # Wait for result
            response = operation.result()
            
            manager_callback(project_id, {"status": "processing", "progress": 90})
            
            if response.generated_videos:
                video_bytes = response.generated_videos[0].video.video_bytes
                with open(output_path, "wb") as f:
                    f.write(video_bytes)
                
                print(f"Video saved to {output_path}")
                manager_callback(project_id, {
                    "status": "completed", 
                    "progress": 100,
                    "video_url": f"/uploads/{os.path.basename(output_path)}" 
                })
            else:
                manager_callback(project_id, {"status": "failed", "error": "No video returned"})
            
        except Exception as e:
            print(f"Error generating video: {e}")
            manager_callback(project_id, {"status": "failed", "error": str(e)})

    def _run_generation_sync(self, prompt: str, output_path: str) -> bool:
        """
        Synchronous video generation - returns True on success, False on failure.
        Used for parallel generation with ThreadPoolExecutor.
        """
        if not self.client:
            print("VideoAgent: Client not initialized.")
            return False
            
        print(f"Starting video generation for: {prompt[:80]}...")
        try:
            # Call Veo API (using Veo 3.1 Preview - duration must be 4-8 seconds)
            operation = self.client.models.generate_videos(
                model="veo-3.1-generate-preview",
                prompt=prompt,
                config=types.GenerateVideosConfig(
                    duration_seconds=6
                )
            )
            
            print("Video generation operation started, waiting for result...")

            # Wait for result (blocking)
            response = operation.result()
            
            if response.generated_videos:
                video_bytes = response.generated_videos[0].video.video_bytes
                with open(output_path, "wb") as f:
                    f.write(video_bytes)
                
                print(f"Video saved to {output_path}")
                return True
            else:
                print("No video returned from API")
                return False
            
        except Exception as e:
            print(f"Error generating video: {e}")
            raise e  # Re-raise so caller can handle
