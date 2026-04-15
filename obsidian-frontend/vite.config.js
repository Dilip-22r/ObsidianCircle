import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          ui: ['lucide-react'],
          charts: ['recharts'],
          socket: ['socket.io-client'],
          state: ['zustand']
        }
      }
    },
    // Optimize chunks
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: true,
    // Minify CSS
    cssMinify: true,
    // Target modern browsers
    target: 'esnext'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'recharts',
      'socket.io-client',
      'zustand'
    ]
  },
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0')
  }
})
