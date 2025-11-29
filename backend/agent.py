from gemini_utils import analyze_walkthrough_for_ads

from google.adk.agents import LlmAgent
from google.adk.models.google_llm import Gemini
from google.adk.tools.agent_tool import AgentTool
from google.adk.tools.google_search_tool import google_search

from google.genai import types
from typing import List
import os
from dotenv import load_dotenv
load_dotenv()
print("✅ ADK components imported successfully.")

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in environment variables. Please set it in a .env file or environment.")


# Configure retry options for the Gemini model
retry_config = types.HttpRetryOptions(
    attempts=5,  # Maximum retry attempts
    exp_base=7,  # Delay multiplier
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504],  # Retry on these HTTP errors
)


# Google Search agent
ads_research_agent = LlmAgent(
    name="ads_research_agent",
    model=Gemini(model="gemini-3-pro-preview", retry_options=retry_config),
    description="Searches for information using Google search",
    instruction=f"""
        You are a senior performance marketer and creative strategist with a track record of producing viral ads on TikTok, Reels, and YouTube Shorts, here is the analysis results from analyze_walkthrough_for_ads: {analyze_walkthrough_for_ads()}. 
        Your task: search the web and synthesize the most effective, up-to-date methods for creating viral video ads for mobile apps and story based products like novels or reading apps.

        Requirements:

        Search for and summarize
            - Proven viral ad frameworks for short videos. For example: hook story payoff, problem agitation solution, “I tried X for 7 days” challenge formats, reaction or duet formats, UGC style ads.
            - Specific tactics that have worked well for app promotion content, including examples of angles that trigger curiosity and emotional engagement.
            - Best practices for making ads look native to each platform instead of like polished TV commercials.

        For each framework or tactic:
            - Give a 1 sentence description.
            - Explain why it works in terms of human psychology, attention, and shareability.
            - Provide 2 to 3 example ad ideas for this app.

        Output format:
            - you should output in json format which is defined as:
            {
    "project_context": {
        "product_name": "EcoBottle 3000",
        "brand_voice": "Futuristic & Sustainable",
        "target_audience": "Tech-Savvy Hikers",
        "viral_angle": "Tech vs. Nature"
    },
    "generated_scripts": [
        {
        "id": "script_01",
        "title": "The Microscope Reveal",
        "hook": "You are drinking 10,000 bacteria right now.",
        "tone": "Shock & Awe",
        "assets": {
            "characters": [
            {
                "name": "Tech User",
                "visual_prompt": "Young adult, diverse, wearing smart casual tech wear, looking concerned then relieved."
            }
            ],
            "objects": [
            {
                "name": "Dirty Bottle",
                "visual_prompt": "Close up of a worn plastic water bottle rim with visible grime and texture."
            },
            {
                "name": "EcoBottle 3000",
                "visual_prompt": "Sleek matte black smart water bottle with a glowing blue LED ring on the cap."
            }
            ],
            "environments": [
            {
                "name": "Dark Lab",
                "visual_prompt": "Dark moody laboratory setting with blue rim lighting, microscope in background."
            },
            {
                "name": "Modern Loft",
                "visual_prompt": "Clean, minimalist apartment kitchen with concrete counters and natural light."
            }
            ]
        },
        "scenes": [
            {
            "scene_id": 1,
            "visual": "Extreme macro shot of dirty bottle rim. Text overlay: 'YOUR BOTTLE IS ALIVE'",
            "audio": "Stop. Look at your water bottle rim."
            },
            {
            "scene_id": 2,
            "visual": "EcoBottle 3000 cap glowing Blue. Split screen vs bacteria.",
            "audio": "This is the solution."
            },
            {
            "scene_id": 3,
            "visual": "Finger taps cap. Bacteria disintegrate.",
            "audio": "One tap. 99.9 % eliminated."
            }
        ]
        },
        {
        "id": "script_02",
        "title": "Sounds of Purity",
        "hook": "The sound of perfect hydration.",
        "tone": "ASMR / Satisfying",
        "assets": {
            "characters": [
            {
                "name": "Hiker",
                "visual_prompt": "Fit individual in 30s, wearing high-end outdoor gear, looking peaceful."
            }
            ],
            "objects": [
            {
                "name": "EcoBottle 3000 (White)",
                "visual_prompt": "Pristine glacial white smart bottle, water droplets on surface."
            }
            ],
            "environments": [
            {
                "name": "Misty Forest",
                "visual_prompt": "Dense pine forest at sunrise, shafts of light cutting through mist."
            },
            {
                "name": "Mountain Stream",
                "visual_prompt": "Crystal clear water flowing over smooth river stones, cinematic focus."
            }
            ]
        },
        "scenes": [
            {
            "scene_id": 1,
            "visual": "Misty forest morning. Birds chirping.",
            "audio": "(Nature sounds)"
            },
            {
            "scene_id": 2,
            "visual": "Filling EcoBottle from crystal clear stream.",
            "audio": "(Crisp water sounds)"
            },
            {
            "scene_id": 3,
            "visual": "Cap click. Electric hum.",
            "audio": "(Humming sound)"
            }
        ]
        },
        {
        "id": "script_03",
        "title": "Stop Wasting Money",
        "hook": "Spending $5 a day on water?",
        "tone": "Educational / Energetic",
        "assets": {
            "characters": [
            {
                "name": "Frustrated Commuter",
                "visual_prompt": "Business casual attire, looking annoyed at a receipt."
            }
            ],
            "objects": [
            {
                "name": "Plastic Waste",
                "visual_prompt": "Pile of crushed single-use plastic water bottles."
            },
            {
                "name": "Money",
                "visual_prompt": "Stylized dollar bills flying away or burning."
            }
            ],
            "environments": [
            {
                "name": "City Street",
                "visual_prompt": "Busy urban street corner with a trash can overflowing."
            },
            {
                "name": "Comparison Space",
                "visual_prompt": "Clean studio background split down the middle for comparison."
            }
            ]
        },
        "scenes": [
            {
            "scene_id": 1,
            "visual": "Fast montage of buying expensive water.",
            "audio": "You're throwing money away."
            },
            {
            "scene_id": 2,
            "visual": "EcoBottle filling from tap. Gold glow effect.",
            "audio": "Turn tap water into gold."
            },
            {
            "scene_id": 3,
            "visual": "Side by side: 1 EcoBottle vs 100 plastic bottles.",
            "audio": "Save the planet. Save your wallet."
            }
        ]
        }
    ]
    }
        
        """,
    tools=[google_search]
)


# Root agent
root_agent = LlmAgent(
    name="ads_research_agent",
    model=Gemini(model="gemini-3-pro-preview", retry_options=retry_config),
    instruction="""You are a senior performance marketer and creative strategist with a track record of producing viral ads, you should use the ads_research_agent to gather information about creating viral ads for mobile apps and story based products like novels or reading apps. Synthesize the information provided by the ads_research_agent to create a comprehensive strategy for producing viral ads.""",
    tools=[AgentTool(agent=ads_research_agent)],
)
root_agent=root_agent