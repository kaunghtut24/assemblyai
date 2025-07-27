from fastapi import FastAPI, File, UploadFile, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from transcriber import OptimizedTranscriber, AssemblyAITranscriber, TranscriptionError, PerformanceMetrics
import tempfile
import os
import time
import shutil
from typing import Dict, Any
from contextlib import asynccontextmanager

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
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
    speech_model: str = "slam-1",
    language_code: str = None,
    enable_caching: bool = True
):
    """
    Transcribe audio file with optimized performance

    - **file**: Audio file to transcribe (supports various formats)
    - **speech_model**: AssemblyAI speech model to use (default: slam-1)
    - **language_code**: Language code for transcription (optional)
    - **enable_caching**: Whether to enable result caching (default: true)
    """
    start_time = time.time()
    temp_file_path = None

    try:
        # Validate file
        if not file.filename:
            raise TranscriptionError("No file provided", 400)

        # Check file size (limit to 500MB)
        max_size = 500 * 1024 * 1024  # 500MB
        file_size = 0

        # Create temporary file with async file operations
        temp_file_path = tempfile.mktemp(suffix=f"_{file.filename}")

        logger.info("Starting file upload",
                   filename=file.filename,
                   content_type=file.content_type)

        # Stream file to disk to handle large files efficiently
        if AIOFILES_AVAILABLE:
            # Use async file operations
            async with aiofiles.open(temp_file_path, 'wb') as temp_file:
                while chunk := await file.read(8192):  # 8KB chunks
                    file_size += len(chunk)
                    if file_size > max_size:
                        raise TranscriptionError(
                            f"File too large. Maximum size is {max_size // (1024*1024)}MB",
                            413
                        )
                    await temp_file.write(chunk)
        else:
            # Fallback to sync file operations
            with open(temp_file_path, 'wb') as temp_file:
                while chunk := await file.read(8192):  # 8KB chunks
                    file_size += len(chunk)
                    if file_size > max_size:
                        raise TranscriptionError(
                            f"File too large. Maximum size is {max_size // (1024*1024)}MB",
                            413
                        )
                    temp_file.write(chunk)

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
                    enable_caching=enable_caching
                )
            else:
                # Basic transcriber (sync)
                result = transcriber_instance.transcribe_with_local_file(temp_file_path)
        else:
            raise TranscriptionError("Transcriber not properly initialized", 500)

        # Add performance metrics to response
        processing_time = time.time() - start_time
        result["processing_time"] = processing_time
        result["file_size_mb"] = file_size / (1024*1024)

        # Schedule cleanup of temp file
        background_tasks.add_task(cleanup_temp_file, temp_file_path)

        logger.info("Transcription completed successfully",
                   filename=file.filename,
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