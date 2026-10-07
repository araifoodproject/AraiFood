import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    https: true,
    port: 5173,
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