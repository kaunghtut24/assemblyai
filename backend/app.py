from fastapi import FastAPI, File, UploadFile, HTTPException, Request, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from transcriber import OptimizedTranscriber, AssemblyAITranscriber, TranscriptionError, PerformanceMetrics
import tempfile
import os
import time
import shutil
import uuid
from pathlib import Path
from typing import Dict, Any, List
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Optional imports with fallbacks
try:
    import aiofiles
    AIOFILES_AVAILABLE = True
except ImportError:
    AIOFILES_AVAILABLE = False

try:
    import structlog
    logger = structlog.get_logger(__name__)
except ImportError:
    import logging
    logger = logging.getLogger(__name__)

# Global transcriber instance
transcriber_instance = None

# Create uploads directory
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

def get_cors_origins() -> List[str]:
    """Get CORS origins from environment variable with fallback"""
    cors_origins = os.getenv("CORS_ORIGINS", "")

    if cors_origins:
        # Split by comma and strip whitespace
        origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
        logger.info(f"Using CORS origins from environment: {origins}")
        return origins

    # Fallback for development
    fallback_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    logger.warning(f"CORS_ORIGINS not set, using fallback: {fallback_origins}")
    return fallback_origins

def get_server_config() -> Dict[str, Any]:
    """Get server configuration from environment variables"""
    return {
        "host": os.getenv("HOST", "0.0.0.0"),
        "port": int(os.getenv("PORT", 8000))
    }

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    global transcriber_instance
    # Startup
    logger.info("Starting up transcription service")
    try:
        transcriber_instance = OptimizedTranscriber()
        logger.info("Using OptimizedTranscriber")
    except Exception as e:
        logger.warning(f"Failed to initialize OptimizedTranscriber, falling back to basic transcriber: {e}")
        transcriber_instance = AssemblyAITranscriber()
        logger.info("Using basic AssemblyAITranscriber")
    yield
    # Shutdown
    logger.info("Shutting down transcription service")
    if transcriber_instance and hasattr(transcriber_instance, 'session'):
        if transcriber_instance.session and not transcriber_instance.session.closed:
            await transcriber_instance.session.close()

app = FastAPI(
    title="Audio Transcription API",
    description="High-performance audio transcription service powered by AssemblyAI",
    version="2.0.0",
    lifespan=lifespan
)

# Add middleware for performance and compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Configure CORS with environment-based origins
cors_origins = get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Custom exception handler for TranscriptionError
@app.exception_handler(TranscriptionError)
async def transcription_exception_handler(request: Request, exc: TranscriptionError):
    logger.error("Transcription error occurred",
                error=exc.message,
                status_code=exc.status_code,
                details=exc.details)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "details": exc.details,
            "timestamp": time.time()
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "service": "audio-transcription-api",
        "version": "2.0.0"
    }

async def cleanup_temp_file(file_path: str):
    """Background task to clean up temporary files"""
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
            logger.info("Cleaned up temporary file", file_path=file_path)
    except Exception as e:
        logger.warning("Failed to cleanup temp file", file_path=file_path, error=str(e))

@app.post("/transcribe")
async def transcribe_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    speech_model: str = Form("universal"),
    language_code: str = Form(None),
    enable_caching: bool = Form(True),
    speaker_labels: bool = Form(False),
    speakers_expected: int = Form(None),
    min_speakers_expected: int = Form(None),
    max_speakers_expected: int = Form(None)
):
    """
    Transcribe audio file with optimized performance and speaker diarization

    - **file**: Audio file to transcribe (supports various formats)
    - **speech_model**: AssemblyAI speech model to use (default: universal)
    - **language_code**: Language code for transcription (optional)
    - **enable_caching**: Whether to enable result caching (default: true)
    - **speaker_labels**: Enable speaker diarization (default: false)
    - **speakers_expected**: Expected number of speakers (optional)
    - **min_speakers_expected**: Minimum number of speakers (optional)
    - **max_speakers_expected**: Maximum number of speakers (optional)
    """
    start_time = time.time()
    temp_file_path = None

    try:
        # Validate file
        if not file.filename:
            raise TranscriptionError("No file provided", 400)

        # Validate speech model
        supported_models = ["universal", "slam-1"]
        if speech_model not in supported_models:
            raise TranscriptionError(
                f"Unsupported speech model: {speech_model}. Supported models: {', '.join(supported_models)}",
                400
            )

        # Check file size (limit to 500MB)
        max_size = 500 * 1024 * 1024  # 500MB
        file_size = 0

        # Create unique filename and save to uploads directory
        file_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix
        saved_filename = f"{file_id}{file_extension}"
        saved_file_path = UPLOADS_DIR / saved_filename

        # Also create temporary file for processing
        temp_file_path = tempfile.mktemp(suffix=f"_{file.filename}")

        logger.info("Starting file upload",
                   filename=file.filename,
                   content_type=file.content_type,
                   file_id=file_id)

        # Stream file to both temp and permanent locations
        if AIOFILES_AVAILABLE:
            # Use async file operations
            async with aiofiles.open(temp_file_path, 'wb') as temp_file, \
                       aiofiles.open(saved_file_path, 'wb') as saved_file:
                while chunk := await file.read(8192):  # 8KB chunks
                    file_size += len(chunk)
                    if file_size > max_size:
                        raise TranscriptionError(
                            f"File too large. Maximum size is {max_size // (1024*1024)}MB",
                            413
                        )
                    await temp_file.write(chunk)
                    await saved_file.write(chunk)
        else:
            # Fallback to sync file operations
            with open(temp_file_path, 'wb') as temp_file, \
                 open(saved_file_path, 'wb') as saved_file:
                while chunk := await file.read(8192):  # 8KB chunks
                    file_size += len(chunk)
                    if file_size > max_size:
                        raise TranscriptionError(
                            f"File too large. Maximum size is {max_size // (1024*1024)}MB",
                            413
                        )
                    temp_file.write(chunk)
                    saved_file.write(chunk)

        logger.info("File uploaded successfully",
                   filename=file.filename,
                   size_mb=file_size / (1024*1024))

        # Transcribe using available transcriber
        if hasattr(transcriber_instance, 'transcribe_with_local_file') and callable(getattr(transcriber_instance, 'transcribe_with_local_file')):
            # Check if it's the optimized version (async)
            if isinstance(transcriber_instance, OptimizedTranscriber):
                result = await transcriber_instance.transcribe_with_local_file(
                    temp_file_path,
                    speech_model=speech_model,
                    language_code=language_code,
                    enable_caching=enable_caching,
                    speaker_labels=speaker_labels,
                    speakers_expected=speakers_expected,
                    min_speakers_expected=min_speakers_expected,
                    max_speakers_expected=max_speakers_expected
                )
            else:
                # Basic transcriber (sync)
                result = transcriber_instance.transcribe_with_local_file(temp_file_path)
        else:
            raise TranscriptionError("Transcriber not properly initialized", 500)

        # Add performance metrics and file information to response
        processing_time = time.time() - start_time
        result["processing_time"] = processing_time
        result["file_size_mb"] = file_size / (1024*1024)
        result["file_info"] = {
            "original_filename": file.filename,
            "saved_filename": saved_filename,
            "file_id": file_id,
            "file_path": str(saved_file_path),
            "content_type": file.content_type,
            "size_bytes": file_size
        }

        # Schedule cleanup of temp file (keep saved file)
        background_tasks.add_task(cleanup_temp_file, temp_file_path)

        logger.info("Transcription completed successfully",
                   filename=file.filename,
                   file_id=file_id,
                   processing_time=processing_time,
                   text_length=len(result.get("text", "")))

        return result

    except TranscriptionError:
        # Clean up temp file immediately on error
        if temp_file_path and os.path.exists(temp_file_path):
            background_tasks.add_task(cleanup_temp_file, temp_file_path)
        raise
    except Exception as e:
        # Clean up temp file immediately on error
        if temp_file_path and os.path.exists(temp_file_path):
            background_tasks.add_task(cleanup_temp_file, temp_file_path)

        logger.error("Unexpected error during transcription",
                    filename=file.filename if file else "unknown",
                    error=str(e))
        raise TranscriptionError(
            f"Internal server error: {str(e)}",
            500,
            {"original_error": str(e)}
        )

@app.get("/audio/{file_id}")
async def get_audio_file(file_id: str):
    """
    Serve uploaded audio files by file ID
    """
    try:
        # Find the file in uploads directory
        for file_path in UPLOADS_DIR.glob(f"{file_id}.*"):
            if file_path.is_file():
                return FileResponse(
                    path=str(file_path),
                    media_type="audio/*",
                    filename=file_path.name
                )

        raise HTTPException(status_code=404, detail="Audio file not found")
    except Exception as e:
        logger.error("Error serving audio file", file_id=file_id, error=str(e))
        raise HTTPException(status_code=500, detail="Error serving audio file")

@app.get("/progress/{transcript_id}")
async def get_transcription_progress(transcript_id: str):
    """Get transcription progress by transcript ID"""
    try:
        if not transcriber_instance:
            raise HTTPException(status_code=500, detail="Transcriber not initialized")

        if hasattr(transcriber_instance, 'get_transcript_progress'):
            progress_data = transcriber_instance.get_transcript_progress(transcript_id)
            return {
                "transcript_id": transcript_id,
                "progress": progress_data.get('progress', 0),
                "timestamp": progress_data.get('timestamp', time.time()),
                "status": "tracking"
            }
        else:
            raise HTTPException(status_code=404, detail="Progress tracking not available")

    except Exception as e:
        logger.error("Error getting transcription progress",
                    transcript_id=transcript_id,
                    error=str(e))
        raise HTTPException(status_code=500, detail=f"Error getting progress: {str(e)}")

@app.get("/metrics")
async def get_metrics():
    """Get service metrics and performance statistics"""
    if transcriber_instance and hasattr(transcriber_instance, 'cache'):
        cache_size = len(transcriber_instance.cache)
        cache_keys = list(transcriber_instance.cache.keys())[:5]  # Show first 5 keys
    else:
        cache_size = 0
        cache_keys = []

    return {
        "cache": {
            "size": cache_size,
            "sample_keys": cache_keys,
            "ttl_seconds": getattr(transcriber_instance, 'cache_ttl', 3600)
        },
        "service": {
            "uptime_seconds": time.time(),
            "version": "2.0.0",
            "max_connections": getattr(transcriber_instance, 'max_connections', 10)
        }
    }

if __name__ == "__main__":
    import uvicorn
    config = get_server_config()
    logger.info(f"Starting server on {config['host']}:{config['port']}")
    uvicorn.run(
        "app:app",
        host=config["host"],
        port=config["port"],
        reload=True,
        log_level="info"
    )