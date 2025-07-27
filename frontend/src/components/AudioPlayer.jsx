import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function AudioPlayer({ audioFile, transcript, onWordHighlight }) {
  const { isDark } = useTheme();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);

  // Create audio URL from file or file info
  const audioUrl = useMemo(() => {
    if (!audioFile) return null;

    // If audioFile is a File object, create blob URL
    if (audioFile instanceof File) {
      return URL.createObjectURL(audioFile);
    }

    // If audioFile has file_info (from backend response), use the file_id
    if (audioFile.file_info?.file_id) {
      return `http://localhost:8000/audio/${audioFile.file_info.file_id}`;
    }

    return null;
  }, [audioFile]);

  // Update current time and highlight words
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const time = audio.currentTime * 1000; // Convert to milliseconds
      setCurrentTime(time);

      // Find current word based on timestamp
      if (transcript?.words) {
        const currentWord = transcript.words.findIndex((word, index) => {
          const nextWord = transcript.words[index + 1];
          return time >= word.start && (!nextWord || time < nextWord.start);
        });

        if (currentWord !== currentWordIndex) {
          setCurrentWordIndex(currentWord);
          onWordHighlight?.(currentWord);
        }
      }

      // Find current speaker if utterances are available
      if (transcript?.utterances) {
        const currentUtterance = transcript.utterances.find(utterance =>
          time >= utterance.start && time <= utterance.end
        );

        if (currentUtterance && currentUtterance.speaker !== currentSpeaker) {
          setCurrentSpeaker(currentUtterance.speaker);
        }
      }
    };

    const updateDuration = () => {
      setDuration(audio.duration * 1000); // Convert to milliseconds
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [transcript, currentWordIndex, onWordHighlight]);

  // Cleanup audio URL (only for blob URLs)
  useEffect(() => {
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    // Support both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const percent = (clientX - rect.left) / rect.width;
    const newTime = percent * audio.duration;
    audio.currentTime = newTime;
  }, []);

  // Touch event handlers for mobile
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    handleSeek(e);
  }, [handleSeek]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    handleSeek(e);
  }, [handleSeek]);

  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const handlePlaybackRateChange = useCallback((e) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  }, []);

  const jumpToWord = useCallback((wordIndex) => {
    const audio = audioRef.current;
    if (!audio || !transcript?.words?.[wordIndex]) return;

    const word = transcript.words[wordIndex];
    audio.currentTime = word.start / 1000; // Convert to seconds
  }, [transcript]);

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!audioFile) {
    return null;
  }

  return (
    <div className={`
      rounded-lg border p-4 sm:p-6 space-y-4
      ${isDark
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
      }
    `}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Audio Playback
        </h3>
        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div
          className={`
            relative h-3 sm:h-2 rounded-full cursor-pointer touch-manipulation
            ${isDark ? 'bg-gray-700' : 'bg-gray-200'}
          `}
          onClick={handleSeek}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          <div
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
          {/* Touch indicator */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-lg opacity-0 sm:opacity-100 transition-opacity"
            style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 8px)` }}
          />
        </div>
      </div>

      {/* Speaker Navigation */}
      {transcript?.utterances && transcript.utterances.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Speaker Navigation
            </h4>
            {currentSpeaker && (
              <span className={`
                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${isDark
                  ? 'bg-blue-600 text-blue-100'
                  : 'bg-blue-100 text-blue-800'
                }
              `}>
                Current: Speaker {currentSpeaker}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(transcript.utterances.map(u => u.speaker))).sort().map(speaker => (
              <button
                key={speaker}
                onClick={() => {
                  const firstUtterance = transcript.utterances.find(u => u.speaker === speaker);
                  if (firstUtterance && audioRef.current) {
                    audioRef.current.currentTime = firstUtterance.start / 1000;
                  }
                }}
                className={`
                  px-3 py-2 text-sm rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-0
                  ${currentSpeaker === speaker
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }
                `}
              >
                Speaker {speaker}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className={`
              flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 rounded-full transition-colors touch-manipulation
              ${isDark
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white'
              }
            `}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Playback Rate */}
          <div className="flex items-center space-x-2 flex-1 sm:flex-none">
            <label className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Speed:
            </label>
            <select
              value={playbackRate}
              onChange={handlePlaybackRateChange}
              className={`
                text-sm rounded px-2 py-2 sm:py-1 border min-h-[44px] sm:min-h-0 touch-manipulation
                ${isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                }
              `}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <svg className={`w-5 h-5 sm:w-4 sm:h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l3.883-3.824a1 1 0 011.617.824zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 sm:w-20 h-6 sm:h-auto touch-manipulation"
          />
        </div>
      </div>

      {/* Word Navigation */}
      {transcript?.words && (
        <div className="border-t pt-4">
          <div className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Word Navigation
          </div>
          <div className="flex flex-wrap gap-1 max-h-32 sm:max-h-40 overflow-y-auto">
            {transcript.words.map((word, index) => (
              <button
                key={index}
                onClick={() => jumpToWord(index)}
                className={`
                  px-3 py-2 sm:px-2 sm:py-1 text-sm sm:text-xs rounded transition-colors touch-manipulation min-h-[44px] sm:min-h-0
                  ${index === currentWordIndex
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                  }
                `}
              >
                {word.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
