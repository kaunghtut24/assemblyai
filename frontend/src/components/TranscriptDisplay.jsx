import { useState, useCallback } from "react";

export default function TranscriptDisplay({ result }) {
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

  return (
    <div className="mt-6 border-t pt-6 space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Transcript Results</h2>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button
            onClick={downloadTranscript}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
          >
            💾 Download
          </button>
        </div>
      </div>

      {/* Performance metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-600">Confidence</div>
          <div className="font-semibold text-gray-900">{formatConfidence(result.confidence)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Processing Time</div>
          <div className="font-semibold text-gray-900">{formatProcessingTime(result.processing_time)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">File Size</div>
          <div className="font-semibold text-gray-900">{formatFileSize(result.file_size_mb)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Words</div>
          <div className="font-semibold text-gray-900">{result.words?.length || 'N/A'}</div>
        </div>
      </div>

      {/* Main transcript text */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="prose max-w-none">
          <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
            {result.text}
          </p>
        </div>
      </div>

      {/* Word-level details toggle */}
      {result.words && result.words.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowWords(!showWords)}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            {showWords ? 'Hide' : 'Show'} word-level details
          </button>

          {showWords && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="grid gap-2">
                {result.words.map((word, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{word.text}</span>
                    <div className="flex gap-4 text-gray-600">
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
        <div className="text-xs text-gray-500 border-t pt-2">
          Transcript ID: {result.id}
        </div>
      )}
    </div>
  );
}