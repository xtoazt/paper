import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'node-fetch': resolve(__dirname, 'src/lib/node-fetch-shim.ts'),
      'libsodium': 'libsodium-wrappers',
      'libsodium-wrappers': 'libsodium-wrappers'
    }
  },
  optimizeDeps: {
    exclude: ['pyodide'],
    include: ['libsodium-wrappers']
  },
  build: {
    // Code splitting for optimal loading
    rollupOptions: {
      external: (id) => {
        // Externalize problematic dependencies
        if (id.includes('libsodium.mjs')) return true;
        return false;
      },
      output: {
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // P2P libraries - split into separate chunks
          if (id.includes('node_modules/libp2p') || id.includes('node_modules/@libp2p')) {
            return 'libp2p-vendor';
          }
          if (id.includes('node_modules/ipfs') || id.includes('node_modules/helia')) {
            return 'ipfs-vendor';
          }
          // Design system
          if (id.includes('/components/design-system/')) {
            return 'design-system';
          }
          // Interactive components (lazy loaded)
          if (id.includes('/components/interactive/')) {
            return 'interactive';
          }
          // Landing page components
          if (id.includes('/components/landing/')) {
            return 'landing';
          }
          // Dashboard components
          if (id.includes('/components/ui/') && id.includes('Dashboard')) {
            return 'dashboard';
          }
          // Monitoring components
          if (id.includes('/components/monitoring/')) {
            return 'monitoring';
          }
          // AI components
          if (id.includes('/components/ai/') || id.includes('/lib/ai/')) {
            return 'ai';
          }
          // Build system
          if (id.includes('/lib/build/')) {
            return 'build-system';
          }
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // Optimize chunk size - target < 100KB per chunk
    chunkSizeWarningLimit: 100,
    // Enable aggressive minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2 // Multiple passes for better compression
      },
      mangle: {
        safari10: true // Safari 10 compatibility
      },
      format: {
        comments: false // Remove all comments
      }
    },
    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true,
    // Source maps for debugging (disable in production)
    sourcemap: false,
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets < 4KB
    // Report compressed size
    reportCompressedSize: true
  },
  // Performance optimizations
  server: {
    hmr: {
      overlay: true
    }
  }
})




