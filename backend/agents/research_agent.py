import json
from typing import Dict, Any
from .base_agent import BaseAgent

MOCK_RESEARCH_DATA = {
    "productInfo": {
        "name": "Inferred Product (Mock)",
        "description": "A placeholder product description since the AI generation failed or API key is missing.",
        "competitors": ["Competitor A", "Competitor B", "Competitor C"]
    },
    "marketAnalysis": {
        "trend": "General Viral Trend",
        "insight": "People love authentic content."
    },
    "scripts": [
        {
            "id": 1,
            "title": "Mock Script 1",
            "hook": "This is a fallback hook.",
            "body": "Describe visual flow here.",
            "callToAction": "Buy Now"
        },
        {
            "id": 2,
            "title": "Mock Script 2",
            "hook": "Another fallback hook.",
            "body": "Describe visual flow here.",
            "callToAction": "Check it out"
        }
    ]
}

class ResearchAgent(BaseAgent):
    def __init__(self):
        # Using Gemini 3 Pro Preview as requested
        super().__init__(model_name="gemini-3-pro-preview")

    def analyze(self, brief_data: Dict[str, Any]) -> Dict[str, Any]:
        source_info = brief_data.get("source_material", {})
        filename = source_info.get("filename", "Unknown Video")
        
        prompt = f"""
        You are an expert viral video researcher and strategist.
        I have a source video file named "{filename}".
        
        Your task is to:
        1. Analyze the potential product/topic based on this filename.
        2. Generate a market analysis for this product category.
        3. Create 3 viral video concepts (scripts) tailored for social media (TikTok/Reels/Shorts).
        
        Output strictly valid JSON matching this structure:
        {{
          "productInfo": {{
            "name": " inferred product name",
            "description": "inferred description",
            "competitors": ["competitor 1", "competitor 2", "competitor 3"]
          }},
          "marketAnalysis": {{
            "trend": "current viral trend",
            "insight": "strategic insight"
          }},
          "scripts": [
            {{
              "id": 1,
              "title": "Catchy Title 1",
              "hook": "Opening hook text",
              "body": "Visual and audio description of the video flow",
              "callToAction": "Strong CTA"
            }},
            {{
              "id": 2,
              "title": "Catchy Title 2",
              "hook": "Opening hook text",
              "body": "Visual and audio description of the video flow",
              "callToAction": "Strong CTA"
            }},
            {{
              "id": 3,
              "title": "Catchy Title 3",
              "hook": "Opening hook text",
              "body": "Visual and audio description of the video flow",
              "callToAction": "Strong CTA"
            }}
          ]
        }}
        """
        
        response_text = self.generate(prompt)
        if not response_text:
            return MOCK_RESEARCH_DATA
        
        try:
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                return MOCK_RESEARCH_DATA
        except json.JSONDecodeError:
            return MOCK_RESEARCH_DATA
