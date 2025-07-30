import { useState, useCallback } from "react";
import { useTheme } from '../contexts/ThemeContext';

export default function TranscriptDisplay({ result, highlightedWordIndex = -1 }) {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);
  const [showWords, setShowWords] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Get preview text (first 200 characters)
  const getPreviewText = () => {
    if (!result.text) return 'No transcription text available';
    const text = result.text.trim();
    if (text.length <= 200) return text;
    return text.substring(0, 200) + '...';
  };

  // Render transcript with speaker diarization
  const renderSpeakerTranscript = () => {
    if (!result.utterances || result.utterances.length === 0) {
      // Fallback to regular transcript if no utterances
      return renderTranscriptText();
    }

    // Sort utterances by start time to ensure proper order
    const sortedUtterances = [...result.utterances].sort((a, b) => a.start - b.start);

    return (
      <div className="space-y-4">
        <div className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Speaker Diarization Enabled - {sortedUtterances.length} speaker segments detected
        </div>

        {sortedUtterances.map((utterance, utteranceIndex) => {
          // Get speaker color for consistency
          const speakerColors = [
            { bg: isDark ? 'bg-blue-600' : 'bg-blue-100', text: isDark ? 'text-blue-100' : 'text-blue-800', border: 'border-blue-500' },
            { bg: isDark ? 'bg-green-600' : 'bg-green-100', text: isDark ? 'text-green-100' : 'text-green-800', border: 'border-green-500' },
            { bg: isDark ? 'bg-purple-600' : 'bg-purple-100', text: isDark ? 'text-purple-100' : 'text-purple-800', border: 'border-purple-500' },
            { bg: isDark ? 'bg-orange-600' : 'bg-orange-100', text: isDark ? 'text-orange-100' : 'text-orange-800', border: 'border-orange-500' },
            { bg: isDark ? 'bg-pink-600' : 'bg-pink-100', text: isDark ? 'text-pink-100' : 'text-pink-800', border: 'border-pink-500' },
          ];

          const speakerIndex = (utterance.speaker && typeof utterance.speaker === 'string')
            ? parseInt(utterance.speaker.replace(/\D/g, '')) || 0
            : utterance.speaker || 0;
          const colorScheme = speakerColors[speakerIndex % speakerColors.length];

          return (
            <div
              key={utteranceIndex}
              className={`
                border-l-4 pl-4 py-3 rounded-r-lg transition-all duration-200
                ${colorScheme.border} ${isDark ? 'bg-gray-800/50' : 'bg-gray-50/50'}
                hover:${isDark ? 'bg-gray-800/70' : 'bg-gray-50/70'}
              `}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`
                  inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                  ${colorScheme.bg} ${colorScheme.text}
                `}>
                  🎤 Speaker {utterance.speaker || 'Unknown'}
                </span>
                <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatTime(utterance.start / 1000)} → {formatTime(utterance.end / 1000)}
                </span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Confidence: {formatConfidence(utterance.confidence)}
                </span>
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  ({Math.round((utterance.end - utterance.start) / 1000)}s)
                </span>
              </div>

              <div className="leading-relaxed text-base">
                {utterance.words && utterance.words.length > 0 ? (
                  utterance.words.map((word, wordIndex) => {
                    // Find global word index for highlighting
                    const globalWordIndex = result.words ?
                      result.words.findIndex(w => w.start === word.start && w.text === word.text) : -1;

                    return (
                      <span
                        key={wordIndex}
                        className={`
                          transition-all duration-200 cursor-pointer
                          ${globalWordIndex === highlightedWordIndex
                            ? isDark
                              ? 'bg-yellow-600 text-black shadow-lg'
                              : 'bg-yellow-300 text-black shadow-lg'
                            : isDark
                              ? 'text-gray-100 hover:bg-gray-700'
                              : 'text-gray-900 hover:bg-gray-100'
                          }
                          ${globalWordIndex === highlightedWordIndex ? 'px-1 rounded' : ''}
                        `}
                        title={`${word.start}ms - ${word.end}ms (${formatConfidence(word.confidence)})`}
                      >
                        {word.text}
                        {wordIndex < utterance.words.length - 1 ? ' ' : ''}
                      </span>
                    );
                  })
                ) : (
                  <p className={`${isDark ? 'text-gray-100' : 'text-gray-900'} whitespace-pre-wrap`}>
                    {utterance.text || 'No text available for this segment'}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        <div className={`text-xs mt-4 pt-3 border-t ${isDark ? 'text-gray-500 border-gray-700' : 'text-gray-500 border-gray-200'}`}>
          💡 Tip: Hover over words to see timing and confidence information
        </div>
      </div>
    );
  };

  // Format time in MM:SS format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render transcript with word highlighting
  const renderTranscriptText = () => {
    if (!result.words || result.words.length === 0) {
      // Fallback to plain text if no word-level data
      return (
        <div className="space-y-4">
          <div className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Standard Transcription - Full text output
          </div>
          <div className={`
            p-4 rounded-lg leading-relaxed text-base
            ${isDark ? 'bg-gray-800/50 text-gray-100' : 'bg-gray-50/50 text-gray-900'}
          `}>
            <p className="whitespace-pre-wrap">
              {result.text || 'No transcription text available'}
            </p>
          </div>
          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            ℹ️ Word-level timing data not available for this transcription
          </div>
        </div>
      );
    }

    // Format text with proper punctuation and capitalization
    const formatTranscriptText = () => {
      if (!result.words || result.words.length === 0) return result.text;

      let formattedText = '';
      let currentSentence = '';

      result.words.forEach((word, index) => {
        const wordText = word.text || '';

        // Add word to current sentence
        currentSentence += (currentSentence ? ' ' : '') + wordText;

        // Check if this word ends a sentence
        const endsWithPunctuation = /[.!?]$/.test(wordText);
        const isLastWord = index === result.words.length - 1;

        if (endsWithPunctuation || isLastWord) {
          // Capitalize first letter of sentence
          if (currentSentence) {
            const capitalizedSentence = currentSentence.charAt(0).toUpperCase() + currentSentence.slice(1);
            formattedText += (formattedText ? ' ' : '') + capitalizedSentence;
            currentSentence = '';
          }
        }
      });

      return formattedText || result.text;
    };

    return (
      <div className="space-y-4">
        <div className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Standard Transcription - {result.words.length} words with timing data
        </div>

        {/* Formatted text view */}
        <div className={`
          p-4 rounded-lg mb-4
          ${isDark ? 'bg-gray-800/50' : 'bg-gray-50/50'}
        `}>
          <div className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            📝 Formatted Text:
          </div>
          <p className={`leading-relaxed text-base whitespace-pre-wrap ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {formatTranscriptText()}
          </p>
        </div>

        {/* Interactive word view */}
        <div className={`
          p-4 rounded-lg border
          ${isDark ? 'bg-gray-800/30 border-gray-700' : 'bg-white border-gray-200'}
        `}>
          <div className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            🎯 Interactive Words (hover for timing):
          </div>
          <div className="leading-relaxed text-base">
            {result.words.map((word, index) => (
              <span
                key={index}
                className={`
                  transition-all duration-200 cursor-pointer inline-block mr-1 mb-1 px-1 py-0.5 rounded
                  ${index === highlightedWordIndex
                    ? isDark
                      ? 'bg-yellow-600 text-black shadow-lg scale-105'
                      : 'bg-yellow-300 text-black shadow-lg scale-105'
                    : isDark
                      ? 'text-gray-100 hover:bg-gray-700 hover:shadow-md'
                      : 'text-gray-900 hover:bg-gray-100 hover:shadow-md'
                  }
                `}
                title={`"${word.text}" | ${formatTime(word.start / 1000)} - ${formatTime(word.end / 1000)} | Confidence: ${formatConfidence(word.confidence)}`}
              >
                {word.text}
              </span>
            ))}
          </div>
        </div>

        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          💡 Tip: Hover over words to see detailed timing and confidence information
        </div>
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
        <div className="flex items-center gap-3">
          <h2 className={`text-lg sm:text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Transcript Results
          </h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              px-2 py-1 text-xs rounded-md transition-colors touch-manipulation
              ${isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }
            `}
          >
            {isExpanded ? '📄 Collapse' : '📖 Expand'}
          </button>
        </div>
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
        border rounded-lg p-4 sm:p-6 mobile-scroll
        ${isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
        }
        ${!isExpanded ? 'min-h-[120px]' : 'min-h-[200px]'}
      `}>
        <div className="prose max-w-none text-sm sm:text-base">
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && isExpanded && (
            <details className={`mb-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <summary className="cursor-pointer">Debug Info</summary>
              <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                {JSON.stringify({
                  speaker_labels_enabled: result.speaker_labels_enabled,
                  has_utterances: !!(result.utterances && result.utterances.length > 0),
                  utterances_count: result.utterances?.length || 0,
                  has_words: !!(result.words && result.words.length > 0),
                  words_count: result.words?.length || 0,
                  has_text: !!result.text
                }, null, 2)}
              </pre>
            </details>
          )}

          {/* Render appropriate transcript format */}
          {isExpanded ? (
            (() => {
              // Check if speaker diarization is enabled and we have utterances
              const hasSpeakerData = result.speaker_labels_enabled &&
                                   result.utterances &&
                                   result.utterances.length > 0;

              if (hasSpeakerData) {
                return renderSpeakerTranscript();
              } else {
                return renderTranscriptText();
              }
            })()
          ) : (
            // Show preview when collapsed
            <div className="space-y-3">
              <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                📝 Preview (click "Expand" to see full transcript)
              </div>
              <div className={`
                p-3 rounded-lg leading-relaxed
                ${isDark ? 'bg-gray-700/50 text-gray-100' : 'bg-gray-50 text-gray-900'}
              `}>
                <p className="whitespace-pre-wrap">
                  {getPreviewText()}
                </p>
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                💡 Click "Expand" above to see the full transcript with interactive features
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Word-level details toggle - only show when expanded */}
      {isExpanded && result.words && result.words.length > 0 && (
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