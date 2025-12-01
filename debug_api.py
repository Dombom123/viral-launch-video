import os
from dotenv import load_dotenv
import google.generativeai as genai

def test_api_access():
    print("--- Debugging API Access ---")
    
    # 1. Check Environment Variables
    print(f"Current Working Directory: {os.getcwd()}")
    
    # Try loading from specific paths
    env_loaded = load_dotenv(dotenv_path="backend/.env")
    print(f"Loaded backend/.env: {env_loaded}")
    
    if not env_loaded:
        env_loaded = load_dotenv(dotenv_path=".env")
        print(f"Loaded .env: {env_loaded}")

    gemini_key = os.getenv("GEMINI_API_KEY")
    google_key = os.getenv("GOOGLE_API_KEY")
    
    print(f"GEMINI_API_KEY found: {'Yes' if gemini_key else 'No'}")
    print(f"GOOGLE_API_KEY found: {'Yes' if google_key else 'No'}")
    
    active_key = gemini_key or google_key
    
    if not active_key:
        print("ERROR: No API key found. Please check your .env file.")
        return

    # 2. Test Gemini Client
    print("\n--- Testing Gemini Client ---")
    try:
        genai.configure(api_key=active_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content("Hello, are you working?")
        print(f"Response received: {response.text[:50]}...")
        print("SUCCESS: API is working correctly.")
    except Exception as e:
        print(f"ERROR: Failed to call Gemini API. Reason: {e}")

if __name__ == "__main__":
    test_api_access()


