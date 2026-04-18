import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    electron({
      main: {
        // Entry point for the main process
        entry: 'electron/main.js',
      },
      preload: {
        // Entry point for the preload script
        input: 'electron/preload.js',
      },
    }),
  ],
})
