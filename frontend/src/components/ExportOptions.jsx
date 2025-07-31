import { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ExportOptions({ result }) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Copy to clipboard functionality
  const copyToClipboard = useCallback(async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    }
  }, []);

  // Format time for captions (HH:MM:SS,mmm for SRT, HH:MM:SS.mmm for VTT)
  const formatCaptionTime = (milliseconds, format = 'srt') => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const ms = milliseconds % 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (format === 'srt') {
      return `${timeString},${ms.toString().padStart(3, '0')}`;
    } else {
      return `${timeString}.${ms.toString().padStart(3, '0')}`;
    }
  };

  // Generate SRT caption format
  const generateSRT = useCallback(() => {
    if (!result.words || result.words.length === 0) {
      return result.text || 'No transcription available';
    }

    let srtContent = '';
    let captionIndex = 1;
    let currentCaption = '';
    let captionStart = null;
    let captionEnd = null;
    const maxCaptionLength = 80; // Characters per caption
    const maxCaptionDuration = 5000; // 5 seconds max per caption

    result.words.forEach((word, index) => {
      if (captionStart === null) {
        captionStart = word.start;
      }

      currentCaption += (currentCaption ? ' ' : '') + word.text;
      captionEnd = word.end;

      const shouldBreak = 
        currentCaption.length >= maxCaptionLength ||
        (captionEnd - captionStart) >= maxCaptionDuration ||
        index === result.words.length - 1 ||
        /[.!?]$/.test(word.text);

      if (shouldBreak && currentCaption.trim()) {
        srtContent += `${captionIndex}\n`;
        srtContent += `${formatCaptionTime(captionStart, 'srt')} --> ${formatCaptionTime(captionEnd, 'srt')}\n`;
        srtContent += `${currentCaption.trim()}\n\n`;
        
        captionIndex++;
        currentCaption = '';
        captionStart = null;
      }
    });

    return srtContent;
  }, [result]);

  // Generate VTT caption format
  const generateVTT = useCallback(() => {
    if (!result.words || result.words.length === 0) {
      return `WEBVTT\n\n00:00:00.000 --> 00:00:10.000\n${result.text || 'No transcription available'}`;
    }

    let vttContent = 'WEBVTT\n\n';
    let currentCaption = '';
    let captionStart = null;
    let captionEnd = null;
    const maxCaptionLength = 80;
    const maxCaptionDuration = 5000;

    result.words.forEach((word, index) => {
      if (captionStart === null) {
        captionStart = word.start;
      }

      currentCaption += (currentCaption ? ' ' : '') + word.text;
      captionEnd = word.end;

      const shouldBreak = 
        currentCaption.length >= maxCaptionLength ||
        (captionEnd - captionStart) >= maxCaptionDuration ||
        index === result.words.length - 1 ||
        /[.!?]$/.test(word.text);

      if (shouldBreak && currentCaption.trim()) {
        vttContent += `${formatCaptionTime(captionStart, 'vtt')} --> ${formatCaptionTime(captionEnd, 'vtt')}\n`;
        vttContent += `${currentCaption.trim()}\n\n`;
        
        currentCaption = '';
        captionStart = null;
      }
    });

    return vttContent;
  }, [result]);

  // Generate JSON format with detailed timing
  const generateJSON = useCallback(() => {
    const exportData = {
      metadata: {
        confidence: result.confidence,
        processing_time: result.processing_time,
        file_size_mb: result.file_size_mb,
        speaker_labels_enabled: result.speaker_labels_enabled,
        export_timestamp: new Date().toISOString()
      },
      transcript: {
        text: result.text,
        words: result.words || [],
        utterances: result.utterances || []
      }
    };
    return JSON.stringify(exportData, null, 2);
  }, [result]);

  // Download file
  const downloadFile = useCallback((content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Export handlers
  const exportTXT = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    downloadFile(result.text, `transcript_${timestamp}.txt`, 'text/plain');
  };

  const exportSRT = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const srtContent = generateSRT();
    downloadFile(srtContent, `captions_${timestamp}.srt`, 'text/plain');
  };

  const exportVTT = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const vttContent = generateVTT();
    downloadFile(vttContent, `captions_${timestamp}.vtt`, 'text/vtt');
  };

  const exportJSON = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const jsonContent = generateJSON();
    downloadFile(jsonContent, `transcript_data_${timestamp}.json`, 'application/json');
  };

  const exportOptions = [
    {
      id: 'txt',
      name: 'Plain Text',
      description: 'Simple text file (.txt)',
      icon: '📄',
      action: exportTXT,
      copyAction: () => copyToClipboard(result.text, 'txt')
    },
    {
      id: 'srt',
      name: 'SRT Captions',
      description: 'SubRip subtitle format (.srt)',
      icon: '🎬',
      action: exportSRT,
      copyAction: () => copyToClipboard(generateSRT(), 'srt'),
      disabled: !result.words || result.words.length === 0
    },
    {
      id: 'vtt',
      name: 'VTT Captions',
      description: 'WebVTT subtitle format (.vtt)',
      icon: '🌐',
      action: exportVTT,
      copyAction: () => copyToClipboard(generateVTT(), 'vtt'),
      disabled: !result.words || result.words.length === 0
    },
    {
      id: 'json',
      name: 'JSON Data',
      description: 'Complete data with timing (.json)',
      icon: '📊',
      action: exportJSON,
      copyAction: () => copyToClipboard(generateJSON(), 'json')
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          px-3 py-2 sm:py-1 text-sm rounded-md transition-colors touch-manipulation min-h-[44px] sm:min-h-0
          ${isDark
            ? 'bg-green-700 hover:bg-green-600 active:bg-green-800 text-green-100'
            : 'bg-green-100 hover:bg-green-200 active:bg-green-300 text-green-700'
          }
        `}
      >
        📥 Export {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && (
        <div className={`
          absolute right-0 top-full mt-2 w-80 rounded-lg shadow-lg border z-50
          ${isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
          }
        `}>
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Export Options
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Choose your preferred export format
            </p>
          </div>

          <div className="p-2 space-y-1">
            {exportOptions.map((option) => (
              <div
                key={option.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg transition-colors
                  ${option.disabled
                    ? isDark ? 'opacity-50 cursor-not-allowed' : 'opacity-50 cursor-not-allowed'
                    : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-lg">{option.icon}</span>
                  <div>
                    <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {option.name}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {option.description}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={option.copyAction}
                    disabled={option.disabled}
                    className={`
                      px-2 py-1 text-xs rounded transition-colors
                      ${option.disabled
                        ? 'cursor-not-allowed opacity-50'
                        : isDark
                          ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }
                    `}
                    title="Copy to clipboard"
                  >
                    {copied === option.id ? '✓' : '📋'}
                  </button>
                  <button
                    onClick={option.action}
                    disabled={option.disabled}
                    className={`
                      px-2 py-1 text-xs rounded transition-colors
                      ${option.disabled
                        ? 'cursor-not-allowed opacity-50'
                        : isDark
                          ? 'bg-blue-600 hover:bg-blue-500 text-blue-100'
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                      }
                    `}
                    title="Download file"
                  >
                    💾
                  </button>
                </div>
              </div>
            ))}
          </div>

          {(!result.words || result.words.length === 0) && (
            <div className={`
              p-3 border-t text-xs
              ${isDark ? 'border-gray-700 text-gray-400 bg-gray-700/30' : 'border-gray-200 text-gray-600 bg-gray-50'}
            `}>
              ⚠️ Caption formats (SRT/VTT) require word-level timing data
            </div>
          )}
        </div>
      )}
    </div>
  );
}
