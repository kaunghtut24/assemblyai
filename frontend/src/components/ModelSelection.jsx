import { useTheme } from '../contexts/ThemeContext';

export default function ModelSelection({ speechModel, setSpeechModel }) {
  const { isDark } = useTheme();

  const models = [
    {
      id: 'universal',
      name: 'Universal',
      description: 'Best overall accuracy for most use cases. Supports 100+ languages.',
      recommended: true,
      features: ['Multilingual support', 'High accuracy', 'General purpose']
    },
    {
      id: 'slam-1',
      name: 'Slam-1',
      description: 'Advanced model with domain-specific term support for improved accuracy.',
      recommended: false,
      features: ['Domain-specific terms', 'Enhanced accuracy', 'Contextual understanding']
    }
  ];

  const handleModelChange = (modelId) => {
    setSpeechModel(modelId);
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
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Speech Model
        </h3>
        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Choose the AI model for transcription
        </div>
      </div>

      <div className="space-y-3">
        {models.map((model) => (
          <label 
            key={model.id}
            className={`
              relative flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 touch-manipulation
              ${speechModel === model.id
                ? isDark
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-blue-500 bg-blue-50'
                : isDark
                  ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            <input
              type="radio"
              name="speechModel"
              value={model.id}
              checked={speechModel === model.id}
              onChange={(e) => handleModelChange(e.target.value)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className={`text-base font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {model.name}
                </div>
                {model.recommended && (
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${isDark 
                      ? 'bg-green-900/50 text-green-300 border border-green-700' 
                      : 'bg-green-100 text-green-800 border border-green-200'
                    }
                  `}>
                    Recommended
                  </span>
                )}
              </div>
              
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {model.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {model.features.map((feature, index) => (
                  <span 
                    key={index}
                    className={`
                      px-2 py-1 text-xs rounded-md
                      ${speechModel === model.id
                        ? isDark
                          ? 'bg-blue-800 text-blue-200'
                          : 'bg-blue-200 text-blue-800'
                        : isDark
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-200 text-gray-700'
                      }
                    `}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className={`
        text-xs p-3 rounded-lg
        ${isDark
          ? 'bg-gray-700/50 text-gray-400'
          : 'bg-gray-100 text-gray-600'
        }
      `}>
        <strong>Note:</strong> Universal is recommended for most use cases.
        Slam-1 allows you to provide domain-specific terms to improve accuracy for specialized vocabulary.
      </div>
    </div>
  );
}
