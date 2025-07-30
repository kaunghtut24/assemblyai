import assemblyai as aai
import os
import asyncio
import time
import hashlib
import json
from typing import Optional, Dict, Any, Union
from pathlib import Path
from dotenv import load_dotenv
import backoff
from functools import lru_cache
import tempfile

# Optional imports with fallbacks
try:
    import aiofiles
    AIOFILES_AVAILABLE = True
except ImportError:
    AIOFILES_AVAILABLE = False

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

try:
    import structlog
    logger = structlog.get_logger(__name__)
    STRUCTLOG_AVAILABLE = True
except ImportError:
    import logging
    logger = logging.getLogger(__name__)
    STRUCTLOG_AVAILABLE = False

load_dotenv()

# Configure structured logging
logger = structlog.get_logger(__name__)

class TranscriptionError(Exception):
    """Custom exception for transcription errors"""
    def __init__(self, message: str, status_code: int = 500, details: Dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class PerformanceMetrics:
    """Track performance metrics for transcription operations"""
    def __init__(self):
        self.start_time = time.time()
        self.end_time = None
        self.memory_usage = {}
        self.api_calls = 0
        self.cache_hits = 0
        self.errors = 0

    def complete(self):
        self.end_time = time.time()
        if PSUTIL_AVAILABLE:
            try:
                process = psutil.Process()
                self.memory_usage = {
                    'peak_mb': process.memory_info().rss / 1024 / 1024,
                    'current_mb': process.memory_info().rss / 1024 / 1024
                }
            except Exception:
                self.memory_usage = {'peak_mb': 0, 'current_mb': 0}
        else:
            self.memory_usage = {'peak_mb': 0, 'current_mb': 0}

    @property
    def duration(self) -> float:
        return (self.end_time or time.time()) - self.start_time

    def to_dict(self) -> Dict[str, Any]:
        return {
            'duration_seconds': self.duration,
            'memory_peak_mb': self.memory_usage.get('peak_mb', 0),
            'api_calls': self.api_calls,
            'cache_hits': self.cache_hits,
            'errors': self.errors,
            'efficiency': self.cache_hits / max(self.api_calls, 1) if self.api_calls > 0 else 0
        }

class OptimizedTranscriber:
    """High-performance transcription service with optimizations"""

    def __init__(self, max_connections: int = 10):
        self.api_key = os.getenv("ASSEMBLYAI_API_KEY")
        if not self.api_key:
            raise TranscriptionError("ASSEMBLYAI_API_KEY not found in environment", 401)

        aai.settings.api_key = self.api_key
        self.session = None
        self.max_connections = max_connections
        self.cache = {}  # Simple in-memory cache (Redis would be better for production)
        self.cache_ttl = 3600  # 1 hour
        self.progress_store = {}  # Store transcription progress
        self._setup_connection_pool()

    def _setup_connection_pool(self):
        """Initialize aiohttp session with connection pooling"""
        if AIOHTTP_AVAILABLE:
            try:
                connector = aiohttp.TCPConnector(
                    limit=self.max_connections,
                    limit_per_host=5,
                    keepalive_timeout=30,
                    enable_cleanup_closed=True
                )
                timeout = aiohttp.ClientTimeout(total=600)
                self.session = aiohttp.ClientSession(
                    connector=connector,
                    timeout=timeout,
                    headers={'authorization': self.api_key}
                )
            except Exception as e:
                logger.warning("Failed to setup aiohttp session", error=str(e))
                self.session = None
        else:
            self.session = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session and not self.session.closed:
            await self.session.close()

    @lru_cache(maxsize=128)
    def _get_cache_key(self, audio_source: str, config: str) -> str:
        """Generate cache key for transcription requests"""
        combined = f"{audio_source}:{config}"
        return hashlib.md5(combined.encode()).hexdigest()

    def _get_cached_result(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached transcription result"""
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if time.time() - timestamp < self.cache_ttl:
                return cached_data
            else:
                del self.cache[cache_key]
        return None

    def _cache_result(self, cache_key: str, result: Dict[str, Any]) -> None:
        """Cache successful transcription result"""
        self.cache[cache_key] = (result, time.time())

    def _store_transcript_progress(self, transcript_id: str, progress: int):
        """Store transcription progress"""
        self.progress_store[transcript_id] = {
            'progress': progress,
            'timestamp': time.time()
        }

    def get_transcript_progress(self, transcript_id: str) -> Dict[str, Any]:
        """Get transcription progress"""
        if transcript_id in self.progress_store:
            return self.progress_store[transcript_id]
        return {'progress': 0, 'timestamp': time.time()}

    def _calculate_progress(self, status: aai.TranscriptStatus) -> int:
        """Calculate progress percentage based on transcript status"""
        status_progress_map = {
            aai.TranscriptStatus.queued: 10,
            aai.TranscriptStatus.processing: 50,
            aai.TranscriptStatus.completed: 100,
            aai.TranscriptStatus.error: 0
        }
        return status_progress_map.get(status, 0)

    @backoff.on_exception(
        backoff.expo,
        (aai.AssemblyAIError, Exception),
        max_tries=3,
        max_time=300
    )
    async def transcribe_with_local_file(
        self,
        file_path: str,
        speech_model: str = "universal",
        language_code: Optional[str] = None,
        enable_caching: bool = True,
        speaker_labels: bool = False,
        speakers_expected: Optional[int] = None,
        min_speakers_expected: Optional[int] = None,
        max_speakers_expected: Optional[int] = None,
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """Optimized transcription with caching and async processing"""
        metrics = PerformanceMetrics()

        try:
            # Create config for caching
            config = json.dumps({
                "speech_model": speech_model,
                "language_code": language_code or "en",
                "speaker_labels": speaker_labels,
                "speakers_expected": speakers_expected,
                "min_speakers_expected": min_speakers_expected,
                "max_speakers_expected": max_speakers_expected
            }, sort_keys=True)

            # Check cache first
            if enable_caching:
                cache_key = self._get_cache_key(file_path, config)
                cached_result = self._get_cached_result(cache_key)
                if cached_result:
                    metrics.cache_hits += 1
                    logger.info("Cache hit for transcription", file_path=file_path)
                    return cached_result

            metrics.api_calls += 1

            # Use AssemblyAI SDK with optimized config
            transcriber = aai.Transcriber()

            # Configure transcription options
            config_kwargs = {
                "speech_model": speech_model,
                "language_code": language_code,
                "speaker_labels": speaker_labels
            }

            # Add speaker options if specified
            if speakers_expected is not None:
                config_kwargs["speakers_expected"] = speakers_expected
            elif min_speakers_expected is not None or max_speakers_expected is not None:
                speaker_options = {}
                if min_speakers_expected is not None:
                    speaker_options["min_speakers_expected"] = min_speakers_expected
                if max_speakers_expected is not None:
                    speaker_options["max_speakers_expected"] = max_speakers_expected
                config_kwargs["speaker_options"] = speaker_options

            config_obj = aai.TranscriptionConfig(**config_kwargs)

            logger.info("Starting transcription", file_path=file_path, config=config)

            # Submit transcription request
            transcript = transcriber.submit(file_path, config=config_obj)
            transcript_id = transcript.id

            # Store transcript ID for progress tracking
            self._store_transcript_progress(transcript_id, 0)

            # Poll for completion with progress updates
            while transcript.status not in [aai.TranscriptStatus.completed, aai.TranscriptStatus.error]:
                await asyncio.sleep(2)  # Poll every 2 seconds
                transcript = aai.Transcript.get_by_id(transcript_id)

                # Calculate progress based on status
                progress = self._calculate_progress(transcript.status)
                self._store_transcript_progress(transcript_id, progress)

                # Call progress callback if provided
                if progress_callback:
                    try:
                        await progress_callback(transcript_id, progress, transcript.status.value)
                    except Exception as e:
                        logger.warning("Progress callback failed", error=str(e))

            if transcript.status == aai.TranscriptStatus.error:
                metrics.errors += 1
                raise TranscriptionError(
                    f"Transcription failed: {transcript.error}",
                    status_code=400,
                    details={"transcript_id": transcript.id}
                )

            # Final progress update
            self._store_transcript_progress(transcript_id, 100)

            result = {
                "text": transcript.text,
                "confidence": transcript.confidence,
                "id": transcript.id,
                "transcript_id": transcript_id,
                "status": "completed",
                "audio_duration": getattr(transcript, 'audio_duration', None),
                "words": getattr(transcript, 'words', []) if hasattr(transcript, 'words') else [],
                "utterances": getattr(transcript, 'utterances', []) if hasattr(transcript, 'utterances') else [],
                "speaker_labels_enabled": speaker_labels
            }

            # Cache successful result
            if enable_caching:
                self._cache_result(cache_key, result)

            metrics.complete()
            logger.info("Transcription completed",
                       file_path=file_path,
                       metrics=metrics.to_dict())

            return result

        except aai.AssemblyAIError as e:
            metrics.errors += 1
            metrics.complete()
            logger.error("AssemblyAI API error",
                        error=str(e),
                        status_code=getattr(e, 'status_code', 500),
                        metrics=metrics.to_dict())
            raise TranscriptionError(
                f"API error: {str(e)}",
                status_code=getattr(e, 'status_code', 500),
                details={"original_error": str(e)}
            )
        except Exception as e:
            metrics.errors += 1
            metrics.complete()
            logger.error("Unexpected transcription error",
                        error=str(e),
                        metrics=metrics.to_dict())
            raise TranscriptionError(
                f"Transcription error: {str(e)}",
                status_code=500,
                details={"original_error": str(e)}
            )

# Legacy class for backward compatibility
class AssemblyAITranscriber:
    """Legacy transcriber class - maintained for backward compatibility"""

    def __init__(self):
        self.optimized_transcriber = OptimizedTranscriber()

    def transcribe_with_local_file(self, file_path: str) -> Dict[str, Any]:
        """Legacy sync method - wraps the optimized async version"""
        try:
            # Run the async method in a new event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(
                    self.optimized_transcriber.transcribe_with_local_file(file_path)
                )
                return result
            finally:
                loop.close()
        except TranscriptionError:
            raise
        except Exception as e:
            raise TranscriptionError(f"Transcription error: {str(e)}")
