import { defineConfig, devices } from '@playwright/test'

function normalizeSiteBasePath(value: string | undefined) {
  const path = value?.trim().replace(/^\/+|\/+$/g, '') ?? ''
  return path ? `/${path}/` : '/'
}

const previewOrigin = 'http://127.0.0.1:4173'
const siteBasePath = normalizeSiteBasePath(process.env.SITE_BASE_PATH)
// Optional: point at an installed Chrome when Playwright's own browsers are not available.
const chromeLaunch = process.env.PLAYWRIGHT_CHROME_PATH
  ? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH }
  : {}
const previewUrl = new URL(siteBasePath, previewOrigin).toString()

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: previewUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: chromeLaunch },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'], launchOptions: chromeLaunch },
    },
  ],
  webServer: {
    command: 'npm run preview -- --strictPort',
    url: previewUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
