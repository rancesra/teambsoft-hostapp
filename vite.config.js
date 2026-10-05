import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // El 5173 lo usa el módulo de Catálogo. El 5000 tampoco sirve: en macOS lo ocupa AirPlay.
    port: 5050,
    strictPort: true,
  },
})