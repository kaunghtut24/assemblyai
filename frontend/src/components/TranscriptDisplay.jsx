import { useState, useCallback } from "react";
import { useTheme } from '../contexts/ThemeContext';

export default function TranscriptDisplay({ result, highlightedWordIndex = -1 }) {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);
  const [showWords, setShowWords] = useState(false);

  // Copy to clipboard functionality
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = result.text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result.text]);

  // Download as text file
  const downloadTranscript = useCallback(() => {
    const blob = new Blob([result.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result.text]);

  // Format confidence as percentage
  const formatConfidence = (confidence) => {
    if (!confidence) return 'N/A';
    return `${(confidence * 100).toFixed(1)}%`;
  };

  // Format processing time
  const formatProcessingTime = (time) => {
    if (!time) return 'N/A';
    return `${time.toFixed(2)}s`;
  };

  // Format file size
  const formatFileSize = (sizeMB) => {
    if (!sizeMB) return 'N/A';
    return `${sizeMB.toFixed(2)} MB`;
  };

  // Render transcript with word highlighting
  const renderTranscriptText = () => {
    if (!result.words || result.words.length === 0) {
      return (
        <p className={`leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          {result.text}
        </p>
      );
    }

    return (
      <div className="leading-relaxed">
        {result.words.map((word, index) => (
          <span
            key={index}
            className={`
              transition-all duration-200 cursor-pointer
              ${index === highlightedWordIndex
                ? isDark
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-blue-500 text-white shadow-lg'
                : isDark
                  ? 'text-gray-100 hover:bg-gray-700'
                  : 'text-gray-900 hover:bg-gray-100'
              }
              ${index === highlightedWordIndex ? 'px-1 rounded' : ''}
            `}
            title={`${word.start}ms - ${word.end}ms (${formatConfidence(word.confidence)})`}
          >
            {word.text}
            {index < result.words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={`
      mt-6 border-t pt-6 space-y-4
      ${isDark ? 'border-gray-700' : 'border-gray-200'}
    `}>
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h2 className={`text-lg sm:text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Transcript Results
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={copyToClipboard}
            className={`
              flex-1 sm:flex-none px-3 py-2 sm:py-1 text-sm rounded-md transition-colors touch-manipulation min-h-[44px] sm:min-h-0
              ${isDark
                ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-600 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700'
              }
            `}
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button
            onClick={downloadTranscript}
            className={`
              flex-1 sm:flex-none px-3 py-2 sm:py-1 text-sm rounded-md transition-colors touch-manipulation min-h-[44px] sm:min-h-0
              ${isDark
                ? 'bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-blue-100'
                : 'bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-700'
              }
            `}
          >
            💾 Download
          </button>
        </div>
      </div>

      {/* Performance metrics */}
      <div className={`
        grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg
        ${isDark ? 'bg-gray-800' : 'bg-gray-50'}
      `}>
        <div className="text-center">
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Confidence</div>
          <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {formatConfidence(result.confidence)}
          </div>
        </div>
        <div className="text-center">
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Processing Time</div>
          <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {formatProcessingTime(result.processing_time)}
          </div>
        </div>
        <div className="text-center">
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>File Size</div>
          <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {formatFileSize(result.file_size_mb)}
          </div>
        </div>
        <div className="text-center">
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Words</div>
          <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {result.words?.length || 'N/A'}
          </div>
        </div>
      </div>

      {/* Main transcript text */}
      <div className={`
        border rounded-lg p-4 sm:p-6 min-h-[200px] mobile-scroll
        ${isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
        }
      `}>
        <div className="prose max-w-none text-sm sm:text-base">
          {renderTranscriptText()}
        </div>
      </div>

      {/* Word-level details toggle */}
      {result.words && result.words.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowWords(!showWords)}
            className={`
              text-sm underline transition-colors touch-manipulation min-h-[44px] sm:min-h-0 py-2 sm:py-0
              ${isDark
                ? 'text-blue-400 hover:text-blue-300 active:text-blue-500'
                : 'text-blue-600 hover:text-blue-700 active:text-blue-800'
              }
            `}
          >
            {showWords ? 'Hide' : 'Show'} word-level details
          </button>

          {showWords && (
            <div className={`
              border rounded-lg p-3 sm:p-4 max-h-48 sm:max-h-64 overflow-y-auto mobile-scroll
              ${isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-gray-50 border-gray-200'
              }
            `}>
              <div className="grid gap-2">
                {result.words.map((word, index) => (
                  <div
                    key={index}
                    className={`
                      flex justify-between items-center text-sm p-2 rounded transition-colors
                      ${index === highlightedWordIndex
                        ? isDark
                          ? 'bg-blue-700 text-white'
                          : 'bg-blue-100 text-blue-900'
                        : isDark
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="font-medium">{word.text}</span>
                    <div className={`
                      flex gap-4 text-xs
                      ${index === highlightedWordIndex
                        ? isDark ? 'text-blue-100' : 'text-blue-700'
                        : isDark ? 'text-gray-400' : 'text-gray-600'
                      }
                    `}>
                      <span>Start: {word.start}ms</span>
                      <span>End: {word.end}ms</span>
                      <span>Confidence: {formatConfidence(word.confidence)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Additional metadata */}
      {result.id && (
        <div className={`
          text-xs border-t pt-2
          ${isDark
            ? 'text-gray-500 border-gray-700'
            : 'text-gray-500 border-gray-200'
          }
        `}>
          Transcript ID: {result.id}
        </div>
      )}
    </div>
  );
}