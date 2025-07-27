import { useState, useEffect } from "react";
import { useTheme } from '../contexts/ThemeContext';

export default function PerformanceMonitor() {
  const { isDark } = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/metrics");
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (!metrics && !loading) {
    return null;
  }

  return (
    <div className={`
      rounded-lg shadow-sm border p-4
      ${isDark
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
      }
    `}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Performance Metrics
        </h3>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className={`
            text-xs underline disabled:opacity-50 transition-colors
            ${isDark
              ? 'text-blue-400 hover:text-blue-300'
              : 'text-blue-600 hover:text-blue-700'
            }
          `}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cache Size</div>
            <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {metrics.cache.size}
            </div>
          </div>
          <div>
            <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cache TTL</div>
            <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {metrics.cache.ttl_seconds}s
            </div>
          </div>
          <div>
            <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Max Connections</div>
            <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {metrics.service.max_connections}
            </div>
          </div>
          <div>
            <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Version</div>
            <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {metrics.service.version}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
