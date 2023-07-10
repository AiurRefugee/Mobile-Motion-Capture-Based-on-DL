import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: ['127.0.0.1', '192.168.2.30'],
    https: {

      key: 'mydomain.key',
      cert: 'mydomain.crt',
    }
  },
  base: "./",
  outputDir: 'dist',

  publicPath: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
