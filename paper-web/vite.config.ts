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
  }
})




