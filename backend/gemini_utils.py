"""
Shared Gemini API utilities in Python

- 统一处理 Gemini 2.5 与 Gemini 3 的调用
- 支持 thinkingConfig
- 支持视频分辨率设置
- 解析文本输出与 tool call

可以作为 walkthrough analysis 模块的基础, analyze_walkthrough_for_ads 的输出
可以直接喂给后续的 ads research agent。
"""

from __future__ import annotations

import os
import json
import logging
from typing import Any, Dict, List, Literal, Optional, TypedDict

import requests

# ============================================================================
# TYPES
# ============================================================================

ThinkingLevel = Literal["none", "low", "high"]
MediaResolution = Literal["low", "medium", "high"]


class ToolCall(TypedDict):
    name: str
    args: Dict[str, Any]


class GeminiCallResult(TypedDict, total=False):
    text: str
    tool_calls: List[ToolCall]
    thought_signature: Optional[str]
    finish_reason: Optional[str]
    was_filtered: bool
    filter_reason: Optional[str]


GeminiResponse = Dict[str, Any]

# ============================================================================
# CONSTANTS
# ============================================================================

PERMISSIVE_SAFETY_SETTINGS: List[Dict[str, str]] = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_CIVIC_INTEGRITY", "threshold": "BLOCK_NONE"},
]

logger = logging.getLogger(__name__)

# ============================================================================
# MODEL UTILS
# ============================================================================


def is_gemini3_model(model: str) -> bool:
    """检查是否为 Gemini 3 模型"""
    return "gemini-3" in model


def is_thinking_model(model: str) -> bool:
    """检查是否为带内置 thinking 的变体"""
    return "thinking" in model


def supports_thinking_config(model: str) -> bool:
    """检查模型是否支持显式 thinkingConfig"""
    return is_gemini3_model(model)


def get_api_version(model: str) -> Literal["v1alpha", "v1beta"]:

    if is_gemini3_model(model) or is_thinking_model(model):
        return "v1alpha"
    return "v1beta"


def map_media_resolution(resolution: MediaResolution) -> str:
    """映射分辨率到 Gemini API 的字符串"""
    if resolution == "high":
        return "media_resolution_high"
    if resolution == "medium":
        return "media_resolution_medium"
    return "media_resolution_low"


def build_video_part(
    video_uri: str,
    model: str,
    media_resolution: MediaResolution = "low",
) -> Dict[str, Any]:
 
    video_part: Dict[str, Any] = {
        "fileData": {
            "mimeType": "video/mp4",
            "fileUri": video_uri,
        }
    }
    if is_gemini3_model(model):
        video_part["mediaResolution"] = {"level": map_media_resolution(media_resolution)}
    return video_part


def build_generation_config(
    model: str,
    temperature: float = 0.7,
    max_output_tokens: int = 8192,
    thinking_level: ThinkingLevel = "low",
    media_resolution: MediaResolution = "low",
) -> Dict[str, Any]:
    """构建 generationConfig"""
    config: Dict[str, Any] = {
        "temperature": temperature,
        "maxOutputTokens": max_output_tokens,
    }

    if supports_thinking_config(model) and thinking_level != "none":
        config["thinkingConfig"] = {"thinkingLevel": thinking_level}

    if not is_gemini3_model(model):
        config["mediaResolution"] = map_media_resolution(media_resolution)

    return config


# ============================================================================
# LOW LEVEL API CALLS
# ============================================================================


def call_gemini(
    *,
    system_prompt: str,
    contents: List[Dict[str, Any]],
    model: str,
    tools: Optional[List[Dict[str, Any]]] = None,
    media_resolution: MediaResolution = "low",
    thinking_level: ThinkingLevel = "low",
    temperature: float = 0.7,
    max_output_tokens: int = 8192,
) -> GeminiCallResult:

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("Environment variable GOOGLE_API_KEY is not set")

    api_version = get_api_version(model)
    logger.info("Calling Gemini model %s (%s)", model, api_version)

    request_body: Dict[str, Any] = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}],
        },
        "contents": contents,
        "generationConfig": build_generation_config(
            model=model,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            thinking_level=thinking_level,
            media_resolution=media_resolution,
        ),
        "safetySettings": PERMISSIVE_SAFETY_SETTINGS,
    }

    if tools:
        request_body["tools"] = tools
        request_body["toolConfig"] = {
            "functionCallingConfig": {"mode": "AUTO"},
        }

    url = (
        f"https://generativelanguage.googleapis.com/"
        f"{api_version}/models/{model}:generateContent?key={api_key}"
    )

    resp = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        data=json.dumps(request_body),
        timeout=120,
    )

    try:
        result: GeminiResponse = resp.json()
    except Exception as exc:  # noqa: BLE001
        logger.error("Gemini API response is not valid JSON: %s", exc)
        raise RuntimeError(f"Invalid JSON from Gemini: {resp.text[:500]}") from exc

    if not resp.ok or "error" in result:
        logger.error("Gemini API error: %s", result.get("error") or resp.status_code)
        message = (
            result.get("error", {}).get("message")
            if isinstance(result.get("error"), dict)
            else None
        )
        raise RuntimeError(message or f"Gemini API error: {resp.status_code}")

    prompt_feedback = result.get("promptFeedback") or {}
    block_reason = prompt_feedback.get("blockReason")
    if block_reason:
        logger.warning("Gemini API prompt blocked: %s", block_reason)
        return GeminiCallResult(
            text="",
            tool_calls=[],
            was_filtered=True,
            filter_reason=block_reason,
        )

    candidates = result.get("candidates") or []
    if not candidates:
        logger.error("Gemini API returned no candidates")
        raise RuntimeError(
            "No response from Gemini. Try a shorter video. lower quality. "
            "or simplify your request."
        )

    candidate = candidates[0]
    if candidate.get("finishReason") == "SAFETY":
        logger.warning("Gemini API response filtered for safety")
        return GeminiCallResult(
            text="",
            tool_calls=[],
            was_filtered=True,
            filter_reason="SAFETY",
            finish_reason="SAFETY",
        )

    text_parts: List[str] = []
    tool_calls: List[ToolCall] = []
    thought_signature: Optional[str] = None

    content = candidate.get("content") or {}
    parts = content.get("parts") or []

    for part in parts:
        if part.get("text") and not part.get("thought"):
            text_parts.append(part["text"])

        if "functionCall" in part and part["functionCall"]:
            fn = part["functionCall"]
            name = fn.get("name")
            args = fn.get("args") or {}
            if name:
                logger.info("Gemini API function call: %s", name)
                tool_calls.append(ToolCall(name=name, args=args))

        if part.get("thoughtSignature"):
            thought_signature = part["thoughtSignature"]

    full_text = "".join(text_parts)
    logger.info(
        "Gemini API response parsed. text length=%d. tool calls=%d",
        len(full_text),
        len(tool_calls),
    )

    return GeminiCallResult(
        text=full_text,
        tool_calls=tool_calls,
        thought_signature=thought_signature,
        finish_reason=candidate.get("finishReason"),
    )


def call_gemini_with_video(
    *,
    video_uri: str,
    system_prompt: str,
    user_message: str,
    model: str,
    tools: Optional[List[Dict[str, Any]]] = None,
    media_resolution: MediaResolution = "low",
    thinking_level: ThinkingLevel = "low",
    previous_messages: Optional[List[Dict[str, Optional[str]]]] = None,
) -> GeminiCallResult:

    if previous_messages is None:
        previous_messages = []

    contents: List[Dict[str, Any]] = []

    contents.append(
        {
            "role": "user",
            "parts": [
                build_video_part(video_uri, model, media_resolution),
                {"text": user_message},
            ],
        }
    )

    for msg in previous_messages:
        role = msg.get("role", "user")
        text = msg.get("text", "") or ""
        ts = msg.get("thoughtSignature") or msg.get("thought_signature")

        parts: List[Dict[str, Any]] = [{"text": text}]
        if role == "model" and ts:
            parts.append({"thoughtSignature": ts})

        contents.append({"role": role, "parts": parts})

    return call_gemini(
        system_prompt=system_prompt,
        contents=contents,
        tools=tools,
        model=model,
        media_resolution=media_resolution,
        thinking_level=thinking_level,
    )


# ============================================================================
# TOOL DEFINITIONS
# ============================================================================

SHOTLIST_TOOL: Dict[str, Any] = {
    "functionDeclarations": [
        {
            "name": "update_shotlist",
            "description": (
                "Create or update the trailer shotlist. Call this immediately after analyzing a video."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Trailer title based on the video content",
                    },
                    "description": {
                        "type": "string",
                        "description": "Brief description of the trailer's vibe",
                    },
                    "shots": {
                        "type": "array",
                        "description": "Ordered list of shots for the trailer",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {
                                    "type": "string",
                                    "description": "Unique ID like shot-1. shot-2",
                                },
                                "in": {
                                    "type": "number",
                                    "description": "Start time in seconds",
                                },
                                "out": {
                                    "type": "number",
                                    "description": "End time in seconds",
                                },
                                "description": {
                                    "type": "string",
                                    "description": "What is in this shot",
                                },
                                "label": {
                                    "type": "string",
                                    "description": "Narrative purpose",
                                },
                                "audio": {
                                    "type": "string",
                                    "enum": ["keep", "mute"],
                                    "description": "Keep or mute audio",
                                },
                            },
                            "required": [
                                "id",
                                "in",
                                "out",
                                "description",
                                "label",
                                "audio",
                            ],
                        },
                    },
                },
                "required": ["title", "description", "shots"],
            },
        }
    ]
}


def get_gemini_tools() -> List[Dict[str, Any]]:
    """返回工具列表"""
    return [SHOTLIST_TOOL]


# ============================================================================
# WALKTHROUGH ANALYSIS SYSTEM PROMPT
# ============================================================================

WALKTHROUGH_ANALYSIS_SYSTEM_PROMPT = """
You are a senior product marketing strategist, creative director and narrative psychologist in one.

You receive:
- A raw product walkthrough video (screen recording or product demo).
- A short user instruction describing the task.

Your job is NOT to write ad copy yet.
Your job is to deeply understand the product and transform the walkthrough into structured insight that a downstream "ads research agent" and "creative generation agent" can use.

You must:
1) Infer what the product is, who it is for, and what real-world problems or desires it addresses.
2) Identify the key "aha moments" in the video, where a potential user would feel:
   - relief, surprise, empowerment, pride or safety.
3) Identify boring or confusing segments that should be skipped or compressed in an ad.
4) Analyze not only functional value, but also:
   - the fantasies this product invites (future scenarios users imagine for themselves),
   - the identity archetypes it speaks to,
   - the "confirmation lines": short sentences that users could say to themselves after buying, that make them feel more complete or more like their ideal self.
5) Turn all of this into a JSON object that is machine readable and safe to feed into:
   - an ads research agent that will search the web for relevant best practices and examples,
   - a creative agent that will generate multiple ad concepts and scripts.

Rules:
- Be concrete, specific and honest. Do not over-infer beyond what the video plausibly supports.
- Prefer hypotheses over certainties. You can say "likely" or "possible" in descriptions.
- Do NOT output any marketing fluff or long prose paragraphs.
- Your entire response MUST be a single valid JSON object that matches the schema described below.
- Do NOT wrap the JSON in code fences. Do NOT add comments.

Use this exact JSON schema for your output:

{
  "product_overview": {
    "working_name": "string, you can invent a short descriptive name if none is shown",
    "category": "short category label, e.g. 'AI coding tool', 'kids co-reading app', 'B2B analytics dashboard'",
    "one_sentence_pitch": "tight, concrete explanation of what this product does and for whom",
    "maturity_guess": "one of: early, beta, mature"
  },
  "target_users": [
    {
      "segment_name": "short label for this audience segment",
      "persona_summary": "1-2 sentence description of who they are in their own words",
      "jobs_to_be_done": ["list of user jobs or tasks they want to accomplish"],
      "key_pains": ["list of pains or frustrations this product seems to address"],
      "key_desires": ["list of deeper desires, fears, aspirations related to this product"]
    }
  ],
  "core_value_props": [
    {
      "name": "short name for this value prop",
      "description": "what it does in simple language",
      "why_it_matters": "why this matters to the target user in emotional and practical terms"
    }
  ],
  "feature_timeline": {
    "aha_moments": [
      {
        "timestamp_sec": 0,
        "description": "what happens on screen that is impressive or relieving",
        "user_reaction_hypothesis": "what the user likely feels, e.g. 'finally, this is easier', 'wow, this feels pro'",
        "ad_hook_potential": "high, medium or low"
      }
    ],
    "friction_points": [
      {
        "timestamp_sec": 0,
        "description": "what is boring, confusing or visually weak in the walkthrough",
        "ad_editing_suggestion": "how an editor should treat this in a short ad"
      }
    ]
  },
  "usage_contexts": [
    "short phrases describing when and where this product is used, based on the walkthrough"
  ],
  "emotional_and_identity_analysis": {
    "fantasies": [
      "future scenarios the user might imagine for themselves if this product works as promised"
    ],
    "identity_archetypes": [
      "labels for the kind of person this product appeals to, e.g. 'early adopter builder', 'AI-native parent', 'serious operator'"
    ],
    "confirmation_lines": [
      "short first-person sentences like: 'By using this, I can finally say I am X.'"
    ]
  },
  "differentiation_hypotheses": [
    "1-3 sentences about how this product might differ from typical tools in this space"
  ],
  "ad_angle_ideas": [
    {
      "angle_name": "short name, e.g. 'From overwhelmed to shipped in one evening'",
      "core_promise": "what promise this angle makes to the viewer",
      "best_channels": ["likely best platforms for this angle, e.g. 'TikTok', 'YouTube Shorts', 'X'"],
      "suggested_formats": ["formats like 'talking head plus screen capture', 'POV montage', 'UGC testimonial'"]
    }
  ],
  "research_goals_for_agent": [
    "clear English sentences describing what the ads research agent should try to find online"
  ],
  "research_queries_for_agent": [
    "specific search queries that the ads research agent can paste into search engines to find ad expertise, frameworks, and viral examples relevant to this product"
  ],
  "risks_and_constraints": [
    "things ads must not exaggerate, misrepresent or promise, based on what the walkthrough truly shows"
  ]
}
"""

# ============================================================================
# HIGH LEVEL WALKTHROUGH ANALYSIS API
# ============================================================================


def analyze_walkthrough_for_ads(
    *,
    video_uri: str,
    model: str,
    product_context: str = "",
    media_resolution: MediaResolution = "medium",
    thinking_level: ThinkingLevel = "high",
) -> GeminiCallResult:
    """
    高层入口: 分析一个 walkthrough 视频, 输出下游 research agent 可用的 JSON 文本。

    参数:
        video_uri: 已上传到 Gemini File API 的视频 URI
        model: Gemini 模型名称, 如 "gemini-2.5-flash" 或 "gemini-3.0-pro"
        product_context: 一两句上下文提示, 如:
            "AI-assisted coding tool for indie hackers"
            "AI-native co-reading app for parents and kids"
        media_resolution: 视频分辨率偏好
        thinking_level: 思考级别
    返回:
        GeminiCallResult, 其中 result["text"] 是 walkthrough 的结构化 JSON 分析
    """
    if not product_context:
        user_message = (
            "Here is a raw product walkthrough video. "
            "Analyze it according to the system instructions and output the JSON."
        )
    else:
        user_message = (
            f"Here is a raw product walkthrough video for {product_context}. "
            "Analyze it according to the system instructions and output the JSON."
        )

    return call_gemini_with_video(
        video_uri=video_uri,
        system_prompt=WALKTHROUGH_ANALYSIS_SYSTEM_PROMPT,
        user_message=user_message,
        model=model,
        tools=None,  
        media_resolution=media_resolution,
        thinking_level=thinking_level,
    )
