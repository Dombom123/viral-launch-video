import json
import os
from pathlib import Path
from typing import Dict, Any, Callable
import concurrent.futures
from .base_agent import BaseAgent

MOCK_STORYBOARD_DATA = {
    "characters": [
        { "id": "c1", "src": "https://placehold.co/200x200/png?text=Mock+Char+1", "label": "Mock Character 1" },
        { "id": "c2", "src": "https://placehold.co/200x200/png?text=Mock+Char+2", "label": "Mock Character 2" }
    ],
    "locations": [
        { "id": "l1", "src": "https://placehold.co/300x200/png?text=Mock+Loc+1", "label": "Mock Location 1" }
    ],
    "objects": [
        { "id": "o1", "src": "https://placehold.co/200x200/png?text=Mock+Obj", "label": "Mock Object" }
    ],
    "frames": [
        { "id": 1, "description": "Mock Scene 1 Description", "img": "https://placehold.co/400x225/png?text=Mock+Scene+1" },
        { "id": 2, "description": "Mock Scene 2 Description", "img": "https://placehold.co/400x225/png?text=Mock+Scene+2" }
    ]
}

class StoryboardAgent(BaseAgent):
    def __init__(self):
        super().__init__(model_name="gemini-2.0-flash-exp")

    def generate_storyboard(
        self, 
        script_data: Dict[str, Any], 
        project_id: str = None, 
        output_dir: Path = None, 
        image_agent = None,
        on_update: Callable[[Dict[str, Any]], None] = None
    ) -> Dict[str, Any]:
        """
        Generate storyboard with real-time updates.
        on_update: callback called each time an image is generated, passing the current storyboard state
        """
        title = script_data.get("title", "Viral Video")
        hook = script_data.get("hook", "")
        body = script_data.get("body", "")
        cta = script_data.get("callToAction", "")
        
        # 1. Generate Storyboard Structure (Text)
        prompt = f"""
        You are a visionary storyboard artist and director.
        
        Create a detailed storyboard and asset list for this video concept:
        Title: {title}
        Hook: {hook}
        Script Body: {body}
        CTA: {cta}
        
        We need to visualize this.
        
        Output strictly valid JSON matching this structure:
        {{
            "characters": [
                {{ "id": "c1", "src": "placeholder", "label": "Name & brief visual description", "visual_prompt": "Detailed visual prompt for image generation (character on white background)" }},
                {{ "id": "c2", "src": "placeholder", "label": "Name & brief visual description", "visual_prompt": "Detailed visual prompt for image generation (character on white background)" }}
            ],
            "locations": [
                {{ "id": "l1", "src": "placeholder", "label": "Brief visual description", "visual_prompt": "Detailed visual prompt for image generation" }},
                {{ "id": "l2", "src": "placeholder", "label": "Brief visual description", "visual_prompt": "Detailed visual prompt for image generation" }}
            ],
            "objects": [
                 {{ "id": "o1", "src": "placeholder", "label": "Key object description", "visual_prompt": "Detailed visual prompt for image generation (object on white background)" }}
            ],
            "frames": [
                {{ "id": 1, "description": "Visual description of the Hook scene", "img": "placeholder", "visual_prompt": "Detailed visual prompt for this specific frame. IMPORTANT: Mention characters or objects from the asset list if they appear." }},
                {{ "id": 2, "description": "Visual description of the middle part", "img": "placeholder", "visual_prompt": "Detailed visual prompt for this specific frame. IMPORTANT: Mention characters or objects from the asset list if they appear." }}
            ]
        }}
        
        IMPORTANT: 
        1. Provide detailed 'visual_prompt' for AI image generation. 
        2. For characters and objects, keep background simple/white in prompt.
        3. For frames/scenes, describe the composition and action clearly.
        """
        
        response_text = self.generate(prompt)
        storyboard_data = MOCK_STORYBOARD_DATA.copy()
        storyboard_data["status"] = "generating"
        storyboard_data["phase"] = "text"
        
        if response_text:
            try:
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                if start_idx != -1 and end_idx != -1:
                    json_str = response_text[start_idx:end_idx]
                    storyboard_data = json.loads(json_str)
                    storyboard_data["status"] = "generating"
                    storyboard_data["phase"] = "text"
            except json.JSONDecodeError:
                pass

        # Notify that text structure is ready
        if on_update:
            on_update(storyboard_data)

        # 2. Generate Images (Assets first, then Scenes)
        if image_agent and project_id and output_dir:
            print("Generating actual images for storyboard...")
            storyboard_data["phase"] = "assets"
            if on_update:
                on_update(storyboard_data)
            
            import threading
            lock = threading.Lock()
            
            def generate_and_update(item, type_prefix, list_name):
                """Generate image and update the storyboard data with lock"""
                visual_prompt = item.get("visual_prompt", item.get("label", "A generic image"))
                item_id = item.get("id", "unknown")
                filename = f"{project_id}_{type_prefix}_{item_id}.png"
                output_path = output_dir / filename
                
                print(f"Generating {type_prefix} {item_id}...")
                generated_path = image_agent.generate_image(visual_prompt, str(output_path))
                
                if generated_path:
                    relative_url = f"/uploads/{filename}"
                    with lock:
                        # Find and update the item in storyboard_data
                        for i, data_item in enumerate(storyboard_data.get(list_name, [])):
                            if data_item.get("id") == item.get("id"):
                                if "src" in data_item or list_name in ["characters", "locations", "objects"]:
                                    storyboard_data[list_name][i]["src"] = relative_url
                                if "img" in data_item or list_name == "frames":
                                    storyboard_data[list_name][i]["img"] = relative_url
                                break
                        
                        # Notify update
                        if on_update:
                            on_update(storyboard_data)
                
                return item_id

            # Phase 1: Generate Assets (Characters, Locations, Objects) in Parallel
            asset_futures = []
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                if "characters" in storyboard_data:
                    for item in storyboard_data["characters"]:
                        asset_futures.append(executor.submit(generate_and_update, item, "char", "characters"))
                
                if "locations" in storyboard_data:
                    for item in storyboard_data["locations"]:
                        asset_futures.append(executor.submit(generate_and_update, item, "loc", "locations"))
                        
                if "objects" in storyboard_data:
                    for item in storyboard_data["objects"]:
                        asset_futures.append(executor.submit(generate_and_update, item, "obj", "objects"))
                
                # Wait for all assets to complete
                for future in concurrent.futures.as_completed(asset_futures):
                    try:
                        future.result()
                    except Exception as e:
                        print(f"Asset generation error: {e}")

            print("Asset generation phase complete. Starting scenes...")
            storyboard_data["phase"] = "scenes"
            if on_update:
                on_update(storyboard_data)

            # Phase 2: Generate Scenes (Frames) in Parallel
            scene_futures = []
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                if "frames" in storyboard_data:
                    for item in storyboard_data["frames"]:
                        scene_futures.append(executor.submit(generate_and_update, item, "frame", "frames"))
                
                for future in concurrent.futures.as_completed(scene_futures):
                    try:
                        future.result()
                    except Exception as e:
                        print(f"Scene generation error: {e}")

        storyboard_data["status"] = "completed"
        storyboard_data["phase"] = "done"
        if on_update:
            on_update(storyboard_data)
            
        return storyboard_data
