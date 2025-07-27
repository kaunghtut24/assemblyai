import { useState, useCallback, useRef } from "react";

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

export default function FileUpload({ onTranscribe }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
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

  // Enhanced upload with progress tracking and error handling
  const uploadAndTranscribe = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      // Validate file
      validateFile(file);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const operation = async () => {
        const formData = new FormData();
        formData.append("file", file);

        // Enhanced fetch with progress tracking
        const response = await fetch("http://localhost:8000/transcribe", {
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

      setProgress(100);
      onTranscribe(result);

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
  }, [file, onTranscribe, validateFile]);

  // Cancel transcription
  const cancelTranscription = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
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
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    }
  }, [validateFile]);

  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      try {
        validateFile(selectedFile);
        setFile(selectedFile);
        setError(null);
      } catch (err) {
        setError(err.message);
        setFile(null);
      }
    }
  }, [validateFile]);

  return (
    <div className="space-y-4">
      {/* Drag and Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          <div className="text-gray-600">
            {file ? (
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / (1024*1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p>Drag and drop your audio file here, or</p>
                <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                  browse files
                  <input
                    type="file"
                    className="hidden"
                    accept="audio/*,video/*,.mp3,.wav,.mp4,.m4a,.webm,.flac,.ogg"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Progress Bar */}
      {loading && (
        <div className="space-y-2">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Transcribing... {progress}%
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={uploadAndTranscribe}
          disabled={!file || loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? "Transcribing..." : "Transcribe Audio"}
        </button>

        {loading && (
          <button
            onClick={cancelTranscription}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}

        {file && !loading && (
          <button
            onClick={() => {
              setFile(null);
              setError(null);
              setProgress(0);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}