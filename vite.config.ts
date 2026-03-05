import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — rarely changes, cached long-term
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charting library — largest dependency
          'vendor-charts': ['recharts'],
          // HTML-to-canvas for report exports
          'vendor-html2canvas': ['html2canvas'],
          // Icon library
          'vendor-icons': ['lucide-react'],
          // State + HTTP layer
          'vendor-data': ['zustand', 'axios', 'react-hot-toast'],
        },
      },
    },
  },
})
