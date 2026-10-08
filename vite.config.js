import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// ============================================================
// HTTPS Toggle — set ENABLE_HTTPS=true in .env to use HTTPS
// Default: HTTP (better for mobile login testing)
// ============================================================
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === 'true'

const plugins = [react()]
if (ENABLE_HTTPS) {
  plugins.push(basicSsl())
}

export default defineConfig({
  plugins,
  server: {
    host: true,
    port: 5173,
    ...(ENABLE_HTTPS && { https: true }),
  },
  build: {
    cssMinify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) return 'react-vendor'
            if (id.includes('firebase') || id.includes('@firebase')) return 'firebase-vendor'
            if (id.includes('recharts') || id.includes('d3-')) return 'chart-vendor'
            if (id.includes('lucide-react') || id.includes('react-toastify')) return 'ui-vendor'
            return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },
})