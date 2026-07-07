import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react(), tailwindcss()];

  // Only include Electron plugin when explicitly building for desktop.
  // Mobile/Capacitor builds must NOT include this plugin — it adds
  // crossorigin attributes and Electron shims that crash Android WebView.
  if (mode === 'electron') {
    const { default: electron } = await import('vite-plugin-electron/simple');
    plugins.push(
      electron({
        main: {
          // Entry point for the main process
          entry: 'electron/main.js',
        },
        preload: {
          // Entry point for the preload script
          input: 'electron/preload.js',
        },
      })
    );
  }

  // 👇 Return your plugins along with source map configurations
  return {
    plugins,
    build: {
      sourcemap: true, // 👈 Generates .js.map files for Capacitor/Electron builds
    },
    css: {
      devSourcemap: true // 👈 Generates maps for Tailwind CSS classes during dev
    }
  };
})
