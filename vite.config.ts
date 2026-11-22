import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'process.env.FRONTEND_URL': JSON.stringify(env.FRONTEND_URL),
      'process.env.BACKEND_URL': JSON.stringify(env.BACKEND_URL)
    },
    plugins: [react()],

    server: {
      // Con `npm run dev`, /api va a Snippets como en la VM (nginx): mismo origen, sin CORS.
      // 127.0.0.1 y no localhost: si otra app escucha en el 8080 por IPv6, localhost puede ir a esa.
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || 'http://127.0.0.1:8080',
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
