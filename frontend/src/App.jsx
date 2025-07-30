import FileUpload from "./components/FileUpload";
import TranscriptDisplay from "./components/TranscriptDisplay";
import PerformanceMonitor from "./components/PerformanceMonitor";
import AudioPlayer from "./components/AudioPlayer";
import ThemeToggle from "./components/ThemeToggle";
import SpeakerSettings from "./components/SpeakerSettings";
import ModelSelection from "./components/ModelSelection";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { buildApiUrl } from "./config/api";
import { useState, useCallback, useEffect } from "react";

function AppContent() {
  const { isDark } = useTheme();
  const [transcript, setTranscript] = useState(null);
  const [history, setHistory] = useState([]);
  const [apiHealth, setApiHealth] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);

  // Speaker diarization settings
  const [speakerLabels, setSpeakerLabels] = useState(false);
  const [speakersExpected, setSpeakersExpected] = useState(null);
  const [minSpeakersExpected, setMinSpeakersExpected] = useState(null);
  const [maxSpeakersExpected, setMaxSpeakersExpected] = useState(null);

  // Model selection
  const [speechModel, setSpeechModel] = useState("universal");

  // Check API health on mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch(buildApiUrl("/health"));
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
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4">
            <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              🎤 Audio Transcriber
            </h1>
            <ThemeToggle />
          </div>
          <p className={`text-sm sm:text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            High-performance audio transcription powered by AssemblyAI
          </p>

          {/* API Status */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm">
            {apiHealth?.status === "healthy" ? (
              <div className={`
                flex items-center gap-2 px-3 py-1 rounded-full
                ${isDark
                  ? 'text-green-300 bg-green-900/30'
                  : 'text-green-700 bg-green-100'
                }
              `}>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                API Online
              </div>
            ) : (
              <div className={`
                flex items-center gap-2 px-3 py-1 rounded-full
                ${isDark
                  ? 'text-red-300 bg-red-900/30'
                  : 'text-red-700 bg-red-100'
                }
              `}>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                API Offline
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className={`
              rounded-lg shadow-sm border p-6
              ${isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
              }
            `}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Upload Audio File
              </h2>
              <FileUpload
                onTranscribe={handleTranscribe}
                onFileSelect={setAudioFile}
                speechModel={speechModel}
                speakerLabels={speakerLabels}
                speakersExpected={speakersExpected}
                minSpeakersExpected={minSpeakersExpected}
                maxSpeakersExpected={maxSpeakersExpected}
              />

              {/* Model Selection */}
              <div className="mt-6">
                <ModelSelection
                  speechModel={speechModel}
                  setSpeechModel={setSpeechModel}
                />
              </div>

              {/* Speaker Settings */}
              <div className="mt-6">
                <SpeakerSettings
                  speakerLabels={speakerLabels}
                  setSpeakerLabels={setSpeakerLabels}
                  speakersExpected={speakersExpected}
                  setSpeakersExpected={setSpeakersExpected}
                  minSpeakersExpected={minSpeakersExpected}
                  setMinSpeakersExpected={setMinSpeakersExpected}
                  maxSpeakersExpected={maxSpeakersExpected}
                  setMaxSpeakersExpected={setMaxSpeakersExpected}
                />
              </div>

              {transcript && (
                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    onClick={clearTranscript}
                    className={`
                      text-sm underline transition-colors
                      ${isDark
                        ? 'text-gray-400 hover:text-gray-200'
                        : 'text-gray-600 hover:text-gray-800'
                      }
                    `}
                  >
                    Clear current transcript
                  </button>
                </div>
              )}
            </div>

            {/* Audio Player */}
            {(audioFile || transcript?.file_info) && transcript && (
              <div className="mt-6">
                <AudioPlayer
                  audioFile={audioFile || transcript}
                  transcript={transcript}
                  onWordHighlight={setHighlightedWordIndex}
                />
              </div>
            )}
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <div className={`
              rounded-lg shadow-sm border p-6
              ${isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
              }
            `}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Recent Transcripts
                </h3>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className={`
                      text-xs underline transition-colors
                      ${isDark
                        ? 'text-gray-400 hover:text-gray-200'
                        : 'text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No transcripts yet
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`
                        p-3 border rounded-lg cursor-pointer transition-colors
                        ${isDark
                          ? 'border-gray-600 hover:bg-gray-700'
                          : 'border-gray-100 hover:bg-gray-50'
                        }
                      `}
                      onClick={() => setTranscript(item)}
                    >
                      <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                      <div className={`text-sm line-clamp-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {item.text.substring(0, 100)}...
                      </div>
                      <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
            <div className={`
              rounded-lg shadow-sm border p-6
              ${isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
              }
            `}>
              <TranscriptDisplay
                result={transcript}
                highlightedWordIndex={highlightedWordIndex}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`mt-12 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>
            Powered by{" "}
            <a
              href="https://www.assemblyai.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`underline transition-colors ${
                isDark
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-blue-600 hover:text-blue-700'
              }`}
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

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}