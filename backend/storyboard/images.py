from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from google import genai
from google.genai.types import GenerateContentConfig
from fastapi import HTTPException


def generate_image(prompt: str, dest_path: Path) -> str:
    """
    Generate an image using Gemini 3 Pro Image Preview.
    Writes PNG to dest_path and returns the public-facing path ("/runs/...").
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    client = genai.Client(api_key=api_key)
    
    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=f"Generate an image: {prompt}",
            config=GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )
    except Exception as exc:
        print(f"[images] Image generation failed: {exc}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {exc}") from exc

    image_bytes: Optional[bytes] = None

    # Try to extract image from response
    if response.candidates:
        for part in response.candidates[0].content.parts:
            if hasattr(part, "inline_data") and part.inline_data:
                if part.inline_data.mime_type and part.inline_data.mime_type.startswith("image/"):
                    image_bytes = part.inline_data.data
                    break

    if not image_bytes:
        print(f"[images] No image in response. Response: {response}")
        raise HTTPException(status_code=500, detail="Image generation returned no image data")

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    dest_path.write_bytes(image_bytes)
    
    # Return path relative to public folder
    return "/" + "/".join(dest_path.parts[dest_path.parts.index("public") + 1:])
