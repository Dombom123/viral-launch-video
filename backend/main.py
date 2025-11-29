import os
import json
import uuid
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from agents.research_agent import ResearchAgent
from agents.storyboard_agent import StoryboardAgent
from agents.video_agent import VideoAgent
from agents.image_agent import ImageAgent
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Viral Video Generator API")

# Mount uploads directory to serve generated assets
# This allows the frontend to access http://localhost:8000/uploads/...
# Make sure UPLOADS_DIR exists before mounting
UPLOADS_DIR = Path(__file__).parent / "data" / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True, parents=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Initialize Agents
research_agent = ResearchAgent()
storyboard_agent = StoryboardAgent()
video_agent = VideoAgent()
image_agent = ImageAgent()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data storage
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
UPLOADS_DIR = DATA_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True, parents=True)
RUNS_DIR = DATA_DIR / "runs"
RUNS_DIR.mkdir(exist_ok=True, parents=True)

class ProjectManager:
    def __init__(self):
        pass

    def create_project(self) -> str:
        project_id = str(uuid.uuid4())[:8]  # Short ID
        project_dir = RUNS_DIR / project_id
        project_dir.mkdir(exist_ok=True)
        return project_id

    def save_json(self, project_id: str, filename: str, data: Dict[str, Any]):
        project_dir = RUNS_DIR / project_id
        if not project_dir.exists():
            raise HTTPException(status_code=404, detail="Project not found")
        
        with open(project_dir / filename, "w") as f:
            json.dump(data, f, indent=2)

    def load_json(self, project_id: str, filename: str) -> Optional[Dict[str, Any]]:
        project_dir = RUNS_DIR / project_id
        file_path = project_dir / filename
        if not file_path.exists():
            return None
        
        with open(file_path, "r") as f:
            return json.load(f)

manager = ProjectManager()

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Viral Video Generator Backend is running"}

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    # 1. Create new project
    project_id = manager.create_project()
    
    # 2. Save video file
    file_location = UPLOADS_DIR / f"{project_id}_{file.filename}"
    with open(file_location, "wb") as f:
        f.write(await file.read())
        
    # 3. Create initial brief.json
    brief_data = {
        "project_id": project_id,
        "source_material": {
            "filename": file.filename,
            "file_path": str(file_location),
            "content_type": file.content_type
        },
        "status": "uploaded"
    }
    manager.save_json(project_id, "brief.json", brief_data)
    
    return {"project_id": project_id, "message": "File uploaded successfully"}

@app.get("/api/project/{project_id}/brief")
def get_brief(project_id: str):
    data = manager.load_json(project_id, "brief.json")
    if not data:
        raise HTTPException(status_code=404, detail="Brief not found")
    return data

@app.post("/api/project/{project_id}/research")
def trigger_research(project_id: str):
    # Check if brief exists
    brief = manager.load_json(project_id, "brief.json")
    if not brief:
        raise HTTPException(status_code=404, detail="Project brief not found")

    # Trigger Research Agent
    research_data = research_agent.analyze(brief)
    
    # Ensure project_id is in the data
    research_data["project_id"] = project_id
    
    manager.save_json(project_id, "research.json", research_data)
    return {"status": "completed", "data": research_data}

@app.get("/api/project/{project_id}/research")
def get_research(project_id: str):
    data = manager.load_json(project_id, "research.json")
    if not data:
        # If not found, return empty or error? Let's return null to signal it's not ready
         raise HTTPException(status_code=404, detail="Research data not found")
    return data

@app.post("/api/project/{project_id}/select-script")
def select_script(project_id: str, selection: Dict[str, Any]):
    # Save the selected script
    manager.save_json(project_id, "selected_script.json", selection)
    return {"status": "saved"}

@app.get("/api/project/{project_id}/storyboard")
def get_storyboard(project_id: str):
    """Get current storyboard state (for polling)"""
    data = manager.load_json(project_id, "storyboard.json")
    if not data:
        return {"status": "not_started", "data": None}
    return {"status": data.get("status", "unknown"), "data": data}

@app.post("/api/project/{project_id}/storyboard")
def generate_storyboard(project_id: str):
    # Get selected script
    script = manager.load_json(project_id, "selected_script.json")
    if not script:
         raise HTTPException(status_code=404, detail="No script selected")

    # Check if already generating
    existing = manager.load_json(project_id, "storyboard.json")
    if existing and existing.get("status") == "generating":
        return {"status": "already_generating", "data": existing}

    # Initialize storyboard status
    manager.save_json(project_id, "storyboard.json", {"status": "generating", "phase": "starting"})
    
    # Callback to save updates in real-time
    def on_storyboard_update(storyboard_data):
        manager.save_json(project_id, "storyboard.json", storyboard_data)

    # Run storyboard generation in background thread
    import threading
    def run_generation():
        storyboard_agent.generate_storyboard(
            script, 
            project_id=project_id, 
            output_dir=UPLOADS_DIR, 
            image_agent=image_agent,
            on_update=on_storyboard_update
        )
    
    threading.Thread(target=run_generation).start()
    
    return {"status": "started", "message": "Storyboard generation started. Poll GET /storyboard for updates."}

@app.post("/api/project/{project_id}/generate-asset")
def generate_asset(project_id: str, request: Dict[str, Any]):
    # Request body: { "prompt": "...", "type": "image" }
    prompt = request.get("prompt")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt required")
        
    # Define output path
    # We'll use a simple naming scheme based on timestamp or uuid
    asset_filename = f"{project_id}_{uuid.uuid4().hex[:6]}.png"
    output_path = UPLOADS_DIR / asset_filename
    
    relative_url = image_agent.generate_image(prompt, str(output_path))
    
    if relative_url:
        # Return the URL accessible by frontend
        # Assuming frontend can access files in uploads via some static mount or proxy
        # For this prototype, we return the path relative to 'uploads' if we mount it
        # Or just return the full path if we serve it
        return {"status": "completed", "url": f"/uploads/{asset_filename}"}
    else:
        raise HTTPException(status_code=500, detail="Image generation failed")

import concurrent.futures
import threading

# Thread-safe lock for updating video status
video_status_lock = threading.Lock()

def update_clip_status(project_id: str, clip_id, status: str, progress: int = 0, video_url: str = None, error: str = None):
    """Thread-safe update of individual clip status"""
    with video_status_lock:
        current = manager.load_json(project_id, "video_status.json") or {}
        clips_status = current.get("clips_status", [])
        
        # Find and update the clip
        found = False
        for clip in clips_status:
            if clip.get("id") == clip_id:
                clip["status"] = status
                clip["progress"] = progress
                if video_url:
                    clip["videoUrl"] = video_url
                if error:
                    clip["error"] = error
                found = True
                break
        
        if not found:
            clips_status.append({
                "id": clip_id,
                "status": status,
                "progress": progress,
                "videoUrl": video_url,
                "error": error
            })
        
        current["clips_status"] = clips_status
        
        # Update overall counts
        completed = sum(1 for c in clips_status if c.get("status") == "completed")
        failed = sum(1 for c in clips_status if c.get("status") == "failed")
        current["completed_clips"] = completed
        current["failed_clips"] = failed
        current["progress"] = int((completed / current.get("total_clips", 1)) * 100) if current.get("total_clips") else 0
        
        # Update overall status
        total = current.get("total_clips", 0)
        if completed + failed >= total and total > 0:
            current["status"] = "completed" if failed == 0 else "completed_with_errors"
            current["playlist"] = [c.get("videoUrl") for c in clips_status if c.get("videoUrl")]
        
        manager.save_json(project_id, "video_status.json", current)

@app.post("/api/project/{project_id}/video-gen")
def start_video_generation(project_id: str):
    # Get storyboard to form the prompt
    storyboard = manager.load_json(project_id, "storyboard.json")
    
    if not storyboard or "frames" not in storyboard or len(storyboard["frames"]) == 0:
        # Fallback if no storyboard
        prompt = "A viral video"
        output_filename = f"{project_id}_final.mp4"
        output_path = UPLOADS_DIR / output_filename
        manager.save_json(project_id, "video_status.json", {"status": "processing", "progress": 0, "clips_status": []})
        
        def update_status(pid, status):
            with video_status_lock:
                current = manager.load_json(pid, "video_status.json") or {}
                current.update(status)
                manager.save_json(pid, "video_status.json", current)

        video_agent.start_generation_task(prompt, project_id, str(output_path), update_status)
        return {"status": "started"}

    # Generate multiple clips in parallel based on storyboard frames
    frames = storyboard["frames"]
    
    # Initialize status with all clips as pending
    clips_status = []
    for i, frame in enumerate(frames):
        frame_id = frame.get("id", i)
        clips_status.append({
            "id": frame_id,
            "prompt": frame.get("visual_prompt", frame.get("description", f"Scene {i+1}")),
            "status": "pending",
            "progress": 0
        })
    
    manager.save_json(project_id, "video_status.json", {
        "status": "processing", 
        "progress": 0, 
        "total_clips": len(frames),
        "completed_clips": 0,
        "failed_clips": 0,
        "clips_status": clips_status
    })

    def generate_single_clip(frame, frame_idx):
        frame_id = frame.get("id", frame_idx)
        description = frame.get("description", "")
        visual_prompt = frame.get("visual_prompt", "")
        clip_prompt = f"Cinematic shot: {visual_prompt or description}"
        
        filename = f"{project_id}_clip_{frame_id}.mp4"
        output_path = UPLOADS_DIR / filename
        
        # Update to processing
        update_clip_status(project_id, frame_id, "processing", 10)
        
        try:
            # Call video agent directly (blocking in this thread)
            result = video_agent._run_generation_sync(clip_prompt, str(output_path))
            
            if result:
                update_clip_status(project_id, frame_id, "completed", 100, f"/uploads/{filename}")
                return True
            else:
                update_clip_status(project_id, frame_id, "failed", 0, error="No video returned")
                return False
        except Exception as e:
            print(f"Error generating clip {frame_id}: {e}")
            update_clip_status(project_id, frame_id, "failed", 0, error=str(e)[:100])
            return False

    def orchestrate_video_generation():
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = {
                executor.submit(generate_single_clip, frame, i): frame.get("id", i) 
                for i, frame in enumerate(frames)
            }
            
            for future in concurrent.futures.as_completed(futures):
                clip_id = futures[future]
                try:
                    future.result()
                except Exception as e:
                    print(f"Clip {clip_id} generation exception: {e}")
        
        # Final status update
        with video_status_lock:
            final = manager.load_json(project_id, "video_status.json")
            if final:
                completed = sum(1 for c in final.get("clips_status", []) if c.get("status") == "completed")
                failed = sum(1 for c in final.get("clips_status", []) if c.get("status") == "failed")
                
                if failed == 0:
                    final["status"] = "completed"
                elif completed > 0:
                    final["status"] = "completed_with_errors"
                else:
                    final["status"] = "failed"
                
                final["progress"] = 100
                final["playlist"] = [c.get("videoUrl") for c in final.get("clips_status", []) if c.get("videoUrl")]
                final["video_url"] = final["playlist"][0] if final["playlist"] else ""
                manager.save_json(project_id, "video_status.json", final)

    threading.Thread(target=orchestrate_video_generation).start()
    
    return {"status": "started"}

@app.post("/api/project/{project_id}/retry-clip/{clip_id}")
def retry_clip(project_id: str, clip_id: str):
    """Retry generating a single failed clip"""
    storyboard = manager.load_json(project_id, "storyboard.json")
    if not storyboard or "frames" not in storyboard:
        raise HTTPException(status_code=404, detail="Storyboard not found")
    
    # Find the frame
    frame = None
    for f in storyboard["frames"]:
        if str(f.get("id")) == str(clip_id):
            frame = f
            break
    
    if not frame:
        raise HTTPException(status_code=404, detail="Clip not found")
    
    def retry_generation():
        description = frame.get("description", "")
        visual_prompt = frame.get("visual_prompt", "")
        clip_prompt = f"Cinematic shot: {visual_prompt or description}"
        
        filename = f"{project_id}_clip_{clip_id}.mp4"
        output_path = UPLOADS_DIR / filename
        
        update_clip_status(project_id, clip_id, "processing", 10)
        
        try:
            result = video_agent._run_generation_sync(clip_prompt, str(output_path))
            if result:
                update_clip_status(project_id, clip_id, "completed", 100, f"/uploads/{filename}")
            else:
                update_clip_status(project_id, clip_id, "failed", 0, error="No video returned")
        except Exception as e:
            update_clip_status(project_id, clip_id, "failed", 0, error=str(e)[:100])
    
    threading.Thread(target=retry_generation).start()
    return {"status": "retrying"}

@app.get("/api/project/{project_id}/video-status")
def get_video_status(project_id: str):
    """Get video generation status - returns real progress from Veo 3.1 generation"""
    status_data = manager.load_json(project_id, "video_status.json")
    if not status_data:
         return {"status": "idle", "progress": 0}
    
    return status_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
