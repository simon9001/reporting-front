/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: Number(process.env.SR_WEB_PORT ?? 5173),
    strictPort: true,
    proxy: { '/api': { target: process.env.SR_API_PROXY ?? 'http://localhost:3000' } },
  },
  test: { include: ['src/**/*.test.ts'] },
})
