from __future__ import annotations

import base64
from pathlib import Path
from typing import Optional

import google.generativeai as genai
from fastapi import HTTPException


def generate_image(prompt: str, dest_path: Path) -> str:
    """
    Generate an image using Gemini image generation.
    Writes PNG to dest_path and returns the public-facing path ("/runs/...").
    """
    model = genai.GenerativeModel("models/nano-banana-pro-preview")
    try:
        response = model.generate_image(prompt=prompt)
    except AttributeError:
        # Fallback for older SDKs: use content generation with PNG mime type
        response = model.generate_content(
            prompt, generation_config={"response_mime_type": "image/png"}
        )

    image_bytes: Optional[bytes] = None

    if hasattr(response, "image") and response.image:
        image_bytes = response.image
    elif hasattr(response, "images") and response.images:
        first = response.images[0]
        if hasattr(first, "data") and first.data:
            image_bytes = first.data
        elif hasattr(first, "image") and first.image:
            image_bytes = first.image
    elif hasattr(response, "candidates"):
        part = response.candidates[0].content.parts[0]
        if hasattr(part, "data") and part.data:
            image_bytes = part.data
        elif hasattr(part, "inline_data") and part.inline_data:
            image_bytes = base64.b64decode(part.inline_data.data)

    if not image_bytes:
        raise HTTPException(status_code=500, detail="Image generation returned no data")

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    dest_path.write_bytes(image_bytes)
    return "/" + "/".join(dest_path.parts[dest_path.parts.index("public") + 1 :])
