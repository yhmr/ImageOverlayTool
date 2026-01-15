import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    build: {
      sourcemap: true,
    }
  },
  preload: {
    build: {
      sourcemap: true,
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    root: 'src/renderer',
    plugins: [
      react(),
      tailwindcss()
    ],
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          main: 'src/renderer/main-window/index.html',
          imageSettings: 'src/renderer/image-settings/index.html'
        }
      }
    }
  }
})