import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function KeytermsPrompt({ 
  speechModel, 
  keytermsPrompt, 
  setKeytermsPrompt 
}) {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show for slam-1 model
  if (speechModel !== 'slam-1') {
    return null;
  }

  const examples = [
    "Medical terms: stethoscope, diagnosis, prescription, symptoms",
    "Legal terms: plaintiff, defendant, jurisdiction, litigation",
    "Technical terms: API, database, authentication, deployment",
    "Business terms: revenue, stakeholder, quarterly, metrics"
  ];

  const handleExampleClick = (example) => {
    setKeytermsPrompt(example);
  };

  return (
    <div className={`
      border rounded-lg p-4 sm:p-6 space-y-4
      ${isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
      }
    `}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Domain-Specific Terms
          </h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Improve accuracy by providing relevant terms for your audio content
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            text-sm underline transition-colors
            ${isDark
              ? 'text-blue-400 hover:text-blue-300'
              : 'text-blue-600 hover:text-blue-700'
            }
          `}
        >
          {isExpanded ? 'Hide' : 'Show'} Examples
        </button>
      </div>

      <div className="space-y-3">
        <div className={`
          p-3 rounded-lg border-l-4
          ${isDark
            ? 'bg-blue-900/20 border-blue-500 text-blue-200'
            : 'bg-blue-50 border-blue-500 text-blue-800'
          }
        `}>
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div className="text-sm">
              <strong>Slam-1 Model Enhancement:</strong> Provide domain-specific terms to improve 
              transcription accuracy for specialized vocabulary.
            </div>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Key Terms & Context
          </label>
          <textarea
            value={keytermsPrompt}
            onChange={(e) => setKeytermsPrompt(e.target.value)}
            placeholder="Enter terms separated by commas: term1, term2, term3..."
            rows={3}
            className={`
              w-full px-3 py-2 border rounded-lg resize-none transition-colors
              ${isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
            `}
          />
          <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {keytermsPrompt.length}/500 characters
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-2">
            <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Example prompts:
            </div>
            <div className="grid gap-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className={`
                    text-left p-2 rounded border text-sm transition-colors
                    ${isDark
                      ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50 text-gray-300'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    }
                  `}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`
        text-xs p-3 rounded-lg
        ${isDark
          ? 'bg-gray-700/50 text-gray-400'
          : 'bg-gray-100 text-gray-600'
        }
      `}>
        <strong>Format:</strong> Separate terms with commas. Include technical terms, proper names,
        acronyms, or industry-specific vocabulary that might be difficult to recognize.
      </div>
    </div>
  );
}
