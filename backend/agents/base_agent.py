import os
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv

# Explicitly load .env from current directory or parent
env_path = Path(".") / ".env"
if not env_path.exists():
    env_path = Path("..") / ".env"

load_dotenv(dotenv_path=env_path)

class BaseAgent:
    def __init__(self, model_name="gemini-3-pro-preview"):
        # Support both variable names
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("Warning: GEMINI_API_KEY or GOOGLE_API_KEY not found in environment variables.")
            
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)

    def generate(self, prompt: str) -> str:
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error generating content: {e}")
            return ""
