from __future__ import annotations

import json
import os
from typing import List

import google.generativeai as genai
from fastapi import HTTPException

from .schemas import Research


class LLMCharacter:
    def __init__(self, id: str, name: str, role: str, description: str) -> None:
        self.id = id
        self.name = name
        self.role = role
        self.description = description


class LLMEnvironment:
    def __init__(self, id: str, name: str, description: str) -> None:
        self.id = id
        self.name = name
        self.description = description


def configure_gemini() -> None:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY/GOOGLE_API_KEY is not configured")
    os.environ.setdefault("GEMINI_API_KEY", api_key)
    genai.configure(api_key=api_key)


def _text_model():
    configure_gemini()
    return genai.GenerativeModel("models/gemini-3-pro-preview")


def _parse_json(response_text: str):
    try:
        return json.loads(response_text)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"LLM returned invalid JSON: {exc}") from exc


def generate_characters(research: Research) -> List[LLMCharacter]:
    model = _text_model()
    script = research.selected_script
    hooks = [script.hook]
    prompt = f"""
You are generating cast for a viral short-form video storyboard.
Story: {script.title}
Tone: {script.tone}
Hooks: {", ".join(hooks)}
Existing character references: {[c.name for c in script.assets.characters]}

Return JSON with key "characters" as a list of objects: id (slug), name, role, description.
"""
    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"},
    )
    data = _parse_json(response.text or response.candidates[0].content.parts[0].text)
    characters = data.get("characters", [])
    if not characters:
        raise HTTPException(status_code=500, detail="LLM did not return characters")
    return [LLMCharacter(id=char["id"], name=char["name"], role=char["role"], description=char["description"]) for char in characters]


def generate_environments(research: Research) -> List[LLMEnvironment]:
    model = _text_model()
    script = research.selected_script
    prompt = f"""
Suggest 2-4 environments for the storyboard based on:
- Story: {script.title}
- Tone: {script.tone}
- Provided environments: {[env.name for env in script.assets.environments]}

Return JSON with key "environments": list of objects with id (slug), name, description.
"""
    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"},
    )
    data = _parse_json(response.text or response.candidates[0].content.parts[0].text)
    environments = data.get("environments", [])
    if not environments:
        raise HTTPException(status_code=500, detail="LLM did not return environments")
    return [LLMEnvironment(id=env["id"], name=env["name"], description=env["description"]) for env in environments]
