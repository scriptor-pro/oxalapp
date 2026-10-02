/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const certPath = path.resolve(__dirname, '.cert/cert.pem')
const keyPath = path.resolve(__dirname, '.cert/key.pem')
const hasCert = fs.existsSync(certPath) && fs.existsSync(keyPath)
const { version } = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Affichée sur l'écran d'accueil : suit package.json à chaque bump.
  define: { __APP_VERSION__: JSON.stringify(version) },
  server: hasCert
    ? {
        https: { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) },
        proxy: {
          '/pb': {
            target: 'http://127.0.0.1:8090',
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/pb/, ''),
          },
        },
      }
    : undefined,
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['**/node_modules/**', '.claude/worktrees/**'],
  },
})
