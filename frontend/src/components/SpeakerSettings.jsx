import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function SpeakerSettings({ 
  speakerLabels, 
  setSpeakerLabels, 
  speakersExpected, 
  setSpeakersExpected,
  minSpeakersExpected,
  setMinSpeakersExpected,
  maxSpeakersExpected,
  setMaxSpeakersExpected 
}) {
  const { isDark } = useTheme();
  const [speakerMode, setSpeakerMode] = useState('auto'); // 'auto', 'exact', 'range'

  const handleSpeakerModeChange = (mode) => {
    setSpeakerMode(mode);
    // Reset values when changing modes
    setSpeakersExpected(null);
    setMinSpeakersExpected(null);
    setMaxSpeakersExpected(null);
  };

  const handleSpeakerLabelsToggle = () => {
    const newValue = !speakerLabels;
    setSpeakerLabels(newValue);
    
    // Reset speaker settings when disabling
    if (!newValue) {
      setSpeakerMode('auto');
      setSpeakersExpected(null);
      setMinSpeakersExpected(null);
      setMaxSpeakersExpected(null);
    }
  };

  return (
    <div className={`
      border rounded-lg p-4 sm:p-6 space-y-4
      ${isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
      }
    `}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Speaker Detection
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Identify and separate different speakers in your audio
          </p>
        </div>
        
        <button
          onClick={handleSpeakerLabelsToggle}
          className={`
            relative inline-flex h-8 w-14 sm:h-6 sm:w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation
            ${speakerLabels
              ? 'bg-blue-600 focus:ring-offset-gray-800' 
              : isDark 
                ? 'bg-gray-600 focus:ring-offset-gray-800'
                : 'bg-gray-200 focus:ring-offset-white'
            }
          `}
          aria-label={`${speakerLabels ? 'Disable' : 'Enable'} speaker detection`}
        >
          <span
            className={`
              inline-block h-6 w-6 sm:h-4 sm:w-4 transform rounded-full bg-white transition duration-200 ease-in-out
              ${speakerLabels ? 'translate-x-7 sm:translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {speakerLabels && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Speaker Configuration
            </label>
            
            <div className="space-y-3">
              {/* Auto Detection */}
              <label className="flex items-start gap-3 cursor-pointer touch-manipulation">
                <input
                  type="radio"
                  name="speakerMode"
                  value="auto"
                  checked={speakerMode === 'auto'}
                  onChange={(e) => handleSpeakerModeChange(e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    Auto-detect speakers
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Let AI automatically detect the number of speakers (1-10)
                  </div>
                </div>
              </label>

              {/* Exact Number */}
              <label className="flex items-start gap-3 cursor-pointer touch-manipulation">
                <input
                  type="radio"
                  name="speakerMode"
                  value="exact"
                  checked={speakerMode === 'exact'}
                  onChange={(e) => handleSpeakerModeChange(e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    Exact number of speakers
                  </div>
                  <div className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Specify if you know the exact number of speakers
                  </div>
                  {speakerMode === 'exact' && (
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={speakersExpected || ''}
                      onChange={(e) => setSpeakersExpected(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="e.g., 2"
                      className={`
                        w-20 px-2 py-1 text-sm rounded border focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        ${isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }
                      `}
                    />
                  )}
                </div>
              </label>

              {/* Range */}
              <label className="flex items-start gap-3 cursor-pointer touch-manipulation">
                <input
                  type="radio"
                  name="speakerMode"
                  value="range"
                  checked={speakerMode === 'range'}
                  onChange={(e) => handleSpeakerModeChange(e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    Speaker range
                  </div>
                  <div className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Set minimum and maximum number of speakers
                  </div>
                  {speakerMode === 'range' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={minSpeakersExpected || ''}
                        onChange={(e) => setMinSpeakersExpected(e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Min"
                        className={`
                          w-16 px-2 py-1 text-sm rounded border focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          ${isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }
                        `}
                      />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>to</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={maxSpeakersExpected || ''}
                        onChange={(e) => setMaxSpeakersExpected(e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Max"
                        className={`
                          w-16 px-2 py-1 text-sm rounded border focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          ${isDark 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }
                        `}
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className={`
            p-3 rounded-lg text-xs
            ${isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'}
          `}>
            <div className="font-medium mb-1">💡 Tips for better speaker detection:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>Each speaker should speak for at least 30 seconds</li>
              <li>Avoid overlapping speech when possible</li>
              <li>Clear audio quality improves accuracy</li>
              <li>Works best with distinct voices</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
