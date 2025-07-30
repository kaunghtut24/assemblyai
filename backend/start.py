#!/usr/bin/env python3
"""
Startup script for the Audio Transcription API
Handles environment-based configuration for deployment flexibility
"""

import os
import uvicorn
from dotenv import load_dotenv

def main():
    """Start the FastAPI server with environment-based configuration"""
    # Load environment variables
    load_dotenv()
    
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "false").lower() == "true"
    log_level = os.getenv("LOG_LEVEL", "info").lower()
    
    print(f"🚀 Starting Audio Transcription API")
    print(f"📡 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"🔄 Reload: {reload}")
    print(f"📝 Log Level: {log_level}")
    
    # Print CORS configuration
    cors_origins = os.getenv("CORS_ORIGINS", "")
    if cors_origins:
        origins = [origin.strip() for origin in cors_origins.split(",")]
        print(f"🌐 CORS Origins: {origins}")
    else:
        print("🌐 CORS Origins: Using fallback (localhost:3000)")
    
    print("-" * 50)
    
    # Start the server
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=reload,
        log_level=log_level,
        access_log=True
    )

if __name__ == "__main__":
    main()
