#!/usr/bin/env python3
"""
Test script to verify AssemblyAI API key is working
"""
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_api_key():
    """Test if the AssemblyAI API key is valid"""
    api_key = os.getenv("ASSEMBLYAI_API_KEY")
    
    if not api_key:
        print("❌ ERROR: ASSEMBLYAI_API_KEY not found in .env file")
        print("Please add your API key to backend/.env:")
        print("ASSEMBLYAI_API_KEY=your_api_key_here")
        return False
    
    print(f"🔑 API Key found: {api_key[:8]}...{api_key[-4:]} (masked)")
    
    # Test the API key by making a simple request
    headers = {
        "authorization": api_key,
        "content-type": "application/json"
    }
    
    try:
        # Test with a simple API call to check account info
        response = requests.get(
            "https://api.assemblyai.com/v2/transcript",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ API Key is VALID and working!")
            data = response.json()
            print(f"📊 Found {len(data.get('transcripts', []))} previous transcripts")
            return True
        elif response.status_code == 401:
            print("❌ API Key is INVALID")
            print("Possible issues:")
            print("  1. The API key is incorrect")
            print("  2. The API key has expired")
            print("  3. The API key doesn't have proper permissions")
            print("\nPlease:")
            print("  1. Go to https://assemblyai.com/dashboard")
            print("  2. Copy your API key")
            print("  3. Update backend/.env with the correct key")
            return False
        elif response.status_code == 429:
            print("⚠️  API Key is valid but you've hit rate limits")
            print("Please wait a moment and try again")
            return False
        else:
            print(f"⚠️  Unexpected response: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        print("Please check your internet connection")
        return False

if __name__ == "__main__":
    print("🧪 Testing AssemblyAI API Key...")
    print("=" * 40)
    
    success = test_api_key()
    
    print("=" * 40)
    if success:
        print("🎉 Your API key is working! You can now use the transcription service.")
    else:
        print("🔧 Please fix the API key issue and try again.")
