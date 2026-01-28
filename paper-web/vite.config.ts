import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'node-fetch': resolve(__dirname, 'src/lib/node-fetch-shim.ts')
    }
  },
  optimizeDeps: {
    exclude: ['pyodide']
  },
  build: {
    // Code splitting for optimal loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          // P2P libraries
          'p2p-vendor': ['libp2p', 'ipfs-core'],
          // Interactive components (lazy loaded)
          'interactive': [
            './src/components/interactive/LiveDemo',
            './src/components/interactive/NetworkViz',
            './src/components/interactive/ComparisonMatrix'
          ]
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    // Source maps for debugging (disable in production)
    sourcemap: false
  },
  // Performance optimizations
  server: {
    hmr: {
      overlay: true
    }
  }
})




