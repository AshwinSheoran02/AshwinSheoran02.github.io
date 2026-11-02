import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

function normalizeSiteBasePath(value: string | undefined) {
  const path = value?.trim().replace(/^\/+|\/+$/g, '') ?? ''
  return path ? `/${path}/` : '/'
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = normalizeSiteBasePath(
    process.env.SITE_BASE_PATH ?? env.SITE_BASE_PATH,
  )

  return {
    base,
    plugins: [react(), tailwindcss()],
    build: {
      // The 3D scene is a lazily loaded chunk; three.js alone is ~600 kB before gzip.
      chunkSizeWarningLimit: 1400,
      rolldownOptions: {
        treeshake: {
          // n8ao (ambient occlusion) has no side effects but does not declare it.
          // Marking it lets the bundler keep it out of the main 3D chunk; it is
          // loaded on demand for the high quality tier only.
          moduleSideEffects: (id: string) => !id.includes('node_modules/n8ao'),
        },
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      css: true,
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['tests/**', 'node_modules/**', 'dist/**'],
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        reportsDirectory: './coverage',
      },
    },
  }
})
