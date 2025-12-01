from google import genai
print("google.genai imported successfully")
try:
    client = genai.Client(api_key="TEST")
    print("Client created")
except Exception as e:
    print(f"Client init failed: {e}")


