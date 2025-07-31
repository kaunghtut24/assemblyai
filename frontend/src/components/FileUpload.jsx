import { useState, useCallback, useRef, useEffect } from "react";
import { useTheme } from '../contexts/ThemeContext';
import { buildApiUrl } from '../config/api';

// Performance monitoring utility
class TranscriptionRUM {
  constructor() {
    this.metrics = [];
  }

  async trackTranscription(operation, metadata = {}) {
    const startTime = performance.now();
    const startMemory = performance.memory?.usedJSHeapSize || 0;

    try {
      const result = await operation();

      this.recordMetric({
        type: 'transcription_success',
        duration: performance.now() - startTime,
        memoryDelta: (performance.memory?.usedJSHeapSize || 0) - startMemory,
        ...metadata
      });

      return result;
    } catch (error) {
      this.recordMetric({
        type: 'transcription_error',
        duration: performance.now() - startTime,
        error: error.message,
        ...metadata
      });
      throw error;
    }
  }

  recordMetric(metric) {
    this.metrics.push({
      ...metric,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });

    // Log performance data
    console.log('Performance metric:', metric);
  }
}

const rum = new TranscriptionRUM();

export default function FileUpload({
  onTranscribe,
  onFileSelect,
  speechModel = "universal",
  speakerLabels = false,
  speakersExpected = null,
  minSpeakersExpected = null,
  maxSpeakersExpected = null,
  keytermsPrompt = ""
}) {
  const { isDark } = useTheme();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const abortControllerRef = useRef(null);

  // File validation
  const validateFile = useCallback((file) => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = [
      'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a',
      'audio/webm', 'video/mp4', 'video/webm'
    ];

    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize / (1024*1024)}MB`);
    }

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|mp4|m4a|webm|flac|ogg)$/i)) {
      throw new Error('Unsupported file type. Please use audio or video files.');
    }

    return true;
  }, []);

  // Estimate transcription time based on file size
  const estimateTranscriptionTime = useCallback((file) => {
    if (!file) return null;

    // Rough estimation: 1MB ≈ 1 minute of audio, transcription takes ~10-30% of audio duration
    const fileSizeMB = file.size / (1024 * 1024);
    const estimatedAudioMinutes = fileSizeMB; // Very rough approximation
    const transcriptionMinutes = Math.max(0.5, estimatedAudioMinutes * 0.2); // 20% of audio duration, minimum 30 seconds

    if (transcriptionMinutes < 1) {
      return `~${Math.round(transcriptionMinutes * 60)} seconds`;
    } else if (transcriptionMinutes < 60) {
      return `~${Math.round(transcriptionMinutes)} minute${transcriptionMinutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(transcriptionMinutes / 60);
      const minutes = Math.round(transcriptionMinutes % 60);
      return `~${hours}h ${minutes}m`;
    }
  }, []);

  // Upload and transcription
  const uploadAndTranscribe = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Validate file
      validateFile(file);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const operation = async () => {
        const formData = new FormData();
        formData.append("file", file);

        // Add speech model parameter
        formData.append("speech_model", speechModel);

        // Add speaker diarization parameters
        if (speakerLabels) {
          formData.append("speaker_labels", "true");
          if (speakersExpected !== null) {
            formData.append("speakers_expected", speakersExpected.toString());
          }
          if (minSpeakersExpected !== null) {
            formData.append("min_speakers_expected", minSpeakersExpected.toString());
          }
          if (maxSpeakersExpected !== null) {
            formData.append("max_speakers_expected", maxSpeakersExpected.toString());
          }
        }

        // Add keyterms prompt for slam-1 model
        if (keytermsPrompt && speechModel === "slam-1") {
          formData.append("keyterms_prompt", keytermsPrompt);
        }

        // Perform transcription request
        const response = await fetch(buildApiUrl("/transcribe"), {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal,
          headers: {
            // Let browser set Content-Type for FormData
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data;
      };

      // Track performance and execute
      const result = await rum.trackTranscription(operation, {
        fileSize: file.size,
        fileName: file.name,
        fileType: file.type
      });

      // Complete transcription
      setLoading(false);
      onTranscribe(result);
      onFileSelect?.(file); // Pass the audio file for playback

    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Transcription cancelled');
      } else {
        setError(err.message || 'Transcription failed');
      }
      console.error('Transcription error:', err);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [file, onTranscribe, onFileSelect, validateFile, speechModel, speakerLabels, speakersExpected, minSpeakersExpected, maxSpeakersExpected]);

  // Cancel transcription
  const cancelTranscription = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      try {
        validateFile(droppedFile);
        setFile(droppedFile);
        setEstimatedTime(estimateTranscriptionTime(droppedFile));
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  }, [validateFile, estimateTranscriptionTime]);

  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      try {
        validateFile(selectedFile);
        setFile(selectedFile);
        setEstimatedTime(estimateTranscriptionTime(selectedFile));
        setError(null);
      } catch (err) {
        setError(err.message);
        setFile(null);
        setEstimatedTime(null);
      }
    }
  }, [validateFile, estimateTranscriptionTime]);

  return (
    <div className="space-y-4">
      {/* Drag and Drop Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors touch-manipulation
          ${dragOver
            ? isDark
              ? 'border-blue-400 bg-blue-900/20'
              : 'border-blue-500 bg-blue-50'
            : isDark
              ? 'border-gray-600 hover:border-gray-500 bg-gray-800'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-3">
          <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            {file ? (
              <div className="space-y-2">
                <div className="text-4xl">📁</div>
                <p className={`font-medium text-base sm:text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {file.name}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {(file.size / (1024*1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-4xl">🎵</div>
                <div>
                  <p className="text-base sm:text-lg mb-2">Drag and drop your audio file here</p>
                  <p className="text-sm mb-3">or</p>
                  <label className={`
                    inline-block px-4 py-3 sm:px-6 sm:py-2 rounded-lg font-medium cursor-pointer transition-colors touch-manipulation min-h-[44px] flex items-center justify-center
                    ${isDark
                      ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white'
                    }
                  `}>
                    Choose File
                    <input
                      type="file"
                      className="hidden"
                      accept="audio/*,video/*,.mp3,.wav,.mp4,.m4a,.webm,.flac,.ogg"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Supports: MP3, WAV, MP4, M4A, WebM, FLAC, OGG (max 500MB)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={`
          border rounded-lg p-3
          ${isDark
            ? 'bg-red-900/20 border-red-800 text-red-300'
            : 'bg-red-50 border-red-200 text-red-700'
          }
        `}>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Estimated Time Display */}
      {file && estimatedTime && !loading && (
        <div className={`
          border rounded-lg p-3 text-center
          ${isDark
            ? 'bg-blue-900/20 border-blue-800 text-blue-300'
            : 'bg-blue-50 border-blue-200 text-blue-700'
          }
        `}>
          <p className="text-sm">
            ⏱️ Estimated transcription time: <span className="font-medium">{estimatedTime}</span>
          </p>
        </div>
      )}

      {/* Working Animation */}
      {loading && (
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="flex space-x-1">
              <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} style={{animationDelay: '0ms'}}></div>
              <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} style={{animationDelay: '150ms'}}></div>
              <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
          <p className={`text-sm text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            🎯 Transcribing your audio...
            {estimatedTime && (
              <span className="block text-xs mt-1 opacity-75">
                Estimated time: {estimatedTime}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
        <button
          onClick={uploadAndTranscribe}
          disabled={!file || loading}
          className={`
            flex-1 px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors touch-manipulation min-h-[44px] sm:min-h-0
            ${!file || loading
              ? isDark
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gray-400 text-white cursor-not-allowed'
              : isDark
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
            }
          `}
        >
          {loading ? "Transcribing..." : "Transcribe Audio"}
        </button>

        <div className="flex gap-2">
          {loading && (
            <button
              onClick={cancelTranscription}
              className={`
                px-4 py-3 sm:py-2 border rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-0
                ${isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700 active:bg-gray-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                }
              `}
            >
              Cancel
            </button>
          )}

          {file && !loading && (
            <button
              onClick={() => {
                setFile(null);
                setError(null);
                setEstimatedTime(null);
              }}
              className={`
                px-4 py-3 sm:py-2 border rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-0
                ${isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700 active:bg-gray-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                }
              `}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}