import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

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
    root: 'src/renderer',
    plugins: [
      react({
        jsxImportSource: '@emotion/react',
        babel: {
          plugins: ['@emotion/babel-plugin']
        }
      })
    ],
    build: {
      sourcemap: true,
      rollupOptions: {
        input: 'src/renderer/index.html'
      }
    }
  }
})