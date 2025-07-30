import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')

  // Extract allowed hosts from environment variables
  const getAllowedHosts = () => {
    const hosts = []

    // Add hosts from VITE_ALLOWED_HOSTS if specified
    if (env.VITE_ALLOWED_HOSTS) {
      hosts.push(...env.VITE_ALLOWED_HOSTS.split(',').map(host => host.trim()))
    }

    // Extract host from VITE_API_URL if it's external
    if (env.VITE_API_URL && !env.VITE_API_URL.includes('localhost') && !env.VITE_API_URL.includes('127.0.0.1')) {
      try {
        const url = new URL(env.VITE_API_URL)
        hosts.push(url.hostname)
      } catch (e) {
        console.warn('Invalid VITE_API_URL format:', env.VITE_API_URL)
      }
    }

    // Add common development hosts
    hosts.push('localhost', '127.0.0.1')

    // Remove duplicates and return
    return [...new Set(hosts)]
  }

  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT) || 3000,
      host: env.VITE_HOST || '0.0.0.0',
      allowedHosts: getAllowedHosts()
    },
    // Ensure environment variables are available in the build
    define: {
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL || 'http://localhost:8000')
    }
  }
})
