import FileUpload from "./components/FileUpload";
import TranscriptDisplay from "./components/TranscriptDisplay";
import PerformanceMonitor from "./components/PerformanceMonitor";
import { useState, useCallback, useEffect } from "react";

export default function App() {
  const [transcript, setTranscript] = useState(null);
  const [history, setHistory] = useState([]);
  const [apiHealth, setApiHealth] = useState(null);

  // Check API health on mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch("http://localhost:8000/health");
        const data = await response.json();
        setApiHealth(data);
      } catch (error) {
        console.error("API health check failed:", error);
        setApiHealth({ status: "unhealthy", error: error.message });
      }
    };

    checkApiHealth();
  }, []);

  // Handle new transcription
  const handleTranscribe = useCallback((result) => {
    setTranscript(result);

    // Add to history
    const historyItem = {
      id: result.id || Date.now(),
      timestamp: new Date().toISOString(),
      text: result.text,
      confidence: result.confidence,
      processing_time: result.processing_time,
      file_size_mb: result.file_size_mb
    };

    setHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10
  }, []);

  // Clear current transcript
  const clearTranscript = useCallback(() => {
    setTranscript(null);
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎤 Audio Transcription Service
          </h1>
          <p className="text-gray-600">
            High-performance audio transcription powered by AssemblyAI
          </p>

          {/* API Status */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm">
            {apiHealth?.status === "healthy" ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                API Online
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700 bg-red-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                API Offline
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upload Audio File
              </h2>
              <FileUpload onTranscribe={handleTranscribe} />

              {transcript && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={clearTranscript}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Clear current transcript
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Transcripts
                </h3>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-gray-500 text-sm">No transcripts yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setTranscript(item)}
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-900 line-clamp-2">
                        {item.text.substring(0, 100)}...
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Confidence: {item.confidence ? `${(item.confidence * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Monitor */}
            <div className="mt-4">
              <PerformanceMonitor />
            </div>
          </div>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <TranscriptDisplay result={transcript} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Powered by{" "}
            <a
              href="https://www.assemblyai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              AssemblyAI
            </a>
            {" "}• Built with FastAPI & React
          </p>
        </div>
      </div>
    </div>
  );
}