/**
 * API Configuration
 * Handles dynamic API URL configuration for different environments
 */

// Get API URL from environment variables with fallback
const getApiUrl = () => {
  // Vite exposes env vars prefixed with VITE_
  const envApiUrl = import.meta.env.VITE_API_URL;
  
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Fallback logic for different environments
  if (import.meta.env.PROD) {
    // Production fallback - try to detect common deployment patterns
    const currentHost = window.location.host;
    
    // If frontend is on Vercel/Netlify, try common backend patterns
    if (currentHost.includes('vercel.app')) {
      return 'https://your-backend-name.railway.app';
    }
    if (currentHost.includes('netlify.app')) {
      return 'https://your-backend-name.railway.app';
    }
    
    // Default production fallback
    console.warn('VITE_API_URL not set in production. Using localhost fallback.');
    return 'http://localhost:8000';
  }
  
  // Development fallback
  return 'http://localhost:8000';
};

// Export the API configuration
export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  ENDPOINTS: {
    HEALTH: '/health',
    TRANSCRIBE: '/transcribe',
    METRICS: '/metrics',
    AUDIO: '/audio'
  }
};

// Helper functions for building API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const buildAudioUrl = (fileId) => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUDIO}/${fileId}`;
};

// Log the current configuration in development
if (import.meta.env.DEV) {
  console.log('API Configuration:', {
    BASE_URL: API_CONFIG.BASE_URL,
    ENV_VAR: import.meta.env.VITE_API_URL,
    MODE: import.meta.env.MODE
  });
}
