import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

// Se mezcla con la configuración de Vite para heredar el alias "@". jsdom simula el navegador:
// window, sessionStorage, btoa y postMessage existen igual que en Chrome.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: { environment: 'jsdom' },
  }),
)
