import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      figmaAssetResolver(),
      react(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    assetsInclude: ['**/*.svg', '**/*.csv'],

    // Environment variables are automatically exposed by Vite if prefixed with VITE_
    // No need for manual define unless you have special cases
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },

    build: {
      // Increase warning limit (recommended)
      chunkSizeWarningLimit: 800,

      rollupOptions: {
        output: {
          manualChunks: {
            // Core libraries
            vendor: ['react', 'react-dom', 'react-router-dom'],
            
            // Supabase
            supabase: ['@supabase/supabase-js'],

            // UI/Icons
            icons: ['lucide-react'],

            // Keep your admin/dashboard pages lighter
            admin: [
              '@/pages/admin',
              // Add more heavy admin components if needed
            ],
          },
        },
      },
    },
  }
})