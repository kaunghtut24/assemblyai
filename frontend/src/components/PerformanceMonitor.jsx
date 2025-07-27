import { useState, useEffect } from "react";

export default function PerformanceMonitor() {
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Performance Metrics</h3>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="text-xs text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-600">Cache Size</div>
            <div className="font-semibold">{metrics.cache.size}</div>
          </div>
          <div>
            <div className="text-gray-600">Cache TTL</div>
            <div className="font-semibold">{metrics.cache.ttl_seconds}s</div>
          </div>
          <div>
            <div className="text-gray-600">Max Connections</div>
            <div className="font-semibold">{metrics.service.max_connections}</div>
          </div>
          <div>
            <div className="text-gray-600">Version</div>
            <div className="font-semibold">{metrics.service.version}</div>
          </div>
        </div>
      )}
    </div>
  );
}
