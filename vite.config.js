import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // ✅ Vite v8: use esbuild for CSS minify (lightningcss too strict)
    cssMinify: 'esbuild',
    rollupOptions: {
      output: {
        // ✅ Vite v8 compatible — function format
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('/react/')
            ) {
              return 'react-vendor'
            }
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'firebase-vendor'
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'chart-vendor'
            }
            if (
              id.includes('lucide-react') ||
              id.includes('react-toastify')
            ) {
              return 'ui-vendor'
            }
            return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },
})