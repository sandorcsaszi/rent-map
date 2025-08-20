import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // More granular chunking for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'vendor-leaflet';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('react-icons')) {
              return 'vendor-icons';
            }
            // All other vendor packages
            return 'vendor-misc';
          }
          // App chunks
          if (id.includes('components/')) {
            return 'components';
          }
          if (id.includes('utils/') || id.includes('services/')) {
            return 'utils';
          }
        },
      },
    },
    // Use esbuild for faster minification
    minify: 'esbuild',
    // Smaller chunk size warning
    chunkSizeWarningLimit: 500,
    // Disable source maps in production
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'leaflet', 
      'react-leaflet',
    ],
    exclude: ['@supabase/supabase-js'],
  },
  // Esbuild options for console removal and optimization
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none', // Remove comments
  },
})
